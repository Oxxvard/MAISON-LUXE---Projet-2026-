'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, Copy, CheckCircle, XCircle, Calendar, Percent, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CouponsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && (session.user as any)?.role !== 'admin') {
      router.push('/');
    } else if (session) {
      fetchCoupons();
    }
  }, [session]);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce code promo ?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Code promo supprimé');
        setCoupons(coupons.filter(c => c._id !== id));
      } else {
        const data = await res.json();
        toast.error(
          (data?.error && (data.error.message || data.error.code)) ||
            (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || {})) ||
            'Erreur lors de la suppression'
        );
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié !');
  };

  const isExpired = (date?: Date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isNotStarted = (date?: Date) => {
    if (!date) return false;
    return new Date(date) > new Date();
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

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Codes Promo</h1>
          <p className="text-gray-600 mt-1">Gérez vos codes de réduction</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Créer un code promo
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun code promo
          </h3>
          <p className="text-gray-600 mb-6">
            Créez votre premier code de réduction
          </p>
          <Link
            href="/admin/coupons/new"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
          >
            <Plus className="w-4 h-4" />
            Créer un code promo
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Code</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Réduction</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Utilisation</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Validité</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const expired = isExpired(coupon.expiryDate);
                const notStarted = isNotStarted(coupon.startDate);
                const limitReached = coupon.usageLimit && coupon.usageCount >= coupon.usageLimit;
                const isActive = coupon.isActive && !expired && !notStarted && !limitReached;

                return (
                  <tr key={coupon._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm font-semibold">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copier le code"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-sm">
                        {coupon.type === 'percentage' ? (
                          <>
                            <Percent className="w-4 h-4 text-blue-600" />
                            Pourcentage
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4 text-green-600" />
                            Montant fixe
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value.toFixed(2)}€`}
                      {coupon.maxDiscount && coupon.type === 'percentage' && (
                        <span className="text-xs text-gray-500 block">Max: {coupon.maxDiscount.toFixed(2)}€</span>
                      )}
                      {coupon.minPurchase > 0 && (
                        <span className="text-xs text-gray-500 block">Min: {coupon.minPurchase.toFixed(2)}€</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {coupon.usageCount} / {coupon.usageLimit || '∞'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {coupon.expiryDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(coupon.expiryDate).toLocaleDateString('fr-FR')}
                        </div>
                      ) : (
                        <span className="text-gray-400">Illimité</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          isActive
                            ? 'bg-green-100 text-green-800'
                            : expired
                            ? 'bg-red-100 text-red-800'
                            : notStarted
                            ? 'bg-yellow-100 text-yellow-800'
                            : limitReached
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Actif
                          </>
                        ) : expired ? (
                          <>
                            <XCircle className="w-3 h-3" /> Expiré
                          </>
                        ) : notStarted ? (
                          <>
                            <Calendar className="w-3 h-3" /> Planifié
                          </>
                        ) : limitReached ? (
                          <>
                            <XCircle className="w-3 h-3" /> Épuisé
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inactif
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/coupons/edit/${coupon._id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded inline-flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
