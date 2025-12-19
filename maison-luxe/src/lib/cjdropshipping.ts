// Service CJ Dropshipping API

import fs from 'fs';
import path from 'path';
import logger from '@/lib/logger';
import { captureException } from '@/lib/sentry';
import { logEvent } from '@/lib/events';

// --- Types locaux pour réduire `any` ---
interface CJOrderItem {
  vid?: string;
  quantity?: number;
  storeLineItemId?: string;
  _id?: unknown;
}

interface ShippingAddress {
  address?: string;
  province?: string;
  city?: string;
  country?: string;
  fullName?: string;
  phone?: string;
  postalCode?: string;
}

type OrderData = {
  orderNumber?: string;
  shippingCountryCode?: string;
  shippingCountry?: string;
  shippingProvince?: string;
  shippingCity?: string;
  shippingAddress?: ShippingAddress | string | null;
  shippingCustomerName?: string;
  shippingPhone?: string;
  shippingZip?: string;
  email?: string;
  logisticName?: string;
  fromCountryCode?: string;
  shopLogisticsType?: number;
  payType?: number;
  remark?: string;
  platform?: string;
  storageId?: string;
  warehouseId?: string;
  items?: CJOrderItem[];
  products?: CJOrderItem[];
};

type WarehouseInfo = Record<string, unknown>;

// Typage générique pour les réponses CJ (les interfaces non utilisées ont été réduites)
// Fichier de cache du token (persiste entre redémarrages)
const TOKEN_CACHE_FILE = path.join(process.cwd(), 'tmp', 'cj-token.json');

// Cache global du token (persiste entre les hot-reloads en dev)
let globalTokenCache: {
  token: string | null;
  expiry: number;
} = {
  token: null,
  expiry: 0,
};

// Charger le token depuis le fichier au démarrage
function loadTokenFromFile(): void {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8'));
      if (data.token && data.expiry > Date.now()) {
        globalTokenCache = data;
        logger.info('✅ CJ token loaded from file', { expiresInMinutes: Math.round((data.expiry - Date.now()) / 1000 / 60) });
      }
    }
  } catch (error) {
    logger.warn('Failed to load token from file:', error);
  }
}

// Sauvegarder le token dans un fichier
function saveTokenToFile(token: string, expiry: number): void {
  try {
    const dir = path.dirname(TOKEN_CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify({ token, expiry }));
  } catch (error) {
    logger.warn('Failed to save token to file:', error);
  }
}

// Charger le token au chargement du module
loadTokenFromFile();

class CJDropshippingService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Read env directly; validation happens via `src/lib/env.ts` at startup when used
    this.apiKey = process.env.CJ_API_KEY || '';
    this.baseUrl = process.env.CJ_API_URL || 'https://developers.cjdropshipping.com/api2.0/v1';
    if (!this.apiKey) {
      logger.warn('CJ_API_KEY not set; CJ operations will fail until configured');
    }
  }

  // Obtenir le token d'accès avec cache intelligent global
  async getAccessToken(): Promise<string> {
    // Runtime check: ensure CJ API key is configured
    if (!this.apiKey) {
      logger.error('CJ_API_KEY is not configured. Set CJ_API_KEY in your environment.');
      throw new Error('CJ_API_KEY not configured');
    }
    // Vérifier le cache global
    if (globalTokenCache.token && Date.now() < globalTokenCache.expiry) {
      const minutesLeft = Math.round((globalTokenCache.expiry - Date.now()) / 1000 / 60);
      logger.info('✅ Using cached CJ token', { expiresInMinutes: minutesLeft });
      return globalTokenCache.token!;
    }

    // Si on a un token expiré, essayer de le rafraîchir au lieu d'en obtenir un nouveau
    if (globalTokenCache.token && Date.now() >= globalTokenCache.expiry) {
      logger.info('🔄 Token expired, trying to refresh...');
      try {
        const refreshed = await this.refreshAccessToken(globalTokenCache.token!);
        if (refreshed) return refreshed;
      } catch (error) {
        logger.warn('Failed to refresh token, getting new one:', error);
      }
    }

    logger.info('🔄 Fetching new CJ access token...');
    
    try {
      const response = await fetch(`${this.baseUrl}/authentication/getAccessToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
        }),
      });

      const data = await response.json();

      if (data.code === 200 && data.data) {
        // Sauvegarder dans le cache global ET dans un fichier
        globalTokenCache.token = data.data.accessToken;
        globalTokenCache.expiry = Date.now() + (23 * 60 * 60 * 1000); // 23 heures
        
        saveTokenToFile(globalTokenCache.token!, globalTokenCache.expiry);
        
        logger.info('✅ New CJ token obtained', { expiresAt: new Date(globalTokenCache.expiry).toISOString() });
        return globalTokenCache.token!;
      }
      throw new Error(data.message || 'Failed to get access token');
    } catch (error) {
      logger.error('CJ API Authentication Error:', error);
      captureException(error, { func: 'getAccessToken' });
      throw error;
    }
  }

  // Rafraîchir le token d'accès (5 fois/minute vs 1 fois/5min pour getAccessToken)
  async refreshAccessToken(oldToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/authentication/refreshAccessToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: oldToken,
        }),
      });

      const data = await response.json();

      if (data.code === 200 && data.data) {
        globalTokenCache.token = data.data.accessToken;
        globalTokenCache.expiry = Date.now() + (23 * 60 * 60 * 1000);
        
        saveTokenToFile(globalTokenCache.token!, globalTokenCache.expiry);
        
        logger.info('✅ CJ token refreshed', { expiresAt: new Date(globalTokenCache.expiry).toISOString() });
        return globalTokenCache.token!;
      }

      return null;
    } catch (error) {
      logger.error('CJ Token Refresh Error:', error);
      captureException(error, { func: 'refreshAccessToken' });
      return null;
    }
  }

  // Rechercher des produits avec API v2 (ElasticSearch - plus performant)
  async searchProducts(params: {
    keyword?: string;
    categoryId?: string;
    page?: number;
    size?: number;
    startSellPrice?: number;
    endSellPrice?: number;
    countryCode?: string;
    sort?: 'asc' | 'desc';
    orderBy?: number; // 0=best match, 1=listing count, 2=sell price, 3=create time, 4=inventory
  }): Promise<Record<string, unknown> | null> {
    const token = await this.getAccessToken();

    try {
      const queryParams = new URLSearchParams({
        page: (params.page || 1).toString(),
        size: Math.max(10, Math.min(100, params.size || 20)).toString(), // Min 10, Max 100
        ...(params.keyword && { keyWord: params.keyword }),
        ...(params.categoryId && { categoryId: params.categoryId }),
        ...(params.startSellPrice && { startSellPrice: params.startSellPrice.toString() }),
        ...(params.endSellPrice && { endSellPrice: params.endSellPrice.toString() }),
        ...(params.countryCode && { countryCode: params.countryCode }),
        ...(params.sort && { sort: params.sort }),
        ...(params.orderBy !== undefined && { orderBy: params.orderBy.toString() }),
      });

      const response = await fetch(
        `${this.baseUrl}/product/listV2?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
          },
        }
      );

      const data = await response.json();

      if (data.code === 200) {
        return data.data;
      }

      throw new Error(data.message || 'Failed to search products');
    } catch (error) {
      logger.error('CJ API Search Error:', error);
      captureException(error, { func: 'searchProducts' });
      throw error;
    }
  }

  // Obtenir les détails d'un produit avec features
  async getProductDetails(pid: string, features?: string[]): Promise<Record<string, unknown> | null> {
    const token = await this.getAccessToken();

    try {
      const params = new URLSearchParams({ pid });
      
      // Ajouter les features si fournis (enable_combine, enable_video, enable_inventory)
      if (features && features.length > 0) {
        features.forEach(feature => params.append('features', feature));
      }

      const response = await fetch(
        `${this.baseUrl}/product/query?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
          },
        }
      );

      const data = await response.json();

      if (data.code === 200) {
        return data.data;
      }

      throw new Error(data.message || 'Failed to get product details');
    } catch (error) {
      logger.error('CJ API Product Details Error:', error);
      captureException(error, { func: 'getProductDetails', pid });
      throw error;
    }
  }

  // Obtenir les catégories CJ (structure hiérarchique)
  async getCategories(): Promise<Record<string, unknown> | null> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.baseUrl}/product/getCategory`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
          },
        }
      );

      const data = await response.json();

      if (data.code === 200) {
        return data.data;
      }

      throw new Error(data.message || 'Failed to get categories');
    } catch (error) {
      logger.error('CJ API Categories Error:', error);
      captureException(error, { func: 'getCategories' });
      throw error;
    }
  }

  // ============ STOCK & WAREHOUSE METHODS ============

  // Obtenir le stock d'un produit par SKU
  async getProductStock(sku: string): Promise<Record<string, unknown> | null> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.baseUrl}/product/stock/queryBySku?sku=${sku}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
          },
        }
      );

      const data = await response.json();

      if (data.code === 200) {
        return data.data;
      }

      throw new Error(data.message || 'Failed to get product stock');
    } catch (error) {
      logger.error('CJ API Stock Error:', error);
      captureException(error, { func: 'getProductStock', sku });
      throw error;
    }
  }

  // Obtenir les informations d'un entrepôt/storage
  async getWarehouseInfo(warehouseId: string): Promise<WarehouseInfo> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/warehouse/detail?id=${encodeURIComponent(warehouseId)}`,
        {
          method: 'GET',
          headers: {
            'CJ-Access-Token': token,
          },
        }
      );

      const data = await response.json();

      if (data.code === 200) {
        return data.data as WarehouseInfo;
      }

      throw new Error(data.message || `Failed to get warehouse info for ${warehouseId}`);
    } catch (error) {
      logger.error('CJ API Warehouse Info Error:', error);
      captureException(error, { func: 'getWarehouseInfo', warehouseId });
      throw error;
    }
  }

  // Obtenir les informations de plusieurs entrepôts
  async getMultipleWarehousesInfo(warehouseIds: string[]): Promise<WarehouseInfo[]> {
    try {
      const results = await Promise.all(
        warehouseIds.map(id => this.getWarehouseInfo(id))
      );
      return results;
    } catch (error) {
      logger.error('CJ API Multiple Warehouses Error:', error);
      captureException(error, { func: 'getMultipleWarehousesInfo' });
      throw error;
    }
  }

  // Obtenir la liste globale de tous les entrepôts CJ
  async getGlobalWarehouseList(): Promise<WarehouseInfo[]> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/product/globalWarehouseList`,
        {
          method: 'GET',
          headers: {
            'CJ-Access-Token': token,
          },
        }
      );

      const data = await response.json();

      if (data.code === 200 || data.code === 0 || data.success) {
        return data.data;
      }

      throw new Error(data.message || 'Failed to get global warehouse list');
    } catch (error) {
      logger.error('CJ API Global Warehouse List Error:', error);
      captureException(error, { func: 'getGlobalWarehouseList' });
      throw error;
    }
  }

  // ============ SHOPPING / ORDER METHODS ============

  // Créer une commande CJ
  async createOrder(orderData: OrderData): Promise<Record<string, unknown>> {
    const token = await this.getAccessToken();

    try {
      // Support pour les 2 formats : ancien (products) et nouveau (items + shippingAddress)
      const items: CJOrderItem[] = Array.isArray(orderData.items)
        ? orderData.items
        : Array.isArray(orderData.products)
        ? orderData.products
        : [];

      const addr = (typeof orderData.shippingAddress === 'object' && orderData.shippingAddress !== null
        ? (orderData.shippingAddress as ShippingAddress)
        : {}) as ShippingAddress;
      
      // Déterminer la province - si vide, utiliser la ville comme fallback
      const province = orderData.shippingProvince || addr.province || addr.city || 'N/A';
      
      const payload: Record<string, unknown> = {
        orderNumber: orderData.orderNumber,
        shippingCountryCode: orderData.shippingCountryCode || addr.country || 'US',
        shippingCountry: orderData.shippingCountry || addr.country || 'United States',
        shippingProvince: province,
        shippingCity: (orderData.shippingCity as string) || addr.city || '',
        shippingAddress: addr.address || (typeof orderData.shippingAddress === 'string' ? orderData.shippingAddress : ''),
        shippingCustomerName: (orderData.shippingCustomerName as string) || addr.fullName || '',
        shippingPhone: (orderData.shippingPhone as string) || addr.phone || '',
        shippingZip: (orderData.shippingZip as string) || addr.postalCode || '',
        email: orderData.email || '',
        logisticName: orderData.logisticName || 'USPS',
        fromCountryCode: orderData.fromCountryCode || 'CN',
        shopLogisticsType: orderData.shopLogisticsType || 2, // 2 = Seller Logistics (CJ gère tout)
        payType: orderData.payType || 3,
        remark: orderData.remark || '',
        products: items.map((item: CJOrderItem) => ({
          vid: item.vid,
          quantity: item.quantity,
          storeLineItemId: item.storeLineItemId || (typeof item._id === 'string' ? item._id : undefined),
        })),
      };

      // Ajouter platform et storageId conditionnellement
      if (orderData.platform) {
        payload.platform = orderData.platform;
        // Si platform est fourni, storageId est probablement requis
        if (orderData.storageId || orderData.warehouseId) {
          payload.storageId = orderData.storageId || orderData.warehouseId;
        }
      } else if (orderData.storageId || orderData.warehouseId) {
        // Si seulement storageId sans platform
        payload.storageId = orderData.storageId || orderData.warehouseId;
      }
      // Si ni platform ni storageId ne sont fournis, CJ utilisera ses valeurs par défaut

      logger.info('🛒 Creating CJ order', {
        orderNumber: orderData.orderNumber,
        customer: payload.shippingCustomerName,
        country: payload.shippingCountryCode,
        items: items.length,
      });

      const response = await fetch(
        `${this.baseUrl}/shopping/order/createOrderV3`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.code === 200 && data.data) {
        logger.info('✅ CJ Order created', {
          cjOrderId: data.data.orderId,
          orderNumber: data.data.orderNumber,
          orderAmount: data.data.orderAmount,
        });
        try { logEvent('cj.order.created', { cjOrderId: data.data.orderId, orderNumber: data.data.orderNumber, orderAmount: data.data.orderAmount }); } catch (e) {}
        return data.data;
      }

      throw new Error(data.message || 'Failed to create CJ order');
    } catch (error) {
      logger.error('CJ API Create Order Error:', error);
      captureException(error, { func: 'createOrder', orderNumber: orderData.orderNumber });
      throw error;
    }
  }

  // Obtenir les détails d'une commande CJ
  async getOrderDetails(orderId: string, features?: string[]): Promise<Record<string, unknown> | null> {
    const token = await this.getAccessToken();

    try {
      const params = new URLSearchParams({ orderId });
      
      if (features && features.length > 0) {
        features.forEach(feature => params.append('features', feature));
      }

      const response = await fetch(
        `${this.baseUrl}/shopping/order/getOrderDetail?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
          },
        }
      );

      const data = await response.json();

      if (data.code === 200) {
        return data.data;
      }

      throw new Error(data.message || 'Failed to get order details');
    } catch (error) {
      logger.error('CJ API Get Order Details Error:', error);
      captureException(error, { func: 'getOrderDetails', orderId });
      throw error;
    }
  }

  // Confirmer une commande CJ
  async confirmOrder(orderId: string): Promise<Record<string, unknown> | null> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.baseUrl}/shopping/order/confirmOrder`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
          },
          body: JSON.stringify({ orderId }),
        }
      );

      const data = await response.json();

      if (data.code === 200) {
        logger.info('✅ CJ Order confirmed', { orderId });
        return data.data;
      }

      throw new Error(data.message || 'Failed to confirm order');
    } catch (error) {
      logger.error('CJ API Confirm Order Error:', error);
      captureException(error, { func: 'confirmOrder', orderId });
      throw error;
    }
  }

  // Obtenir le solde du compte CJ
  async getBalance(): Promise<Record<string, unknown> | null> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.baseUrl}/shopping/pay/getBalance`,
        {
          method: 'GET',
          headers: {
            'CJ-Access-Token': token,
          },
        }
      );

      const data = await response.json();

      if (data.code === 200) {
        return data.data;
      }

      throw new Error(data.message || 'Failed to get balance');
    } catch (error) {
      logger.error('CJ API Get Balance Error:', error);
      captureException(error, { func: 'getBalance' });
      throw error;
    }
  }

  // ==================== LOGISTICS API ====================

  // Calculer les frais de port
  async calculateFreight(params: {
    startCountryCode: string;
    endCountryCode: string;
    products: Array<{ vid: string; quantity: number }>;
    zip?: string;
    taxId?: string;
    houseNumber?: string;
    iossNumber?: string;
  }): Promise<Array<Record<string, unknown>> | null> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.baseUrl}/logistic/freightCalculate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
          },
          body: JSON.stringify(params),
        }
      );

      const data = await response.json();

      if (data.code === 200 && data.data) {
        // Log simplifié : nombre d'options au lieu du détail complet
        logger.info('✅ Freight calculated', { options: data.data.length });
        try { logEvent('cj.freight.calculated', { options: data.data.length }); } catch (e) {}
        return data.data;
      }

      // Gérer spécifiquement l'erreur de rate limit
      if (data.message?.includes('QPS limit') || data.message?.includes('Too Many Requests')) {
        logger.warn('⚠️ CJ API Rate limit hit for freight calculation');
        throw new Error('Too Many Requests, QPS limit is 1 time/1second');
      }

      throw new Error(data.message || 'Failed to calculate freight');
    } catch (error) {
      logger.error('CJ API Calculate Freight Error:', error);
      captureException(error, { func: 'calculateFreight' });
      throw error;
    }
  }

  // Obtenir les informations de suivi (tracking)
  async getTrackingInfo(trackNumbers: string[]): Promise<Array<Record<string, unknown>> | null> {
    const token = await this.getAccessToken();

    try {
      // Construire l'URL avec les paramètres de requête
      const params = new URLSearchParams();
      trackNumbers.forEach(num => params.append('trackNumber', num));

      const response = await fetch(
        `${this.baseUrl}/logistic/trackInfo?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'CJ-Access-Token': token,
          },
        }
      );

      const data = await response.json();

      if (data.code === 200 && data.data) {
        logger.info('✅ Tracking info retrieved', { packages: data.data.length });
        return data.data;
      }

      throw new Error(data.message || 'Failed to get tracking info');
    } catch (error) {
      logger.error('CJ API Get Tracking Info Error:', error);
      captureException(error, { func: 'getTrackingInfo' });
      throw error;
    }
  }

  // ==================== WEBHOOK API ====================

  // Configurer les webhooks CJ
  async setWebhook(config: {
    product?: { type: 'ENABLE' | 'CANCEL'; callbackUrls: string[] };
    stock?: { type: 'ENABLE' | 'CANCEL'; callbackUrls: string[] };
    order?: { type: 'ENABLE' | 'CANCEL'; callbackUrls: string[] };
    logistics?: { type: 'ENABLE' | 'CANCEL'; callbackUrls: string[] };
  }): Promise<Record<string, unknown> | null> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.baseUrl}/webhook/set`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
          },
          body: JSON.stringify(config),
        }
      );

      const data = await response.json();

      if (data.code === 200 && data.data) {
        logger.info('✅ CJ Webhooks configured successfully');
        return data.data;
      }

      throw new Error(data.message || 'Failed to set webhooks');
    } catch (error) {
      logger.error('CJ API Set Webhook Error:', error);
      captureException(error, { func: 'setWebhook' });
      throw error;
    }
  }
}

// Export singleton instance
export const cjService = new CJDropshippingService();
