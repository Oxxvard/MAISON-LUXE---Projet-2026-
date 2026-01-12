# ==================================
# ÉTAPE 1: Builder - Construction
# ==================================
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install --legacy-peer-deps

# Copier tout le code source
COPY . .

# Variables d'environnement pour le build (valeurs fictives - seront remplacées au runtime)
ENV MONGODB_URI="mongodb://localhost:27017/maisonluxe" \
    NEXTAUTH_URL="http://localhost:3000" \
    NEXTAUTH_SECRET="build-placeholder-will-be-replaced" \
    RESEND_API_KEY="re_build_placeholder" \
    STRIPE_SECRET_KEY="sk_test_build_placeholder" \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_build_placeholder" \
    CJ_ACCESS_TOKEN="build_placeholder" \
    SKIP_ENV_VALIDATION=true

# Générer le client Prisma si nécessaire et construire l'application
RUN npm run build

# ==================================
# ÉTAPE 2: Runner - Production
# ==================================
FROM node:20-alpine AS runner

WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package*.json ./

# Définir les variables d'environnement
ENV NODE_ENV=production

# Changer le propriétaire des fichiers
RUN chown -R nextjs:nodejs /app

# Utiliser l'utilisateur non-root
USER nextjs

# Exposer le port (Render utilise PORT env var, par défaut 10000)
EXPOSE 3000

# Commande de démarrage
CMD ["node", "server.js"]
