import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | Maison Luxe',
  description: 'Notre politique de protection des données personnelles et de respect de votre vie privée.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Politique de Confidentialité</h1>
          
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Collecte des Données</h2>
              <p className="mb-4">
                Nous collectons uniquement les données nécessaires au traitement de vos commandes :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Informations de contact (nom, email, téléphone)</li>
                <li>Adresse de livraison et de facturation</li>
                <li>Historique de commandes</li>
                <li>Données de navigation (cookies techniques)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Utilisation des Données</h2>
              <p className="mb-4">Vos données sont utilisées exclusivement pour :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Traiter et expédier vos commandes</li>
                <li>Vous tenir informé du suivi de livraison</li>
                <li>Gérer votre compte client</li>
                <li>Améliorer nos services</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Partage des Données</h2>
              <p className="mb-4">
                Nous ne vendons ni ne louons jamais vos données personnelles. Nous les partageons 
                uniquement avec nos partenaires essentiels :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Transporteurs</strong> - Pour la livraison de vos commandes</li>
                <li><strong>Stripe</strong> - Pour le traitement sécurisé des paiements</li>
                <li><strong>MongoDB Atlas</strong> - Pour le stockage sécurisé des données</li>
                <li><strong>Vercel</strong> - Pour l'hébergement du site web</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Sécurité</h2>
              <p className="mb-4">
                Nous prenons la sécurité de vos données très au sérieux :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Chiffrement SSL/TLS pour toutes les communications</li>
                <li>Mots de passe hashés avec bcrypt</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Monitoring de sécurité avec Sentry</li>
                <li>Sauvegardes régulières et sécurisées</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Vos Droits (RGPD)</h2>
              <p className="mb-4">
                Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Droit d'accès</strong> - Consulter vos données personnelles</li>
                <li><strong>Droit de rectification</strong> - Modifier vos données inexactes</li>
                <li><strong>Droit à l'effacement</strong> - Supprimer votre compte et données</li>
                <li><strong>Droit de portabilité</strong> - Récupérer vos données dans un format lisible</li>
                <li><strong>Droit d'opposition</strong> - Refuser le traitement de vos données</li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, contactez-nous à : <strong>privacy@maison-luxe.fr</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Cookies</h2>
              <p className="mb-4">
                Notre site utilise uniquement des cookies techniques nécessaires au fonctionnement :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Session utilisateur (authentification)</li>
                <li>Panier de commande</li>
                <li>Préférences de navigation</li>
              </ul>
              <p className="mt-4">
                Aucun cookie de tracking ou publicitaire n'est utilisé.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Conservation des Données</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Comptes clients</strong> - Conservés tant que le compte est actif</li>
                <li><strong>Commandes</strong> - 10 ans (obligation légale comptable)</li>
                <li><strong>Données de navigation</strong> - 13 mois maximum</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Contact</h2>
              <p className="mb-4">
                Pour toute question concernant cette politique de confidentialité :<br />
                <strong>Email :</strong> privacy@maison-luxe.fr<br />
                <strong>Délégué à la Protection des Données :</strong> dpo@maison-luxe.fr
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