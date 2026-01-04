import { NextResponse, NextRequest } from 'next/server';
import logger from '@/lib/logger';
import Stripe from 'stripe';
import { withAuth } from '@/lib/auth-middleware';
import { withBodyValidation } from '@/lib/validation';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { z } from 'zod';
import { errorResponse, formatZodError, sendErrorResponse, sendCustomError } from '@/lib/errors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// Schéma de validation pour checkout
const CheckoutSchema = z.object({
  items: z.array(z.object({
    id: z.string().optional(),
    product: z.string().optional(),
    name: z.string().optional(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    image: z.string().optional(),
    stock: z.number().optional(),
  }).refine(
    (item) => item.id || item.product,
    { message: "Chaque item doit avoir un 'id' ou 'product'" }
  )),
  orderId: z.string().min(1),
  shipping: z.object({
    id: z.string().optional(),
    name: z.string(),
    logisticName: z.string().optional(),
    price: z.number().min(0),
    deliveryTime: z.union([z.number().positive(), z.string()]), // Accepte "12-20" ou nombre
    priceCNY: z.number().optional(),
    taxesFee: z.number().optional(),
    clearanceFee: z.number().optional(),
    totalFee: z.number().optional(),
  }).optional(),
});

export const POST = withAuth(withBodyValidation(CheckoutSchema, async (request: NextRequest, session, data) => {
  try {
    const { items, orderId, shipping } = data;

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
        product: p._id,
        name: p.name,
        price: p.price,
        quantity: qty,
        image: Array.isArray(p.images) && p.images.length ? p.images[0] : it.image,
      });
    }

    // Créer les line items Stripe depuis les données serveur
    const lineItems = normalizedItems.map((ni) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: ni.name,
          images: ni.image ? [ni.image] : [],
        },
        unit_amount: Math.round(Number(ni.price) * 100),
      },
      quantity: ni.quantity,
    }));

    // Ajouter les frais de livraison si présents
    if (shipping && Number(shipping.price) > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Livraison - ${shipping.name}`,
            images: [],
          },
          unit_amount: Math.round(Number(shipping.price) * 100),
        },
        quantity: 1,
      });
    }

    // Récupérer l'ordre pour avoir les infos du coupon
    const orderBeforeCheckout = await Order.findById(orderId).lean();
    const couponDiscount = orderBeforeCheckout?.coupon?.discount || 0;

    // Si coupon, distribuer la réduction proportionnellement sur tous les articles
    if (couponDiscount > 0 && lineItems.length > 0) {
      // Calculer le sous-total des articles (sans livraison)
      let articlesSubtotal = 0;
      let articlesCount = 0;
      
      for (const item of lineItems) {
        const itemName = item.price_data?.product_data?.name || '';
        if (!itemName.includes('Livraison')) {
          articlesSubtotal += (item.price_data?.unit_amount || 0) * (item.quantity || 1);
          articlesCount += 1;
        }
      }
      
      // Distribuer la réduction proportionnellement sur chaque article
      if (articlesSubtotal > 0) {
        // articlesSubtotal est en centimes, couponDiscount est en euros → convertir en centimes
        const couponDiscountCentimes = Math.round(couponDiscount * 100);
        const discountPercentage = Math.min(1, couponDiscountCentimes / articlesSubtotal); // Max 100% réduction
        
        for (const item of lineItems) {
          const itemName = item.price_data?.product_data?.name || '';
          if (!itemName.includes('Livraison')) {
            const originalPrice = item.price_data?.unit_amount || 0;
            const discountAmount = Math.round(originalPrice * discountPercentage);
            item.price_data!.unit_amount = Math.max(0, originalPrice - discountAmount);
          }
        }
      }
    }

    // Créer la session Stripe Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
      customer_email: session.user?.email!,
      metadata: {
        orderId: orderId,
        userId: (session.user as any).id,
      },
    });

    // Mettre à jour l'Order avec les données normalisées (prix serveurs) + stripeSessionId
    try {
      // Récupérer l'ordre pour avoir le coupon et la livraison
      const order = await Order.findById(orderId).lean() as any;
      const couponDiscount = order?.coupon?.discount || 0;
      const shippingCost = order?.shippingCost || (shipping?.price || 0);
      
      // Recalculer le total = articles + livraison - coupon
      const articlesTotal = normalizedItems.reduce((sum, it) => sum + Number(it.price) * it.quantity, 0);
      const totalAmount = articlesTotal + shippingCost - couponDiscount;
      
      await Order.updateOne(
        { _id: orderId },
        {
          $set: {
            items: normalizedItems,
            totalAmount,
            shippingCost,
            stripeSessionId: checkoutSession.id,
          },
        }
      );
    } catch (_e) {
      logger.warn('⚠️ Impossible de normaliser la commande:', (_e as any)?.message);
    }

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error: any) {
    logger.error('Erreur création session Stripe:', error);
    return sendErrorResponse('INTERNALerror', error.message || 'Erreur lors de la création de la session de paiement');
  }
}));
