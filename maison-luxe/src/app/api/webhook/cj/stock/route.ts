import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import logger from '@/lib/logger';
import { CJStockWebhookSchema } from '@/lib/schemas';
import { successResponse, sendErrorResponse, sendCustomError, formatZodError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Webhook CJ - Mises à jour de stock
 * 
 * CJ envoie des notifications quand le stock change :
 * - Stock disponible
 * - Rupture de stock
 * - Réapprovisionnement
 * 
 * Requis par CJ : réponse < 3s avec status 200
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    logger.info('📊 CJ Stock Webhook received:', JSON.stringify(body, null, 2));

    // Ignorer les payloads de test/validation de CJ
    if (body.vid === 'test' || body.sku === 'test' || body.productId === 'test') {
      logger.info('✅ CJ Stock Webhook validation payload acknowledged');
      return NextResponse.json(successResponse({ message: 'Webhook validation successful' }), { status: 200 });
    }

    const parsed = CJStockWebhookSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn('⚠️ CJ Stock Webhook: payload validation failed', { errors: parsed.error.format() });
      return NextResponse.json(successResponse({ message: 'Invalid webhook payload (acknowledged)', details: formatZodError(parsed.error) }));
    }

    await dbConnect();

    // Structure attendue (peut varier)
    const {
      vid,               // Variant ID
      sku,               // SKU CJ
      productId,         // Product ID CJ
      stock,             // Nouveau stock disponible
      inStock,           // Boolean: en stock ou non
      warehouseId,       // ID de l'entrepôt
      updateTime,        // Timestamp
    } = parsed.data;

    if (!vid && !sku && !productId) {
      logger.warn('⚠️ Webhook stock: missing product identifier');
      return sendErrorResponse('MISSING_REQUIRED_FIELD', 'Missing product identifier');
    }

    // Trouver le produit dans notre DB
    const query: any = {};
    if (vid) query['cjData.vid'] = vid;
    else if (sku) query['cjData.sku'] = sku;
    else if (productId) query['cjData.productId'] = productId;

    const product = await Product.findOne(query);

    if (!product) {
      logger.warn('⚠️ Webhook stock: Product not found', query);
      return NextResponse.json(successResponse({ message: 'Product not found but acknowledged' }));
    }

    // Préparer les mises à jour
    const updates: any = {
      updatedAt: new Date(),
    };

    // Mettre à jour le stock si fourni
    if (typeof stock === 'number') {
      updates.stock = Math.max(0, stock);
      logger.info(`📦 Updating stock for ${product.name}: ${product.stock} → ${stock}`);
    }

    // Mettre à jour la disponibilité
    if (typeof inStock === 'boolean') {
      updates.inStock = inStock;
      // Si hors stock, mettre le stock à 0
      if (!inStock && updates.stock === undefined) {
        updates.stock = 0;
      }
    }

    // Stocker les infos CJ
    if (!product.cjData) {
      updates.cjData = product.cjData || {};
    }

    updates['cjData.lastStockUpdate'] = new Date();
    if (warehouseId) {
      updates['cjData.warehouseId'] = warehouseId;
    }

    // Appliquer les mises à jour
    await Product.updateOne({ _id: product._id }, { $set: updates });

    const elapsed = Date.now() - startTime;
    logger.info(`✅ Stock updated for product ${product._id} (${elapsed}ms)`);

    return NextResponse.json(successResponse({ productId: product._id, newStock: updates.stock, processingTime: elapsed }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    logger.error('❌ CJ Stock Webhook Error:', error);
    return sendCustomError(200, 'WEBHOOK_PROCESSINGerror', error.message || 'Internal error', { processingTime: elapsed });
  }
}
