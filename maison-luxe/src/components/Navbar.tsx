'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingCart, Menu, X, User, Search, Heart } from 'lucide-react';
import { useCartStore, CartItem } from '@/store/cart';
import { ICategory } from '@/models/Category';
import { IProduct } from '@/models/Product';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Navbar() {
  const { data: session } = useSession();
  const items = useCartStore((state) => state.items);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IProduct[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Sync cart count after hydration and on items change
  useEffect(() => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    setCartItemsCount(count);
  }, [items]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Charger les catégories pour alimenter la recherche populaire et le menu
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories', { next: { revalidate: 300 } });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }

    fetchCategories();
  }, []);

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <>
      {/* Bandeau promotionnel style Louis Vuitton */}
      <div className="bg-black text-white text-center py-2 text-sm font-light tracking-wide">
        Découvrez le{' '}
        <Link href="/produits" className="underline hover:no-underline font-normal">
          vestiaire des fêtes
        </Link>
        {' '}MaisonLuxe.
      </div>

      {/* Navbar principale */}
      <nav className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : ''
      } border-b border-gray-100`}>
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Gauche: Menu */}
            <div className="flex items-center gap-8 flex-1">
              {/* Bouton menu desktop */}
              <div className="hidden md:block relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm font-normal hover:opacity-70 transition-opacity"
                >
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  <span>Menu</span>
                </button>

                {/* Menu déroulant desktop style LV */}
                {menuOpen && (
                  <div className="absolute left-0 top-full mt-3 w-80 bg-white shadow-2xl rounded-lg border border-gray-100 py-8 px-8 z-50">
                    <div className="space-y-6">
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <Link
                            key={cat._id}
                            href={`/produits?category=${cat._id}`}
                            onClick={() => setMenuOpen(false)}
                            className="block text-2xl font-normal hover:opacity-70 transition-opacity"
                          >
                            {cat.name}
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Chargement...</p>
                      )}
                      
                      {/* Séparateur */}
                      <div className="border-t border-gray-200 pt-6 space-y-6">
                        <Link
                          href="/about"
                          onClick={() => setMenuOpen(false)}
                          className="block text-xl font-normal hover:opacity-70 transition-opacity"
                        >
                          À propos
                        </Link>
                        <Link
                          href="/contact"
                          onClick={() => setMenuOpen(false)}
                          className="block text-xl font-normal hover:opacity-70 transition-opacity"
                        >
                          Contact
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton menu mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center gap-2 text-sm font-normal hover:opacity-70 transition-opacity"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Recherche desktop */}
              <div className="hidden lg:block relative" ref={searchRef}>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="flex items-center gap-2 text-sm font-normal hover:opacity-70 transition-opacity"
                >
                  <Search className="w-5 h-5" />
                  <span>Recherche</span>
                </button>

                {/* Overlay recherche */}
                {searchOpen && (
                  <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm">
                    <div className="relative max-w-6xl mx-auto px-6 pt-10">
                      <div className="flex justify-between items-start mb-6">
                        <button onClick={() => setSearchOpen(false)} className="text-sm text-white underline">Fermer</button>
                      </div>
                      <div className="relative">
                        <div className="w-full rounded-full border border-gray-300 bg-white backdrop-blur px-6 py-4 shadow-md flex items-center gap-4">
                          <Search className="w-5 h-5 text-gray-500" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Rechercher Pochette"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent focus:outline-none text-base"
                          />
                        </div>
                      </div>
                      {/* Résultats de recherche */}
                      {searchQuery.trim().length >= 2 && (
                        <div className="relative mt-8">
                          {searchLoading ? (
                            <div className="text-center text-sm text-gray-600">Recherche...</div>
                          ) : searchResults.length > 0 ? (
                            <div className="bg-white backdrop-blur rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
                              {searchResults.map((product) => (
                                <Link
                                  key={product._id}
                                  href={`/products/${product.slug}`}
                                  onClick={() => {
                                    setSearchOpen(false);
                                    setSearchQuery('');
                                  }}
                                  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  {product.images?.[0] && (
                                    <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                                      <Image
                                        src={product.images[0]}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{product.name}</p>
                                    <p className="text-sm text-gray-500">{typeof product.category === 'object' && 'name' in product.category ? product.category.name : ''}</p>
                                  </div>
                                  <span className="font-semibold text-gray-900">{(product.price || 0).toFixed(2)} €</span>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-sm text-white">Aucun produit trouvé</div>
                          )}
                        </div>
                      )}

                      {/* Recherches populaires */}
                      {searchQuery.trim().length < 2 && (
                        <div className="relative mt-4 text-xs uppercase tracking-[0.2em] text-white flex flex-wrap gap-4 items-center">
                          <span>Recherches populaires</span>
                          {categories.slice(0, 6).map((cat) => (
                            <button
                              key={cat._id}
                              onClick={() => {
                                setSearchQuery(cat.name);
                              }}
                              className="lowercase px-3 py-1 rounded-full border border-white/30 bg-white/20 hover:bg-white/30 transition-colors text-white"
                            >
                              {cat.name}
                            </button>
                          ))}
                          {categories.length === 0 && (
                            <span className="lowercase text-white/60">(catégories en chargement)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Centre: Logo */}
            <Link 
              href="/" 
              className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold tracking-[0.3em] text-gray-900 hover:text-gray-700 transition-colors"
            >
              MAISONLUXE
            </Link>

            {/* Droite: Actions */}
            <div className="flex items-center gap-6 flex-1 justify-end">
              <Link href="/contact" className="hidden md:block text-sm font-normal hover:opacity-70 transition-opacity">
                Contactez-nous
              </Link>

              {/* Wishlist */}
              <Link href="/favoris" className="p-1 hover:opacity-70 transition-opacity" aria-label="Favoris">
                <Heart className="w-5 h-5" />
              </Link>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    if (session) {
                      setShowUserMenu((v) => !v);
                    } else {
                      router.push('/auth/signin');
                    }
                  }}
                  className="p-1 hover:opacity-70 transition-opacity"
                  aria-label="Profil"
                >
                  <User className="w-5 h-5" />
                </button>
                {showUserMenu && session && (
                  <div className="absolute right-0 mt-3 w-56 bg-white shadow-xl rounded-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      Mon profil
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      Mes commandes
                    </Link>
                    {(session.user as any)?.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors font-semibold"
                      >
                        Administration
                      </Link>
                    )}
                    <div className="border-t border-gray-100 my-2"></div>
                    <button
                      onClick={async () => {
                        setShowUserMenu(false);
                        const { toast } = await import('react-hot-toast');
                        toast.success('Déconnexion réussie', {
                          style: {
                            background: '#fff',
                            color: '#dc2626',
                            border: '1px solid #ef4444',
                          },
                        });
                        setTimeout(() => {
                          signOut({ redirect: true, callbackUrl: '/' });
                        }, 500);
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>

              {/* Panier */}
              <Link
                href="/cart"
                className="relative p-1 hover:opacity-70 transition-opacity"
                aria-label="Panier"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white md:hidden overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-[0.2em]">MENU</h2>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Catégories en gros texte style LV */}
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <Link
                    key={cat._id}
                    href={`/produits?category=${cat._id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-3xl font-normal hover:opacity-70 transition-opacity"
                  >
                    {cat.name}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-500">Chargement des catégories...</p>
              )}

              {/* Séparateur */}
              <div className="border-t border-gray-200 pt-8 space-y-8">
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-3xl font-normal hover:opacity-70 transition-opacity"
                >
                  À propos
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-3xl font-normal hover:opacity-70 transition-opacity"
                >
                  Contact
                </Link>
              </div>

              {/* Besoin d'aide */}
              <div className="border-t border-gray-200 pt-8">
                <p className="text-sm text-gray-600 mb-2">Besoin d'aide ?</p>
                <a href="tel:+33977404077" className="text-2xl font-normal hover:opacity-70 transition-opacity">
                  +33 9 77 40 40 77
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
