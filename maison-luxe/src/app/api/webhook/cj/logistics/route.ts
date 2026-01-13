import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { emailService } from '@/lib/email';
import mongoose from 'mongoose';
import logger from '@/lib/logger';
import { CJLogisticsWebhookSchema } from '@/lib/schemas';
import { successResponse, sendErrorResponse, sendCustomError, formatZodError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Webhook CJ - Mises à jour logistiques (tracking)
 * 
 * CJ envoie des notifications de tracking :
 * - Tracking number attribué
 * - Colis récupéré par le transporteur
 * - En transit
 * - Livré
 * - Échec de livraison
 * 
 * Requis par CJ : réponse < 3s avec status 200
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    logger.info('🚚 CJ Logistics Webhook received:', JSON.stringify(body, null, 2));

    // Ignorer les payloads de test/validation de CJ
    if (body.trackingNumber === 'test' || body.orderId === 'test') {
      logger.info('✅ CJ Logistics Webhook validation payload acknowledged');
      return NextResponse.json(successResponse({ message: 'Webhook validation successful' }), { status: 200 });
    }

    const parsed = CJLogisticsWebhookSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn('⚠️ CJ Logistics Webhook: payload validation failed', { errors: parsed.error.format() });
      return NextResponse.json(successResponse({ message: 'Invalid webhook payload (acknowledged)', details: formatZodError(parsed.error) }));
    }

    await dbConnect();

    // Structure attendue (basée sur la doc CJ tracking)
    const {
      trackingNumber,
      orderId,
      orderNumber,
      logisticName,
      trackingStatus,    // In transit, Delivered, etc.
      trackingFrom,      // Pays d'origine
      trackingTo,        // Pays de destination
      deliveryTime,      // Date de livraison
      deliveryDay,       // Nombre de jours
      lastMileCarrier,   // Transporteur dernier kilomètre
      lastTrackNumber,   // Tracking du transporteur final
      trackingEvents,    // Historique des événements
    } = parsed.data;

    if (!trackingNumber && !orderId && !orderNumber) {
      logger.warn('⚠️ Webhook logistics: missing identifier');
      return sendErrorResponse('MISSING_REQUIRED_FIELD', 'Missing identifier');
    }

    // Trouver la commande (gérer plusieurs clés possibles)
    const orQueries: any[] = [];
    if (trackingNumber) {
      orQueries.push({ trackingNumber });
    }
    if (orderNumber) {
      orQueries.push({ cjOrderNumber: orderNumber });
      if (mongoose.Types.ObjectId.isValid(orderNumber)) {
        orQueries.push({ _id: new mongoose.Types.ObjectId(orderNumber) });
      }
      // Compat si un champ orderNumber existe dans certains environnements
      orQueries.push({ orderNumber });
    }
    if (orderId) {
      orQueries.push({ cjOrderId: orderId });
      orQueries.push({ 'cjData.orderId': orderId });
    }

    const order = await Order.findOne(orQueries.length ? { $or: orQueries } : {});

    if (!order) {
      logger.warn('⚠️ Webhook logistics: Order not found', { orderId, orderNumber, trackingNumber });
      return NextResponse.json(successResponse({ message: 'Order not found but acknowledged' }));
    }

    // Préparer les mises à jour
    const updates: any = {
      updatedAt: new Date(),
    };

    // Ajouter tracking number si pas encore défini
      if (trackingNumber && !order.trackingNumber) {
      updates.trackingNumber = trackingNumber;
      logger.info(`📦 Adding tracking number ${trackingNumber} to order ${order._id}`);
    }

    // Stocker les infos de tracking dans cjData
    updates['cjData.tracking'] = {
      trackingNumber,
      logisticName,
      trackingStatus,
      trackingFrom,
      trackingTo,
      deliveryTime,
      deliveryDay,
      lastMileCarrier,
      lastTrackNumber,
      lastUpdate: new Date(),
    };

    // Définir également transporteur et dates sur l'ordre principal si disponibles
    if (logisticName || lastMileCarrier) {
      updates.trackingCarrier = logisticName || lastMileCarrier;
    }

    // Si des événements de tracking sont fournis, les stocker
    if (trackingEvents && Array.isArray(trackingEvents)) {
      updates['cjData.trackingEvents'] = trackingEvents;
    }

    // Mettre à jour le statut si livré
      if (trackingStatus?.toLowerCase().includes('delivered')) {
      updates.status = 'delivered';
      updates.deliveredAt = deliveryTime ? new Date(deliveryTime) : new Date();
      logger.info(`📬 Order ${order._id} marked as delivered`);
    } else if (trackingStatus?.toLowerCase().includes('transit') || trackingStatus?.toLowerCase().includes('shipped')) {
      if (order.status === 'pending' || order.status === 'processing') {
        updates.status = 'shipped';
        if (!order.shippedAt) updates.shippedAt = new Date();
        logger.info(`🚀 Order ${order._id} marked as shipped`);
      }
    }

    // Appliquer les mises à jour
    await Order.updateOne({ _id: order._id }, { $set: updates });

    const elapsed = Date.now() - startTime;
    logger.info(`✅ Logistics updated for order ${order._id} (${elapsed}ms)`);

    // Envoyer email avec tracking info si nouveau numéro
    if (updates.trackingNumber && !order.trackingNumber) {
      try {
        logger.info('📧 Envoi email notification expédition...');
        
        // Recharger la commande avec populate user
        const updatedOrder = await Order.findById(order._id).populate('user');
        
        if (updatedOrder && updatedOrder.user && typeof updatedOrder.user !== 'string') {
          const user = updatedOrder.user as any;
          await emailService.sendShippingNotification({
            _id: updatedOrder._id,
            user: {
              email: user.email,
              name: user.name,
            },
            trackingNumber: updates.trackingNumber,
            items: updatedOrder.items,
            shippingAddress: updatedOrder.shippingAddress,
          });
          logger.info('✅ Email expédition envoyé');
        }
      } catch (emailError: any) {
        logger.error('❌ Erreur envoi email expédition:', emailError.message);
        // Ne pas bloquer le webhook
      }
    }

    // Envoyer email de livraison si statut delivered
    if (updates.status === 'delivered' && order.status !== 'delivered') {
      try {
        logger.info('📧 Envoi email confirmation livraison...');
        
        const updatedOrder = await Order.findById(order._id).populate('user');
        
        if (updatedOrder && updatedOrder.user && typeof updatedOrder.user !== 'string') {
          const user = updatedOrder.user as any;
          await emailService.sendDeliveryConfirmation({
            _id: updatedOrder._id,
            user: {
              email: user.email,
              name: user.name,
            },
            items: updatedOrder.items,
          });
          logger.info('✅ Email livraison envoyé');
        }
      } catch (emailError: any) {
        logger.error('❌ Erreur envoi email livraison:', emailError.message);
      }
    }

    return NextResponse.json(successResponse({ orderId: order._id, trackingNumber, processingTime: elapsed }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    logger.error('❌ CJ Logistics Webhook Error:', error);
    return sendCustomError(200, 'WEBHOOK_PROCESSINGerror', error.message || 'Internal error', { processingTime: elapsed });
  }
}
