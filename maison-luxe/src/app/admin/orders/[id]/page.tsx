'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Package } from 'lucide-react';

export default function AdminOrderDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (session && (session.user as any)?.role !== 'admin') {
      router.push('/');
    } else if (session && orderId) {
      fetchOrder();
    }
  }, [session, orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        toast.error('Commande non trouvée');
        router.push('/admin/orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Erreur lors du chargement');
      router.push('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success('Statut mis à jour');
        await fetchOrder();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Commande non trouvée</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.push('/admin/orders')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux commandes
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Commande #{order.orderNumber}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-block px-3 py-1 rounded-full text-sm font-medium" 
              style={{
                backgroundColor: {
                  pending: '#FEF3C7',
                  confirmed: '#DBEAFE',
                  shipped: '#D1FAE5',
                  delivered: '#D1FAE5',
                  cancelled: '#FEE2E2',
                }[order.status as string] || '#F3F4F6',
                color: {
                  pending: '#92400E',
                  confirmed: '#1E40AF',
                  shipped: '#065F46',
                  delivered: '#065F46',
                  cancelled: '#7F1D1D',
                }[order.status as string] || '#374151'
              }}>
              {order.status}
            </div>
          </div>
        </div>

        {/* Statut */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Statut de la commande
          </h2>
          <div className="flex flex-wrap gap-2">
            {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={updating || order.status === status}
                className={`px-4 py-2 rounded-md transition ${
                  order.status === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Informations client */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Informations client</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-600">Nom:</span>{' '}
                <span className="font-medium">{order.customerName}</span>
              </p>
              <p>
                <span className="text-gray-600">Email:</span>{' '}
                <span className="font-medium">{order.customerEmail}</span>
              </p>
              {order.customerPhone && (
                <p>
                  <span className="text-gray-600">Téléphone:</span>{' '}
                  <span className="font-medium">{order.customerPhone}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Adresse de livraison</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}{' '}
                {order.shippingAddress?.postalCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles commandés</h3>
          <div className="space-y-3">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.selectedColor && (
                    <p className="text-sm text-gray-600">Couleur: {item.selectedColor}</p>
                  )}
                  <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {(item.price * item.quantity).toFixed(2)}€
                  </p>
                  <p className="text-sm text-gray-600">{item.price.toFixed(2)}€ x {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Résumé */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Sous-total:</span>
            <span>{(order.subtotal || 0).toFixed(2)}€</span>
          </div>
          {order.shippingCost && (
            <div className="flex justify-between text-sm">
              <span>Frais de port:</span>
              <span>{order.shippingCost.toFixed(2)}€</span>
            </div>
          )}
          {order.discount && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Réduction:</span>
              <span>-{order.discount.toFixed(2)}€</span>
            </div>
          )}
          <div className="flex justify-between font-semibold pt-2 border-t">
            <span>Total:</span>
            <span>{(order.total || 0).toFixed(2)}€</span>
          </div>
        </div>

        {/* CJ Info */}
        {order.cjOrderNumber && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Commande CJ:</span> {order.cjOrderNumber}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
