# 🗺️ FEUILLE DE ROUTE MAISON LUXE - 2025/2026

**Date de mise à jour :** 19 décembre 2025

---

## ✅ Ce qui a été fait jusqu'à présent

- Correction de toutes les erreurs TypeScript/ESLint bloquantes (build OK)
- Correction des erreurs de typage liées à Mongoose (populated fields)
- Correction des variables de catch non conformes
- Remplacement progressif des types `any` par des types explicites dans les composants critiques
- Ajout d'un logger central minimal (`src/lib/logger.ts`)
- Remplacement de `console.error` par `logger.error` dans les routes produits et commandes
- Mise à jour de la todo list pour la centralisation du logging et l'intégration Sentry
- Application de la validation Zod sur les routes critiques (produits, commandes, coupons)
- Sécurisation des routes critiques avec un middleware d'authentification
- Vérification de la signature Stripe webhook
- Validation des variables d'environnement au démarrage
- Configuration du rate limiting sur les endpoints sensibles
- Documentation d'audit complète (voir historique)

---

## 🟡 Ce qu'il reste à faire (priorités et tâches)

### Sécurité & Stabilité (PHASE 1-2)
- [x] Appliquer le middleware d'auth sur toutes les routes admin et GET sensibles
- [x] Implémenter des wrappers withAuth/withAdminAuth
- [ ] Tester la protection sur toutes les routes critiques (in progress — tests automatisés à ajouter)
- [x] Étendre la validation Zod à toutes les routes API (routes critiques couvertes)
- [x] Standardiser la gestion des erreurs (structure, codes)
- [x] Intégrer Sentry pour le suivi des erreurs (server + client)
- [x] Centraliser le logging (Pino)
- [x] Logger les événements importants (imports CJ, paiements, etc.) — instrumentation complète; schéma d'événements normalisé et appliqué

### Paiement & Webhooks
- [ ] Vérifier la signature Stripe avec la clé secrète (tests réels)
- [ ] Gérer tous les états de paiement (succès, échec, retry)
- [ ] Sécuriser et valider tous les webhooks CJ
- [ ] Implémenter l'idempotence et l'historique des webhooks

### Qualité & Tests
- [ ] Ajouter des tests unitaires (Jest)
- [ ] Ajouter des tests d'intégration (supertest)
- [ ] Ajouter des tests E2E (Playwright)
- [ ] Mettre en place CI/CD (GitHub Actions)
- [ ] Couverture de code >80%

### Fonctionnalités manquantes (PHASE 3-4)
- [ ] Dashboard admin avancé (analytics, exports, gestion users)
- [ ] Gestion utilisateur complète (reset password, 2FA, OAuth, RGPD)
- [ ] Système de retours/RMA
- [ ] Email marketing, notifications, favoris avancés
- [ ] Blog, FAQ, pages légales
- [ ] Intégrations (autres gateways, CRM, analytics avancées)

### Performance & Monitoring (PHASE 5+)
- [ ] Optimisation des requêtes DB (index, lean, select)
- [ ] Bundle analysis, Lighthouse CI
- [ ] Monitoring uptime, dashboards, alertes
- [ ] CDN, backups, disaster recovery
- [ ] RGPD/CCPA compliance, cookie banner

---

## 📋 Checklist pré-production (rappel)
- [ ] Sécurité : secrets, headers, HTTPS, CORS, rate limiting, validation, XSS, CSRF, webhooks
- [ ] Performance : Lighthouse >90, FCP <1.5s, DB optimisée, images, bundle <100KB
- [ ] Fonctionnalités : inscription, login, panier, checkout, paiement, emails, admin, produits
- [ ] Données : MongoDB Atlas, backups, indexes, RGPD
- [ ] Monitoring : Sentry, uptime, alertes, logs, analytics

---

## 📝 Historique des modifications récentes
- 17/12/2025 : Ajout logger central, remplacement console.error, todo logging/Sentry
- 18/12/2025 : Correction build, typages, audit mis à jour, début de nettoyage warnings

---

**Document généré automatiquement à partir de l'audit complet et des actions réalisées.**

Pour toute nouvelle tâche ou modification, mettre à jour ce fichier en priorité.
