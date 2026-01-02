import { NextResponse, NextRequest } from 'next/server';
import logger from '@/lib/logger';
import { sendErrorResponse, sendCustomError } from '@/lib/errors';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { withAdminAuth } from '@/lib/auth-middleware';
import { withBodyValidation } from '@/lib/validation';
import { UpdateProductSchema } from '@/lib/schemas';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    if (!slug) {
      return sendCustomError(400, 'INVALID_SLUG', 'Slug manquant');
    }

    const product = await Product.findOne({ slug })
      .populate('category', 'name slug')
      .lean()
      .exec();

    if (!product) {
      return sendCustomError(404, 'PRODUCT_NOT_FOUND', 'Produit non trouvé');
    }

    // Convertir les ObjectId en strings pour éviter les problèmes de sérialisation
    const cleanedProduct = JSON.parse(JSON.stringify(product));

    return NextResponse.json(cleanedProduct);
  } catch (error: any) {
    logger.error('Erreur récupération produit:', error);
    console.error('Product API Error:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
    });
    return sendErrorResponse('INTERNALerror', 'Erreur lors de la récupération du produit');
  }
}

export const PUT = withAdminAuth(withBodyValidation(UpdateProductSchema, async (request: NextRequest, _session, data, ctx) => {
  try {
    const { slug } = await ctx.params;
    await dbConnect();

    const product = await Product.findOneAndUpdate(
      { slug },
      data,
      { new: true, runValidators: true }
    );

    if (!product) {
      return sendCustomError(404, 'PRODUCT_NOT_FOUND', 'Produit non trouvé');
    }

    return NextResponse.json(product);
  } catch (error: any) {
    logger.error('Erreur mise à jour produit:', error);
    return sendErrorResponse('INTERNALerror', error.message || 'Erreur lors de la mise à jour du produit');
  }
}));

export const PATCH = withAdminAuth(withBodyValidation(
  // Partial schema allows updating only name or others
  UpdateProductSchema.pick({ name: true }).partial(),
  async (request: NextRequest, _session, data, ctx) => {
    try {
      const { slug } = await ctx.params;
      await dbConnect();

      const name = (data as any).name;

      if (!name || !String(name).trim()) {
        return sendCustomError(400, 'MISSING_REQUIRED_FIELD', 'Le nom est requis');
      }

      const product = await Product.findOneAndUpdate(
        { slug },
        { name: String(name).trim() },
        { new: true, runValidators: true }
      );

      if (!product) {
        return sendCustomError(404, 'PRODUCT_NOT_FOUND', 'Produit non trouvé');
      }

      return NextResponse.json(product);
    } catch (error: any) {
      logger.error('Erreur mise à jour nom produit:', error);
      return sendErrorResponse('INTERNALerror', error.message || 'Erreur lors de la mise à jour du nom');
    }
  }
));

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    const product = await Product.findOneAndDelete({ slug });

    if (!product) {
      return sendCustomError(404, 'PRODUCT_NOT_FOUND', 'Produit non trouvé');
    }

    return NextResponse.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    logger.error('Erreur suppression produit:', error);
    return sendErrorResponse('INTERNALerror', 'Erreur lors de la suppression du produit');
  }
}
