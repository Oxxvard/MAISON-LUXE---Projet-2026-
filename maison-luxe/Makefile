# ===============================================
# Makefile - Commandes Docker simplifiées
# ===============================================
# Usage: make <commande>
# ===============================================

.PHONY: help dev prod build up down logs restart clean test

# Couleurs pour l'affichage
YELLOW := \033[1;33m
GREEN := \033[1;32m
RED := \033[1;31m
RESET := \033[0m

# Par défaut : afficher l'aide
.DEFAULT_GOAL := help

help: ## 📋 Afficher cette aide
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@echo "$(GREEN)  🚀 MaisonLuxe - Commandes Docker                         $(RESET)"
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"

# ===============================================
# 💻 DÉVELOPPEMENT
# ===============================================

dev: ## 💻 Démarrer en mode développement (hot-reload)
	@echo "$(GREEN)🚀 Démarrage en mode développement...$(RESET)"
	docker compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✅ Application disponible sur http://localhost:3000$(RESET)"

dev-build: ## 🔨 Build et démarrer en mode dev
	@echo "$(GREEN)🔨 Build de l'image de développement...$(RESET)"
	docker compose -f docker-compose.dev.yml up -d --build
	@echo "$(GREEN)✅ Application disponible sur http://localhost:3000$(RESET)"

dev-logs: ## 📜 Voir les logs en mode dev
	docker compose -f docker-compose.dev.yml logs -f app

dev-down: ## 🛑 Arrêter le mode développement
	@echo "$(YELLOW)🛑 Arrêt du mode développement...$(RESET)"
	docker compose -f docker-compose.dev.yml down

# ===============================================
# 🚀 PRODUCTION
# ===============================================

prod: ## 🚀 Démarrer en mode production
	@echo "$(GREEN)🚀 Démarrage en mode production...$(RESET)"
	docker compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✅ Application en production sur http://localhost:3000$(RESET)"

prod-build: ## 🔨 Build et démarrer en mode production
	@echo "$(GREEN)🔨 Build de l'image de production...$(RESET)"
	docker compose -f docker-compose.prod.yml up -d --build
	@echo "$(GREEN)✅ Application en production sur http://localhost:3000$(RESET)"

prod-logs: ## 📜 Voir les logs en mode production
	docker compose -f docker-compose.prod.yml logs -f app

prod-down: ## 🛑 Arrêter le mode production
	@echo "$(YELLOW)🛑 Arrêt du mode production...$(RESET)"
	docker compose -f docker-compose.prod.yml down

# ===============================================
# 🛠️ COMMANDES GÉNÉRALES
# ===============================================

build: ## 🔨 Build l'image Docker (mode par défaut)
	@echo "$(GREEN)🔨 Build de l'image Docker...$(RESET)"
	docker compose build

up: ## ▶️ Démarrer tous les services
	@echo "$(GREEN)▶️ Démarrage des services...$(RESET)"
	docker compose up -d

down: ## ⏹️ Arrêter tous les services
	@echo "$(YELLOW)⏹️ Arrêt des services...$(RESET)"
	docker compose down

restart: ## 🔄 Redémarrer tous les services
	@echo "$(YELLOW)🔄 Redémarrage des services...$(RESET)"
	docker compose restart

logs: ## 📜 Afficher les logs de tous les services
	docker compose logs -f

logs-app: ## 📜 Logs de l'application uniquement
	docker compose logs -f app

logs-db: ## 📜 Logs de MongoDB uniquement
	docker compose logs -f mongodb

# ===============================================
# 🧹 NETTOYAGE
# ===============================================

clean: ## 🧹 Nettoyer les conteneurs et images
	@echo "$(YELLOW)🧹 Nettoyage des conteneurs arrêtés...$(RESET)"
	docker compose down
	docker system prune -f
	@echo "$(GREEN)✅ Nettoyage terminé$(RESET)"

clean-all: ## 🧹 Nettoyer TOUT (conteneurs, images, volumes)
	@echo "$(RED)⚠️  ATTENTION : Suppression de tous les conteneurs, images et volumes !$(RESET)"
	@read -p "Êtes-vous sûr ? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		docker system prune -af --volumes; \
		echo "$(GREEN)✅ Nettoyage complet terminé$(RESET)"; \
	else \
		echo "$(YELLOW)❌ Nettoyage annulé$(RESET)"; \
	fi

# ===============================================
# 🔍 INSPECTION
# ===============================================

ps: ## 📊 Afficher l'état des conteneurs
	@echo "$(GREEN)📊 État des conteneurs :$(RESET)"
	docker compose ps

stats: ## 📈 Afficher les statistiques des conteneurs
	docker stats --no-stream

inspect: ## 🔍 Inspecter tous les services
	@echo "$(GREEN)🔍 Inspection des services...$(RESET)"
	@echo ""
	@echo "$(YELLOW)Conteneurs :$(RESET)"
	@docker compose ps
	@echo ""
	@echo "$(YELLOW)Volumes :$(RESET)"
	@docker volume ls | grep maison-luxe
	@echo ""
	@echo "$(YELLOW)Images :$(RESET)"
	@docker images | grep maison-luxe

# ===============================================
# 🐚 ACCÈS SHELL
# ===============================================

shell: ## 🐚 Ouvrir un shell dans le conteneur app
	@echo "$(GREEN)🐚 Ouverture du shell dans l'application...$(RESET)"
	docker exec -it maisonluxe-app sh

shell-db: ## 🗄️ Ouvrir mongosh dans MongoDB
	@echo "$(GREEN)🗄️ Ouverture de mongosh...$(RESET)"
	docker exec -it maisonluxe-mongodb mongosh -u admin -p admin123

# ===============================================
# 🧪 TESTS & VALIDATION
# ===============================================

test: ## 🧪 Lancer les tests Docker
	@echo "$(GREEN)🧪 Validation de la configuration Docker...$(RESET)"
	bash scripts/test-docker.sh

test-build: ## 🧪 Tester le build (sans démarrer)
	@echo "$(GREEN)🧪 Test du build Docker...$(RESET)"
	docker compose build --progress=plain

health: ## 🏥 Vérifier la santé des services
	@echo "$(GREEN)🏥 Vérification de la santé des services...$(RESET)"
	@docker inspect --format='{{.Name}}: {{.State.Health.Status}}' $$(docker ps -q) 2>/dev/null || echo "Aucun healthcheck configuré"

# ===============================================
# 💾 BASE DE DONNÉES
# ===============================================

db-backup: ## 💾 Backup de la base MongoDB
	@echo "$(GREEN)💾 Création du backup MongoDB...$(RESET)"
	mkdir -p backups
	docker exec maisonluxe-mongodb mongodump -u admin -p admin123 --db maisonluxe --out /tmp/backup
	docker cp maisonluxe-mongodb:/tmp/backup ./backups/backup-$$(date +%Y%m%d-%H%M%S)
	@echo "$(GREEN)✅ Backup créé dans ./backups/$(RESET)"

db-restore: ## ♻️ Restaurer la base MongoDB (spécifier BACKUP_DIR=path)
	@if [ -z "$(BACKUP_DIR)" ]; then \
		echo "$(RED)❌ Erreur : Spécifiez BACKUP_DIR=path/to/backup$(RESET)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)♻️ Restauration de la base depuis $(BACKUP_DIR)...$(RESET)"
	docker cp $(BACKUP_DIR) maisonluxe-mongodb:/tmp/restore
	docker exec maisonluxe-mongodb mongorestore -u admin -p admin123 --db maisonluxe /tmp/restore/maisonluxe
	@echo "$(GREEN)✅ Base restaurée$(RESET)"

db-reset: ## 🔄 Réinitialiser complètement la base
	@echo "$(RED)⚠️  ATTENTION : Suppression de toutes les données MongoDB !$(RESET)"
	@read -p "Êtes-vous sûr ? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		docker volume rm maison-luxe_mongodb_data 2>/dev/null || true; \
		docker compose up -d; \
		echo "$(GREEN)✅ Base réinitialisée$(RESET)"; \
	else \
		echo "$(YELLOW)❌ Réinitialisation annulée$(RESET)"; \
	fi

# ===============================================
# 🚀 DÉPLOIEMENT
# ===============================================

deploy-railway: ## 🚂 Déployer sur Railway
	@echo "$(GREEN)🚂 Déploiement sur Railway...$(RESET)"
	railway up

deploy-render: ## 🎨 Déployer sur Render (git push)
	@echo "$(GREEN)🎨 Push vers Render...$(RESET)"
	git push origin main
	@echo "$(YELLOW)→ Le déploiement se fait automatiquement sur Render$(RESET)"

# ===============================================
# 📦 GESTION DES IMAGES
# ===============================================

pull: ## 📦 Pull les dernières images
	@echo "$(GREEN)📦 Téléchargement des images...$(RESET)"
	docker compose pull

push: ## 📤 Push l'image vers un registry (nécessite REGISTRY_URL)
	@if [ -z "$(REGISTRY_URL)" ]; then \
		echo "$(RED)❌ Erreur : Spécifiez REGISTRY_URL=your-registry.com/image$(RESET)"; \
		exit 1; \
	fi
	docker tag maison-luxe-app $(REGISTRY_URL)
	docker push $(REGISTRY_URL)

# ===============================================
# 🔧 MAINTENANCE
# ===============================================

update: ## 🔄 Mettre à jour et redéployer
	@echo "$(GREEN)🔄 Mise à jour de l'application...$(RESET)"
	git pull origin main
	docker compose down
	docker compose up -d --build
	@echo "$(GREEN)✅ Mise à jour terminée$(RESET)"

prune: ## 🧹 Nettoyer les ressources Docker inutilisées
	@echo "$(YELLOW)🧹 Nettoyage des ressources inutilisées...$(RESET)"
	docker system prune -f
	@echo "$(GREEN)✅ Nettoyage terminé$(RESET)"
