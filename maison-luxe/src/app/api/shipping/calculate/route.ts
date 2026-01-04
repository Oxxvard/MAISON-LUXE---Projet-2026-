import { NextRequest, NextResponse } from 'next/server';
import { cjService } from '@/lib/cjdropshipping';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import logger from '@/lib/logger';

// Cache simple pour éviter les appels répétitifs (expire après 5 minutes)
const shippingCache = new Map<string, { data: any; expiry: number }>();

// POST - Calculer les frais de livraison
export async function POST(request: NextRequest) {
  try {
    const { items, country, postalCode } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items required' },
        { status: 400 }
      );
    }

    if (!country) {
      return NextResponse.json(
        { error: 'Country required' },
        { status: 400 }
      );
    }

    // Créer une clé de cache basée sur les paramètres
    const cacheKey = `${country}-${postalCode || 'nozip'}-${items
      .map((i: any) => `${i.id}:${i.quantity}`)
      .join('-')}`;

    // Vérifier le cache
    const cached = shippingCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      logger.info('✅ Using cached shipping calculation');
      return NextResponse.json(cached.data);
    }

    await dbConnect();

    // Récupérer les produits pour obtenir les VIDs CJ
    const productIds = items.map((item: any) => item.id || item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    
    const productMap = new Map(
      products.map((p: any) => [p._id.toString(), p])
    );

    // Préparer les produits pour CJ avec VID - vérifier validité
    const cjProducts = [];
    const missingVids = [];

    for (const item of items) {
      const productId = (item.id || item.product).toString();
      const product = productMap.get(productId);
      
      if (!product) {
        logger.warn(`⚠️ Product not found: ${productId}`);
        missingVids.push(productId);
        continue;
      }

      // Vérifier si le produit a un VID CJ valide (format UUID ou ID CJ)
      const vid = product.cjVid;
      if (!vid || vid === product._id.toString()) {
        logger.warn(`⚠️ Product ${product.name} (${productId}) has no valid CJ VID`);
        missingVids.push(productId);
        continue;
      }

      cjProducts.push({
        vid,
        quantity: item.quantity,
      });
    }

    // Si aucun produit n'a de VID CJ valide, retourner des frais estimés
    if (cjProducts.length === 0) {
      logger.warn('⚠️ No products with valid CJ VID, using default estimate');
      return NextResponse.json({
        success: true,
        shippingOptions: [
          {
              id: 'standard',
              name: 'Standard',
              logisticName: 'CJ Logistics',
            price: 0,
              deliveryTime: '12-20',
          },
          {
            id: 'express',
              name: 'Express',
              logisticName: 'CJ Express',
            price: 15.99,
              deliveryTime: '7-12',
          }
        ],
        defaultShipping: {
            id: 'standard',
            name: 'Standard',
            logisticName: 'CJ Logistics',
          price: 0,
            deliveryTime: '12-20',
        },
        isEstimate: true,
        message: 'Frais de port estimés',
      });
    }

    // Calculer les frais de port avec CJ
    // Note: startCountryCode devrait être le pays du warehouse CJ (généralement CN pour Chine)
    let freightData;
    try {
      freightData = await cjService.calculateFreight({
        startCountryCode: 'CN', // La plupart des produits CJ partent de Chine
        endCountryCode: country,
        products: cjProducts,
        zip: postalCode,
      });
    } catch (freightError: any) {
      logger.warn('⚠️ CJ freight calculation failed, using default estimate:', freightError.message);
      // Retourner des frais estimés si CJ API échoue
      return NextResponse.json({
        success: true,
        shippingOptions: [
          {
            id: 'standard',
            name: 'Standard',
            logisticName: 'CJ Logistics',
            price: 0,
            deliveryTime: '12-20',
          },
          {
            id: 'express',
            name: 'Express',
            logisticName: 'CJ Express',
            price: 15.99,
            deliveryTime: '7-12',
          }
        ],
        defaultShipping: {
          id: 'standard',
          name: 'Standard',
          logisticName: 'CJ Logistics',
          price: 0,
          deliveryTime: '12-20',
        },
        isEstimate: true,
        message: 'Frais de port estimés',
      });
    }
    // Sélectionner 2 options : Standard (économique) et Express (rapide)
    const freightArr = Array.isArray(freightData) ? freightData : [];
    const sortedByPrice = [...freightArr].sort((a: any, b: any) => (a.logisticPrice || 0) - (b.logisticPrice || 0));
    const sortedBySpeed = [...freightArr].sort((a: any, b: any) => {
      const aDays = parseInt(String(a.logisticAging || '').split('-')[1]) || 999;
      const bDays = parseInt(String(b.logisticAging || '').split('-')[1]) || 999;
      return aDays - bDays;
    });

    const selectedOptions = [];

      // Option 1 : Standard - Économique (la moins chère)
    const cheapest = sortedByPrice[0];
    selectedOptions.push({
        id: 'standard',
        name: 'Standard',
        logisticName: cheapest.logisticName,
      price: cheapest.logisticPrice,
      priceCNY: cheapest.logisticPriceCn,
      deliveryTime: cheapest.logisticAging,
      taxesFee: cheapest.taxesFee || 0,
      clearanceFee: cheapest.clearanceOperationFee || 0,
      totalFee: cheapest.totalPostageFee || cheapest.logisticPrice,
    });

      // Option 2 : Express (la plus rapide)
    const express = sortedBySpeed[0];
      // Toujours ajouter Express même si c'est le même que cheapest
      if (express && express !== cheapest) {
      selectedOptions.push({
        id: 'express',
          name: 'Express',
          logisticName: express.logisticName,
        price: express.logisticPrice,
        priceCNY: express.logisticPriceCn,
        deliveryTime: express.logisticAging,
        taxesFee: express.taxesFee || 0,
        clearanceFee: express.clearanceOperationFee || 0,
        totalFee: express.totalPostageFee || express.logisticPrice,
      });
      } else if (freightArr.length > 1) {
        // Si express est identique, prendre une option intermédiaire
        const alternateRaw = sortedByPrice[Math.min(1, sortedByPrice.length - 1)];
        const alternate = (alternateRaw || {}) as Record<string, unknown>;
        const altLogisticPrice = typeof alternate.logisticPrice === 'number' ? (alternate.logisticPrice as number) : Number(alternate.logisticPrice ?? 0) || 0;
        const altTotalPostage = typeof alternate.totalPostageFee === 'number' ? (alternate.totalPostageFee as number) : altLogisticPrice;
        selectedOptions.push({
          id: 'express',
          name: 'Express',
          logisticName: (alternate.logisticName as string) || 'Express',
          price: altLogisticPrice * 1.3, // Légèrement plus cher pour express
          priceCNY: alternate.logisticPriceCn,
          deliveryTime: alternate.logisticAging,
          taxesFee: alternate.taxesFee || 0,
          clearanceFee: alternate.clearanceOperationFee || 0,
          totalFee: altTotalPostage * 1.3,
        });
    }

    // Retourner les options de livraison
    const responseData = {
      success: true,
      shippingOptions: selectedOptions,
        // Option par défaut : Standard (économique)
      defaultShipping: selectedOptions[0],
    };

    // Sauvegarder dans le cache (5 minutes)
    shippingCache.set(cacheKey, {
      data: responseData,
      expiry: Date.now() + 5 * 60 * 1000,
    });

    // Nettoyer le cache des entrées expirées (limite à 100 entrées)
    if (shippingCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of shippingCache.entries()) {
        if (value.expiry < now) {
          shippingCache.delete(key);
        }
      }
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    logger.error('❌ Calculate shipping error:', error);
    
      // Si erreur de rate limit, retourner des frais estimés par défaut
    if (error.message?.includes('QPS limit') || error.message?.includes('Too Many Requests')) {
      logger.warn('⚠️ Rate limit hit, using default shipping estimate');
      return NextResponse.json({
        success: true,
        shippingOptions: [
          {
            id: 'free',
            name: 'Livraison Économique',
            price: 0,
            deliveryTime: '15-30',
          },
          {
            id: 'normal',
            name: 'Livraison Standard',
            price: 5.99,
            deliveryTime: '10-20',
          },
          {
            id: 'express',
            name: 'Livraison Express',
            price: 15.99,
            deliveryTime: '5-10',
          }
        ],
        defaultShipping: {
          id: 'free',
          name: 'Livraison Économique',
          price: 0,
          deliveryTime: '15-30',
        },
        isEstimate: true,
        message: 'Frais de port estimés (calcul en cours)',
      });
    }

    // Si erreur "Variant not found", retourner des frais estimés
    if (error.message?.includes('Variant not found')) {
      logger.warn('⚠️ CJ variant not found, using default shipping estimate');
      return NextResponse.json({
        success: true,
        shippingOptions: [
          {
            id: 'free',
            name: 'Livraison Économique',
            price: 0,
            deliveryTime: '15-30',
          },
          {
            id: 'normal',
            name: 'Livraison Standard',
            price: 5.99,
            deliveryTime: '10-20',
          },
          {
            id: 'express',
            name: 'Livraison Express',
            price: 15.99,
            deliveryTime: '5-10',
          }
        ],
        defaultShipping: {
          id: 'free',
          name: 'Livraison Économique',
          price: 0,
          deliveryTime: '15-30',
        },
        isEstimate: true,
        message: 'Frais de port estimés',
      });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to calculate shipping' },
      { status: 500 }
    );
  }
}
