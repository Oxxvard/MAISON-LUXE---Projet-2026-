'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Download, Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchOrder();
    }
  }, [status, resolvedParams.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${resolvedParams.id}`);
      if (!res.ok) throw new Error('Commande non trouvée');
      const response = await res.json();
      // L'API retourne { success: true, data: {...} }
      setOrder(response.data || response);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Erreur lors du chargement de la commande');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const res = await fetch(`/api/orders/${resolvedParams.id}/invoice`);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors du téléchargement');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${order._id.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Facture téléchargée');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du téléchargement');
    } finally {
      setDownloadingInvoice(false);
    }
  };

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

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return '✓ Paiement confirmé';
      case 'pending':
        return '⏳ En attente';
      case 'failed':
        return '✗ Échoué';
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

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <Link href="/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ChevronLeft className="w-4 h-4" />
            Retour aux commandes
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Commande #{order.orderNumber || order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-gray-600 mt-1">
                Commandée le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {order.paymentStatus === 'paid' && (
              <button
                onClick={downloadInvoice}
                disabled={downloadingInvoice}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-5 h-5" />
                {downloadingInvoice ? 'Téléchargement...' : 'Télécharger facture'}
              </button>
            )}
          </div>
        </div>

        {/* Statuts */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Statut de commande</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Statut de paiement</p>
            <p className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'pending' ? 'text-orange-600' : 'text-red-600'}`}>
              {getPaymentStatusLabel(order.paymentStatus)}
            </p>
          </div>
        </div>

        {/* Articles */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Articles commandés</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {order.items?.map((item: any, index: number) => (
              <div key={index} className="p-6 flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {(item.price * item.quantity).toFixed(2)} €
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.price.toFixed(2)} € × {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Résumé */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-semibold">
                  {order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toFixed(2)} €
                </span>
              </div>

              {order.coupon && order.coupon.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon {order.coupon.code}</span>
                  <span className="font-semibold">-{order.coupon.discount.toFixed(2)} €</span>
                </div>
              )}

              {order.shippingCost && order.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais de port</span>
                  <span className="font-semibold">{order.shippingCost.toFixed(2)} €</span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">{order.totalAmount.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Adresse de livraison */}
        {order.shippingAddress && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Adresse de livraison</h2>
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
              <p className="text-gray-600">{order.shippingAddress.street}</p>
              <p className="text-gray-600">
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
              </p>
              <p className="text-gray-600">{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && (
                <p className="text-gray-600 pt-2">Tél: {order.shippingAddress.phone}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
