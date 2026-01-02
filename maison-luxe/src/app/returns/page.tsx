import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Retours & Remboursements | Maison Luxe',
  description: 'Politique de retour, conditions de remboursement et procédure d\'échange pour vos achats.',
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Retours & Remboursements</h1>
          
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">🔄 Politique de Retour</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-semibold">
                  ✅ Retours gratuits sous 14 jours
                </p>
                <p className="text-green-700">
                  Conformément à la législation européenne, vous bénéficiez de 14 jours pour retourner votre achat.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">📋 Conditions de Retour</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-green-600 mb-2">✅ Retour Accepté</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Produit dans son emballage d'origine</li>
                    <li>• État neuf et non porté</li>
                    <li>• Étiquettes et certificats présents</li>
                    <li>• Demande sous 14 jours</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-red-600 mb-2">❌ Retour Refusé</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Produit personnalisé ou sur mesure</li>
                    <li>• Bijoux percés ou gravés</li>
                    <li>• Produits d'hygiène (boucles d'oreilles)</li>
                    <li>• Emballage abîmé ou manquant</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">📝 Procédure de Retour</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold">1</div>
                  <div>
                    <h3 className="font-semibold">Demande de Retour</h3>
                    <p className="text-gray-600">Connectez-vous à votre compte et initiez une demande de retour depuis vos commandes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold">2</div>
                  <div>
                    <h3 className="font-semibold">Étiquette de Retour</h3>
                    <p className="text-gray-600">Nous vous enverrons une étiquette de retour prépayée par email.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold">3</div>
                  <div>
                    <h3 className="font-semibold">Emballage</h3>
                    <p className="text-gray-600">Remettez le produit dans son emballage d'origine avec tous les accessoires.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold">4</div>
                  <div>
                    <h3 className="font-semibold">Expédition</h3>
                    <p className="text-gray-600">Déposez le colis chez notre transporteur partenaire ou programmez un enlèvement.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">💳 Remboursement</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-2">
                  <li><strong>Délai :</strong> 3-5 jours ouvrés après réception du retour</li>
                  <li><strong>Méthode :</strong> Même moyen de paiement que l'achat original</li>
                  <li><strong>Montant :</strong> Prix du produit + frais de livraison si retour sous 14 jours</li>
                  <li><strong>Frais de retour :</strong> Gratuits pour les retours légitimes</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">🔄 Échange</h2>
              <p className="mb-4">
                Pour un échange (taille, couleur), nous recommandons de procéder à un retour 
                suivi d'une nouvelle commande pour garantir la disponibilité.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  <strong>Conseil :</strong> Consultez notre guide des tailles et nos photos détaillées 
                  avant votre achat pour éviter les retours.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">🛡️ Produits Défectueux</h2>
              <p className="mb-4">
                Si vous recevez un produit défectueux ou endommagé :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contactez-nous immédiatement avec photos</li>
                <li>Retour gratuit et prioritaire</li>
                <li>Remplacement ou remboursement intégral</li>
                <li>Dédommagement possible selon le préjudice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">📞 Contact Service Retours</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="mb-2"><strong>Email :</strong> retours@maison-luxe.fr</p>
                <p className="mb-2"><strong>Téléphone :</strong> +33 1 XX XX XX XX</p>
                <p className="mb-2"><strong>Horaires :</strong> Lun-Ven 9h-18h</p>
                <p className="text-sm text-gray-600">Réponse sous 24h en moyenne</p>
              </div>
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