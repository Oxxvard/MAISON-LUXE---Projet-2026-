'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Star, ShoppingCart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

// Normalise les images pour supporter les valeurs en string (séparées par virgule/espace) ou en tableau
function normalizeImages(rawImages: unknown): string[] {
  if (Array.isArray(rawImages)) {
    return rawImages.filter(Boolean) as string[];
  }
  if (typeof rawImages === 'string') {
    return rawImages
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

// Extrait les src d'images présents dans la description HTML (utile si le HTML embarque les visuels)
function extractImageUrlsFromHtml(html?: string): string[] {
  if (!html) return [];
  const urls: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) urls.push(match[1]);
  }
  return urls;
}

// Supprime les balises <img> de la description pour éviter d'afficher les visuels en double sous le carrousel
function stripImagesFromHtml(html?: string): string {
  if (!html) return '';
  return html.replace(/<img[^>]*>/gi, '');
}

// Détecte les variantes de couleur à partir des données DB, CJ ou du texte de description
function extractColorOptions(product: any): Array<{ color: string; images?: string[] }> {
  // Priorité 1: colorVariants configurés en admin
  if (Array.isArray(product?.colorVariants) && product.colorVariants.length > 0) {
    return product.colorVariants.map((v: any) => ({
      color: v.color,
      images: v.images,
    }));
  }

  // Priorité 2: variants CJ
  const colors = new Set<string>();
  const variants = product?.cjData?.variants;
  if (Array.isArray(variants)) {
    variants.forEach((v: any) => {
      const color = v?.color || v?.Color || v?.COLOR || v?.colour || v?.Colour;
      if (typeof color === 'string' && color.trim()) {
        colors.add(color.trim());
      }
    });
  }

  // Priorité 3: description
  if (typeof product?.description === 'string') {
    const desc = product.description;
    const regexes = [
      /(?:Color|Colour|Couleur)\s*[:|-]\s*([^<\n]+)/gi,
      /couleur\s+disponible[s]?\s*[:|-]\s*([^<\n]+)/gi,
    ];
    regexes.forEach((rgx) => {
      let m: RegExpExecArray | null;
      while ((m = rgx.exec(desc)) !== null) {
        if (m[1]) {
          m[1]
            .split(/[\/;,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((c) => colors.add(c));
        }
      }
    });
  }

  return Array.from(colors).map((color) => ({ color }));
}

export default function ProductPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: '' });

  const addItem = useCartStore((state) => state.addItem);

  // Recentrer sur la première image quand le produit change
  useEffect(() => {
    setSelectedImage(0);
    const options = extractColorOptions(product);
    setSelectedColor(options[0]?.color || '');
  }, [product?._id]);

  useEffect(() => {
    // Charger en parallèle pour gagner du temps
    Promise.all([fetchProduct(), fetchReviews()]);
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${params.slug}`, {
        // Ajouter le cache pour les rechargements
        next: { revalidate: 60 }
      });
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/products/${params.slug}/reviews`, {
        next: { revalidate: 30 }
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast.error('Produit en rupture de stock');
      return;
    }

    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: quantity,
      stock: product.stock,
    });

    toast.success('Produit ajouté au panier');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      toast.error('Vous devez être connecté pour laisser un avis');
      return;
    }

    setSubmittingReview(true);

    try {
      const res = await fetch(`/api/products/${params.slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });

      if (res.ok) {
        toast.success('Avis publié avec succès');
        setReviewForm({ rating: 5, comment: '' });
        fetchReviews();
        fetchProduct();
      } else {
        const data = await res.json();
        toast.error(
          (data?.error && (data.error.message || data.error.code)) ||
            (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || {})) ||
            'Erreur lors de la publication de l\'avis'
        );
      }
    } catch (error) {
      toast.error('Erreur lors de la publication de l\'avis');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = async (reviewId: string) => {
    if (!editForm.comment.trim()) {
      toast.error('Le commentaire est requis');
      return;
    }

    try {
      const res = await fetch(`/api/products/${params.slug}/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        toast.success('Avis modifié avec succès');
        setEditingReviewId(null);
        fetchReviews();
        fetchProduct();
      } else {
        const data = await res.json();
        toast.error(
          (data?.error && (data.error.message || data.error.code)) ||
            (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || {})) ||
            'Erreur lors de la modification'
        );
      }
    } catch (error) {
      toast.error('Erreur lors de la modification de l\'avis');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${params.slug}/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Avis supprimé avec succès');
        fetchReviews();
        fetchProduct();
      } else {
        const data = await res.json();
        toast.error(
          (data?.error && (data.error.message || data.error.code)) ||
            (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || {})) ||
            'Erreur lors de la suppression'
        );
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'avis');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500">Produit non trouvé</p>
      </div>
    );
  }

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const normalizedImages = normalizeImages(product.images);
  const htmlImages = extractImageUrlsFromHtml(product.description);
  const mergedImages = Array.from(new Set([...normalizedImages, ...htmlImages]));
  const allImages = mergedImages.length > 0 ? mergedImages : ['/placeholder.svg'];
  const colorOptions = extractColorOptions(product);
  
  // Filtrer les images selon la couleur sélectionnée
  const getImagesForDisplay = () => {
    if (!selectedColor) return allImages;
    
    const selectedColorOption = colorOptions.find(opt => opt.color === selectedColor);
    if (selectedColorOption && selectedColorOption.images && selectedColorOption.images.length > 0) {
      return selectedColorOption.images;
    }
    
    return allImages;
  };
  
  const images = getImagesForDisplay();
  const totalImages = images.length;
  const safeDescription = stripImagesFromHtml(product.description);

  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev + 1) % totalImages);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="relative h-72 md:h-[360px] rounded-lg overflow-hidden mb-4">
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            {discount > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-md font-semibold">
                -{discount}%
              </div>
            )}

            {totalImages > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur shadow hover:bg-white transition"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-800" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur shadow hover:bg-white transition"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="h-5 w-5 text-gray-800" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full shadow">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        idx === selectedImage ? 'bg-gray-900' : 'bg-gray-400'
                      }`}
                      aria-label={`Aller à l'image ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails intentionally removed to focus on the main carousel */}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

          <div className="flex items-center mb-4">
            {product.reviewCount > 0 ? (
              <>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-600">
                  {product.rating.toFixed(1)} ({product.reviewCount} avis)
                </span>
              </>
            ) : (
              <span className="text-gray-500">0 avis</span>
            )}
          </div>

          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">{product.price.toFixed(2)} €</span>
            {product.compareAtPrice && (
              <span className="ml-3 text-xl text-gray-500 line-through">
                {product.compareAtPrice.toFixed(2)} €
              </span>
            )}
          </div>

          {colorOptions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Couleur</h3>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(opt.color);
                      setSelectedImage(0); // Reset to first image of selected color
                    }}
                    className={`px-3 py-2 rounded-full border text-sm transition ${
                      selectedColor === opt.color
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300 bg-white text-gray-800 hover:border-gray-500'
                    }`}
                  >
                    {opt.color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {product.stock > 0 ? 'En stock' : 'Rupture de stock'}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-6 py-2 border-x border-gray-300">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-4 py-2 hover:bg-gray-100"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              Ajouter au panier
            </button>
          </div>

          <div 
            className="text-gray-700 mb-6 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: safeDescription }}
          />

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-2">Catégorie</h3>
            <p className="text-gray-700">{product.category?.name}</p>
          </div>
        </div>
      </div>

      {/* Avis */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">Avis clients</h2>

        {session && (
          <form onSubmit={handleSubmitReview} className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold mb-4">Laisser un avis</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Note</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= reviewForm.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Commentaire</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-400"
            >
              {submittingReview ? 'Publication...' : 'Publier l\'avis'}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => {
              const isOwner = session && (session.user as any)?.id === review.user?._id?.toString();
              const isEditing = editingReviewId === review._id;

              return (
                <div key={review._id} className="bg-white p-6 rounded-lg shadow">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Note</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setEditForm({ ...editForm, rating: star })}
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= editForm.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Commentaire</label>
                        <textarea
                          value={editForm.comment}
                          onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditReview(review._id)}
                          className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 text-sm"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingReviewId(null)}
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 font-semibold">{review.userName}</span>
                        <span className="ml-auto text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{review.comment}</p>
                      {isOwner && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingReviewId(review._id);
                              setEditForm({ rating: review.rating, comment: review.comment });
                            }}
                            className="text-sm text-gray-600 hover:text-gray-900 underline"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="text-sm text-red-600 hover:text-red-800 underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-8">Aucun avis pour le moment</p>
          )}
        </div>
      </div>
    </div>
  );
}
