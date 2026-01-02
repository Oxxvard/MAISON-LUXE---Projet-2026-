'use client';

import { useState, useEffect } from 'react';
import { Loader, AlertCircle, MapPin, Truck } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WarehouseInfo {
  id: string;
  name: string;
  areaCountryCode: string;
  city: string;
  province: string;
  address1: string;
  phone: string;
  logisticsBrandList: Array<{ id: string; name: string }>;
  isSelfPickup?: number;
}

// IDs d'entrepôts connus de CJ Dropshipping
const KNOWN_WAREHOUSES = [
  '201e67f6ba4644c0a36d63bf4989dd70', // Cranbury Warehouse (US)
  // Ajoute d'autres IDs si tu les connais
];

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customWarehouseId, setCustomWarehouseId] = useState('');
  const [loadingCustom, setLoadingCustom] = useState(false);

  // Charger les entrepôts connus au démarrage
  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/cj/warehouse?ids=${KNOWN_WAREHOUSES.join(',')}`
      );
      const data = await response.json();

      if (response.ok && data.warehouses) {
        setWarehouses(data.warehouses);
      } else {
        setError(data.error || 'Erreur lors du chargement des entrepôts');
      }
    } catch (_err) {
      console.error('Erreur:', _err);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomWarehouse = async () => {
    if (!customWarehouseId.trim()) {
      toast.error('Entrez un ID d\'entrepôt');
      return;
    }

    setLoadingCustom(true);
    try {
      const response = await fetch(
        `/api/cj/warehouse?id=${encodeURIComponent(customWarehouseId)}`
      );
      const data = await response.json();

      if (response.ok) {
        // Ajouter ou remplacer dans la liste
        setWarehouses(prev => {
          const filtered = prev.filter(w => w.id !== data.id);
          return [data, ...filtered];
        });
        setCustomWarehouseId('');
        toast.success('Entrepôt chargé !');
      } else {
        toast.error(
          (data?.error && (data.error.message || data.error.code)) ||
            (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || {})) ||
            'Entrepôt non trouvé'
        );
      }
    } catch (_err) {
      console.error('Erreur:', _err);
      toast.error('Erreur de connexion');
    } finally {
      setLoadingCustom(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Entrepôts CJ Dropshipping
          </h1>
          <p className="text-gray-600">
            Consultez les informations de localisation et options logistiques des entrepôts CJ
          </p>
        </div>

        {/* Ajouter un entrepôt custom */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Charger un entrepôt spécifique
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="ID d'entrepôt CJ"
              value={customWarehouseId}
              onChange={(e) => setCustomWarehouseId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadCustomWarehouse()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              onClick={loadCustomWarehouse}
              disabled={loadingCustom}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loadingCustom ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                'Charger'
              )}
            </button>
          </div>
        </div>

        {/* Messages */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Erreur</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Grille d'entrepôts */}
        {!loading && warehouses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {warehouses.map((warehouse) => (
              <div
                key={warehouse.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* En-tête */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {warehouse.name}
                  </h3>
                  <p className="text-gray-300 text-sm mt-1">
                    {warehouse.city}, {warehouse.province} • {warehouse.areaCountryCode}
                  </p>
                </div>

                {/* Détails */}
                <div className="p-6 space-y-4">
                  {/* Localisation */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Localisation</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-start gap-2">
                        <span className="font-medium text-gray-700 min-w-20">Adresse:</span>
                        <span>{warehouse.address1}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-medium text-gray-700 min-w-20">Téléphone:</span>
                        <a
                          href={`tel:${warehouse.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {warehouse.phone}
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Options logistiques */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Options Logistiques
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {warehouse.logisticsBrandList?.map((brand) => (
                        <span
                          key={brand.id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {brand.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Self-Pickup */}
                  {warehouse.isSelfPickup === 1 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      ✅ Self-pickup supporté
                    </div>
                  )}

                  {/* ID (pour copier) */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">ID d'entrepôt:</p>
                    <code className="block bg-gray-100 p-2 rounded text-xs text-gray-800 break-all font-mono">
                      {warehouse.id}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && warehouses.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun entrepôt chargé</p>
          </div>
        )}
      </div>
    </div>
  );
}
