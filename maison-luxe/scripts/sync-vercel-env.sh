#!/bin/bash

# Script pour synchroniser les variables d'environnement avec Vercel
# Usage: ./scripts/sync-vercel-env.sh

set -e

echo "🔄 Synchronisation des variables d'environnement avec Vercel"
echo ""

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "📦 Installation: npm i -g vercel"
    exit 1
fi

# Vérifier si on est connecté
if ! vercel whoami &> /dev/null; then
    echo "🔑 Connexion à Vercel..."
    vercel login
fi

echo "✅ Connecté à Vercel"
echo ""

# Liste des variables critiques à vérifier
CRITICAL_VARS=(
    "MONGODB_URI"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "CJ_API_KEY"
    "RESEND_API_KEY"
)

OPTIONAL_VARS=(
    "CJ_API_SECRET"
    "CJ_API_URL"
    "SENTRY_DSN"
    "USE_DB_TOKEN_CACHE"
    "NODE_ENV"
)

echo "📋 Vérification des variables critiques..."
echo ""

missing_critical=()
missing_optional=()

# Vérifier les variables critiques
for var in "${CRITICAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var: MANQUANTE dans .env local"
        missing_critical+=("$var")
    else
        echo "✅ $var: Présente localement"
    fi
done

echo ""
echo "📋 Vérification des variables optionnelles..."
echo ""

# Vérifier les variables optionnelles
for var in "${OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚠️  $var: Non définie"
        missing_optional+=("$var")
    else
        echo "✅ $var: Présente localement"
    fi
done

echo ""

if [ ${#missing_critical[@]} -ne 0 ]; then
    echo "❌ Variables critiques manquantes: ${missing_critical[*]}"
    echo ""
    echo "💡 Ajoutez-les dans votre fichier .env avant de continuer"
    exit 1
fi

echo "🚀 Prêt à synchroniser avec Vercel"
echo ""
echo "Options disponibles:"
echo "  1) Vérifier les variables sur Vercel (lecture seule)"
echo "  2) Ajouter/Mettre à jour les variables sur Vercel"
echo "  3) Télécharger les variables depuis Vercel"
echo "  4) Quitter"
echo ""

read -p "Choisissez une option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📊 Variables d'environnement sur Vercel:"
        echo ""
        vercel env ls
        ;;
    2)
        echo ""
        echo "⚙️  Configuration des variables sur Vercel..."
        echo ""
        
        # Demander confirmation
        read -p "⚠️  Cela va mettre à jour les variables en PRODUCTION. Continuer? (y/N): " confirm
        
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "❌ Annulé"
            exit 0
        fi
        
        echo ""
        echo "📤 Ajout des variables sur Vercel (Production)..."
        echo ""
        
        # Ajouter chaque variable critique
        for var in "${CRITICAL_VARS[@]}"; do
            if [ -n "${!var}" ]; then
                echo "Adding $var to Vercel..."
                echo "${!var}" | vercel env add "$var" production --force || true
            fi
        done
        
        # Ajouter les variables optionnelles si définies
        for var in "${OPTIONAL_VARS[@]}"; do
            if [ -n "${!var}" ]; then
                echo "Adding $var to Vercel..."
                echo "${!var}" | vercel env add "$var" production --force || true
            fi
        done
        
        # Variables spécifiques à la production
        echo "true" | vercel env add USE_DB_TOKEN_CACHE production --force || true
        echo "production" | vercel env add NODE_ENV production --force || true
        
        echo ""
        echo "✅ Variables synchronisées avec succès!"
        echo ""
        echo "📝 Prochaines étapes:"
        echo "  1. Vérifier: vercel env ls"
        echo "  2. Déployer: git push origin main"
        echo "  3. Surveiller: vercel logs --follow"
        ;;
    3)
        echo ""
        echo "📥 Téléchargement des variables depuis Vercel..."
        echo ""
        vercel env pull .env.vercel.production
        echo ""
        echo "✅ Variables téléchargées dans .env.vercel.production"
        echo "⚠️  Ne committez PAS ce fichier!"
        ;;
    4)
        echo "👋 Au revoir!"
        exit 0
        ;;
    *)
        echo "❌ Option invalide"
        exit 1
        ;;
esac

echo ""
echo "🎉 Terminé!"
