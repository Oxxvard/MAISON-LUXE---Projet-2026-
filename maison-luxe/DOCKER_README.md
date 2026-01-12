# 🐳 Guide Docker - MaisonLuxe

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Développement Local](#développement-local)
3. [Production](#production)
4. [Commandes Utiles](#commandes-utiles)
5. [Dépannage](#dépannage)

---

## 🔧 Prérequis

Assurez-vous d'avoir installé :
- **Docker Desktop** (≥ 20.10)
- **Docker Compose** (≥ 2.0)
- **Make** (optionnel, pour les commandes simplifiées)

Vérifiez avec :
```bash
docker --version
docker compose version
make --version  # Optionnel
```

## ⚡ Démarrage rapide

### Option 1 : Avec Makefile (recommandé)

```bash
# Afficher toutes les commandes disponibles
make help

# Développement avec hot-reload
make dev

# Production
make prod

# Voir les logs
make logs
```

### Option 2 : Avec le script de déploiement

```bash
# Développement
./deploy.sh dev

# Production
./deploy.sh prod

# Staging
./deploy.sh staging
```

### Option 3 : Avec Docker Compose directement

```bash
# Production
docker compose -f docker-compose.prod.yml up -d --build

# Développement
docker compose -f docker-compose.dev.yml up -d --build
```

---

## 💻 Développement Local

### 1️⃣ Première utilisation

**Copiez le fichier d'environnement Docker :**
```bash
cp .env.docker.example .env.docker
```

**Modifiez `.env.docker` avec vos vraies clés :**
- `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` (Google Cloud Console)
- `STRIPE_SECRET_KEY` et `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Stripe Dashboard)
- `CJ_ACCESS_TOKEN` (CJ Dropshipping)
- `RESEND_API_KEY` (Resend Dashboard)
- `NEXTAUTH_SECRET` (générez avec `openssl rand -base64 32`)

### 2️⃣ Démarrer l'environnement de développement

```bash
# Démarrer tous les services (app + MongoDB + Redis)
docker compose up -d

# Voir les logs
docker compose logs -f app
```

**Votre application sera accessible sur :**
- 🌐 Application : http://localhost:3000
- 🗄️ MongoDB : localhost:27017
- 🔴 Redis : localhost:6379

### 3️⃣ Reconstruire après modification du code

```bash
# Reconstruire l'image et redémarrer
docker compose up --build -d
```

### 4️⃣ Arrêter l'environnement

```bash
# Arrêter les services
docker compose down

# Arrêter ET supprimer les volumes (données perdues !)
docker compose down -v
```

---

## 🚀 Production

### 1️⃣ Configuration

**Créez un fichier `.env.production` avec vos variables d'environnement de production :**
```bash
cp .env.docker.example .env.production
```

**⚠️ Important pour la production :**
- Utilisez **MongoDB Atlas** (pas MongoDB local)
- Configurez `NEXTAUTH_URL` avec votre vrai domaine
- Utilisez des secrets forts (NEXTAUTH_SECRET)
- Configurez Stripe webhooks avec votre domaine
- Activez Sentry pour le monitoring

### 2️⃣ Build et déploiement

```bash
# Build l'image de production
docker compose -f docker-compose.prod.yml build

# Démarrer en production
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 3️⃣ Monitoring

```bash
# Voir l'état de santé
docker compose -f docker-compose.prod.yml ps

# Logs de production
docker compose -f docker-compose.prod.yml logs -f app

# Stats en temps réel
docker stats
```

---

## 🛠️ Commandes Utiles

### Gestion des conteneurs

```bash
# Lister les conteneurs actifs
docker ps

# Lister toutes les images
docker images

# Supprimer les images inutilisées
docker image prune -a

# Supprimer tous les conteneurs arrêtés
docker container prune
```

### Debugging

```bash
# Entrer dans le conteneur de l'app
docker exec -it maisonluxe-app sh

# Entrer dans MongoDB
docker exec -it maisonluxe-mongodb mongosh -u maisonluxe -p maisonluxe123

# Voir les variables d'environnement
docker exec maisonluxe-app env
```

### Base de données

```bash
# Backup MongoDB
docker exec maisonluxe-mongodb mongodump -u maisonluxe -p maisonluxe123 --db maisonluxe --out /tmp/backup

# Copier le backup localement
docker cp maisonluxe-mongodb:/tmp/backup ./backup

# Restore MongoDB
docker exec -i maisonluxe-mongodb mongorestore -u maisonluxe -p maisonluxe123 --db maisonluxe /tmp/backup/maisonluxe
```

### Volumes

```bash
# Lister les volumes
docker volume ls

# Inspecter un volume
docker volume inspect maisonluxe_mongodb_data

# Supprimer un volume (⚠️ perte de données)
docker volume rm maisonluxe_mongodb_data
```

---

## 🔍 Dépannage

### ❌ Problème : "Port 3000 déjà utilisé"

**Solution :**
```bash
# Trouver le processus utilisant le port
lsof -i :3000

# Tuer le processus
kill -9 <PID>

# Ou changer le port dans docker-compose.yml
ports:
  - "3001:3000"
```

### ❌ Problème : "MongoDB connection failed"

**Vérifiez :**
1. MongoDB est bien démarré : `docker ps | grep mongodb`
2. Healthcheck OK : `docker inspect maisonluxe-mongodb | grep Health -A 10`
3. Variables d'env : `echo $MONGODB_URI`

**Solution :**
```bash
# Redémarrer MongoDB
docker compose restart mongodb

# Vérifier les logs
docker compose logs mongodb
```

### ❌ Problème : "Module not found" ou erreur de build

**Solution :**
```bash
# Rebuild sans cache
docker compose build --no-cache

# Supprimer node_modules et rebuild
docker compose down
docker volume rm maisonluxe_node_modules
docker compose up --build -d
```

### ❌ Problème : "Cannot connect to Docker daemon"

**Solution :**
```bash
# Démarrer Docker Desktop
sudo systemctl start docker

# Ou sur macOS
open -a Docker
```

### ❌ Problème : "Image build failed with npm errors"

**Solution :**
- Vérifiez que `.env.docker` existe et est valide
- Assurez-vous que `SKIP_ENV_VALIDATION=1` est dans les build args
- Essayez `npm install --legacy-peer-deps` si problème de dépendances

---

## 📚 Ressources

- [Documentation Docker](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)

---

## ✅ Checklist de déploiement

Avant de déployer en production :

- [ ] Toutes les variables d'environnement sont configurées
- [ ] MongoDB Atlas est configuré (pas MongoDB local)
- [ ] Les secrets sont forts et sécurisés
- [ ] Stripe webhooks pointent vers votre domaine
- [ ] Google OAuth callback URLs sont configurés
- [ ] Sentry est activé pour le monitoring
- [ ] Les logs sont configurés (rotation activée)
- [ ] Un système de backup est en place
- [ ] Les health checks fonctionnent
- [ ] Le domaine a un certificat SSL (HTTPS)

---

## 🆘 Besoin d'aide ?

Vérifiez d'abord :
1. Les logs : `docker compose logs -f`
2. L'état des services : `docker compose ps`
3. La santé des conteneurs : `docker inspect <container> | grep Health -A 10`

Si le problème persiste, ouvrez une issue sur GitHub avec :
- La sortie de `docker compose logs`
- Votre configuration (sans les secrets)
- Les étapes pour reproduire le problème
