# Tests E2E Playwright - Maison Luxe

## 📋 Vue d'ensemble

**30 tests E2E** couvrant les parcours utilisateur et administrateur complets.

### Tests créés
- ✅ **Parcours utilisateur** (`user-journey.spec.ts`) - 14 tests  
- ✅ **Parcours administrateur** (`admin-journey.spec.ts`) - 16 tests

## 🔧 Configuration

### Fichiers créés
- `playwright.config.ts` - Configuration Playwright pour Next.js 15
- `e2e/user-journey.spec.ts` - Tests parcours utilisateur
- `e2e/admin-journey.spec.ts` - Tests parcours admin

### Dépendances système requises

Pour faire fonctionner Playwright dans un dev container ou environnement Linux, installez :

```bash
# Installation automatique des dépendances
npx playwright install-deps chromium

# OU manuellement
sudo apt-get update && sudo apt-get install -y \
  libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 \
  libxkbcommon0 libxdamage1 libgbm1 libpango-1.0-0 \
  libcairo2 libasound2t64 libxcomposite1 libxrandr2 \
  libxrender1 libxss1 libxext6 libfontconfig1 libfreetype6 \
  libnss3 libnspr4
```

## 🚀 Utilisation

### Lancer les tests

```bash
# Tous les tests E2E
npm run test:e2e

# Tests en mode headed (voir le navigateur)
npm run test:e2e:headed

# Tests avec UI interactive
npm run test:e2e:ui

# Afficher le rapport HTML
npm run test:e2e:report
```

### Lancer des tests spécifiques

```bash
# Un fichier
npx playwright test e2e/user-journey.spec.ts

# Un test spécifique
npx playwright test e2e/user-journey.spec.ts:9

# Par nom
npx playwright test --grep "page d'accueil"
```

## 📝 Détails des tests

### Parcours utilisateur (14 tests)

#### Navigation et découverte (4 tests)
- ✅ Page d'accueil affichée correctement
- ✅ Navigation vers page produits
- ✅ Liste des produits affichée
- ✅ Recherche de produits fonctionnelle

#### Authentification (4 tests)
- ✅ Page d'inscription affichée
- ✅ Validation des champs (côté client)
- ✅ Page de connexion affichée
- ✅ Erreur avec identifiants invalides

#### Produits et détails (2 tests)
- ✅ Page détail produit affichée
- ✅ Prix du produit visible

#### Panier (2 tests)
- ✅ Accès au panier
- ✅ Panier vide par défaut

#### Checkout (2 tests)
- ✅ Page checkout accessible
- ✅ Authentification requise pour checkout

### Parcours administrateur (16 tests)

#### Authentification admin (2 tests)
- ✅ Page de connexion admin
- ✅ Redirection après connexion

#### Dashboard admin (2 tests)
- ✅ Protection de l'accès (middleware)
- ✅ Sections du dashboard visibles

#### Gestion des produits (3 tests)
- ✅ Page de gestion des produits
- ✅ Bouton d'ajout de produit
- ✅ Liste des produits existants

#### Import CJ Dropshipping (2 tests)
- ✅ Page d'import CJ
- ✅ Validation du format PID

#### Gestion des commandes (4 tests)
- ✅ Page des commandes
- ✅ Liste des commandes
- ✅ Filtrage par statut
- ✅ Détails d'une commande

#### Webhooks CJ (1 test)
- ✅ Configuration des webhooks

#### Statistiques (2 tests)
- ✅ Statistiques globales
- ✅ Graphiques de statistiques

## 🎯 Approche des tests

### Tests résilients
- Sélecteurs multiples (`text=/produits|products/i`)
- Vérifications conditionnelles avec `.catch(() => false)`
- Timeouts appropriés pour chargement asynchrone

### Tests de navigation
- Vérification des URLs
- Vérification de la présence d'éléments clés
- Tests de formulaires et validation

### Gestion de l'authentification
- Tests sans authentification (pages publiques)
- Tests nécessitant authentification (checkout, admin)
- Détection automatique de redirections

## ⚙️ Configuration Playwright

```typescript
{
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
}
```

## 🚧 Notes importantes

### Environnement dev container
- Les tests E2E nécessitent des dépendances système spécifiques
- Chromium headless est utilisé par défaut
- Le serveur Next.js démarre automatiquement

### Tests en CI/CD
- 2 retries automatiques en cas d'échec
- 1 worker pour éviter conflits
- Traces et vidéos capturées en cas d'échec

### Amélirations futures
- Ajouter des fixtures pour authentification admin
- Tests de bout en bout complets (signup → checkout)
- Tests de performance (Lighthouse)
- Tests d'accessibilité (axe-core)

## 📊 Couverture

Les tests E2E couvrent :
- ✅ Navigation publique
- ✅ Pages d'authentification
- ✅ Middleware de protection
- ✅ Formulaires et validation
- ✅ Interface admin
- ✅ Import CJ Dropshipping
- ✅ Gestion des commandes

## 🔗 Ressources

- [Documentation Playwright](https://playwright.dev/)
- [Best Practices Playwright](https://playwright.dev/docs/best-practices)
- [Playwright avec Next.js](https://nextjs.org/docs/testing#playwright)
