'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function AdminOrdersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && (session.user as any)?.role !== 'admin') {
      router.push('/');
    } else if (session) {
      fetchOrders();
    }
  }, [session]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success('Statut mis à jour');
        fetchOrders();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const updateTracking = async (orderId: string, payload: Record<string, any>) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Suivi mis à jour');
        fetchOrders();
      } else {
        const data = await res.json();
        toast.error(
          (data?.error && (data.error.message || data.error.code)) ||
            (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || {})) ||
            'Erreur lors de la mise à jour du suivi'
        );
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du suivi');
    }
  };

  const retryCJOrder = async (orderId: string) => {
    try {
      const loadingToast = toast.loading('Création de la commande CJ...');
      
      const res = await fetch('/api/admin/orders/retry-cj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      toast.dismiss(loadingToast);

      if (res.ok) {
        toast.success(`Commande CJ créée: ${data.cjOrderNumber}`);
        fetchOrders();
      } else {
        toast.error(
          (data?.error && (data.error.message || data.error.code)) ||
            (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || {})) ||
            'Erreur lors de la création CJ'
        );
      }
    } catch (error) {
      toast.error('Erreur lors de la création CJ');
    }
  };

  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.push('/admin')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour au tableau de bord
      </button>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestion des commandes</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    Commande #{order._id.slice(-8)}
                  </h3>
                  <p className="text-gray-600">
                    {order.user?.name} - {order.user?.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{order.totalAmount.toFixed(2)} €</p>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                    className="mt-2 px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="pending">En attente</option>
                    <option value="processing">En traitement</option>
                    <option value="shipped">Expédiée</option>
                    <option value="delivered">Livrée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Produits</h4>
                <div className="space-y-2">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                      <span className="font-medium">
                        {(item.price * item.quantity).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t mt-4 pt-4">
                <h4 className="font-semibold mb-2">Adresse de livraison</h4>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.fullName}<br />
                  {order.shippingAddress.address}<br />
                  {order.shippingAddress.postalCode} {order.shippingAddress.city}<br />
                  {order.shippingAddress.country}<br />
                  Tél: {order.shippingAddress.phone}
                </p>
              </div>

              <div className="flex gap-4 mt-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  Paiement: {order.paymentStatus === 'paid' ? 'Payé' : 
                            order.paymentStatus === 'failed' ? 'Échoué' : 'En attente'}
                </span>

                {/* CJ Order Status */}
                {order.cjOrderId && (
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    CJ: {order.cjOrderNumber || order.cjOrderId.slice(-8)}
                  </span>
                )}
                
                {order.cjOrderError && !order.cjOrderId && (
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                    CJ: Erreur
                  </span>
                )}

                {/* Retry CJ Button */}
                {order.paymentStatus === 'paid' && !order.cjOrderId && (
                  <button
                    onClick={() => retryCJOrder(order._id)}
                    className="px-4 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition"
                  >
                    🔄 Créer commande CJ
                  </button>
                )}

                {/* Show error details if any */}
                {order.cjOrderError && (
                  <span className="text-xs text-red-600 ml-2" title={order.cjOrderError}>
                    ⚠️ {order.cjOrderError.substring(0, 50)}...
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500">Transporteur</label>
                  <input
                    className="border rounded px-3 py-2 text-sm"
                    defaultValue={order.trackingCarrier || ''}
                    onBlur={(e) => updateTracking(order._id, { trackingCarrier: e.target.value })}
                    placeholder="Colissimo, DHL..."
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500">Numéro de suivi</label>
                  <input
                    className="border rounded px-3 py-2 text-sm"
                    defaultValue={order.trackingNumber || ''}
                    onBlur={(e) => updateTracking(order._id, { trackingNumber: e.target.value })}
                    placeholder="AB123456789"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500">Envoyé le</label>
                  <input
                    type="date"
                    className="border rounded px-3 py-2 text-sm"
                    defaultValue={order.shippedAt ? order.shippedAt.slice(0, 10) : ''}
                    onBlur={(e) => updateTracking(order._id, { shippedAt: e.target.value })}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500">Livraison estimée</label>
                  <input
                    type="date"
                    className="border rounded px-3 py-2 text-sm"
                    defaultValue={order.estimatedDelivery ? order.estimatedDelivery.slice(0, 10) : ''}
                    onBlur={(e) => updateTracking(order._id, { estimatedDelivery: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucune commande
            </div>
          )}
        </div>
      )}
    </div>
  );
}
