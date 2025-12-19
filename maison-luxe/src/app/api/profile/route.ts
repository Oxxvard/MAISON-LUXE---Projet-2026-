import { NextResponse, NextRequest } from 'next/server';
import logger from '@/lib/logger';
import { withAuth } from '@/lib/auth-middleware';
import { withBodyValidation } from '@/lib/validation';
import { ProfileUpdateSchema } from '@/lib/schemas';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const GET = withAuth(async (request: NextRequest, session) => {
  try {
    await dbConnect();

    const user = await User.findOne({ email: session.user.email })
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});

export const PUT = withAuth(withBodyValidation(ProfileUpdateSchema, async (request: NextRequest, session, data) => {
  try {
    const { name, currentPassword, newPassword } = data as { name?: string; currentPassword?: string; newPassword?: string };

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Mise à jour du nom
    if (name && name.trim()) {
      user.name = name.trim();
    }

    // Changement de mot de passe
    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' }, { status: 400 });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    const updatedUser = user.toObject();
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    logger.error('Profile update error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}));
