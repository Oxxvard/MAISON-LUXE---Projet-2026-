'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Download, X, Loader, ArrowLeft, RefreshCw, Truck } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface CJProduct {
  id: string; // API v2 utilise "id" au lieu de "pid"
  nameEn: string; // API v2 utilise "nameEn" au lieu de "productNameEn"
  bigImage: string; // API v2 utilise "bigImage" au lieu de "productImage"
  sellPrice: string;
  warehouseInventoryNum?: number; // API v2 utilise ce champ pour le stock
  description?: string;
  warehouseId?: string; // ID d'entrepôt principal
  storageList?: Array<{ id: string; name?: string }>;
}

interface WarehouseInfo {
  id: string;
  name: string;
  areaCountryCode: string;
  city: string;
  province: string;
  logisticsBrandList: Array<{ id: string; name: string }>;
}

// Rate limiter simple
class RateLimiter {
  private lastCall: number = 0;
  private minDelay: number = 1100; // 1.1 secondes pour respecter le QPS limit

  async call<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;

    if (timeSinceLastCall < this.minDelay) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minDelay - timeSinceLastCall)
      );
    }

    this.lastCall = Date.now();
    return fn();
  }
}

const productDetailsLimiter = new RateLimiter();

export default function CJImportPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState<CJProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const [customPrices, setCustomPrices] = useState<Record<string, number | undefined>>({});
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(null);
  const [warehouseCache, setWarehouseCache] = useState<Record<string, WarehouseInfo | null>>({});
  const [loadingWarehouse, setLoadingWarehouse] = useState<string | null>(null);
  const [productDetailsCache, setProductDetailsCache] = useState<Record<string, any>>({});
  const [shippingLoading, setShippingLoading] = useState<Record<string, boolean>>({});
  const [shippingInfo, setShippingInfo] = useState<Record<string, { price: number; name: string; time?: string; country: string } | null>>({});
  const shippingCache = useState<Map<string, { data: any; expiry: number }>>(() => new Map())[0];
  const [selectedCountry, setSelectedCountry] = useState<string>('FR');
  const [bulkCalculating, setBulkCalculating] = useState(false);
  const searchTimer = useRef<number | null>(null);

  // Rate limiter pour les appels freight (en plus de product details)
  const freightLimiter = new RateLimiter();

  // Charger/Enregistrer le pays sélectionné dans localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cjImportSelectedCountry');
      if (stored) setSelectedCountry(stored);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cjImportSelectedCountry', selectedCountry);
    } catch {}
  }, [selectedCountry]);

  // Charger les catégories locales
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  // Charger les infos d'entrepôt
  const loadWarehouseInfo = async (warehouseId: string) => {
    // Vérifier le cache
    if (warehouseCache[warehouseId] !== undefined) {
      return warehouseCache[warehouseId];
    }

    try {
      const response = await fetch(`/api/cj/warehouse?id=${warehouseId}`);
      const data = await response.json();

      if (response.ok) {
        setWarehouseCache(prev => ({
          ...prev,
          [warehouseId]: data
        }));
        return data;
      } else {
        setWarehouseCache(prev => ({
          ...prev,
          [warehouseId]: null
        }));
        return null;
      }
    } catch (error) {
      console.error('Erreur chargement entrepôt:', error);
      setWarehouseCache(prev => ({
        ...prev,
        [warehouseId]: null
      }));
      return null;
    }
  };

  // Charger les détails complets du produit pour obtenir l'ID d'entrepôt
  const loadProductWarehouseInfo = async (productId: string) => {
    // Vérifier le cache client d'abord
    if (productDetailsCache[productId]) {
      const cached = productDetailsCache[productId];
      if (cached.warehouseId) {
        const info = await loadWarehouseInfo(cached.warehouseId);
        if (info) {
          setProducts(prev =>
            prev.map(p =>
              p.id === productId
                ? { ...p, warehouseId: cached.warehouseId }
                : p
            )
          );
          return;
        }
      }
    }

    setLoadingWarehouse(productId);
    try {
      // Utiliser le rate limiter pour respecter le QPS limit
      await productDetailsLimiter.call(async () => {
        const response = await fetch(
          `/api/cj/product/${productId}?features=enable_inventory`
        );
        
        if (response.status === 429) {
          throw new Error('Limite API atteinte. Veuillez attendre 30 secondes avant de réessayer.');
        }

        const json = await response.json();

        if (!response.ok) {
          console.error('API Error:', json);
          throw new Error(json.error || 'Erreur lors de la récupération des infos');
        }

        // Normaliser la charge utile : certains endpoints renvoient { success: true, data: {...} }
        const data = json?.data ?? json;

        console.log('✅ Product details response received:');
        console.log('   - raw response keys:', Object.keys(json).slice(0, 20));
        console.log('   - warehouseId:', data.warehouseId);
        console.log('   - _source:', data._source);

        if (data?.warehouseId) {
          // Mettre en cache
          setProductDetailsCache(prev => ({
            ...prev,
            [productId]: data
          }));

          // Charger aussi les infos de cet entrepôt
          const warehouseInfo = await loadWarehouseInfo(data.warehouseId);
          
          // Enrichir le produit avec l'ID d'entrepôt
          setProducts(prev =>
            prev.map(p =>
              p.id === productId
                ? { ...p, warehouseId: data.warehouseId }
                : p
            )
          );

          if (warehouseInfo) {
            const source = data._source?.warehouseId === 'default' ? ' (par défaut)' : '';
            toast.success(`Infos entrepôt chargées${source} !`);
          } else {
            toast.error('Erreur lors du chargement de l\'entrepôt');
          }
        } else {
          console.error('No warehouseId in response:', data);
          toast.error('ID d\'entrepôt non disponible dans la réponse');
        }
      });
    } catch (error: any) {
      console.error('Erreur chargement détails produit:', error);
      toast.error(error.message || 'Erreur lors du chargement des infos');
    } finally {
      setLoadingWarehouse(null);
    }
  };

  // Rechercher des produits sur CJ
  const searchProducts = async () => {
    if (!keyword.trim()) {
      toast.error('Entrez un mot-clé de recherche');
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/cj/search?keyword=${encodeURIComponent(keyword)}&size=20`);

      // Lire le texte brut d'abord (peut être une page HTML en cas de redirect proxy)
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch (e) { /* non-JSON body */ }

      if (!res.ok) {
        console.error('Recherche CJ non-ok:', res.status, text);
        // Si CJ renvoie 429 via la route, afficher message clair
        if (res.status === 429 || (data && data.error && data.error.code === 'TOO_MANY_REQUESTS')) {
          toast.error('Trop de requêtes vers CJ — réessayez dans quelques secondes');
        } else if (res.status === 404) {
          toast.error('Endpoint introuvable (404) — vérifiez le serveur/dev tunnel');
        } else {
          toast.error('Erreur lors de la recherche');
        }
        setProducts([]);
        return;
      }

      if (!data) {
        // Corps non-JSON (probablement HTML) — afficher pour debug
        console.error('Réponse non-JSON reçue pour la recherche CJ:', text.slice(0, 200));
        toast.error('Réponse inattendue (HTML) reçue — voir la console pour plus de détails');
        setProducts([]);
        return;
      }

      // Certains endpoints renvoient directement l'objet CJ, d'autres sont enveloppés
      // dans { success: true, data: {...} }. Normaliser la charge utile.
      const payload = data.data || data;

      // API v2 retourne les produits dans content[0].productList
      if (payload.content && payload.content.length > 0 && payload.content[0].productList) {
        const productList = payload.content[0].productList;
        setProducts(productList);
        toast.success(`${productList.length} produits trouvés`);
      } else {
        setProducts([]);
        toast.error('Aucun produit trouvé');
      }
    } catch (error) {
      console.error('Erreur de recherche:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setSearching(false);
    }
  };

  // Debounced search pour éviter d'atteindre le QPS limit côté CJ
  const scheduleSearch = () => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }
    searchTimer.current = window.setTimeout(() => {
      searchProducts();
      searchTimer.current = null;
    }, 500);
  };

  const refreshSearch = async () => {
    if (!keyword.trim()) return;
    await searchProducts();
  };

  // Calcul du coût de livraison (FR) pour un produit (utilise le premier VID disponible)
  const calculateShippingForProduct = async (productId: string) => {
    try {
      setShippingLoading(prev => ({ ...prev, [productId]: true }));

      // S'assurer que les détails (variants) sont chargés
      let details = productDetailsCache[productId];
      if (!details) {
        const res = await productDetailsLimiter.call(() => fetch(`/api/cj/product/${productId}?features=enable_inventory`));
        if (!res.ok) {
          let msg: any = 'Erreur chargement détails produit';
          try {
            const err = await res.json();
            msg = err?.error ?? err ?? msg;
          } catch {}
          const safe = typeof msg === 'string' ? msg : (msg?.message || msg?.code || JSON.stringify(msg));
          toast.error(safe || 'Erreur chargement détails produit');
          setShippingInfo(prev => ({ ...prev, [productId]: null }));
          return; // ne pas interrompre le calcul global, on passe au suivant
        }
        let json = await res.json();
        // Normaliser : certains endpoints renvoient { success:true, data: {...} }
        const normalized = json?.data ?? json;
        details = normalized;
        setProductDetailsCache(prev => ({ ...prev, [productId]: normalized }));
      }

      const variants = details?.variants || [];
      const firstVid = variants[0]?.vid;
      if (!firstVid) {
        toast.error('Aucune variante CJ (VID) trouvée');
        setShippingInfo(prev => ({ ...prev, [productId]: null }));
        return;
      }

      // Cache clé par produit+pays
      const cacheKey = `${productId}:${selectedCountry}`;
      const cached = shippingCache.get(cacheKey);
      let data: any = null;
      if (cached && Date.now() < cached.expiry) {
        data = cached.data;
      } else {
        const freightRes = await freightLimiter.call(() => fetch('/api/cj/freight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vids: [firstVid], country: selectedCountry, quantity: 1 })
        }));
        data = await freightRes.json();
        if (!freightRes.ok || !data.success) {
          toast.error(
            (data?.error && (data.error.message || data.error.code)) ||
              (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || {})) ||
              'Erreur calcul livraison'
          );
          setShippingInfo(prev => ({ ...prev, [productId]: null }));
          return;
        }
        // Cache 10 minutes
        shippingCache.set(cacheKey, { data, expiry: Date.now() + 10 * 60 * 1000 });
      }

      const opt = data.defaultShipping || data.shippingOptions?.[0];
      if (opt) {
        setShippingInfo(prev => ({ ...prev, [productId]: { price: opt.price, name: opt.name, time: opt.deliveryTime, country: selectedCountry } }));
      } else {
        setShippingInfo(prev => ({ ...prev, [productId]: null }));
      }
    } catch (e: any) {
      console.error('Erreur shipping:', e);
      toast.error(e.message || 'Erreur calcul livraison');
      setShippingInfo(prev => ({ ...prev, [productId]: null }));
    } finally {
      setShippingLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Calcul automatique pour tous les produits visibles selon le pays sélectionné
  useEffect(() => {
    if (products.length === 0) return;

    let cancelled = false;
    const run = async () => {
      setBulkCalculating(true);
      try {
        for (const p of products) {
          if (cancelled) break;
          // Éviter de recalculer si déjà calculé pour ce pays
          const info = shippingInfo[p.id];
          if (!info || info.country !== selectedCountry) {
            await calculateShippingForProduct(p.id);
          }
        }
      } finally {
        setBulkCalculating(false);
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, selectedCountry]);

  // Importer un produit dans notre base
  const importProduct = async (product: CJProduct) => {
    if (!selectedCategory) {
      toast.error('Sélectionnez d\'abord une catégorie');
      return;
    }

    setImporting(product.id);
    try {
      const response = await fetch('/api/cj/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pid: product.id,
          categoryId: selectedCategory,
          customPrice: customPrices[product.id] || null, // Prix personnalisé si défini
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Produit importé avec succès !');
        // Retirer le produit de la liste
        setProducts(prev => prev.filter(p => p.id !== product.id));
        // Nettoyer le prix personnalisé
        setCustomPrices(prev => {
          const newPrices = { ...prev };
          delete newPrices[product.id];
          return newPrices;
        });
      } else {
        // Message d'erreur personnalisé pour la limite de débit
        if (data.error?.includes('Too Many Requests') || data.error?.includes('QPS limit')) {
          toast.error(
            '⏰ Limite API atteinte. Attendez 5 minutes et réessayez.',
            { duration: 8000 }
          );
        } else {
          toast.error(
            (data?.error && (data.error.message || data.error.code)) ||
              (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || {})) ||
              'Erreur lors de l\'import'
          );
        }
      }
    } catch (error) {
      console.error('Erreur import:', error);
      toast.error('Erreur lors de l\'import');
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au tableau de bord
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Importer des Produits CJ Dropshipping
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Recherchez et importez des produits depuis CJ Dropshipping en quelques clics</p>
            <button
              onClick={refreshSearch}
              disabled={searching || !keyword.trim()}
              className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} /> Rafraîchir
            </button>
          </div>
        </div>

        {/* Sélection de catégorie */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie de destination
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Sélectionnez une catégorie</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex-1">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && scheduleSearch()}
                placeholder="Rechercher des produits... (ex: watch, jewelry, bag)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Pays de livraison</label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setShippingInfo({});
                  setSelectedCountry(e.target.value);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg min-w-[140px]"
              >
                <option value="FR">France</option>
                <option value="BE">Belgique</option>
                <option value="CH">Suisse</option>
                <option value="LU">Luxembourg</option>
                <option value="DE">Allemagne</option>
                <option value="ES">Espagne</option>
                <option value="IT">Italie</option>
                <option value="NL">Pays-Bas</option>
                <option value="PT">Portugal</option>
                <option value="GB">Royaume-Uni</option>
                <option value="IE">Irlande</option>
                <option value="US">États-Unis</option>
                <option value="CA">Canada</option>
              </select>
            </div>
            <button
              onClick={scheduleSearch}
              disabled={searching}
              className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {searching ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Rechercher
                </>
              )}
            </button>
          </div>
        </div>

        {/* Résultats */}
        {products.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {products.length} produits trouvés
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 bg-gray-100">
                    {product.bigImage && (
                      <Image
                        src={product.bigImage}
                        alt={product.nameEn}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.nameEn}
                    </h3>
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Coût CJ: ${product.sellPrice}</span>
                        <span className="text-sm text-gray-500">Stock: {product.warehouseInventoryNum || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-600" />
                          {shippingLoading[product.id] ? (
                            <span className="text-gray-500">Calcul livraison...</span>
                          ) : shippingInfo[product.id] ? (
                            <span>
                              Livraison: {shippingInfo[product.id]!.price?.toFixed(2)} €
                              {shippingInfo[product.id]?.time ? ` (${shippingInfo[product.id]!.time} j)` : ''}
                              {` • ${shippingInfo[product.id]!.country}`}
                            </span>
                          ) : (
                            <span className="text-gray-500">Livraison: —</span>
                          )}
                        </div>
                        <button
                          onClick={() => calculateShippingForProduct(product.id)}
                          disabled={shippingLoading[product.id]}
                          className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          {shippingLoading[product.id] ? 'Calcul...' : `Recalculer (${selectedCountry})`}
                        </button>
                      </div>
                    </div>
                    
                    {/* Infos d'entrepôt */}
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      {product.warehouseId ? (
                        <>
                          <button
                            onClick={async () => {
                              if (expandedWarehouse === product.id) {
                                setExpandedWarehouse(null);
                              } else {
                                setExpandedWarehouse(product.id);
                                await loadWarehouseInfo(product.warehouseId!);
                              }
                            }}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            📦 Infos entrepôt
                          </button>
                          {expandedWarehouse === product.id && (
                            <div className="mt-2 pt-2 border-t border-blue-200 text-xs">
                              <div className="mb-2">
                                <p className="font-medium text-gray-700">Entrepôt principal:</p>
                                <code className="bg-white p-1 rounded text-xs text-gray-600 break-all">
                                  {product.warehouseId}
                                </code>
                              </div>
                              {warehouseCache[product.warehouseId] ? (
                                <div className="bg-white p-2 rounded space-y-2">
                                  <div>
                                    <p className="font-medium text-gray-700">
                                      {warehouseCache[product.warehouseId]?.name}
                                    </p>
                                    <p className="text-gray-600">
                                      {warehouseCache[product.warehouseId]?.city}, {warehouseCache[product.warehouseId]?.areaCountryCode}
                                    </p>
                                  </div>
                                  {warehouseCache[product.warehouseId]?.logisticsBrandList && (
                                    <div>
                                      <p className="font-medium text-gray-700 mb-1">Transporteurs:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {warehouseCache[product.warehouseId]!.logisticsBrandList.slice(0, 3).map((brand) => (
                                          <span key={brand.id} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                                            {brand.name}
                                          </span>
                                        ))}
                                        {warehouseCache[product.warehouseId]!.logisticsBrandList.length > 3 && (
                                          <span className="text-gray-600">+{warehouseCache[product.warehouseId]!.logisticsBrandList.length - 3}</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-600">Chargement...</p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => loadProductWarehouseInfo(product.id)}
                          disabled={loadingWarehouse === product.id}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {loadingWarehouse === product.id ? (
                            <>
                              <Loader className="w-3 h-3 animate-spin" />
                              Chargement...
                            </>
                          ) : (
                            <>
                              📦 Afficher infos entrepôt
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-xs text-gray-600 mb-1">
                        Prix de vente (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={`Auto: ${(parseFloat(product.sellPrice) * 1.7).toFixed(2)}€`}
                        value={customPrices[product.id] || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : undefined;
                          setCustomPrices(prev => ({
                            ...prev,
                            [product.id]: value
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      {customPrices[product.id] && (
                        <p className="text-xs text-gray-500 mt-1">
                          Marge: {((customPrices[product.id]! - parseFloat(product.sellPrice)) / customPrices[product.id]! * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => importProduct(product)}
                      disabled={importing === product.id || !selectedCategory}
                      className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {importing === product.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Import...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Importer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message si aucun résultat */}
        {!searching && products.length === 0 && keyword && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <X className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun produit trouvé pour &quot;{keyword}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
