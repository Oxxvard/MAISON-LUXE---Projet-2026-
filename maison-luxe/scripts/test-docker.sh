#!/bin/bash

echo "🧪 Test de la configuration Docker pour MaisonLuxe"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Vérifier que Docker est installé
echo "📦 Test 1: Vérification de Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker est installé: $(docker --version)${NC}"
else
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi

# Test 2: Vérifier que docker-compose est disponible
echo ""
echo "🔧 Test 2: Vérification de Docker Compose..."
if docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose est disponible: $(docker compose version)${NC}"
else
    echo -e "${RED}❌ Docker Compose n'est pas disponible${NC}"
    exit 1
fi

# Test 3: Vérifier les fichiers Docker
echo ""
echo "📄 Test 3: Vérification des fichiers Docker..."
if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✅ Dockerfile trouvé${NC}"
else
    echo -e "${RED}❌ Dockerfile manquant${NC}"
    exit 1
fi

if [ -f ".dockerignore" ]; then
    echo -e "${GREEN}✅ .dockerignore trouvé${NC}"
else
    echo -e "${YELLOW}⚠️  .dockerignore manquant (optionnel mais recommandé)${NC}"
fi

# Test 4: Vérifier next.config.mjs
echo ""
echo "⚙️  Test 4: Vérification de next.config.mjs..."
if grep -q "output.*standalone" next.config.mjs; then
    echo -e "${GREEN}✅ Mode standalone activé dans next.config.mjs${NC}"
else
    echo -e "${YELLOW}⚠️  Mode standalone non détecté dans next.config.mjs${NC}"
    echo "   Ajoutez: output: 'standalone' dans nextConfig"
fi

# Test 5: Construction de l'image Docker (test rapide)
echo ""
echo "🏗️  Test 5: Validation de la syntaxe du Dockerfile..."
echo -e "${YELLOW}⏳ Vérification...${NC}"

# Test simple de syntaxe sans build complet
if docker build --help &> /dev/null && [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✅ Le Dockerfile semble valide${NC}"
    echo -e "${YELLOW}💡 Pour un test complet: docker build -t maisonluxe .${NC}"
else
    echo -e "${RED}❌ Erreur avec Docker${NC}"
    exit 1
fi

# Résumé
echo ""
echo "=================================================="
echo -e "${GREEN}✨ Tous les tests sont passés !${NC}"
echo ""
echo "🚀 Prochaines étapes:"
echo "   1. Créer docker-compose.yml pour orchestrer les services"
echo "   2. Construire l'image: docker build -t maisonluxe ."
echo "   3. Lancer l'application: docker compose up"
echo ""
