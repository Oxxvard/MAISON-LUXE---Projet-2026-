import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { cjService } from '@/lib/cjdropshipping';
import logger from '@/lib/logger';
import { logEvent } from '@/lib/events';

// Helper function to add delay between requests (rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const POST = withAdminAuth(async (request, session) => {
  try {
    await connectDB();

  // Chercher les produits avec PID (pas VID - VID c'est pour les variantes)
  const products = await Product.find({ 
    $or: [
      { cjPid: { $exists: true, $ne: null } },
      { cjVid: { $exists: true, $ne: null } }
    ]
  });

  let updated = 0;
  let errors = 0;
  let skipped = 0;

  for (const product of products) {
    try {
      // Utiliser PID si disponible, sinon VID (certains produits n'ont que VID)
      const productId = product.cjPid || product.cjVid;
      
      if (!productId) {
        skipped++;
        continue;
        }

        // Délai de 1.2 secondes entre chaque requête pour respecter le rate limit
        await delay(1200);

        // Get product details from CJ
        const productDataRaw = (await cjService.getProductDetails(productId)) as unknown;

        if (productDataRaw && typeof productDataRaw === 'object') {
          const productData = productDataRaw as { sellPrice?: string | number; inventory?: string | number };

          // Update cost price
          if (productData.sellPrice !== undefined && productData.sellPrice !== null) {
            product.costPrice = parseFloat(String(productData.sellPrice));
          }

          // Update stock if available
          if (productData.inventory !== undefined && productData.inventory !== null) {
            product.stock = parseInt(String(productData.inventory));
          }

          // Get shipping cost (avec délai supplémentaire)
          try {
            await delay(1200);
            
            const shippingDataRaw = (await cjService.calculateFreight({
              startCountryCode: 'CN',
              endCountryCode: 'FR',
              products: [{
                vid: product.cjVid || productId,
                quantity: 1
              }]
            })) as unknown;

            if (Array.isArray(shippingDataRaw) && shippingDataRaw.length > 0) {
              const shippingData = shippingDataRaw as Array<Record<string, any>>;
              const cheapestShipping = shippingData
                .sort((a, b) => parseFloat(a.logisticPrice || 0) - parseFloat(b.logisticPrice || 0))[0];

              if (cheapestShipping?.logisticPrice) {
                product.shippingCost = parseFloat(String(cheapestShipping.logisticPrice));
              }
            }
          } catch (shippingError: any) {
            // Ne pas bloquer si le calcul de frais échoue
            logger.warn(`⚠️ Skipping shipping cost for ${productId}:`, shippingError.message);
          }

          await product.save();
          updated++;
          logger.info(`✅ [${updated}/${products.length}] Synced "${product.name}" - Cost: ${product.costPrice}€, Shipping: ${product.shippingCost}€`);
          try { logEvent('cj.product.synced', { productId: product._id?.toString?.(), name: product.name, cost: product.costPrice, shippingCost: product.shippingCost, index: updated }); } catch (e) {}
        }
        } catch (error: any) {
        // Logger l'erreur mais continuer avec les autres produits
        if (error.message?.includes('Product not found')) {
          logger.warn(`⚠️ Product not found in CJ: ${product.cjPid || product.cjVid}`);
          skipped++;
        } else if (error.message?.includes('Too Many Requests')) {
          logger.warn(`⚠️ Rate limit hit, waiting 2 seconds...`);
          await delay(2000);
          errors++;
        } else {
          logger.error(`❌ Error syncing ${product.name}:`, error.message);
          errors++;
        }
      }
    }
    try { logEvent('cj.sync.completed', { updated, skipped, errors, total: products.length }); } catch (e) {}

    return NextResponse.json({
      success: true,
      updated,
      errors,
      skipped,
      total: products.length,
      message: `${updated} produits synchronisés, ${skipped} ignorés, ${errors} erreurs`
    });
  } catch (error) {
    logger.error('Error syncing with CJ:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation avec CJ' },
      { status: 500 }
    );
  }
});
