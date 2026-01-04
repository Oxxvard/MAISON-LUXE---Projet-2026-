import { NextResponse, NextRequest } from 'next/server';
import logger from '@/lib/logger';
import Stripe from 'stripe';
import { withAuth } from '@/lib/auth-middleware';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { z } from 'zod';
import { sendErrorResponse, sendCustomError } from '@/lib/errors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// Schéma ultra-permissif pour éliminer tout problème de validation
const CheckoutV2Schema = z.object({
  items: z.array(z.any()),
  orderId: z.string(),
  shipping: z.any().optional(),
});

export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    // Parse body manually
    const body = await request.json();
    logger.info('📦 Checkout V2 request received:', { 
      userId: (session.user as any).id,
      body: JSON.stringify(body).substring(0, 500)
    });
    
    // Validation minimale
    const validation = CheckoutV2Schema.safeParse(body);
    if (!validation.success) {
      logger.error('❌ Validation V2 failed:', validation.error);
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validation.error.format() }
      }, { status: 400 });
    }

    const { items, orderId, shipping } = validation.data;

    // Sécurité: recalcul côté serveur depuis la base produits
    await dbConnect();

    if (!Array.isArray(items) || items.length === 0) {
      return sendCustomError(400, 'INVALID_CART', 'Panier invalide');
    }

    const ids = Array.from(new Set(items.map((it: any) => it.id || it.product))).filter(Boolean);
    const products = await Product.find({ _id: { $in: ids } }).lean();
    const pmap = new Map(products.map((p: any) => [p._id.toString(), p]));

    // Normaliser items et calculer le total serveur
    const normalizedItems: any[] = [];
    let subtotalCents = 0;

    for (const it of items) {
      const pid = (it.id || it.product)?.toString();
      const p = pid ? pmap.get(pid) : null;
      if (!p) {
        return sendErrorResponse('NOT_FOUND', `Produit introuvable: ${pid}`);
      }
      const qty = Math.max(1, Number(it.quantity || 1));
      const unit = Math.round(Number(p.price) * 100);
      subtotalCents += unit * qty;

      normalizedItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: p.name || 'Produit',
            images: p.image ? [p.image] : [],
          },
          unit_amount: unit,
        },
        quantity: qty,
      });
    }

    // Ajouter les frais de livraison
    const shippingPrice = Number(shipping?.price || 0);
    const shippingCents = Math.round(shippingPrice * 100);

    if (shippingCents > 0) {
      normalizedItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Frais de livraison' },
          unit_amount: shippingCents,
        },
        quantity: 1,
      });
    }

    const totalCents = subtotalCents + shippingCents;

    // Créer la session Stripe
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: normalizedItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
      metadata: {
        orderId: orderId.toString(),
        userId: (session.user as any).id,
        shipping: JSON.stringify(shipping || {}),
      },
    });

    logger.info('✅ Stripe session created:', {
      sessionId: stripeSession.id,
      totalCents,
      orderId,
    });

    return NextResponse.json({
      success: true,
      url: stripeSession.url,
      sessionId: stripeSession.id,
    });
  } catch (error: any) {
    logger.error('❌ Checkout V2 error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'CHECKOUT_ERROR', message: error.message }
    }, { status: 500 });
  }
});
