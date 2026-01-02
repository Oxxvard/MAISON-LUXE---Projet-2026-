'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Trash2, Check } from 'lucide-react';
import Image from 'next/image';

export default function EditProductPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [colorVariants, setColorVariants] = useState<Array<{ color: string; images: string[]; cjVid?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState<string>('');

  useEffect(() => {
    if (session && (session.user as any)?.role !== 'admin') {
      router.push('/');
    } else if (session && slug) {
      fetchProduct();
    }
  }, [session, slug]);

  // Mettre à jour colorVariants quand le produit est chargé
  useEffect(() => {
    if (product) {
      setColorVariants(Array.isArray(product.colorVariants) ? product.colorVariants : []);
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        setName(data.name);
        setDescription(data.description || '');
        setPrice(data.price?.toFixed(2) || '0.00');
        setShippingCost(data.shippingCost?.toFixed(2) || '0.00');
        // Initialiser l'image de couverture
        const initialCover = (() => {
          const imgs = extractAllImagesFromData(data);
          if (Array.isArray(data.images) && data.images.length > 0) return data.images[0];
          return imgs[0] || '';
        })();
        setCoverImage(initialCover);
      } else {
        toast.error('Produit non trouvé');
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Erreur lors du chargement');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  // Extraire toutes les images disponibles (product.images + images HTML + images des variantes CJ + images des colorVariants déjà sélectionnées)
  const extractAllImages = () => {
    if (!product) return [];
    const imgs = new Set<string>();
    
    // Images du produit
    if (Array.isArray(product.images)) {
      product.images.forEach((img: string) => img && imgs.add(img));
    }
    
    // Images dans la description HTML
    if (typeof product.description === 'string') {
      const regex = /<img[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = regex.exec(product.description)) !== null) {
        if (match[1]) imgs.add(match[1]);
      }
    }
    
    // Images des variantes CJ
    if (product.cjData?.variants && Array.isArray(product.cjData.variants)) {
      product.cjData.variants.forEach((variant: any) => {
        const variantImage = variant.variantImage || variant.image || variant.imageUrl || variant.pic;
        if (variantImage && typeof variantImage === 'string') {
          imgs.add(variantImage);
        }
        if (Array.isArray(variant.images)) {
          variant.images.forEach((img: string) => img && imgs.add(img));
        }
      });
    }
    
    // Images déjà sélectionnées dans les colorVariants (IMPORTANT: pour les voir dans la grille)
    if (Array.isArray(colorVariants)) {
      colorVariants.forEach((variant) => {
        if (Array.isArray(variant.images)) {
          variant.images.forEach((img: string) => img && imgs.add(img));
        }
      });
    }
    
    return Array.from(imgs);
  };

  // Variante utilisable dans fetchProduct sur les données brutes
  const extractAllImagesFromData = (data: any) => {
    if (!data) return [] as string[];
    const imgs = new Set<string>();
    if (Array.isArray(data.images)) {
      data.images.forEach((img: string) => img && imgs.add(img));
    }
    if (typeof data.description === 'string') {
      const regex = /<img[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = regex.exec(data.description)) !== null) {
        if (match[1]) imgs.add(match[1]);
      }
    }
    if (data.cjData?.variants && Array.isArray(data.cjData.variants)) {
      data.cjData.variants.forEach((variant: any) => {
        const variantImage = variant.variantImage || variant.image || variant.imageUrl || variant.pic;
        if (variantImage && typeof variantImage === 'string') imgs.add(variantImage);
        if (Array.isArray(variant.images)) {
          variant.images.forEach((img: string) => img && imgs.add(img));
        }
      });
    }
    // Images déjà dans les colorVariants (important pour l'initialisation)
    if (Array.isArray(data.colorVariants)) {
      data.colorVariants.forEach((variant: any) => {
        if (Array.isArray(variant.images)) {
          variant.images.forEach((img: string) => img && imgs.add(img));
        }
      });
    }
    return Array.from(imgs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    if (!description.trim()) {
      toast.error('La description est requise');
      return;
    }

    // Filtrer les variantes incomplètes (color vide ou aucune image)
    const validColorVariants = colorVariants.filter(
      (v) => v.color.trim() && v.images.length > 0
    );

    setSaving(true);

    try {
      const res = await fetch(`/api/products/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: name.trim(), 
          description: description.trim(), 
          price: parseFloat(price.toString()),
          shippingCost: parseFloat(shippingCost.toString()),
          colorVariants: validColorVariants,
          // Réordonner les images pour mettre la couverture en premier
          images: (() => {
            const existing = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];
            if (!coverImage) return existing;
            const withoutCover = existing.filter((i: string) => i !== coverImage);
            return [coverImage, ...withoutCover];
          })(),
        }),
      });

      if (res.ok) {
        toast.success('Produit mis à jour');
        router.push('/admin/products');
      } else {
        const error = await res.json();
        console.error('Update error:', error);
        toast.error(error.error?.message || error.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/products')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Retour à la liste
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Modifier le nom du produit
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image de couverture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image de couverture</label>
            {coverImage ? (
              <div className="mb-3">
                <div className="relative w-full aspect-[4/3] border rounded-md overflow-hidden bg-gray-50">
                  <Image src={coverImage} alt="Image de couverture" fill className="object-contain" />
                </div>
                <p className="mt-2 text-xs text-gray-500">Cette image sera utilisée comme visuel principal sur la boutique.</p>
              </div>
            ) : (
              <p className="mb-3 text-sm text-gray-500">Aucune image sélectionnée pour le moment.</p>
            )}
            <div>
              <p className="text-xs text-gray-600 mb-2">Choisissez parmi les images disponibles ci-dessous :</p>
              <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto">
                {extractAllImages().map((img, idx) => {
                  const isSelected = img === coverImage;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCoverImage(img)}
                      className={`relative aspect-square rounded border-2 overflow-hidden transition ${
                        isSelected ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <Image src={img} alt={`Cover ${idx + 1}`} fill className="object-cover" sizes="80px" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du produit
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Nom du produit"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Vous pouvez personnaliser le nom pour votre boutique
            </p>
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description du produit
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-h-[140px]"
                placeholder="Décrivez le produit (HTML autorisé)"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Vous pouvez nettoyer ou réécrire la description fournie par CJ.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix de vente (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0.00"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Prix affiché sur votre boutique.
                </p>
                {product && (
                  <p className="mt-1 text-xs text-gray-500">
                    Coût total: {(product.costPrice + (parseFloat(shippingCost) || 0)).toFixed(2)}€ | 
                    Marge: {(parseFloat(price) - product.costPrice - (parseFloat(shippingCost) || 0)).toFixed(2)}€
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frais de fret (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Coût du fret depuis CJ.
                </p>
              </div>
            </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Variantes couleur
              </label>
              <button
                type="button"
                onClick={() => setColorVariants([...colorVariants, { color: '', images: [], cjVid: '' }])}
                className="flex items-center gap-1 text-sm text-black hover:text-gray-700"
              >
                <Plus className="w-4 h-4" />
                Ajouter couleur
              </button>
            </div>
            <div className="space-y-3">
              {colorVariants.map((variant, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={variant.color}
                      onChange={(e) => {
                        const updated = [...colorVariants];
                        updated[index].color = e.target.value;
                        setColorVariants(updated);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Nom couleur (ex: Rouge, Bleu)"
                    />
                    <button
                      type="button"
                      onClick={() => setColorVariants(colorVariants.filter((_, i) => i !== index))}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Sélection CJ VID */}
                  {product?.cjData?.variants && product.cjData.variants.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Variante CJ (VID) - Important pour recevoir la bonne couleur:</label>
                      <select
                        value={variant.cjVid || ''}
                        onChange={(e) => {
                          const updated = [...colorVariants];
                          updated[index].cjVid = e.target.value;
                          setColorVariants(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Sélectionner le VID CJ...</option>
                        {product.cjData.variants.map((v: any, vIdx: number) => (
                          <option key={vIdx} value={v.vid}>
                            {v.variantNameEn || v.variantName || `Variante ${vIdx + 1}`} - VID: {v.vid?.substring(0, 8)}...
                          </option>
                        ))}
                      </select>
                      {variant.cjVid && (
                        <p className="text-xs text-green-600 mt-1">✓ VID: {variant.cjVid.substring(0, 20)}...</p>
                      )}
                      {!variant.cjVid && (
                        <p className="text-xs text-red-600 mt-1">⚠ Sélectionnez le VID pour garantir la bonne couleur!</p>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Sélectionner une ou plusieurs images (cliquez pour ajouter/retirer):</p>
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                      {extractAllImages().map((img, imgIdx) => {
                        const isSelected = variant.images.includes(img);
                        return (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() => {
                              const updated = [...colorVariants];
                              if (isSelected) {
                                updated[index].images = updated[index].images.filter(i => i !== img);
                              } else {
                                updated[index].images = [...updated[index].images, img];
                              }
                              setColorVariants(updated);
                            }}
                            className={`relative aspect-square rounded border-2 overflow-hidden transition ${
                              isSelected
                                ? 'border-black' 
                                : 'border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            <Image 
                              src={img} 
                              alt={`Option ${imgIdx + 1}`} 
                              fill 
                              className="object-cover" 
                              sizes="80px"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Check className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {variant.images.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">{variant.images.length} image{variant.images.length > 1 ? 's' : ''} sélectionnée{variant.images.length > 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {colorVariants.length === 0 && (
              <p className="text-sm text-gray-500 italic">Aucune variante. Cliquez sur "Ajouter couleur" pour commencer.</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-medium text-gray-900 mb-3">Informations CJ (non modifiables)</h3>
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">Prix d'achat:</span> {product?.costPrice.toFixed(2)} €</p>
              <p><span className="font-medium">Prix de vente:</span> {product?.price.toFixed(2)} €</p>
              <p><span className="font-medium">Stock:</span> {product?.stock}</p>
              <p><span className="font-medium">Catégorie:</span> {product?.category?.name}</p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Pour modifier les prix ou autres informations, supprimez et réimportez le produit depuis CJ
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
