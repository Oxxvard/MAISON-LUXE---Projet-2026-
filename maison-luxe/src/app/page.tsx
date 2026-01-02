'use client';

import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { ArrowRight, TruckIcon, ShieldCheck, Package, Star, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const response = await fetch('/api/products?featured=true&limit=6');
        if (!response.ok) {
          console.error('Failed to fetch products');
          setFeaturedProducts([]);
          setLoading(false);
          return;
        }
        const data = await response.json();
        setFeaturedProducts(data || []);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          console.error('Failed to fetch categories');
          return;
        }
        const data = await response.json();
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }

    if (typeof window !== 'undefined') {
      fetchFeaturedProducts();
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Style Louis Vuitton avec vidéo/image plein écran */}
      <section className="relative h-screen overflow-hidden">
        {/* Fond vidéo/image de luxe */}
        <div className="absolute inset-0 bg-black">
          <Image
            src="https://images.unsplash.com/photo-1560243563-062bfc001d68?w=1920&q=90"
            alt="Luxe et élégance"
            fill
            className="object-cover opacity-60"
            priority
            quality={90}
            sizes="100vw"
          />
        </div>
        
        {/* Overlay avec gradient subtil */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>
        
        {/* Contenu centré */}
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h1 className="text-6xl lg:text-8xl font-light text-white mb-8 tracking-wide">
              MAISONLUXE
            </h1>
            <p className="text-2xl lg:text-3xl text-white/90 mb-4 font-light tracking-[0.2em] uppercase">
              L'Art du Luxe
            </p>
            <p className="text-lg lg:text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
              Découvrez notre collection exclusive où chaque pièce raconte une histoire d'excellence et de raffinement
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/produits"
                className="bg-white text-gray-900 px-10 py-4 text-sm uppercase tracking-[0.2em] font-medium hover:bg-gray-100 transition-all inline-flex items-center group"
              >
                Découvrir la collection
                <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Indicateur de scroll */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/60 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Valeurs - Minimaliste et épuré */}
      <section className="py-24 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 border-2 border-gray-900 rounded-full flex items-center justify-center">
                <TruckIcon className="w-9 h-9 text-gray-900" />
              </div>
              <h3 className="text-sm uppercase tracking-[0.2em] font-medium mb-3">Livraison Premium</h3>
              <p className="text-gray-600 text-sm">Offerte dès 100€ d'achat partout en Europe</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 border-2 border-gray-900 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-9 h-9 text-gray-900" />
              </div>
              <h3 className="text-sm uppercase tracking-[0.2em] font-medium mb-3">Paiement Sécurisé</h3>
              <p className="text-gray-600 text-sm">Transactions cryptées et protégées</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 border-2 border-gray-900 rounded-full flex items-center justify-center">
                <Package className="w-9 h-9 text-gray-900" />
              </div>
              <h3 className="text-sm uppercase tracking-[0.2em] font-medium mb-3">Service Client</h3>
              <p className="text-gray-600 text-sm">Assistance personnalisée 7j/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* Catégories - Grid élégant avec images */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light mb-4 tracking-wide">Nos Univers</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Explorez nos collections soigneusement sélectionnées pour vous offrir le meilleur du luxe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.slice(0, 6).map((category, index) => (
              <Link
                key={category._id}
                href={`/produits?category=${category._id}`}
                className="group relative overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <div className="relative h-96 overflow-hidden">
                  <Image
                    src={category.image || `https://images.unsplash.com/photo-${
                      ['1441986300917-64674bd600d8', '1523170335258-f5ed11844a49', '1515562141207-7a88fb7ce338', 
                       '1484755560615-a4c64e778a6c', '1512499617640-c74ae3a79d37', '1556656793-08538906a9f8'][index % 6]
                    }?w=800&q=80`}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-3xl font-light mb-2 tracking-wide">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-white/80 mb-4 line-clamp-2">{category.description}</p>
                  )}
                  <span className="inline-flex items-center text-sm uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                    Découvrir
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {categories.length > 6 && (
            <div className="text-center mt-12">
              <Link
                href="/produits"
                className="inline-flex items-center text-sm uppercase tracking-[0.2em] border-b-2 border-gray-900 pb-1 hover:border-gray-600 transition-colors"
              >
                Voir toutes les catégories
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Collections Phares - Produits vedettes */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-4">Collection 2026</p>
            <h2 className="text-5xl font-light mb-4 tracking-wide">Pièces d'Exception</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Une sélection exclusive des créations les plus remarquables de notre maison
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-[500px] animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <Link
              href="/produits"
              className="inline-flex items-center bg-gray-900 text-white px-10 py-4 text-sm uppercase tracking-[0.2em] hover:bg-gray-800 transition-all group"
            >
              Explorer toute la collection
              <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section Brand Story avec image */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-96 lg:h-[600px] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=85"
                alt="Notre histoire"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            
            <div className="lg:pl-8">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-6">Depuis 2026</p>
              <h2 className="text-4xl lg:text-5xl font-light mb-8 tracking-wide">
                L'Excellence à la Française
              </h2>
              <div className="space-y-6 text-gray-300 leading-relaxed">
                <p className="text-lg">
                  MaisonLuxe incarne l'essence du raffinement et du savoir-faire d'exception. 
                  Chaque création est le fruit d'une passion pour l'excellence et d'un engagement 
                  sans compromis envers la qualité.
                </p>
                <p>
                  Notre mission est de vous offrir des pièces uniques qui transcendent les tendances 
                  éphémères pour devenir des classiques intemporels.
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center text-sm uppercase tracking-[0.2em] border-b border-white pb-1 hover:border-gray-400 transition-colors mt-8"
                >
                  Découvrir notre histoire
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages - Design épuré */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light mb-4 tracking-wide">Témoignages</h2>
            <p className="text-gray-600">Ce que nos clients disent de nous</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                name: 'Sophie Mercier', 
                title: 'Architecte d\'intérieur',
                text: 'Une expérience d\'achat exceptionnelle. La qualité des produits et du service client est irréprochable.',
                rating: 5 
              },
              { 
                name: 'Marc Dubois', 
                title: 'Entrepreneur',
                text: 'MaisonLuxe allie élégance et modernité. Chaque pièce est une œuvre d\'art en soi.',
                rating: 5 
              },
              { 
                name: 'Julie Laurent', 
                title: 'Designer',
                text: 'Un service personnalisé et des produits d\'une qualité rare. Je recommande sans hésitation.',
                rating: 5 
              },
            ].map((review, index) => (
              <div key={index} className="bg-white p-10 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex mb-6">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gray-900 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-8 leading-relaxed italic">&quot;{review.text}&quot;</p>
                <div>
                  <p className="font-medium text-gray-900">{review.name}</p>
                  <p className="text-sm text-gray-500">{review.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter - Style épuré */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-light mb-6 tracking-wide">Restez Informé</h2>
          <p className="text-gray-300 mb-12 text-lg leading-relaxed">
            Inscrivez-vous à notre newsletter et recevez en exclusivité nos dernières créations 
            et événements privés
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 px-6 py-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white transition-colors"
            />
            <button className="bg-white text-black px-10 py-4 text-sm uppercase tracking-[0.2em] font-medium hover:bg-gray-200 transition-colors whitespace-nowrap">
              S'inscrire
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-6">
            En vous inscrivant, vous acceptez de recevoir nos communications. 
            Vous pouvez vous désabonner à tout moment.
          </p>
        </div>
      </section>
    </div>
  );
}
