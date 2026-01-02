import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - Questions Fréquentes | Maison Luxe',
  description: 'Réponses aux questions les plus fréquentes sur nos produits, livraisons, retours et service client.',
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Questions Fréquentes</h1>
          
          <div className="space-y-6">
            {/* Section Commandes */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-2 border-b">🛒 Commandes & Paiements</h2>
              
              <div className="space-y-4">
                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Comment passer une commande ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>1. Parcourez notre catalogue et ajoutez les produits à votre panier</p>
                    <p>2. Cliquez sur le panier et vérifiez votre sélection</p>
                    <p>3. Procédez au checkout et renseignez vos informations</p>
                    <p>4. Effectuez le paiement sécurisé via Stripe</p>
                    <p>5. Recevez la confirmation par email</p>
                  </div>
                </details>

                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Quels moyens de paiement acceptez-vous ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Nous acceptons toutes les cartes bancaires (Visa, Mastercard, American Express) 
                    via notre partenaire sécurisé Stripe. Le paiement est entièrement sécurisé par chiffrement SSL.</p>
                  </div>
                </details>

                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Puis-je modifier ou annuler ma commande ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Vous pouvez modifier ou annuler votre commande jusqu'à l'expédition. 
                    Contactez-nous rapidement à support@maison-luxe.fr avec votre numéro de commande.</p>
                  </div>
                </details>
              </div>
            </section>

            {/* Section Livraison */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-2 border-b">🚚 Livraison & Suivi</h2>
              
              <div className="space-y-4">
                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Quels sont les délais de livraison ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p><strong>France :</strong> 7-14 jours ouvrés (gratuite dès 50€)</p>
                    <p><strong>Europe :</strong> 10-18 jours ouvrés</p>
                    <p><strong>International :</strong> 15-25 jours ouvrés</p>
                    <p>Les délais peuvent varier selon les périodes et la disponibilité des produits.</p>
                  </div>
                </details>

                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Comment suivre ma commande ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Dès l'expédition, vous recevrez un email avec le numéro de suivi. 
                    Vous pouvez aussi suivre votre commande dans votre espace client ou directement 
                    sur le site du transporteur.</p>
                  </div>
                </details>

                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Livrez-vous partout dans le monde ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Nous livrons dans la plupart des pays. Les frais et délais varient selon la destination. 
                    Contactez-nous pour les zones non couvertes automatiquement.</p>
                  </div>
                </details>
              </div>
            </section>

            {/* Section Produits */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-2 border-b">💎 Produits & Qualité</h2>
              
              <div className="space-y-4">
                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Vos produits sont-ils authentiques ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Oui, tous nos produits sont 100% authentiques. Nous travaillons exclusivement 
                    avec des fournisseurs agréés et reconnus. Chaque produit est accompagné de ses 
                    certificats d'authenticité le cas échéant.</p>
                  </div>
                </details>

                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Comment choisir la bonne taille ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Consultez notre guide des tailles disponible sur chaque fiche produit. 
                    En cas de doute, contactez notre service client qui vous conseillera personnellement.</p>
                  </div>
                </details>

                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Proposez-vous une garantie ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Tous nos produits bénéficient de la garantie légale de conformité (2 ans) 
                    et de la garantie des vices cachés. Certains produits bénéficient également 
                    d'une garantie fabricant spécifique.</p>
                  </div>
                </details>
              </div>
            </section>

            {/* Section Retours */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-2 border-b">🔄 Retours & Échanges</h2>
              
              <div className="space-y-4">
                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Puis-je retourner un produit ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Oui, vous disposez de 14 jours pour retourner tout produit non personnalisé. 
                    Le produit doit être dans son état d'origine avec l'emballage et les étiquettes.</p>
                  </div>
                </details>

                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Les retours sont-ils gratuits ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Oui, les retours sont gratuits pour tout retour légitime sous 14 jours. 
                    Nous fournissons l'étiquette de retour prépayée.</p>
                  </div>
                </details>

                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Combien de temps pour être remboursé ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Le remboursement est effectué dans les 3-5 jours ouvrés après réception 
                    et vérification du retour, sur le même moyen de paiement utilisé pour l'achat.</p>
                  </div>
                </details>
              </div>
            </section>

            {/* Section Compte */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-2 border-b">👤 Compte Client</h2>
              
              <div className="space-y-4">
                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Comment créer un compte ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Cliquez sur "S'inscrire" en haut de la page, renseignez votre email et 
                    créez un mot de passe sécurisé. Vous recevrez un email de confirmation.</p>
                  </div>
                </details>

                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    J'ai oublié mon mot de passe
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Cliquez sur "Mot de passe oublié" sur la page de connexion. 
                    Vous recevrez un email pour réinitialiser votre mot de passe en toute sécurité.</p>
                  </div>
                </details>

                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-gray-800">
                    Mes données sont-elles sécurisées ?
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>Absolument. Nous utilisons les dernières technologies de sécurité (chiffrement SSL, 
                    stockage sécurisé) et respectons le RGPD. Vos données ne sont jamais vendues à des tiers.</p>
                  </div>
                </details>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-gray-50 rounded-lg p-6 mt-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">❓ Votre question n'est pas listée ?</h2>
              <p className="text-gray-700 mb-4">
                Notre équipe de service client est là pour vous aider !
              </p>
              <div className="space-y-2">
                <p><strong>📧 Email :</strong> support@maison-luxe.fr</p>
                <p><strong>⏰ Horaires :</strong> Lundi-Vendredi 9h-18h</p>
                <p><strong>⚡ Délai de réponse :</strong> Moins de 24h</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}