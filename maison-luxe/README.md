# 🏛️ MaisonLuxe - E-commerce Dropshipping Luxe

Site e-commerce complet pour le dropshipping de produits de luxe via CJ Dropshipping.  
**Stack :** Next.js 15 + TypeScript + MongoDB + Stripe + CJ API

📚 **[VOIR LA DOCUMENTATION COMPLÈTE →](./DOCUMENTATION.md)**

---

## ⚡ Démarrage Rapide

```bash
# Installation
npm install

# Configuration
cp .env.example .env.local
# Remplir les variables requises

# Vérification
node scripts/startup-check.js

# Démarrage
npm run dev
```

🌐 **URL :** http://localhost:3001

---

## 🚀 Fonctionnalités

### ✅ Côté Client
- **Page d'accueil** avec produits en vedette et sections marketing
- **Boutique** avec filtrage par catégorie et tri (prix, notes, date)
- **Pages produits détaillées** avec galerie d'images, avis clients, et notes
- **Panier** avec gestion des quantités et persistance locale
- **Système d'authentification** complet (inscription/connexion avec NextAuth)
- **Processus de checkout** avec Stripe Checkout
- **Système d'avis** - Les clients peuvent noter et commenter les produits
- **Design responsive** - Optimisé pour mobile, tablette et desktop

### 🛠️ Côté Admin
- **Tableau de bord** avec statistiques en temps réel
  - Total des commandes et revenus
  - Calcul automatique des marges et bénéfices
  - Nombre de clients
  - Liste des commandes récentes
- **Gestion des produits**
  - Ajout/modification/suppression de produits
  - Gestion des prix d'achat (coût) et de vente
  - Calcul automatique des marges
  - Upload d'images multiples
  - Gestion du stock
- **Gestion des commandes**
  - Vue détaillée de toutes les commandes
  - Mise à jour du statut (en attente, traitement, expédiée, livrée)
  - Informations client et adresse de livraison
- **Gestion des catégories**
  - Création et organisation des catégories de produits

## 📋 Prérequis

- Node.js 18+ 
- MongoDB (local ou Atlas)
- Compte Stripe (pour les paiements)

## ⚙️ Installation

1. **Cloner le projet**
```bash
cd maison-luxe
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**

Créer un fichier `.env` à la racine :

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/maisonluxe

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret_genere_avec_openssl

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle
STRIPE_SECRET_KEY=sk_test_votre_cle
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook

# Admin par défaut (optionnel)
ADMIN_EMAIL=admin@maisonluxe.com
ADMIN_PASSWORD=Admin123!
```

**Générer un secret NextAuth :**
```bash
openssl rand -base64 32
```

4. **Lancer le serveur de développement**
```bash
npm run dev
```

Le site sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🔐 Compte Admin

Pour créer un compte administrateur, inscrivez-vous normalement puis modifiez manuellement le rôle dans MongoDB :

```javascript
db.users.updateOne(
  { email: "votre@email.com" },
  { $set: { role: "admin" } }
)
```

## 💳 Configuration Stripe

1. Créer un compte sur [Stripe](https://stripe.com)
2. Récupérer les clés API (mode test)
3. Configurer les webhooks :
   - URL : `http://localhost:3000/api/webhook/stripe`
   - Événements : `checkout.session.completed`
4. Ajouter les clés dans `.env`

Pour tester les webhooks en local :
```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

## 📊 Structure de la Base de Données

### User
- Nom, email, mot de passe (hashé avec bcrypt)
- Rôle (user/admin)

### Product
- Nom, slug, description
- **Prix d'achat** (costPrice) - Prix du fournisseur
- **Prix de vente** (price) - Prix affiché au client
- Prix comparatif (compareAtPrice) - Pour afficher les réductions
- Images (array), catégorie
- Stock, featured (produit en vedette)
- Rating et nombre d'avis

### Category
- Nom, slug, description, image

### Order
- Utilisateur, articles, montant total
- Statut (pending, processing, shipped, delivered, cancelled)
- Adresse de livraison complète
- Statut du paiement (pending, paid, failed)
- ID de session Stripe

### Review
- Produit, utilisateur, note (1-5), commentaire
- Index unique pour empêcher les doublons

## 🎨 Personnalisation

### Couleurs
Modifier `tailwind.config.ts` pour changer les couleurs principales :

```typescript
colors: {
  primary: {
    // Vos couleurs personnalisées
  },
}
```

### Logo et nom
- Logo : Remplacer "MaisonLuxe" dans `src/components/Navbar.tsx`
- Nom du site : Modifier `src/app/layout.tsx` (metadata)

## 📱 Pages Principales

- `/` - Page d'accueil
- `/shop` - Boutique avec filtres
- `/products/[slug]` - Page produit
- `/cart` - Panier
- `/checkout` - Processus de commande
- `/auth/signin` - Connexion
- `/auth/signup` - Inscription
- `/admin` - Dashboard admin
- `/admin/products` - Gestion produits
- `/admin/orders` - Gestion commandes

## 🚢 Déploiement

### Vercel (Recommandé)

```bash
npm install -g vercel
vercel
```

N'oubliez pas d'ajouter les variables d'environnement dans le dashboard Vercel.

### Variables d'environnement en production

- Mettre à jour `NEXTAUTH_URL` avec votre domaine
- Utiliser les clés Stripe en mode live
- Sécuriser votre MongoDB (MongoDB Atlas recommandé)

## 💰 Optimisation pour le Dropshipping

Le système intègre :
- **Gestion des marges** - Différenciation prix d'achat/vente
- **Calcul automatique des bénéfices** dans le dashboard
- **Suivi des stocks** pour éviter les ruptures
- **Système de réductions** (compareAtPrice)
- **Avis clients** pour augmenter la confiance

## 🐛 Dépannage

**Erreur de connexion MongoDB :**
- Vérifier que MongoDB est lancé
- Vérifier l'URL de connexion dans `.env`

**Erreur Stripe :**
- Vérifier les clés API
- Tester les webhooks avec Stripe CLI

**Erreur NextAuth :**
- Générer un nouveau secret
- Vérifier NEXTAUTH_URL

## 📝 Technologies Utilisées

- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Base de données** : MongoDB avec Mongoose
- **Authentification** : NextAuth.js
- **Paiements** : Stripe Checkout
- **Styling** : Tailwind CSS
- **State Management** : Zustand (panier)
- **Notifications** : React Hot Toast
- **Icônes** : Lucide React

## 📄 Licence

Projet open source - Libre d'utilisation

---

**Créé pour le dropshipping - Marges optimisées 💰**
