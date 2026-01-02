'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Select from 'react-select';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import PhoneInput from '@/components/PhoneInput';

// Liste des pays de l'UE + Suisse
const euCountries = [
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'DE', label: '🇩🇪 Allemagne' },
  { value: 'IT', label: '🇮🇹 Italie' },
  { value: 'ES', label: '🇪🇸 Espagne' },
  { value: 'BE', label: '🇧🇪 Belgique' },
  { value: 'NL', label: '🇳🇱 Pays-Bas' },
  { value: 'PT', label: '🇵🇹 Portugal' },
  { value: 'AT', label: '🇦🇹 Autriche' },
  { value: 'PL', label: '🇵🇱 Pologne' },
  { value: 'IE', label: '🇮🇪 Irlande' },
  { value: 'SE', label: '🇸🇪 Suède' },
  { value: 'DK', label: '🇩🇰 Danemark' },
  { value: 'FI', label: '🇫🇮 Finlande' },
  { value: 'GR', label: '🇬🇷 Grèce' },
  { value: 'CZ', label: '🇨🇿 République tchèque' },
  { value: 'RO', label: '🇷🇴 Roumanie' },
  { value: 'HU', label: '🇭🇺 Hongrie' },
  { value: 'SK', label: '🇸🇰 Slovaquie' },
  { value: 'BG', label: '🇧🇬 Bulgarie' },
  { value: 'HR', label: '🇭🇷 Croatie' },
  { value: 'SI', label: '🇸🇮 Slovénie' },
  { value: 'LT', label: '🇱🇹 Lituanie' },
  { value: 'LV', label: '🇱🇻 Lettonie' },
  { value: 'EE', label: '🇪🇪 Estonie' },
  { value: 'LU', label: '🇱🇺 Luxembourg' },
  { value: 'CY', label: '🇨🇾 Chypre' },
  { value: 'MT', label: '🇲🇹 Malte' },
  { value: 'CH', label: '🇨🇭 Suisse' },
];

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    streetNumber: '',
    streetName: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'FR',
    phone: '',
  });

  const totalPrice = getTotalPrice();
  const shippingCost = selectedShipping?.price || 0;
  const discount = appliedCoupon?.discount || 0;
  const finalTotal = totalPrice + shippingCost - discount;

  // Redirection si non authentifié ou panier vide
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && items.length === 0) {
      router.push('/cart');
    }
  }, [status, items.length, router]);

  // Calculer les frais de port quand le pays ou le code postal change
  useEffect(() => {
    const calculateShipping = async () => {
      if (!formData.country || items.length === 0 || status !== 'authenticated') {
        setShippingOptions([]);
        setSelectedShipping(null);
        return;
      }

      setShippingLoading(true);
      try {
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item) => ({
              id: item.id,
              quantity: item.quantity,
            })),
            country: formData.country,
            postalCode: formData.postalCode,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.shippingOptions && data.shippingOptions.length > 0) {
            setShippingOptions(data.shippingOptions);
            setSelectedShipping(data.defaultShipping || data.shippingOptions[0]);
          } else {
            setShippingOptions([]);
            setSelectedShipping(null);
          }
        } else {
          setShippingOptions([]);
          setSelectedShipping(null);
        }
      } catch (error) {
        console.error('Erreur calcul frais de port:', error);
        setShippingOptions([]);
        setSelectedShipping(null);
      } finally {
        setShippingLoading(false);
      }
    };

    // Debounce le calcul (1.5s pour respecter limite QPS de CJ)
    const timer = setTimeout(() => {
      calculateShipping();
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData.country, formData.postalCode, items.length, status]);

  // Fonction pour valider le téléphone
  const isPhoneValid = (): boolean => {
    const countryPhones = [
      { code: 'FR', dialCode: '+33', minDigits: 9 },
      { code: 'DE', dialCode: '+49', minDigits: 10 },
      { code: 'IT', dialCode: '+39', minDigits: 9 },
      { code: 'ES', dialCode: '+34', minDigits: 9 },
      { code: 'BE', dialCode: '+32', minDigits: 9 },
      { code: 'NL', dialCode: '+31', minDigits: 9 },
      { code: 'PT', dialCode: '+351', minDigits: 9 },
      { code: 'AT', dialCode: '+43', minDigits: 10 },
      { code: 'PL', dialCode: '+48', minDigits: 9 },
      { code: 'IE', dialCode: '+353', minDigits: 9 },
      { code: 'SE', dialCode: '+46', minDigits: 9 },
      { code: 'DK', dialCode: '+45', minDigits: 8 },
      { code: 'FI', dialCode: '+358', minDigits: 9 },
      { code: 'GR', dialCode: '+30', minDigits: 10 },
      { code: 'CZ', dialCode: '+420', minDigits: 9 },
      { code: 'RO', dialCode: '+40', minDigits: 9 },
      { code: 'HU', dialCode: '+36', minDigits: 9 },
      { code: 'SK', dialCode: '+421', minDigits: 9 },
      { code: 'BG', dialCode: '+359', minDigits: 9 },
      { code: 'HR', dialCode: '+385', minDigits: 9 },
      { code: 'SI', dialCode: '+386', minDigits: 8 },
      { code: 'LT', dialCode: '+370', minDigits: 8 },
      { code: 'LV', dialCode: '+371', minDigits: 8 },
      { code: 'EE', dialCode: '+372', minDigits: 8 },
      { code: 'LU', dialCode: '+352', minDigits: 9 },
      { code: 'CY', dialCode: '+357', minDigits: 8 },
      { code: 'MT', dialCode: '+356', minDigits: 8 },
      { code: 'CH', dialCode: '+41', minDigits: 9 },
    ];

    const currentCountry = countryPhones.find((c) => c.code === formData.country);
    if (!formData.phone || !currentCountry) return false;
    
    // Extraire uniquement les chiffres
    const digitsOnly = formData.phone.replace(/\D/g, '');
    const dialCodeDigits = currentCountry.dialCode.replace(/\D/g, '');
    
    // Le téléphone doit commencer par l'indicatif et avoir assez de chiffres
    return (
      formData.phone.startsWith(currentCountry.dialCode) &&
      digitsOnly.startsWith(dialCodeDigits) &&
      digitsOnly.length >= dialCodeDigits.length + currentCountry.minDigits
    );
  };

  // Fonction pour appliquer un code promo
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Veuillez entrer un code promo');
      return;
    }

    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          cartTotal: totalPrice,
          userId: (session?.user as any)?.id,
          cartItems: items.map(item => ({
            productId: item.id,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setAppliedCoupon(data);
        toast.success(`Code promo appliqué ! -${(data.discount || 0).toFixed(2)}€`);
      } else {
        toast.error(
          (data?.error && (data.error.message || data.error.code)) ||
            (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error || {})) ||
            'Code promo invalide'
        );
        setAppliedCoupon(null);
      }
    } catch (error) {
      toast.error('Erreur lors de la validation du code promo');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Fonction pour retirer le code promo
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Code promo retiré');
  };

  const handleAddressSelect = (addressData: any) => {
      const houseNumber = addressData.address.house_number || '';
      const streetName = addressData.address.road || '';
    
    setFormData({
      ...formData,
        streetNumber: houseNumber,
        streetName: streetName,
        address: `${houseNumber} ${streetName}`.trim(),
      city:
        addressData.address.city ||
        addressData.address.town ||
        addressData.address.village ||
        formData.city,
      province:
        addressData.address.state ||
        addressData.address.province ||
        addressData.address.region ||
        formData.province,
      postalCode: addressData.address.postcode || formData.postalCode,
      country: addressData.address.country_code?.toUpperCase() || formData.country,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Valider le téléphone
      const countryPhones = [
        { code: 'FR', dialCode: '+33', minDigits: 9 },
        { code: 'DE', dialCode: '+49', minDigits: 10 },
        { code: 'IT', dialCode: '+39', minDigits: 9 },
        { code: 'ES', dialCode: '+34', minDigits: 9 },
        { code: 'BE', dialCode: '+32', minDigits: 9 },
        { code: 'NL', dialCode: '+31', minDigits: 9 },
        { code: 'PT', dialCode: '+351', minDigits: 9 },
        { code: 'AT', dialCode: '+43', minDigits: 10 },
        { code: 'PL', dialCode: '+48', minDigits: 9 },
        { code: 'IE', dialCode: '+353', minDigits: 9 },
        { code: 'SE', dialCode: '+46', minDigits: 9 },
        { code: 'DK', dialCode: '+45', minDigits: 8 },
        { code: 'FI', dialCode: '+358', minDigits: 9 },
        { code: 'GR', dialCode: '+30', minDigits: 10 },
        { code: 'CZ', dialCode: '+420', minDigits: 9 },
        { code: 'RO', dialCode: '+40', minDigits: 9 },
        { code: 'HU', dialCode: '+36', minDigits: 9 },
        { code: 'SK', dialCode: '+421', minDigits: 9 },
        { code: 'BG', dialCode: '+359', minDigits: 9 },
        { code: 'HR', dialCode: '+385', minDigits: 9 },
        { code: 'SI', dialCode: '+386', minDigits: 8 },
        { code: 'LT', dialCode: '+370', minDigits: 8 },
        { code: 'LV', dialCode: '+371', minDigits: 8 },
        { code: 'EE', dialCode: '+372', minDigits: 8 },
        { code: 'LU', dialCode: '+352', minDigits: 9 },
        { code: 'CY', dialCode: '+357', minDigits: 8 },
        { code: 'MT', dialCode: '+356', minDigits: 8 },
        { code: 'CH', dialCode: '+41', minDigits: 9 },
      ];

      const currentCountry = countryPhones.find((c) => c.code === formData.country);
      const digitsOnly = formData.phone.replace(/\D/g, '');
      const dialCodeDigits = currentCountry?.dialCode.replace(/\D/g, '');
      
      if (
        !currentCountry || 
        !formData.phone.startsWith(currentCountry.dialCode) ||
        !digitsOnly.startsWith(dialCodeDigits || '') ||
        digitsOnly.length < (dialCodeDigits?.length || 0) + (currentCountry?.minDigits || 9)
      ) {
        toast.error(`Numéro invalide. Format: ${currentCountry?.dialCode} + au moins ${currentCountry?.minDigits || 9} chiffres`);
        setLoading(false);
        return;
      }

      // Composer l'adresse complète
      const fullAddress = `${formData.streetNumber} ${formData.streetName}`.trim();
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Créer la commande
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            product: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          coupon: appliedCoupon ? {
            code: appliedCoupon.code,
            discount: appliedCoupon.discount,
          } : undefined,
          shippingCost: selectedShipping?.price || 0,
          shippingAddress: {
            ...formData,
            fullName: fullName,
            address: fullAddress,
          },
        }),
      });

      if (!orderRes.ok) {
        throw new Error('Erreur lors de la création de la commande');
      }

      const order = await orderRes.json();

      // Créer la session Stripe
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          orderId: order._id,
          shipping: selectedShipping,
        }),
      });

      if (!checkoutRes.ok) {
        throw new Error('Erreur lors de la création de la session de paiement');
      }

      const { url } = await checkoutRes.json();

      // Rediriger vers Stripe
      window.location.href = url;
    } catch (error: any) {
      console.error('Erreur checkout:', error);
      toast.error(error.message || 'Erreur lors du paiement');
      setLoading(false);
    }
  };

  // Afficher un loader pendant la vérification de session
  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  // Ne rien afficher si redirection en cours
  if (status === 'unauthenticated' || items.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finaliser la commande</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Adresse de livraison</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recherche d'adresse <span className="text-red-500">*</span>
              </label>
              <AddressAutocomplete
                value={formData.address}
                  onChange={(value) => {
                    setFormData({ ...formData, address: value });
                  }}
                onSelectAddress={handleAddressSelect}
                  placeholder="Commencez à taper votre adresse..."
                country={formData.country}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Tapez votre adresse pour l'autocomplétion
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.streetNumber}
                    onChange={(e) => setFormData({ ...formData, streetNumber: e.target.value })}
                    placeholder="33"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.streetName}
                    onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                    placeholder="Rue de la Paix"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code postal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="75001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Paris"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays de livraison <span className="text-red-500">*</span>
              </label>
              <Select
                  options={euCountries}
                  value={euCountries.find((c: any) => c.value === formData.country)}
                onChange={(option) =>
                  setFormData({ ...formData, country: option?.value || 'FR' })
                }
                placeholder="Sélectionnez un pays..."
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: '#d1d5db',
                    '&:hover': { borderColor: '#9ca3af' },
                  }),
                }}
              />
            </div>

            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              countryCode={formData.country}
              onCountryChange={(code) => setFormData({ ...formData, country: code })}
              required
            />

            {/* Options de livraison */}
            {shippingOptions.length > 0 && (
              <div className="border-t pt-4">
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Mode de livraison <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                    {shippingOptions
                      .filter((option) => {
                        // Garder seulement Standard (économique) et Express
                        const name = option.name?.toLowerCase() || '';
                        return name.includes('standard') || name.includes('express') || name.includes('economy');
                      })
                      .slice(0, 2) // Maximum 2 options
                      .map((option, index) => {
                        // Renommer les options
                        const isExpress = option.name?.toLowerCase().includes('express');
                        const displayName = isExpress ? 'Express' : 'Standard';
                        const displayDescription = isExpress 
                          ? 'Livraison rapide'
                          : 'Livraison économique';
                        const carrier = option.logisticName || option.carrier || 'CJ Logistics';
                      
                        return (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedShipping?.id === option.id
                            ? 'border-gray-900 bg-gray-50 shadow-md'
                            : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                        <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedShipping?.id === option.id}
                          onChange={() => setSelectedShipping(option)}
                            className="w-5 h-5 text-gray-900"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-lg">
                                {displayName}
                              </span>
                              {isExpress && (
                                <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">
                                  RAPIDE
                                </span>
                              )}
                          </div>
                            <div className="text-sm text-gray-600 mt-0.5">
                              {displayDescription} • {option.deliveryTime || '7-15'} jours
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <span>📦</span>
                              <span>Partenaire: {carrier}</span>
                          </div>
                        </div>
                      </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-lg">
                        {option.price > 0 ? `${option.price.toFixed(2)} €` : 'Gratuit'}
                          </div>
                      </div>
                    </label>
                    )})}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isPhoneValid()}
              className="w-full bg-gray-900 text-white py-3 rounded-md hover:bg-gray-800 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                'Procéder au paiement'
              )}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span className="font-medium whitespace-nowrap ml-2">
                    {(item.price * item.quantity).toFixed(2)}&nbsp;€
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span className="whitespace-nowrap">{totalPrice.toFixed(2)}&nbsp;€</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span className="flex items-center gap-2">
                    Code promo: <code className="bg-green-50 px-2 py-0.5 rounded text-xs">{appliedCoupon.code}</code>
                  </span>
                  <span className="whitespace-nowrap">-{(appliedCoupon.discount || 0).toFixed(2)}&nbsp;€</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span className="text-right">
                  {shippingLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : selectedShipping ? (
                    <div>
                      <div className="text-sm">{selectedShipping.name}</div>
                      <div className="whitespace-nowrap">
                        {selectedShipping.price > 0 ? `${selectedShipping.price.toFixed(2)}\u00A0€` : 'Gratuit'}
                      </div>
                    </div>
                  ) : (
                    'Sélectionnez un mode'
                  )}
                </span>
              </div>
            </div>

            {/* Code promo input */}
            {!appliedCoupon ? (
              <div className="border-t mt-4 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code promo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                    placeholder="PROMO2024"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black uppercase text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Appliquer'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t mt-4 pt-4">
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-green-900">Code promo appliqué</div>
                    <div className="text-xs text-green-700">{appliedCoupon.description || appliedCoupon.code}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            )}

            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="whitespace-nowrap">{finalTotal.toFixed(2)}&nbsp;€</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
