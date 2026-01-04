# 🌐 Déploiement sur Cloudflare Pages

## Étape 1 : Créer le projet sur Cloudflare Pages

1. Allez sur https://dash.cloudflare.com/
2. Sélectionnez **Workers & Pages** dans le menu
3. Cliquez sur **Create application** → **Pages** → **Connect to Git**
4. Sélectionnez votre repository GitHub `Oxxvard/Ecommerceproject2026`
5. **Branch de production** : `main`

## Étape 2 : Configuration du build

**Build command:**
```bash
cd maison-luxe && npm install && npm run build
```

**Build output directory:**
```
maison-luxe/.next
```

**Root directory:**
```
maison-luxe
```

**Environment variables (à ajouter):**
```
NODE_VERSION=20
MONGODB_URI=mongodb+srv://maisonluxe:...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://votre-projet.pages.dev
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
CJ_ACCESS_TOKEN=...
RESEND_API_KEY=...
NEXT_PUBLIC_APP_URL=https://votre-projet.pages.dev
```

## Étape 3 : Framework preset

Sélectionnez **Next.js** dans la liste des frameworks

## Étape 4 : Déployer

Cliquez sur **Save and Deploy**

## Avantages vs Vercel

✅ Pas de problème de cache bizarre
✅ CDN mondial ultra-rapide
✅ Redéploiement immédiat
✅ Logs en temps réel
✅ Intégration DNS si domaine sur Cloudflare

## Alternative : Railway

Si Cloudflare Pages ne fonctionne pas (Next.js 16 peut avoir des problèmes), utilisez Railway :

1. https://railway.app
2. New Project → Deploy from GitHub
3. Sélectionner le repo
4. Railway détecte Next.js automatiquement
5. Ajouter les variables d'environnement
6. Deploy

**Prix Railway :** ~5$/mois
**Prix Cloudflare Pages :** Gratuit jusqu'à 500 builds/mois
