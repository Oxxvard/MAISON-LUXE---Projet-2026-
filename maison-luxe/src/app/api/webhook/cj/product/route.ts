import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import logger from '@/lib/logger';
import { successResponse, sendErrorResponse, sendCustomError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Webhook CJ - Mises à jour de produits
 * 
 * CJ envoie des notifications quand un produit change :
 * - Changement de prix
 * - Nouvelles images
 * - Modification de description
 * - Produit discontinué
 * - Nouvelles variantes
 * 
 * Requis par CJ : réponse < 3s avec status 200
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    logger.info('🔔 CJ Product Webhook received:', JSON.stringify(body, null, 2));

    await dbConnect();

    // Structure attendue
    const {
      productId,         // CJ Product ID
      vid,               // Variant ID
      sku,               // SKU
      productName,       // Nouveau nom
      sellPrice,         // Nouveau prix de vente
      productImage,      // Nouvelle image principale
      variants,          // Nouvelles variantes
      description,       // Nouvelle description
      discontinued,      // Boolean: produit arrêté
      updateType,        // Type de mise à jour: PRICE, IMAGE, INFO, DISCONTINUED
      updateTime,        // Timestamp
    } = body;

    // Ignorer les payloads de test/validation de CJ
    if (productId === 'test' || vid === 'test' || sku === 'test') {
      logger.info('✅ CJ Product Webhook validation payload acknowledged');
      return NextResponse.json(successResponse({ message: 'Webhook validation successful' }), { status: 200 });
    }

    if (!productId && !vid && !sku) {
      logger.warn('⚠️ Webhook product: missing identifier');
      return sendErrorResponse('MISSING_REQUIRED_FIELD', 'Missing product identifier');
    }

    // Trouver le produit
    const query: any = {};
    if (productId) query['cjData.productId'] = productId;
    else if (vid) query['cjData.vid'] = vid;
    else if (sku) query['cjData.sku'] = sku;

    const product = await Product.findOne(query);

    if (!product) {
      logger.warn('⚠️ Webhook product: Product not found', query);
      return NextResponse.json(successResponse({ message: 'Product not found but acknowledged' }));
    }

    // Préparer les mises à jour
    const updates: any = {
      updatedAt: new Date(),
    };

    // Mettre à jour le prix si fourni
    if (typeof sellPrice === 'number' && sellPrice > 0) {
      // Calculer notre nouveau prix (marge x3 par exemple)
      const oldPrice = product.price;
      updates.price = Math.round(sellPrice * 3 * 100) / 100;
      logger.info(`💰 Updating price for ${product.name}: ${oldPrice}€ → ${updates.price}€`);
    }

    // Mettre à jour l'image si fournie
    if (productImage) {
      updates.image = productImage;
      logger.info(`🖼️ Updating image for ${product.name}`);
    }

    // Mettre à jour le nom si fourni
    if (productName) {
      updates.name = productName;
    }

    // Mettre à jour la description si fournie
    if (description) {
      updates.description = description;
    }

    // Marquer comme discontinué
    if (discontinued === true) {
      updates.inStock = false;
      updates.stock = 0;
      logger.info(`⚠️ Product ${product.name} discontinued by CJ`);
    }

    // Mettre à jour les données CJ
    if (!product.cjData) {
      updates.cjData = {};
    }

    updates['cjData.lastProductUpdate'] = new Date();
    updates['cjData.updateType'] = updateType;

    if (variants) {
      updates['cjData.variants'] = variants;
    }

    // Appliquer les mises à jour
    await Product.updateOne({ _id: product._id }, { $set: updates });

    const elapsed = Date.now() - startTime;
    logger.info(`✅ Product ${product._id} updated (${elapsed}ms)`);

    return NextResponse.json(successResponse({ productId: product._id, updateType, processingTime: elapsed }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    logger.error('❌ CJ Product Webhook Error:', error);
    return sendCustomError(200, 'WEBHOOK_PROCESSINGerror', error.message || 'Internal error', { processingTime: elapsed });
  }
}
