# 🚂 Déploiement Railway - Guide Complet

## Étape 1 : Créer un compte Railway

1. Allez sur **https://railway.app**
2. Cliquez sur **Login** → **Login with GitHub**
3. Autorisez Railway à accéder à votre compte GitHub

## Étape 2 : Créer un nouveau projet

1. Cliquez sur **New Project**
2. Sélectionnez **Deploy from GitHub repo**
3. Choisissez `Oxxvard/Ecommerceproject2026`
4. Railway va détecter automatiquement Next.js

## Étape 3 : Configuration du projet

### Build Settings (automatiquement détectés)
- **Build Command:** `cd maison-luxe && npm install && npm run build`
- **Start Command:** `cd maison-luxe && npm start`
- **Watch Paths:** `maison-luxe/**`

### Variables d'environnement (IMPORTANT)

Cliquez sur votre service → **Variables** → **+ New Variable** et ajoutez :

```bash
# MongoDB
MONGODB_URI=<copiez depuis votre fichier .env>

# NextAuth (Railway génère une URL automatiquement)
NEXTAUTH_SECRET=<copiez depuis votre fichier .env>
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Google OAuth
GOOGLE_CLIENT_ID=<copiez depuis votre fichier .env>
GOOGLE_CLIENT_SECRET=<copiez depuis votre fichier .env>

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<copiez depuis votre fichier .env>
STRIPE_SECRET_KEY=<copiez depuis votre fichier .env>
STRIPE_WEBHOOK_SECRET=<copiez depuis votre fichier .env>

# CJ Dropshipping
CJ_API_KEY=<copiez depuis votre fichier .env>
CJ_API_URL=https://developers.cjdropshipping.com/api2.0/v1
CJ_RATE_LIMIT_DISABLED=true

# Resend Email
RESEND_API_KEY=<copiez depuis votre fichier .env>
EMAIL_FROM=Maison Luxe <onboarding@resend.dev>

# Admin
ADMIN_EMAIL=<copiez depuis votre fichier .env>
ADMIN_PASSWORD=<copiez depuis votre fichier .env>

# App URL
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_BASE_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Node
NODE_ENV=production
PORT=3000
```

**Note:** `${{RAILWAY_PUBLIC_DOMAIN}}` est une variable Railway qui sera automatiquement remplacée par votre URL (ex: `https://maison-luxe-production.up.railway.app`)

## Étape 4 : Configurer le déploiement

1. Dans **Settings** → **Networking**
2. Cliquez sur **Generate Domain** pour obtenir une URL publique

## Étape 5 : Déployer

1. Railway va automatiquement déployer dès que vous créez le projet
2. Suivez les logs en temps réel dans l'onglet **Deployments**
3. Une fois terminé, cliquez sur l'URL générée pour voir votre site

## Étape 6 : Configuration post-déploiement

### Mettre à jour Google OAuth
1. Allez sur https://console.cloud.google.com/
2. APIs & Services → Credentials
3. Ajoutez votre URL Railway dans "Authorized redirect URIs":
   - `https://VOTRE-URL.up.railway.app/api/auth/callback/google`

### Mettre à jour Stripe Webhooks
1. Allez sur https://dashboard.stripe.com/webhooks
2. Créez un nouveau webhook endpoint:
   - URL: `https://VOTRE-URL.up.railway.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`

## Avantages de Railway

✅ **Déploiement instantané** - aucun problème de cache
✅ **Logs en temps réel** - debugging facile
✅ **Variables d'environnement** - gestion simple
✅ **Auto-scaling** - s'adapte à la charge
✅ **Support Next.js natif** - configuration automatique
✅ **Base de données intégrée** - peut héberger MongoDB si besoin
✅ **Domaine personnalisé** - ajout facile

## Prix

- **Free trial** : 5$ de crédit gratuit
- **Developer plan** : 5$/mois pour commencer
- **Pay as you go** : basé sur l'utilisation réelle

## Redéploiement

Chaque push sur la branche `main` déclenche automatiquement un redéploiement.

## Rollback

En cas de problème, vous pouvez revenir à un déploiement précédent en un clic.

---

## 🚀 Une fois déployé

Votre site sera accessible sur une URL type:
`https://maison-luxe-production.up.railway.app`

Railway ne cache JAMAIS les déploiements, contrairement à Vercel !
