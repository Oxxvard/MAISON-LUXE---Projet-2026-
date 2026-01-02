import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente | Maison Luxe',
  description: 'Conditions générales de vente et d\'utilisation de Maison Luxe - E-commerce de produits de luxe.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Conditions Générales de Vente</h1>
          
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Informations Légales</h2>
              <p className="mb-4">
                <strong>Maison Luxe</strong><br />
                E-commerce de produits de luxe<br />
                Email : contact@maison-luxe.fr<br />
                Site web : maison-luxe-five.vercel.app
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Objet</h2>
              <p className="mb-4">
                Les présentes conditions générales de vente (CGV) régissent les relations contractuelles 
                entre Maison Luxe et ses clients dans le cadre de la vente en ligne de produits de luxe.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Produits</h2>
              <p className="mb-4">
                Tous nos produits sont authentiques et proviennent de fournisseurs agréés. Les descriptions 
                et photos sont données à titre indicatif et peuvent légèrement différer du produit reçu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">4. Prix et Paiement</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tous les prix sont affichés en euros TTC</li>
                <li>Les prix peuvent être modifiés à tout moment mais n'affectent pas les commandes déjà validées</li>
                <li>Le paiement s'effectue par carte bancaire via Stripe (sécurisé SSL)</li>
                <li>La commande est validée après confirmation du paiement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Livraison</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Les délais de livraison sont indiqués sur la page produit</li>
                <li>La livraison est gratuite en France dès 50€ d'achat</li>
                <li>Le risque de perte ou de dommage est transféré au client dès la livraison</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Droit de Rétractation</h2>
              <p className="mb-4">
                Conformément au Code de la consommation, vous disposez d'un délai de 14 jours francs 
                pour retourner votre commande sans avoir à justifier de motifs ni à payer de pénalités.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Garanties</h2>
              <p className="mb-4">
                Tous nos produits bénéficient de la garantie légale de conformité et de la garantie 
                des vices cachés. La durée de garantie varie selon les produits.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Données Personnelles</h2>
              <p className="mb-4">
                Vos données personnelles sont traitées conformément à notre politique de confidentialité. 
                Elles ne sont jamais transmises à des tiers à des fins commerciales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Droit Applicable</h2>
              <p className="mb-4">
                Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux 
                français seront seuls compétents.
              </p>
            </section>

            <p className="text-sm text-gray-600 mt-8">
              Dernière mise à jour : 2 janvier 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}