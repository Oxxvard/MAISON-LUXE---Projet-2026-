import { Resend } from 'resend';
import logger from '@/lib/logger';
import { captureException } from '@/lib/sentry';
import { logEvent, logErrorEvent } from '@/lib/events';

// Initialiser Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY);

// Email par défaut de l'expéditeur
const FROM_EMAIL = process.env.EMAIL_FROM || 'Maison Luxe <onboarding@resend.dev>';

type EmailUser = { email: string; name?: string };
type EmailItem = { name: string; quantity?: number; price?: number };
type EmailShippingAddress = {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

type OrderEmail = {
  _id: string | number | { toString?: () => string };
  user: EmailUser;
  items?: EmailItem[];
  totalAmount?: number;
  shippingAddress?: EmailShippingAddress;
  trackingNumber?: string;
};

/**
 * Service d'envoi d'emails transactionnels
 */
export const emailService = {
  /**
   * Envoyer un email de confirmation de commande
   */
  async sendOrderConfirmation(order: OrderEmail) {
    try {
      const orderIdStr = String(order._id);
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [order.user.email],
        subject: `✅ Commande confirmée #${orderIdStr.slice(-8)}`,
        html: generateOrderConfirmationHTML(order),
      });

      if (error) {
        logger.error('❌ Erreur envoi email confirmation:', error);
        captureException(error, { func: 'sendOrderConfirmation', orderId: orderIdStr });
        try { logErrorEvent('email.order_confirmation.failed', error, { orderId: orderIdStr, to: order.user.email }); } catch (e) {}
        throw error;
      }

      logger.info('✅ Email confirmation envoyé', { id: data?.id });
      try { logEvent('email.order_confirmation.sent', { orderId: orderIdStr, to: order.user.email, messageId: data?.id }); } catch (e) {}
      return data;
    } catch (error) {
      logger.error('❌ Erreur sendOrderConfirmation:', error);
      captureException(error, { func: 'sendOrderConfirmation', orderId: String(order._id) });
      throw error;
    }
  },

  /**
   * Envoyer un email de notification d'expédition
   */
  async sendShippingNotification(order: OrderEmail) {
    try {
      const orderIdStr = String(order._id);
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [order.user.email],
        subject: `📦 Votre commande #${orderIdStr.slice(-8)} a été expédiée`,
        html: generateShippingNotificationHTML(order),
      });

      if (error) {
        logger.error('❌ Erreur envoi email expédition:', error);
        captureException(error, { func: 'sendShippingNotification', orderId: orderIdStr });
        try { logErrorEvent('email.shipping_notification.failed', error, { orderId: orderIdStr, to: order.user.email }); } catch (e) {}
        throw error;
      }

      logger.info('✅ Email expédition envoyé', { id: data?.id });
      try { logEvent('email.shipping_notification.sent', { orderId: orderIdStr, to: order.user.email, messageId: data?.id }); } catch (e) {}
      return data;
    } catch (error) {
      logger.error('❌ Erreur sendShippingNotification:', error);
      captureException(error, { func: 'sendShippingNotification', orderId: String(order._id) });
      throw error;
    }
  },

  /**
   * Envoyer un email de livraison confirmée
   */
  async sendDeliveryConfirmation(order: OrderEmail) {
    try {
      const orderIdStr = String(order._id);
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [order.user.email],
        subject: `✨ Votre commande #${orderIdStr.slice(-8)} est livrée`,
        html: generateDeliveryConfirmationHTML(order),
      });

      if (error) {
        logger.error('❌ Erreur envoi email livraison:', error);
        captureException(error, { func: 'sendDeliveryConfirmation', orderId: orderIdStr });
        try { logErrorEvent('email.delivery_confirmation.failed', error, { orderId: orderIdStr, to: order.user.email }); } catch (e) {}
        throw error;
      }

      logger.info('✅ Email livraison envoyé', { id: data?.id });
      try { logEvent('email.delivery_confirmation.sent', { orderId: orderIdStr, to: order.user.email, messageId: data?.id }); } catch (e) {}
      return data;
    } catch (error) {
      logger.error('❌ Erreur sendDeliveryConfirmation:', error);
      captureException(error, { func: 'sendDeliveryConfirmation', orderId: String(order._id) });
      throw error;
    }
  },
};

/**
 * Template HTML pour email de confirmation de commande
 */
function generateOrderConfirmationHTML(order: OrderEmail): string {
  const orderIdStr = String(order._id);
  const items = order.items ?? [];
  const itemsHTML = items
    .map((item: EmailItem) => {
      const price = typeof item.price === 'number' ? item.price : 0;
      const qty = typeof item.quantity === 'number' ? item.quantity : 1;
      return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${item.name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
        ${qty}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        ${(price * qty).toFixed(2)} €
      </td>
    </tr>
  `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de commande</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">✅ Commande confirmée</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #333;">
                  Bonjour <strong>${order.shippingAddress?.fullName ?? ''}</strong>,
              </p>
              <p style="margin: 0 0 30px; font-size: 16px; color: #666;">
                Merci pour votre commande ! Nous avons bien reçu votre paiement et préparons votre colis avec soin.
              </p>

              <!-- Order Details -->
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 10px; font-size: 18px; color: #333;">
                  Commande #${orderIdStr.slice(-8)}
                </h2>
                <p style="margin: 0; font-size: 14px; color: #666;">
                  ${new Date().toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>

              <!-- Items Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #666;">Produit</th>
                    <th style="padding: 12px; text-align: center; font-size: 14px; color: #666;">Qté</th>
                    <th style="padding: 12px; text-align: right; font-size: 14px; color: #666;">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px;">
                      Total
                    </td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px; color: #667eea;">
                      ${(order.totalAmount ?? 0).toFixed(2)} €
                    </td>
                  </tr>
                </tfoot>
              </table>

              <!-- Shipping Address -->
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px; font-size: 16px; color: #333;">
                  📍 Adresse de livraison
                </h3>
                <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
                  ${order.shippingAddress?.fullName ?? ''}<br>
                  ${order.shippingAddress?.address ?? ''}<br>
                  ${order.shippingAddress?.postalCode ?? ''} ${order.shippingAddress?.city ?? ''}<br>
                  ${order.shippingAddress?.country ?? ''}
                </p>
              </div>

              <!-- Next Steps -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>Prochaine étape :</strong> Vous recevrez un email avec votre numéro de suivi dès que votre colis sera expédié.
                </p>
              </div>

              <p style="margin: 0; font-size: 14px; color: #666;">
                Merci de votre confiance,<br>
                <strong style="color: #667eea;">L'équipe Maison Luxe</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                Cet email a été envoyé à ${order.user.email}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Template HTML pour email de notification d'expédition
 */
function generateShippingNotificationHTML(order: OrderEmail): string {
  const orderIdStr = String(order._id);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commande expédiée</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">📦 Colis expédié !</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #333;">
                Bonjour <strong>${order.shippingAddress?.fullName ?? ''}</strong>,
              </p>
              <p style="margin: 0 0 30px; font-size: 16px; color: #666;">
                Bonne nouvelle ! Votre commande a été expédiée et est en route vers vous.
              </p>

              <!-- Tracking Number -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #ffffff; opacity: 0.9;">
                  Numéro de suivi
                </p>
                <p style="margin: 0; font-size: 24px; color: #ffffff; font-weight: bold; letter-spacing: 1px;">
                  ${order.trackingNumber}
                </p>
              </div>

              <!-- Order Info -->
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px; font-size: 16px; color: #333;">
                  📋 Détails de la commande
                </h3>
                <p style="margin: 0 0 5px; font-size: 14px; color: #666;">
                  <strong>Commande :</strong> #${orderIdStr.slice(-8)}
                </p>
                <p style="margin: 0; font-size: 14px; color: #666;">
                  <strong>Articles :</strong> ${((order.items ?? []).length)} produit(s)
                </p>
              </div>

              <!-- Shipping Address -->
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px; font-size: 16px; color: #333;">
                  📍 Adresse de livraison
                </h3>
                <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
                  ${order.shippingAddress?.fullName ?? ''}<br>
                  ${order.shippingAddress?.address ?? ''}<br>
                  ${order.shippingAddress?.postalCode ?? ''} ${order.shippingAddress?.city ?? ''}<br>
                  ${order.shippingAddress?.country ?? ''}
                </p>
              </div>

              <p style="margin: 0; font-size: 14px; color: #666;">
                Merci de votre confiance,<br>
                <strong style="color: #667eea;">L'équipe Maison Luxe</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                Cet email a été envoyé à ${order.user.email}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Template HTML pour email de livraison confirmée
 */
function generateDeliveryConfirmationHTML(order: OrderEmail): string {
  const orderIdStr = String(order._id);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commande livrée</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
              <div style="font-size: 48px; margin-bottom: 10px;">✨</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Commande livrée !</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #333;">
                Bonjour,
              </p>
              <p style="margin: 0 0 30px; font-size: 16px; color: #666;">
                Votre commande a été livrée avec succès ! Nous espérons que vous êtes satisfait(e) de vos achats.
              </p>

              <!-- Order Info -->
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <p style="margin: 0 0 5px; font-size: 14px; color: #047857;">
                  <strong>Commande #${orderIdStr.slice(-8)}</strong>
                </p>
                <p style="margin: 0; font-size: 14px; color: #047857;">
                  ${((order.items ?? []).length)} produit(s) livré(s)
                </p>
              </div>

              <p style="margin: 0 0 20px; font-size: 14px; color: #666;">
                Si vous avez des questions ou des préoccupations concernant votre commande, n'hésitez pas à nous contacter.
              </p>

              <p style="margin: 0; font-size: 14px; color: #666;">
                Merci de votre confiance,<br>
                <strong style="color: #10b981;">L'équipe Maison Luxe</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                Cet email a été envoyé à ${order.user.email}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
