import { NextRequest, NextResponse } from 'next/server';
import { withBodyValidation } from '@/lib/validation';
import { ForgotPasswordSchema } from '@/lib/schemas';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import PasswordReset from '@/models/PasswordReset';
import { successResponse, sendErrorResponse } from '@/lib/errors';
import logger from '@/lib/logger';
import crypto from 'crypto';
import { emailService } from '@/lib/email';

export const POST = withBodyValidation(ForgotPasswordSchema, async (
  request: NextRequest,
  data
) => {
  try {
    await dbConnect();

    const { email } = data;

    // Trouver l'utilisateur
    const user = await User.findOne({ email: email.toLowerCase() });

    // Pour des raisons de sécurité, toujours retourner le même message
    // même si l'utilisateur n'existe pas (éviter l'énumération d'emails)
    if (!user) {
      logger.info('Tentative de reset pour email inexistant:', { email });
      return NextResponse.json(
        successResponse({ 
          message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' 
        })
      );
    }

    // Vérifier si l'utilisateur utilise OAuth (Google)
    if (!user.password) {
      logger.info('Tentative de reset pour compte OAuth:', { email });
      return NextResponse.json(
        successResponse({ 
          message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' 
        })
      );
    }

    // Générer un token sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Créer l'entrée de reset (expire dans 1 heure)
    await PasswordReset.create({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 3600000), // 1 heure
      used: false,
    });

    // Construire le lien de reset
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;

    // Envoyer l'email
    try {
      await emailService.sendPasswordReset(user.email, {
        name: user.name,
        resetUrl,
      });
      logger.info('Email de reset envoyé:', { email: user.email });
    } catch (emailError: any) {
      logger.error('Erreur envoi email reset:', emailError);
      // Ne pas bloquer la requête si l'email échoue
      // En dev, on peut continuer même sans email
      if (process.env.NODE_ENV === 'production') {
        return sendErrorResponse('INTERNALerror', 'Erreur lors de l\'envoi de l\'email');
      }
      logger.warn('Mode dev: Email non envoyé, mais token créé. URL:', resetUrl);
    }

    return NextResponse.json(
      successResponse({ 
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.',
        // En dev, retourner le lien direct pour faciliter les tests
        ...(process.env.NODE_ENV !== 'production' && { resetUrl }),
      })
    );
  } catch (error: any) {
    logger.error('Erreur forgot-password:', error);
    return sendErrorResponse('INTERNALerror', 'Erreur lors de la demande de réinitialisation');
  }
});
