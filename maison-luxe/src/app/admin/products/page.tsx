'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Edit, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session === null) {
      // Utilisateur non connecté
      router.push('/auth/signin');
      return;
    }
    if (session && (session.user as any)?.role !== 'admin') {
      // Utilisateur connecté mais pas admin
      router.push('/');
      return;
    }
    if (session && (session.user as any)?.role === 'admin') {
      fetchProducts();
    }
  }, [session, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products?limit=100');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        console.error('Erreur API:', res.status, res.statusText);
        toast.error('Erreur lors du chargement des produits');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur de connexion lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${slug}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Produit supprimé');
        fetchProducts();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 mb-4">
            Vous devez être connecté en tant qu'administrateur pour accéder à cette page.
          </p>
          <Link 
            href="/auth/signin"
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  if (session && (session.user as any)?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">
            Accès non autorisé. Cette page est réservée aux administrateurs.
          </p>
        </div>
      </div>
    );
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
        <h1 className="text-3xl font-bold text-gray-900">Gestion des produits CJ</h1>
        <div className="text-sm text-gray-500">
          Tous les produits proviennent de CJ Dropshipping
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Nom</th>
                <th className="text-left py-3 px-4">Prix d'achat</th>
                <th className="text-left py-3 px-4">Fret</th>
                <th className="text-left py-3 px-4">Prix de vente</th>
                <th className="text-left py-3 px-4">Marge</th>
                <th className="text-left py-3 px-4">Stock</th>
                <th className="text-left py-3 px-4">Catégorie</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const margin = product.price - product.costPrice;
                const marginPercent = (margin / product.costPrice) * 100;
                
                return (
                  <tr key={product._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{product.name}</td>
                    <td className="py-3 px-4">{product.costPrice.toFixed(2)} €</td>
                    <td className="py-3 px-4 text-orange-600 font-medium">{(product.shippingCost || 0).toFixed(2)} €</td>
                    <td className="py-3 px-4 font-semibold">{product.price.toFixed(2)} €</td>
                    <td className="py-3 px-4">
                      <span className="text-green-600 font-semibold">
                        +{margin.toFixed(2)} € ({marginPercent.toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-3 px-4">{product.stock}</td>
                    <td className="py-3 px-4">{product.category?.name}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/edit/${product.slug}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded inline-flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </Link>
                        <button
                          onClick={() => handleDelete(product.slug)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
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
