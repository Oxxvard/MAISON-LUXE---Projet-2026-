'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Edit, Trash2, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && (session.user as any)?.role !== 'admin') {
      router.push('/');
    } else if (session) {
      fetchCategories();
    }
  }, [session]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (_e) {
      toast.error('Erreur chargement catégories');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Catégorie supprimée');
        // Mise à jour optimiste immédiate
        setCategories((prev) => prev.filter((c) => c._id !== id));
        // Rafraîchit depuis le serveur sans cache pour cohérence
        fetchCategories();
      } else {
        const data = await res.json();
        toast.error(
          (data?.error && (data.error.message || data.error.code)) ||
            (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || {})) ||
            'Erreur suppression'
        );
      }
    } catch {
      toast.error('Erreur suppression');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.push('/admin')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour au tableau de bord
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Catégories</h1>
        <Link
          href="/admin/categories/new"
          className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nouvelle catégorie
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Nom</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Slug</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Description</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Image</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{cat.name}</td>
                  <td className="py-3 px-4 text-gray-600">{cat.slug}</td>
                  <td className="py-3 px-4 text-gray-600 max-w-[400px] truncate">{cat.description || '-'}</td>
                  <td className="py-3 px-4">
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        width={32}
                        height={32}
                        className="rounded object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-gray-500">
                        <ImageIcon className="w-4 h-4" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/categories/edit/${cat._id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteCategory(cat._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
