'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Package, Calendar, CreditCard, Loader2, ChevronRight, Truck, Download } from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status]);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Erreur lors du chargement des commandes');
      const response = await res.json();
      // L'API retourne { success: true, data: [...] }
      setOrders(response.data || response || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'processing':
        return 'En traitement';
      case 'shipped':
        return 'Expédiée';
      case 'delivered':
        return 'Livrée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mes commandes</h1>
          <p className="text-gray-600">Suivez l'état de vos commandes</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune commande</h2>
            <p className="text-gray-600 mb-6">Vous n'avez pas encore passé de commande</p>
            <Link
              href="/produits"
              className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Découvrir nos produits
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        Commande #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Montant total</p>
                    <p className="text-2xl font-bold text-gray-900">{order.totalAmount.toFixed(2)} €</p>
                  </div>
                </div>

                {/* Produits */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="space-y-3">
                    {order.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {(item.price * item.quantity).toFixed(2)} €
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adresse de livraison */}
                {order.shippingAddress && (
                  <div className="border-t border-gray-100 mt-4 pt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Adresse de livraison</p>
                    <p className="text-sm text-gray-600">
                      {order.shippingAddress.street}, {order.shippingAddress.city}{' '}
                      {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                    </p>
                  </div>
                )}

                {/* Bouton détails */}
                <div className="border-t border-gray-100 mt-4 pt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/orders/${order._id}`}
                    className="inline-flex items-center gap-2 text-gray-900 font-semibold hover:gap-3 transition-all"
                  >
                    Voir les détails
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                  
                  {order.paymentStatus === 'paid' && (
                    <a
                      href={`/api/orders/${order._id}/invoice`}
                      download={`facture-${order._id.slice(-8).toUpperCase()}.pdf`}
                      className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Télécharger facture
                    </a>
                  )}
                  
                  {(order.cjOrderId || order.trackingNumber) && (
                    <Link
                      href={`/orders/${order._id}/tracking`}
                      className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                    >
                      <Truck className="w-5 h-5" />
                      Suivre ma commande
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
