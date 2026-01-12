# 🚀 Guide de Déploiement - MaisonLuxe

Ce guide couvre le déploiement de l'application sur différentes plateformes cloud.

---

## 📋 Table des matières

1. [Railway.app](#railway-deployment)
2. [Render.com](#render-deployment)
3. [Vercel + MongoDB Atlas](#vercel-deployment)
4. [Docker (VPS/Cloud)](#docker-vps-deployment)

---

## 🚂 Railway.app Deployment

Railway offre un déploiement Docker simple avec base de données intégrée.

### Étape 1 : Prérequis

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login
```

### Étape 2 : Créer un nouveau projet

```bash
# Dans le dossier maison-luxe
railway init

# Lier votre projet GitHub
railway link
```

### Étape 3 : Ajouter MongoDB

```bash
# Ajouter MongoDB via Railway
railway add mongodb

# Obtenir l'URL de connexion
railway variables
```

### Étape 4 : Configurer les variables d'environnement

Dans le dashboard Railway, ajoutez :

```bash
MONGODB_URI=${{MONGO_URL}}  # Auto-configuré par Railway
NEXTAUTH_URL=https://votre-app.railway.app
NEXTAUTH_SECRET=votre_secret_32_caracteres
GOOGLE_CLIENT_ID=votre_google_client_id
GOOGLE_CLIENT_SECRET=votre_google_secret
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CJ_ACCESS_TOKEN=votre_token_cj
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@votredomaine.com
ADMIN_EMAIL=admin@votredomaine.com
ADMIN_PASSWORD=VotreMotDePasseSecurise
```

### Étape 5 : Déployer

```bash
# Déployer avec le Dockerfile de production
railway up

# Ou activer le déploiement automatique depuis GitHub
# Dans Settings > Service > Source : Sélectionnez votre branche
```

### Configuration Dockerfile Railway

Railway détecte automatiquement le `Dockerfile`. Assurez-vous que le port 3000 est exposé.

---

## 🎨 Render.com Deployment

### Étape 1 : Créer les services

1. **Allez sur [render.com](https://render.com)**
2. Créez un **Web Service**
3. Connectez votre repo GitHub
4. Sélectionnez la branche `main`

### Étape 2 : Configuration du Web Service

```yaml
Name: maisonluxe-app
Environment: Docker
Region: Frankfurt (ou le plus proche)
Branch: main
Root Directory: maison-luxe
Docker Command: (laissez vide, utilise CMD du Dockerfile)
```

### Étape 3 : Créer MongoDB

**Option A : MongoDB Atlas (recommandé)**
- Créez un cluster gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Obtenez la connection string

**Option B : Render PostgreSQL** (si vous migrez)
- Dans Render Dashboard : New → PostgreSQL
- Copiez l'Internal Database URL

### Étape 4 : Variables d'environnement

Dans l'onglet **Environment** du service :

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/maisonluxe
NEXTAUTH_URL=https://maisonluxe.onrender.com
NEXTAUTH_SECRET=votre_secret_genere
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
CJ_ACCESS_TOKEN=...
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@maisonluxe.com
```

### Étape 5 : Déployer

1. Cliquez sur **Create Web Service**
2. Render va build l'image Docker et déployer
3. Le déploiement prend ~5-10 minutes

### Health Checks (Optionnel)

Dans Settings :
- Health Check Path: `/api/health` (si vous créez cette route)
- Health Check Interval: 30s

---

## ▲ Vercel + MongoDB Atlas

Vercel est optimisé pour Next.js mais ne supporte pas Docker. Déploiement serverless.

### Étape 1 : MongoDB Atlas

1. Créez un cluster sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist `0.0.0.0/0` (ou utilisez Vercel IP ranges)
3. Copiez la connection string

### Étape 2 : Installer Vercel CLI

```bash
npm install -g vercel

# Se connecter
vercel login
```

### Étape 3 : Configurer le projet

```bash
cd maison-luxe

# Première fois
vercel

# Suivez les prompts :
# - Link to existing project? No
# - Project name: maisonluxe
# - Directory: ./
```

### Étape 4 : Variables d'environnement

```bash
# Ajouter les variables en production
vercel env add MONGODB_URI production
vercel env add NEXTAUTH_SECRET production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add CJ_ACCESS_TOKEN production
vercel env add RESEND_API_KEY production

# Ou via le dashboard Vercel
```

### Étape 5 : Déployer

```bash
# Déploiement de production
vercel --prod

# Ou connectez GitHub pour auto-deploy
```

### Configuration Vercel

Fichier `vercel.json` (déjà présent) :

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "regions": ["cdg1"]
}
```

---

## 🐳 Docker VPS Deployment

Pour déployer sur un VPS (DigitalOcean, AWS EC2, Hetzner, etc.)

### Étape 1 : Préparer le VPS

```bash
# SSH dans votre serveur
ssh root@votre-ip

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose
apt-get update
apt-get install docker-compose-plugin -y
```

### Étape 2 : Cloner le projet

```bash
# Installer Git
apt-get install git -y

# Cloner le repo
cd /opt
git clone https://github.com/Oxxvard/Ecommerceproject2026.git
cd Ecommerceproject2026/maison-luxe
```

### Étape 3 : Configurer les variables

```bash
# Copier et modifier .env
cp .env.docker.example .env.docker
nano .env.docker
```

Modifiez avec vos vraies clés :
```bash
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/maisonluxe?authSource=admin
NEXTAUTH_URL=https://votredomaine.com
NEXTAUTH_SECRET=... (générez avec: openssl rand -base64 32)
# ... autres variables
```

### Étape 4 : Configurer nginx (optionnel)

**Installer nginx :**
```bash
apt-get install nginx certbot python3-certbot-nginx -y
```

**Configuration `/etc/nginx/sites-available/maisonluxe` :**
```nginx
server {
    listen 80;
    server_name votredomaine.com www.votredomaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Activer et SSL :**
```bash
ln -s /etc/nginx/sites-available/maisonluxe /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Obtenir certificat SSL
certbot --nginx -d votredomaine.com -d www.votredomaine.com
```

### Étape 5 : Déployer avec Docker

**Option A : Production (recommandé)**
```bash
# Build et démarrer
docker compose -f docker-compose.prod.yml up -d --build

# Voir les logs
docker compose -f docker-compose.prod.yml logs -f app
```

**Option B : Développement avec MongoDB local**
```bash
docker compose up -d --build
```

### Étape 6 : Configuration du firewall

```bash
# Autoriser les ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Étape 7 : Mise à jour automatique

**Créer un script de déploiement `/opt/deploy.sh` :**
```bash
#!/bin/bash
cd /opt/Ecommerceproject2026/maison-luxe
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker system prune -f
```

```bash
chmod +x /opt/deploy.sh
```

**Webhook GitHub (optionnel) :**
Utilisez un outil comme [webhook](https://github.com/adnanh/webhook) pour déclencher `/opt/deploy.sh` automatiquement.

---

## 🔐 Sécurité en Production

### Checklist de sécurité

- [ ] **Secrets forts** : Générez tous les secrets avec `openssl rand -base64 32`
- [ ] **HTTPS activé** : Utilisez Certbot/Let's Encrypt
- [ ] **MongoDB** : Utilisez Atlas en production (pas MongoDB local)
- [ ] **Firewall** : Bloquez tous les ports sauf 22, 80, 443
- [ ] **Variables d'env** : Ne commitez JAMAIS `.env.docker` avec vraies clés
- [ ] **Webhooks Stripe** : Configurez avec votre vrai domaine
- [ ] **CORS** : Limitez les origines autorisées
- [ ] **Rate limiting** : Activé dans `lib/rate-limit.ts`
- [ ] **Sentry** : Configuré pour le monitoring d'erreurs

### Générer des secrets sécurisés

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# Générer un mot de passe admin fort
openssl rand -base64 24
```

---

## 🧪 Tests de déploiement

Après déploiement, testez :

```bash
# 1. Santé de l'application
curl https://votredomaine.com

# 2. Base de données
# Essayez de vous inscrire/connecter

# 3. Stripe
# Faites un paiement test

# 4. Emails
# Testez "Mot de passe oublié"

# 5. CJ Dropshipping
# Créez une commande test
```

---

## 📊 Monitoring

### Railway
- Logs en temps réel dans le dashboard
- Métriques CPU/RAM automatiques

### Render
- Logs dans l'interface
- Alertes email si le service down

### VPS Custom
**Installer un monitoring :**
```bash
# Installer PM2 pour gérer les process
npm install -g pm2

# Ou utiliser Docker stats
docker stats

# Logs centralisés
docker compose -f docker-compose.prod.yml logs -f --tail=100
```

---

## ❓ Troubleshooting

### "Cannot connect to MongoDB"
- Vérifiez que `MONGODB_URI` est correcte
- Sur MongoDB Atlas : vérifiez les IP whitelist
- Testez : `docker compose logs mongodb`

### "502 Bad Gateway" (nginx)
- Vérifiez que l'app est running : `docker ps`
- Logs nginx : `tail -f /var/log/nginx/error.log`

### "Build failed"
- Vérifiez les variables d'environnement de build
- Logs : `docker compose logs app`
- Rebuild sans cache : `docker compose build --no-cache`

### Webhook Stripe ne fonctionne pas
- Utilisez `stripe listen --forward-to localhost:3000/api/webhook/stripe` en dev
- En prod : Configurez l'URL dans Stripe Dashboard
- Vérifiez `STRIPE_WEBHOOK_SECRET`

---

## 🔄 Rollback en cas de problème

```bash
# Railway
railway rollback

# Render
# Dashboard > Manual Deploy > Sélectionnez un ancien commit

# Docker VPS
git reset --hard HEAD~1
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 📚 Ressources supplémentaires

- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Docker Docs](https://docs.docker.com/)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)

---

Bon déploiement ! 🚀
