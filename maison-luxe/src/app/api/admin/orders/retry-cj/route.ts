import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { withBodyValidation } from '@/lib/validation';
import { RetryCJSchema } from '@/lib/schemas';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { cjService } from '@/lib/cjdropshipping';
import logger from '@/lib/logger';
import { logEvent } from '@/lib/events';
import { successResponse, sendErrorResponse } from '@/lib/errors';

// POST - Re-créer une commande CJ pour une commande payée qui a échoué
export const POST = withAdminAuth(withBodyValidation(RetryCJSchema, async (request, session, data) => {
  try {
    const { orderId } = data as { orderId: string };

  await dbConnect();

  // Récupérer la commande
  const order = await Order.findById(orderId).populate('user');

  if (!order) {
    return sendErrorResponse('NOT_FOUND', 'Order not found');
  }

  if (order.paymentStatus !== 'paid') {
    return sendErrorResponse('INVALID_INPUT', 'Order not paid yet');
  }

    if (order.cjOrderId) {
      return sendErrorResponse('INVALID_INPUT', 'CJ order already created');
    }

    // Charger les produits
    const productIds = order.items.map((item: any) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

    // Préparer les produits pour CJ
    const cjProducts = order.items.map((item: any) => {
      const product = productMap.get(item.product.toString());
      const vid = product?.cjVid || product?._id?.toString();

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
      shipmentType: 1,
      remark: `MaisonLuxe manual retry - ${(order.user as any)?.email || 'customer'}`,
    };

    logger.info('🔄 Retrying CJ order creation for:', order._id);
    logger.info('📦 Payload:', JSON.stringify(cjOrderData, null, 2));

    const cjOrder = (await cjService.createOrder(cjOrderData)) as
      | { orderId?: string; orderNumber?: string; orderAmount?: number }
      | unknown;

    if (!cjOrder || typeof cjOrder !== 'object') {
      throw new Error('Invalid response from CJ createOrder');
    }

    const cj = cjOrder as { orderId?: string; orderNumber?: string; orderAmount?: number };

    // Sauvegarder l'ID de commande CJ
    if (cj.orderId) order.cjOrderId = cj.orderId;
    if (cj.orderNumber) order.cjOrderNumber = cj.orderNumber;
    order.cjOrderError = undefined; // Effacer l'erreur précédente
    await order.save();

    logger.info('✅ CJ Order created successfully:', cj.orderId);
    try { logEvent('cj.order.retried', { localOrderId: order._id.toString(), cjOrderId: cj.orderId, cjOrderNumber: cj.orderNumber }); } catch (e) {}

    return NextResponse.json(successResponse({ cjOrderId: cj.orderId, cjOrderNumber: cj.orderNumber, orderAmount: cj.orderAmount }));
  } catch (error: any) {
    logger.error('❌ Retry CJ order failed:', error);

    // Sauvegarder l'erreur dans la commande
    try {
      const { orderId } = await request.json();
      if (orderId) {
        await dbConnect();
        await Order.findByIdAndUpdate(orderId, {
          cjOrderError: error.message,
        });
      }
    } catch (_e) {
      // Ignore
    }

    return sendErrorResponse('INTERNALerror', error.message || 'Failed to create CJ order');
  }
}));
