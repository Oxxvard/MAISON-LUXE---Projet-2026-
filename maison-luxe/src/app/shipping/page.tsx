import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Livraison & Expédition | Maison Luxe',
  description: 'Informations sur nos options de livraison, délais et tarifs pour vos commandes de produits de luxe.',
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Livraison & Expédition</h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Options de Livraison</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Livraison Standard</h3>
                  <p className="text-gray-600 mb-2">Délai : 7-14 jours ouvrés</p>
                  <p className="text-gray-600 mb-2">Tarif : Gratuite dès 50€</p>
                  <p className="text-sm text-gray-500">Suivi inclus</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Livraison Express</h3>
                  <p className="text-gray-600 mb-2">Délai : 3-7 jours ouvrés</p>
                  <p className="text-gray-600 mb-2">Tarif : 9,90€</p>
                  <p className="text-sm text-gray-500">Suivi prioritaire</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Zones de Livraison</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">🇫🇷 France Métropolitaine</h3>
                  <p className="text-gray-600">Livraison gratuite dès 50€ d'achat</p>
                </div>
                <div>
                  <h3 className="font-semibold">🇪🇺 Union Européenne</h3>
                  <p className="text-gray-600">Délai supplémentaire de 2-5 jours, frais selon destination</p>
                </div>
                <div>
                  <h3 className="font-semibold">🌍 International</h3>
                  <p className="text-gray-600">Nous consulter pour les tarifs et délais</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Suivi de Commande</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  Dès l'expédition de votre commande, vous recevrez un email avec le numéro de suivi. 
                  Vous pouvez également suivre votre commande dans votre espace client.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Informations Importantes</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Les délais sont donnés à titre indicatif et peuvent varier selon les périodes</li>
                <li>Les produits sont expédiés depuis nos entrepôts partenaires</li>
                <li>Une signature peut être requise pour la réception</li>
                <li>Les frais de douane éventuels sont à la charge du destinataire</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}