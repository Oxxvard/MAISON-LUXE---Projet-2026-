import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';
import { emailService } from '@/lib/email';
import logger from '@/lib/logger';
import { CJOrderWebhookSchema } from '@/lib/schemas';
import { successResponse, sendErrorResponse, sendCustomError, formatZodError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Webhook CJ - Mises à jour des commandes
 * 
 * CJ envoie des notifications quand le statut d'une commande change :
 * - Order confirmed
 * - Processing
 * - Shipped
 * - Delivered
 * - Cancelled
 * 
 * Requis par CJ : réponse < 3s avec status 200
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    logger.info('📦 CJ Order Webhook received:', JSON.stringify(body, null, 2));

    // Ignorer les payloads de test/validation de CJ
    if (body.orderId === 'test' || body.orderNumber === 'test') {
      logger.info('✅ CJ Order Webhook validation payload acknowledged');
      return NextResponse.json(successResponse({ message: 'Webhook validation successful' }), { status: 200 });
    }

    // Validation légère du payload entrante
    const parsed = CJOrderWebhookSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn('⚠️ CJ Order Webhook: payload validation failed', { errors: parsed.error.format() });
      // Acknowledge to avoid retries from CJ but report validation details for operator
      return NextResponse.json(successResponse({ message: 'Invalid webhook payload (acknowledged)', details: formatZodError(parsed.error) }));
    }

    await dbConnect();

    // Structure attendue de CJ (peut varier selon la doc)
    const {
      orderId,           // CJ order ID
      orderNumber,       // Notre order number
      orderStatus,       // Statut : pending, processing, shipped, delivered, cancelled
      trackingNumber,    // Numéro de suivi (si disponible)
      logisticName,      // Nom du transporteur
      updateTime,        // Timestamp de la mise à jour
    } = parsed.data;

    if (!orderId && !orderNumber) {
      logger.warn('⚠️ Webhook order: missing orderId/orderNumber');
      return sendErrorResponse('MISSING_REQUIRED_FIELD', 'Missing order identifier');
    }

    // Trouver la commande dans notre DB (supporte plusieurs clés)
    const orQueries: any[] = [];

    if (orderNumber) {
      // Correspond à notre numéro CJ côté boutique
      orQueries.push({ cjOrderNumber: orderNumber });
      // Certaines intégrations utilisent l'_id comme orderNumber
      if (mongoose.Types.ObjectId.isValid(orderNumber)) {
        orQueries.push({ _id: new mongoose.Types.ObjectId(orderNumber) });
      }
      // Compat héritée potentielle
      orQueries.push({ orderNumber });
    }

    if (orderId) {
      // Champs principaux utilisés dans notre modèle
      orQueries.push({ cjOrderId: orderId });
      // Compat stockage dans cjData
      orQueries.push({ 'cjData.orderId': orderId });
    }

    const order = await Order.findOne(orQueries.length ? { $or: orQueries } : {});

    if (!order) {
      logger.warn('⚠️ Webhook order: Order not found', { orderId, orderNumber });
      // Répondre 200 quand même pour éviter que CJ retry
      return NextResponse.json(successResponse({ message: 'Order not found but acknowledged' }));
    }

    // Mapper les statuts CJ vers nos statuts
    const statusMap: Record<string, string> = {
      pending: 'pending',
      confirmed: 'processing',
      processing: 'processing',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
      failed: 'cancelled',
    };

    const statusKey = (orderStatus ?? '').toString().toLowerCase();
    const newStatus = statusMap[statusKey] || order.status;

    // Préparer les mises à jour
    const updates: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    // Ajouter le tracking number si fourni
    if (trackingNumber && !order.trackingNumber) {
      updates.trackingNumber = trackingNumber;
    }

    // Mettre à jour les données CJ (utiliser uniquement des sous-chemins pour éviter les conflits Mongoose)
    updates['cjData.lastWebhookUpdate'] = new Date();
    updates['cjData.orderStatus'] = orderStatus;
    if (logisticName) {
      updates['cjData.logisticName'] = logisticName;
    }
    if (orderId) {
      updates['cjData.orderId'] = orderId;
    }

    // Appliquer les mises à jour
    await Order.updateOne({ _id: order._id }, { $set: updates });

    const elapsed = Date.now() - startTime;
    logger.info(`✅ Order ${order._id} updated to ${newStatus} (${elapsed}ms)`);

    // Envoyer emails si shipped/delivered (si info utilisateur disponible)
    try {
      if ((newStatus === 'shipped' && (trackingNumber || order.trackingNumber)) || newStatus === 'delivered') {
        const updatedOrder = await Order.findById(order._id).populate('user');
        if (updatedOrder && updatedOrder.user && typeof updatedOrder.user !== 'string') {
          const user = updatedOrder.user as any;
          if (newStatus === 'shipped') {
            const tracking = (trackingNumber || updatedOrder.trackingNumber) as string;
            if (tracking) {
              await emailService.sendShippingNotification({
                _id: updatedOrder._id,
                user: { email: user.email, name: user.name },
                trackingNumber: tracking,
                items: updatedOrder.items,
                shippingAddress: updatedOrder.shippingAddress,
              });
              logger.info('✅ Email expédition envoyé (webhook order)');
            } else {
              logger.warn('ℹ️ No tracking number available to send shipping email', { order: updatedOrder._id });
            }
          } else if (newStatus === 'delivered') {
            await emailService.sendDeliveryConfirmation({
              _id: updatedOrder._id,
              user: { email: user.email, name: user.name },
              items: updatedOrder.items,
            });
            logger.info('✅ Email livraison envoyé (webhook order)');
          }
        }
      }
    } catch (emailErr: any) {
      logger.error('❌ Erreur envoi email (webhook order):', emailErr.message);
    }

    // Réponse rapide < 3s comme requis par CJ
    return NextResponse.json(successResponse({ orderId: order._id, newStatus, processingTime: elapsed }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    logger.error('❌ CJ Order Webhook Error:', error);
    // Répondre 200 même en cas d'erreur pour éviter les retries infinis
    return sendCustomError(200, 'WEBHOOK_PROCESSINGerror', error.message || 'Internal error', { processingTime: elapsed });
  }
}
