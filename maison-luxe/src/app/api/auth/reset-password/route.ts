import { NextRequest, NextResponse } from 'next/server';
import { withBodyValidation } from '@/lib/validation';
import { ResetPasswordSchema } from '@/lib/schemas';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import PasswordReset from '@/models/PasswordReset';
import { successResponse, sendErrorResponse, sendCustomError } from '@/lib/errors';
import logger from '@/lib/logger';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const POST = withBodyValidation(ResetPasswordSchema, async (
  request: NextRequest,
  data
) => {
  try {
    await dbConnect();

    const { token, password } = data;

    // Hasher le token reçu pour le comparer avec celui en DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Trouver le token de reset
    const resetEntry = await PasswordReset.findOne({
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetEntry) {
      return sendCustomError(400, 'INVALID_TOKEN', 'Lien de réinitialisation invalide ou expiré');
    }

    // Trouver l'utilisateur
    const user = await User.findById(resetEntry.userId);
    if (!user) {
      return sendErrorResponse('NOT_FOUND', 'Utilisateur non trouvé');
    }

    // Vérifier que le nouveau mot de passe n'est pas le même que l'ancien
    if (user.password && await bcrypt.compare(password, user.password)) {
      return sendCustomError(400, 'SAME_PASSWORD', 'Le nouveau mot de passe doit être différent de l\'ancien');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Mettre à jour le mot de passe
    user.password = hashedPassword;
    await user.save();

    // Marquer le token comme utilisé
    resetEntry.used = true;
    await resetEntry.save();

    // Invalider tous les autres tokens de reset pour cet utilisateur
    await PasswordReset.updateMany(
      { userId: user._id, used: false },
      { $set: { used: true } }
    );

    logger.info('Mot de passe réinitialisé:', { userId: user._id, email: user.email });

    return NextResponse.json(
      successResponse({ 
        message: 'Votre mot de passe a été réinitialisé avec succès' 
      })
    );
  } catch (error: any) {
    logger.error('Erreur reset-password:', error);
    return sendErrorResponse('INTERNALerror', 'Erreur lors de la réinitialisation du mot de passe');
  }
});
