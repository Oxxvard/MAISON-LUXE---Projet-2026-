'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function NewCategoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session && (session.user as any)?.role !== 'admin') {
      router.push('/');
    }
  }, [session]);

  useEffect(() => {
    if (!slug && name) setSlug(slugify(name));
  }, [name]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: slug || slugify(name), description, image }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Catégorie créée');
        router.push('/admin/categories');
      } else {
        toast.error(
          (data?.error && (data.error.message || data.error.code)) ||
            (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || {})) ||
            'Erreur création'
        );
      }
    } catch {
      toast.error('Erreur création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.push('/admin/categories')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour aux catégories
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nouvelle catégorie</h1>

      <form onSubmit={onSubmit} className="space-y-5 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image (URL)</label>
          <input value={image} onChange={(e) => setImage(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="flex justify-end">
          <button disabled={saving} className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}
