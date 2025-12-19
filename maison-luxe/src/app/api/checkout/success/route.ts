import { NextResponse, NextRequest } from 'next/server';
import logger from '@/lib/logger';
import Stripe from 'stripe';
import { withAuth } from '@/lib/auth-middleware';
import { withBodyValidation } from '@/lib/validation';
import { CheckoutSuccessSchema } from '@/lib/schemas';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { emailService } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export const POST = withAuth(withBodyValidation(CheckoutSuccessSchema, async (request: NextRequest, session, data) => {
  try {
    const { sessionId } = data as { sessionId: string };

    // Récupérer la session Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    // Vérifier que le paiement a bien été complété
    if (stripeSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Paiement non confirmé' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Récupérer la commande par sessionId
    const order = await Order.findOne({ stripeSessionId: sessionId });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est le propriétaire de la commande
    if (order.user.toString() !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Mettre à jour le statut de la commande
    if (order.paymentStatus !== 'paid') {
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            paymentStatus: 'paid',
            status: 'processing',
            emailSent: false, // Réinitialiser pour envoyer l'email
          },
        }
      );
    }

    // Envoyer l'email de confirmation de paiement
    try {
      logger.info('📧 Envoi email de confirmation depuis /checkout/success...');
      
      // Récupérer la commande mise à jour avec les infos de l'utilisateur
      const updatedOrder = await Order.findById(order._id)
        .populate('user')
        .populate('items.product');

      if (updatedOrder && updatedOrder.user) {
        await emailService.sendOrderConfirmation({
          _id: updatedOrder._id,
          user: {
            email: (updatedOrder.user as any).email,
            name: (updatedOrder.user as any).name,
          },
          items: updatedOrder.items,
          totalAmount: updatedOrder.totalAmount,
          shippingAddress: updatedOrder.shippingAddress,
        });

        // Marquer l'email comme envoyé
        await Order.updateOne(
          { _id: order._id },
          { $set: { emailSent: true } }
        );

        logger.info('✅ Email de confirmation envoyé');
      }
      } catch (emailError: any) {
      logger.error('⚠️ Erreur envoi email:', emailError.message);
      // Ne pas bloquer la réponse si l'email échoue
    }

    return NextResponse.json({
      orderId: order._id,
      message: 'Paiement confirmé',
    });
  } catch (error: any) {
    logger.error('Erreur confirmation paiement:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la confirmation' },
      { status: 500 }
    );
  }
}));
