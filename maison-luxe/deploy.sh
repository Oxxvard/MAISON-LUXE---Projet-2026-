#!/bin/bash

# ===============================================
# Script de déploiement automatique
# ===============================================
# Usage: ./deploy.sh [dev|prod|staging]
# ===============================================

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
ENVIRONMENT=${1:-prod}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/backup_${TIMESTAMP}"

# ===============================================
# Fonctions
# ===============================================

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Vérifier si Docker est installé
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé"
        exit 1
    fi
    print_success "Docker est installé"
}

# Vérifier si Docker Compose est installé
check_docker_compose() {
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose n'est pas installé"
        exit 1
    fi
    print_success "Docker Compose est installé"
}

# Vérifier les variables d'environnement
check_env_file() {
    if [ "$ENVIRONMENT" = "prod" ] && [ ! -f .env.docker ]; then
        print_error "Fichier .env.docker manquant"
        print_info "Créez le fichier : cp .env.docker.example .env.docker"
        exit 1
    fi
    print_success "Fichier de configuration trouvé"
}

# Backup de la base de données
backup_database() {
    print_info "Création du backup de la base de données..."
    
    if docker ps | grep -q maisonluxe-mongodb; then
        mkdir -p "$BACKUP_DIR"
        docker exec maisonluxe-mongodb mongodump \
            -u admin -p admin123 \
            --db maisonluxe \
            --out /tmp/backup 2>&1 | grep -v "Warning" || true
        
        docker cp maisonluxe-mongodb:/tmp/backup "$BACKUP_DIR"
        print_success "Backup créé dans $BACKUP_DIR"
    else
        print_warning "MongoDB n'est pas en cours d'exécution, backup ignoré"
    fi
}

# Pull des dernières modifications
git_pull() {
    if [ -d .git ]; then
        print_info "Pull des dernières modifications Git..."
        git pull origin main
        print_success "Code mis à jour"
    else
        print_warning "Pas de dépôt Git détecté"
    fi
}

# Build et déploiement
deploy() {
    print_info "Déploiement de l'environnement: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        dev)
            print_info "Mode développement avec hot-reload"
            docker compose -f docker-compose.dev.yml down
            docker compose -f docker-compose.dev.yml up -d --build
            COMPOSE_FILE="docker-compose.dev.yml"
            ;;
        prod)
            print_info "Mode production"
            docker compose -f docker-compose.prod.yml down
            docker compose -f docker-compose.prod.yml up -d --build
            COMPOSE_FILE="docker-compose.prod.yml"
            ;;
        staging)
            print_info "Mode staging"
            docker compose down
            docker compose up -d --build
            COMPOSE_FILE="docker-compose.yml"
            ;;
        *)
            print_error "Environnement invalide: $ENVIRONMENT"
            print_info "Usage: ./deploy.sh [dev|prod|staging]"
            exit 1
            ;;
    esac
    
    print_success "Déploiement terminé"
}

# Vérifier la santé des services
health_check() {
    print_info "Vérification de la santé des services..."
    sleep 5
    
    # Vérifier si les conteneurs sont en cours d'exécution
    if docker ps | grep -q maisonluxe-app; then
        print_success "Application démarrée"
    else
        print_error "L'application n'a pas démarré"
        show_logs
        exit 1
    fi
    
    # Vérifier si MongoDB est sain
    if docker ps | grep -q "maisonluxe-mongodb.*healthy"; then
        print_success "MongoDB est sain"
    else
        print_warning "MongoDB n'est pas encore prêt..."
    fi
    
    # Tester l'accès HTTP
    print_info "Test de l'accès HTTP..."
    sleep 3
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "L'application répond sur http://localhost:3000"
    else
        print_warning "L'application ne répond pas encore"
    fi
}

# Afficher les logs
show_logs() {
    print_info "Derniers logs de l'application:"
    echo ""
    case $ENVIRONMENT in
        dev)
            docker compose -f docker-compose.dev.yml logs --tail=20 app
            ;;
        prod)
            docker compose -f docker-compose.prod.yml logs --tail=20 app
            ;;
        *)
            docker compose logs --tail=20 app
            ;;
    esac
}

# Nettoyage des ressources Docker
cleanup() {
    print_info "Nettoyage des ressources inutilisées..."
    docker system prune -f > /dev/null 2>&1
    print_success "Nettoyage terminé"
}

# Afficher les informations de déploiement
show_deployment_info() {
    print_header "🎉 DÉPLOIEMENT RÉUSSI"
    
    echo -e "${GREEN}Environnement:${NC} $ENVIRONMENT"
    echo -e "${GREEN}URL:${NC} http://localhost:3000"
    echo ""
    echo -e "${YELLOW}Commandes utiles:${NC}"
    echo -e "  ${BLUE}make logs${NC}        - Voir les logs en temps réel"
    echo -e "  ${BLUE}make ps${NC}           - Statut des conteneurs"
    echo -e "  ${BLUE}make shell${NC}        - Ouvrir un shell dans l'app"
    echo -e "  ${BLUE}make down${NC}         - Arrêter tous les services"
    echo -e "  ${BLUE}make db-backup${NC}    - Créer un backup de la DB"
    echo ""
    
    if [ -d "$BACKUP_DIR" ]; then
        echo -e "${GREEN}Backup créé:${NC} $BACKUP_DIR"
        echo ""
    fi
}

# ===============================================
# MAIN
# ===============================================

main() {
    print_header "🚀 DÉPLOIEMENT MAISONLUXE - $ENVIRONMENT"
    
    # 1. Vérifications préalables
    check_docker
    check_docker_compose
    check_env_file
    
    # 2. Backup (seulement en prod)
    if [ "$ENVIRONMENT" = "prod" ]; then
        backup_database
    fi
    
    # 3. Pull du code (optionnel)
    if [ "${SKIP_GIT_PULL:-false}" != "true" ]; then
        git_pull
    fi
    
    # 4. Déploiement
    deploy
    
    # 5. Vérifications post-déploiement
    health_check
    
    # 6. Nettoyage
    cleanup
    
    # 7. Affichage des informations
    show_deployment_info
    
    # 8. Afficher les logs récents
    if [ "${SHOW_LOGS:-true}" = "true" ]; then
        show_logs
    fi
}

# Gestion des interruptions
trap 'print_error "Déploiement interrompu"; exit 1' INT TERM

# Exécution
main

exit 0
