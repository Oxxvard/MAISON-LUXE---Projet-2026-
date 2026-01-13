'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { SlidersHorizontal, X, Filter, Loader2, Star } from 'lucide-react';

export default function ProduitsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('-createdAt');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Nouveaux filtres
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(1000);

  // Initialiser la catégorie depuis l'URL au chargement
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, priceRange, minRating, inStockOnly]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { next: { revalidate: 300 } });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/products?sort=${sortBy}`;
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      if (priceRange[0] > 0 || priceRange[1] < maxPrice) {
        url += `&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}`;
      }
      if (minRating > 0) {
        url += `&minRating=${minRating}`;
      }
      if (inStockOnly) {
        url += `&inStock=true`;
      }
      
      const res = await fetch(url, { next: { revalidate: 60 } });
      const data = await res.json();
      
      // Calculer le prix max pour le slider
      if (Array.isArray(data) && data.length > 0) {
        const prices = data.map((p: any) => p.price || 0);
        const max = Math.max(...prices, 1000);
        if (max > maxPrice) {
          setMaxPrice(Math.ceil(max / 100) * 100); // Arrondir à la centaine supérieure
        }
      }
      
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const resetFilters = () => {
    setSelectedCategory('');
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('-createdAt');
  };
  
  // Compter les filtres actifs
  const activeFiltersCount = [
    selectedCategory !== '',
    priceRange[0] > 0 || priceRange[1] < maxPrice,
    minRating > 0,
    inStockOnly
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Nos Produits</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Découvrez notre sélection de produits premium
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filtres Desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-8">
              {/* Bouton Reset */}
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                Réinitialiser les filtres
              </button>

              {/* Catégories */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Catégories
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`block w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                      selectedCategory === ''
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tous les produits
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => setSelectedCategory(category._id)}
                      className={`block w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                        selectedCategory === category._id
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre Prix */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Prix</h3>
                <div className="space-y-4">
                  <div>
                    <input
                      type="range"
                      min="0"
                      max={maxPrice}
                      step="10"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                    />
                    <input
                      type="range"
                      min="0"
                      max={maxPrice}
                      step="10"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900 mt-2"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{priceRange[0]}€</span>
                    <span className="text-gray-400">-</span>
                    <span className="font-medium text-gray-700">{priceRange[1]}€</span>
                  </div>
                </div>
              </div>

              {/* Filtre Notes */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Note minimale</h3>
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg transition-colors ${
                        minRating === rating
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {rating === 0 ? (
                        'Toutes les notes'
                      ) : (
                        <>
                          {Array.from({ length: rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                          <span>et plus</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre Stock */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Disponibilité</h3>
                <label className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900 focus:ring-2"
                  />
                  <span className="text-gray-700 font-medium">En stock uniquement</span>
                </label>
              </div>

              {/* Tri */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Trier par</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="-createdAt">Plus récents</option>
                  <option value="price">Prix croissant</option>
                  <option value="-price">Prix décroissant</option>
                  <option value="-rating">Meilleures notes</option>
                  <option value="name">Nom A-Z</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Bouton filtres Mobile */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 bg-gray-900 text-white p-4 rounded-full shadow-lg flex items-center gap-2"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-semibold">Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-white text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Filtres Mobile */}
          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
              <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 shadow-xl overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Filtres</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Reset */}
                  <button
                    onClick={() => {
                      resetFilters();
                      setShowMobileFilters(false);
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    Réinitialiser les filtres
                  </button>

                  {/* Catégories */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Catégories</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setSelectedCategory('');
                          setShowMobileFilters(false);
                        }}
                        className={`block w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                          selectedCategory === ''
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Tous les produits
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category._id}
                          onClick={() => {
                            setSelectedCategory(category._id);
                            setShowMobileFilters(false);
                          }}
                          className={`block w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                            selectedCategory === category._id
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prix Mobile */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Prix</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-600">Minimum: {priceRange[0]}€</label>
                        <input
                          type="range"
                          min="0"
                          max={maxPrice}
                          step="10"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Maximum: {priceRange[1]}€</label>
                        <input
                          type="range"
                          min="0"
                          max={maxPrice}
                          step="10"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes Mobile */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Note minimale</h3>
                    <div className="space-y-2">
                      {[0, 1, 2, 3, 4].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMinRating(rating)}
                          className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg transition-colors ${
                            minRating === rating
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {rating === 0 ? (
                            'Toutes les notes'
                          ) : (
                            <>
                              {Array.from({ length: rating }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-current" />
                              ))}
                              <span>et plus</span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stock Mobile */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Disponibilité</h3>
                    <label className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                      />
                      <span className="text-gray-700 font-medium">En stock uniquement</span>
                    </label>
                  </div>

                  {/* Tri Mobile */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Trier par</h3>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setShowMobileFilters(false);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="-createdAt">Plus récents</option>
                      <option value="price">Prix croissant</option>
                      <option value="-price">Prix décroissant</option>
                      <option value="-rating">Meilleures notes</option>
                      <option value="name">Nom A-Z</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grille de produits */}
          <div className="lg:col-span-3 mt-8 lg:mt-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">Chargement...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-gray-600">
                  Modifiez vos filtres ou parcourez toutes les catégories
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-gray-600">
                    <span className="font-semibold text-gray-900">{products.length}</span> produit{products.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
