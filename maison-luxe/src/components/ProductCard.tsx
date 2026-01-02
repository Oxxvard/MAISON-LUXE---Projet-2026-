'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useState, memo, useEffect } from 'react';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images: string[];
    rating: number;
    reviewCount: number;
    stock: number;
    category?: {
      name: string;
    };
    description?: string;
  };
}

// Normalise les images pour supporter un string (séparé par virgule/espace) ou un tableau
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

// Fonction pour extraire les matériaux/couleurs de la description
function extractMaterialsFromDescription(description?: string, categoryName?: string): string {
  if (!description) return categoryName || '';
  
  // Recherche de patterns courants dans les descriptions
  const patterns = [
    /material[s]?:\s*([^<\n]+)/i,
    /color[s]?:\s*([^<\n]+)/i,
    /made of:\s*([^<\n]+)/i,
    /composition:\s*([^<\n]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 40);
    }
  }
  
  return categoryName || '';
}

function ProductCard({ product }: ProductCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const images = normalizeImages(product.images);
  const materials = extractMaterialsFromDescription(product.description, product.category?.name);

  // Charger l'état des favoris au montage
  useEffect(() => {
    const checkFavorite = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/favorites');
        if (res.ok) {
          const favorites = await res.json();
          const isFav = favorites.some((fav: any) => fav._id === product._id);
          setIsFavorite(isFav);
        }
      } catch (error) {
        console.error('Erreur vérification favoris:', error);
      } finally {
        setLoading(false);
      }
    };

    checkFavorite();
  }, [session, product._id]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!session) {
      toast.error('Connectez-vous pour ajouter aux favoris', {
        icon: '🔒',
        style: {
          borderRadius: '8px',
          background: '#fff',
          color: '#1f2937',
          padding: '12px 20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
        },
        duration: 3000,
      });
      setTimeout(() => router.push('/auth/signin'), 1000);
      return;
    }

    try {
      if (!isFavorite) {
        // Ajout aux favoris
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product._id }),
        });

        if (res.ok) {
          setIsFavorite(true);
          toast.success('Ajouté aux favoris', {
            icon: '✓',
            style: {
              borderRadius: '8px',
              background: '#fff',
              color: '#1f2937',
              padding: '12px 20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            duration: 2000,
          });
        } else {
          const error = await res.json();
          toast.error(error.error || 'Erreur lors de l\'ajout');
        }
      } else {
        // Retrait des favoris
        const res = await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product._id }),
        });

        if (res.ok) {
          setIsFavorite(false);
          toast.success('Retiré des favoris', {
            icon: '✕',
            style: {
              borderRadius: '8px',
              background: '#fff',
              color: '#1f2937',
              padding: '12px 20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            duration: 2000,
          });
        } else {
          toast.error('Erreur lors du retrait');
        }
      }
    } catch (error) {
      console.error('Erreur favoris:', error);
      toast.error('Une erreur est survenue');
    }
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="group relative bg-white overflow-hidden transition-all duration-300">
        {/* Image Container */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
          <Image
            src={images.length > 0 && images[0].startsWith('http')
              ? images[0]
              : '/placeholder.svg'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          
          {/* Heart Icon - Top Right */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-lg z-10"
          >
            <Heart 
              className={`w-5 h-5 transition-all ${
                isFavorite 
                  ? 'fill-gray-900 text-gray-900' 
                  : 'text-gray-600'
              }`} 
            />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4 text-center">
          {/* Product Name - Uppercase */}
          <h3 className="font-bold text-gray-900 mb-1 uppercase tracking-wide text-sm">
            {product.name}
          </h3>

          {/* Materials/Color - Gray */}
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
            {materials}
          </p>

          {/* Price */}
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {(product.price || 0).toFixed(2)} €
            </span>
            {product.compareAtPrice && product.compareAtPrice > (product.price || 0) && (
              <span className="text-sm text-gray-400 line-through">
                {product.compareAtPrice.toFixed(2)} €
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default memo(ProductCard);
