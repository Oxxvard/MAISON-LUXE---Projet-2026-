import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { cjService } from '@/lib/cjdropshipping';
import { emailService } from '@/lib/email';
import { sendErrorResponse, sendCustomError } from '@/lib/errors';
import crypto from 'crypto';
import logger from '@/lib/logger';
import { logEvent, logErrorEvent } from '@/lib/events';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Vérifier la signature Stripe en utilisant crypto natif
 * Plus sûr que de compter uniquement sur Stripe SDK
 */
function verifyStripeSignature(body: string, signature: string, secret: string): boolean {
  const [timestamp, signatureVersion] = signature.split(',').map(part => {
    const [key, value] = part.split('=');
    return value;
  });

  // Créer le message signé (timestamp.payload)
  const signedContent = `${timestamp}.${body}`;

  // Créer la signature attendue
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedContent, 'utf8')
    .digest('hex');

  // Comparer avec constante time
  return crypto.timingSafeEqual(
    Buffer.from(signatureVersion),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    // Vérifier la signature
    if (!signature) {
      logger.error('❌ Webhook Stripe: signature manquante');
      try { logErrorEvent('payment.webhook.missing_signature', new Error('missing signature')); } catch (e) {}
      return sendErrorResponse('INVALID_WEBHOOK_SIGNATURE', 'Signature webhook manquante');
    }

    if (!webhookSecret) {
      logger.error('❌ Webhook Stripe: STRIPE_WEBHOOK_SECRET non configuré');
      return sendErrorResponse('INTERNALerror', 'Webhook non configuré');
    }

    let event: Stripe.Event;

    try {
      // Essayer d'abord avec la vérification Stripe SDK
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      logger.error('❌ Erreur vérification webhook Stripe:', err.message);
      try { logErrorEvent('payment.webhook.invalid_signature', err, { signature: Boolean(signature) }); } catch (e) {}
      return sendErrorResponse('INVALID_WEBHOOK_SIGNATURE', 'Signature webhook invalide');
    }

    // Log du webhook reçu (utile pour debugging)
    logger.info(`📩 Webhook Stripe reçu: ${event.type} (ID: ${event.id})`);
    try { logEvent('payment.webhook.received', { type: event.type, id: event.id }); } catch (e) {}

    // Gérer l'événement
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const eventId = event.id;

      await dbConnect();

      // Récupérer la commande par stripeSessionId
      const order = (await Order.findOne({ stripeSessionId: session.id }).populate('user')) as any;

      if (!order) {
        logger.error('Order not found for session:', session.id);
        try { logErrorEvent('payment.order.not_found', new Error('order not found'), { sessionId: session.id }); } catch (e) {}
        return NextResponse.json({ received: true });
      }

      // Idempotence: si cet event a déjà été traité, on ignore
      const lastEventId = (order.cjData as any)?.lastStripeEventId;
      if (lastEventId === eventId) {
        logger.warn('⚠️ Stripe event already processed:', eventId);
        return NextResponse.json({ received: true, duplicate: true });
      }

      // Charger manuellement les produits pour avoir accès aux cjVid
      const Product = (await import('@/models/Product')).default;
      const productIds = order.items.map((item: any) => item.product);
      const products = await Product.find({ _id: { $in: productIds } });
      const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

      // Mettre à jour le statut de paiement si pas déjà payé
      if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.status = 'processing';
      }

      logger.info('💳 Payment received for order:', order._id);
      try { logEvent('payment.received', { orderId: order._id.toString(), amount: order.totalAmount }); } catch (e) {}

      // ============ CRÉER COMMANDE CJ AUTOMATIQUEMENT ============
      try {
        if (order.cjOrderId) {
          logger.info('ℹ️ CJ order already exists for:', order._id, '->', order.cjOrderId);
        } else {
          logger.info('🛒 Creating CJ order for:', order._id);

          // Charger le premier produit pour détecter l'entrepôt disponible
          const firstProduct = productMap.values().next().value;
          
          // Si le produit a des données CJ, essayer de détecter l'entrepôt
          if (firstProduct && firstProduct.cjData && firstProduct.cjData.variants) {
            const firstVariant = firstProduct.cjData.variants[0];
              if (firstVariant && firstVariant.inventories && firstVariant.inventories.length > 0) {
              const inv = firstVariant.inventories[0];
              logger.info(`📍 Product has stock in: ${inv.countryCode}`);
            }
          }

          // Préparer les produits pour CJ avec les vrais cjVid
          const cjProducts = order.items.map((item: any) => {
            const product = productMap.get(item.product.toString());
            
            // Extraire la couleur du nom de l'item (format: "Nom - Couleur")
            const itemName = item.name || '';
            const colorMatch = itemName.match(/\s-\s(.+)$/);
            const selectedColor = colorMatch ? colorMatch[1] : null;
            
            let vid = product?.cjVid; // VID par défaut du produit
            
            // Si une couleur spécifique est sélectionnée, chercher le bon VID
            if (selectedColor && product?.colorVariants && product.colorVariants.length > 0) {
              const colorVariant = product.colorVariants.find((cv: any) => cv.color === selectedColor);
              if (colorVariant?.cjVid) {
                vid = colorVariant.cjVid;
                logger.info(`🎨 Color "${selectedColor}" -> VID: ${vid}`);
              } else {
                logger.warn(`⚠️ Color "${selectedColor}" found but no VID set! Using default.`);
              }
            }
            
            // Fallback si toujours pas de VID
            if (!vid) {
              vid = product?._id?.toString() || 'unknown';
              logger.warn(`⚠️ No VID found for ${itemName}, using fallback: ${vid}`);
            }
            
            logger.info(`📦 Item: ${item.name}, VID: ${vid}`);
            
            return {
              vid,
              quantity: item.quantity,
            };
          });

          // Créer la commande CJ (laisser CJ auto-sélectionner le warehouse)
          const cjOrderData = {
            orderNumber: order._id.toString(),
            shippingAddress: {
              fullName: order.shippingAddress.fullName,
              address: order.shippingAddress.address,
              city: order.shippingAddress.city,
              province: order.shippingAddress.province || order.shippingAddress.state,
              postalCode: order.shippingAddress.postalCode,
              country: order.shippingAddress.country,
              phone: order.shippingAddress.phone,
            },
            items: cjProducts,
            // Pas de warehouseId/platform - CJ va auto-sélectionner
            shipmentType: 1, // Express
            remark: `MaisonLuxe order from ${order.user?.email || 'customer'}`,
          };

          logger.info('📦 CJ Order data:', JSON.stringify(cjOrderData, null, 2));

          const cjOrderRaw = await cjService.createOrder(cjOrderData);
          if (cjOrderRaw && typeof cjOrderRaw === 'object') {
            const cjOrder = cjOrderRaw as Record<string, any>;
            if (cjOrder.orderId) {
              order.cjOrderId = cjOrder.orderId;
              order.cjOrderNumber = cjOrder.orderNumber;
              logger.info('✅ CJ Order created:', {
                cjOrderId: cjOrder.orderId,
                localOrderId: order._id,
              });
              try { logEvent('cj.order.created_from_payment', { localOrderId: order._id.toString(), cjOrderId: cjOrder.orderId }); } catch (e) {}
            } else {
              logger.warn('⚠️ CJ createOrder returned unexpected shape', cjOrder);
            }
          } else {
            logger.warn('⚠️ CJ createOrder returned non-object response', cjOrderRaw);
          }
        }
      } catch (cjError: any) {
        logger.error('❌ Failed to create CJ order:', cjError.message);
        try { logErrorEvent('cj.order.create_failed', cjError, { orderId: order._id.toString() }); } catch (e) {}
        // Continuer même si la création CJ échoue
        order.cjOrderError = cjError.message;
      }

      // Tracer l'event traité pour idempotence
      order.cjData = order.cjData || {};
      (order.cjData as any).lastStripeEventId = eventId;

      // Sauvegarder les changements (statut paiement, CJ, eventId)
      await order.save();

      // ============ ENVOYER EMAIL DE CONFIRMATION ============
      try {
        if (order.emailSent) {
          logger.info('ℹ️ Confirmation email already sent for order', order._id);
        } else {
          logger.info('📧 Envoi email de confirmation...');
          await emailService.sendOrderConfirmation({
            _id: order._id,
            user: {
              email: (order.user as any).email,
              name: (order.user as any).name,
            },
            items: order.items,
            totalAmount: order.totalAmount,
            shippingAddress: order.shippingAddress,
          });
          order.emailSent = true;
          await order.save();
          logger.info('✅ Email de confirmation envoyé');
          try { logEvent('email.order_confirmation.sent', { orderId: order._id.toString(), user: (order.user as any).email }); } catch (e) {}
        }
      } catch (emailError: any) {
        logger.error('❌ Erreur envoi email confirmation:', emailError.message);
        try { logErrorEvent('email.order_confirmation.failed', emailError, { orderId: order._id.toString() }); } catch (e) {}
        // Ne pas bloquer le webhook si l'email échoue
      }
      try { logEvent('payment.webhook.processed', { orderId: order._id.toString(), eventId: event.id }); } catch (e) {}
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error('Erreur webhook:', error);
    return sendErrorResponse('INTERNALerror', error.message || 'Erreur webhook');
  }
}
