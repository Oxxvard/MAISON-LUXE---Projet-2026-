import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { cjService } from '@/lib/cjdropshipping';
import { successResponse, sendErrorResponse } from '@/lib/errors';

// GET - Rechercher des produits CJ Dropshipping avec API v2
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('size') || '20');
    const startSellPrice = searchParams.get('startSellPrice') 
      ? parseFloat(searchParams.get('startSellPrice')!) 
      : undefined;
    const endSellPrice = searchParams.get('endSellPrice') 
      ? parseFloat(searchParams.get('endSellPrice')!) 
      : undefined;
    const countryCode = searchParams.get('countryCode') || '';

    const results = await cjService.searchProducts({
      keyword,
      categoryId,
      page,
      size,
      startSellPrice,
      endSellPrice,
      countryCode,
      sort: 'desc',
      orderBy: 0, // best match
    });

    // Enrichir les résultats avec les infos d'entrepôt si disponibles
    const maybeResults: unknown = results;
    if (typeof maybeResults === 'object' && maybeResults !== null) {
      const r = maybeResults as Record<string, any>;
      if (Array.isArray(r.content) && Array.isArray(r.content[0]?.productList)) {
        const enrichedProducts = r.content[0].productList.map((product: any) => ({
          ...product,
          // Récupérer l'ID d'entrepôt depuis les champs possibles
          warehouseId: product.warehouseId || product.storageId || product.storageList?.[0]?.id || null,
          storageList: product.storageList || [], // Liste complète des entrepôts
        }));

        return NextResponse.json(successResponse({ ...r, content: [ { ...r.content[0], productList: enrichedProducts } ] }));
      }
    }

    return NextResponse.json(successResponse(results));
  } catch (error: any) {
    logger.error('CJ Search API Error:', error);
    // Si l'erreur provient d'un rate-limit CJ, retourner 429 au client
    const msg = String(error?.message || '');
    if (msg.includes('Too Many Requests') || msg.includes('QPS limit')) {
      return sendErrorResponse('TOO_MANY_REQUESTS', msg || 'Too Many Requests');
    }

    return sendErrorResponse('INTERNALerror', error.message || 'Failed to search products');
  }
}
