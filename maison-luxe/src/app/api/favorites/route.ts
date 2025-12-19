import { NextResponse, NextRequest } from 'next/server';
import logger from '@/lib/logger';
import { withAuth } from '@/lib/auth-middleware';
import { withBodyValidation } from '@/lib/validation';
import { FavoritePayloadSchema } from '@/lib/schemas';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';

export const GET = withAuth(async (request: NextRequest, session) => {
  try {
    await dbConnect();

    const user = await User.findOne({ email: session.user.email })
      .select('favorites')
      .populate({
        path: 'favorites',
        select: 'name slug price images rating reviewCount stock category',
        populate: { path: 'category', select: 'name slug' }
      })
      .lean();

    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(user.favorites || []);
  } catch (error) {
    logger.error('Erreur récupération favoris:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des favoris' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(withBodyValidation(FavoritePayloadSchema, async (request: NextRequest, session, data) => {
  try {
    const { productId } = data as { productId: string };

    await dbConnect();

    // Vérifier produit existe (rapide, juste un count)
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Opération atomique: ajouter uniquement si pas déjà présent
    const result = await User.findOneAndUpdate(
      { 
        email: session.user.email,
        favorites: { $ne: productId } // Ne pas ajouter si déjà présent
      },
      { $addToSet: { favorites: productId } },
      { new: true, select: 'favorites' }
    );

    if (!result) {
      // Soit user n'existe pas, soit produit déjà dans favoris
      const user = await User.findOne({ email: session.user.email }).select('favorites').lean();
      if (!user) {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Produit déjà dans les favoris' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Ajouté aux favoris', favorites: result.favorites });
  } catch (error) {
    logger.error('Erreur ajout favori:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout aux favoris' },
      { status: 500 }
    );
  }
}));

export const DELETE = withAuth(withBodyValidation(FavoritePayloadSchema, async (request: NextRequest, session, data) => {
  try {
    const { productId } = data as { productId: string };

    await dbConnect();

    // Opération atomique: retirer le produit
    const result = await User.findOneAndUpdate(
      { email: session.user.email },
      { $pull: { favorites: productId } },
      { new: true, select: 'favorites' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Retiré des favoris', favorites: result.favorites });
  } catch (error) {
    logger.error('Erreur retrait favori:', error);
    return NextResponse.json(
      { error: 'Erreur lors du retrait des favoris' },
      { status: 500 }
    );
  }
}));
