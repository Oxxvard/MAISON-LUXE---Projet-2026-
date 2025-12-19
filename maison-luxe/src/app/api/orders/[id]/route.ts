import { NextResponse, NextRequest } from 'next/server';
import logger from '@/lib/logger';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { withBodyValidation } from '@/lib/validation';
import { UpdateOrderAdminSchema } from '@/lib/schemas';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { authOptions } from '@/lib/auth';
import { emailService } from '@/lib/email';
import { successResponse, sendErrorResponse, sendCustomError } from '@/lib/errors';

export const GET = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await dbConnect();
    const { id } = await params;

    const order = await Order.findById(id)
      .populate('user', 'name email')
      .lean();

    if (!order) {
      return sendErrorResponse('NOT_FOUND', 'Commande non trouvée');
    }

    // Vérifier que l'utilisateur peut voir cette commande
    if (
      (session.user as any).role !== 'admin' &&
      order.user._id.toString() !== (session.user as any).id
    ) {
      return sendErrorResponse('FORBIDDEN', 'Non autorisé');
    }

    return NextResponse.json(successResponse(order));
  } catch (error) {
    logger.error('Erreur récupération commande:', error);
    return sendErrorResponse('INTERNALerror', 'Erreur lors de la récupération de la commande');
  }
});

export const PATCH = withAdminAuth(withBodyValidation(UpdateOrderAdminSchema, async (
  request: NextRequest,
  _session,
  data,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await dbConnect();
    const { id } = await params;

    const order = await Order.findById(id).populate('user', 'email name');
    if (!order) {
      return sendErrorResponse('NOT_FOUND', 'Commande non trouvée');
    }

    const prevStatus = order.status;

    if (data.status) order.status = data.status as any;
    if (data.trackingNumber !== undefined) order.trackingNumber = (data.trackingNumber as any) || undefined;
    if (data.trackingCarrier !== undefined) order.trackingCarrier = (data.trackingCarrier as any) || undefined;
    if (data.shippedAt) order.shippedAt = new Date(data.shippedAt as string);
    if (data.deliveredAt) order.deliveredAt = new Date(data.deliveredAt as string);
    if (data.estimatedDelivery) order.estimatedDelivery = new Date(data.estimatedDelivery as string);

    let sendShipping = false;
    let sendDelivery = false;

    if (data.status === 'shipped' && prevStatus !== 'shipped') {
      order.shippedAt = order.shippedAt || new Date();
      sendShipping = true;
    }

    if (data.status === 'delivered' && prevStatus !== 'delivered') {
      order.deliveredAt = order.deliveredAt || new Date();
      sendDelivery = true;
    }

    await order.save();

    // Emails
    try {
      if (sendShipping && order.trackingNumber) {
        await emailService.sendShippingNotification({
          _id: order._id.toString(),
          user: { email: (order.user as any)?.email },
          trackingNumber: order.trackingNumber,
          items: order.items.map((it: any) => ({ name: it.name, quantity: it.quantity })),
          shippingAddress: {
            fullName: order.shippingAddress.fullName,
            address: order.shippingAddress.address,
            city: order.shippingAddress.city,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
          },
        });
      }

      if (sendDelivery) {
        await emailService.sendDeliveryConfirmation({
          _id: order._id.toString(),
          user: { email: (order.user as any)?.email },
          items: order.items.map((it: any) => ({ name: it.name })),
        });
      }
    } catch (_err) {
      logger.error('Erreur envoi email suivi expédition:', _err);
    }

    return NextResponse.json(successResponse(order));
  } catch (error: any) {
    logger.error('Erreur mise à jour commande:', error);
    return sendErrorResponse('INTERNALerror', error.message || 'Erreur lors de la mise à jour de la commande');
  }
}));
