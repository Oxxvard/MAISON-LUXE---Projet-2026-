# CI/CD Pipeline - Maison Luxe

## 📋 Vue d'ensemble

Pipeline CI/CD complet avec **6 jobs** pour garantir la qualité du code à chaque push et pull request.

## 🔄 Workflow

### Déclencheurs
- **Push** sur `main`, `develop`, `chore/**`
- **Pull Request** vers `main`, `develop`

### Jobs

#### 1️⃣ Lint & Type Check
- ✅ ESLint pour la qualité du code
- ✅ TypeScript check (`tsc --noEmit`)
- **Durée** : ~30s

#### 2️⃣ Unit & Integration Tests (Jest)
- ✅ 79 tests Jest
- ✅ MongoDB service container
- ✅ Couverture de code (coverage)
- ✅ Upload vers Codecov
- **Durée** : ~1-2min

#### 3️⃣ Build Application
- ✅ Build Next.js production
- ✅ Upload sourcemaps vers Sentry (optionnel)
- ✅ Artifacts sauvegardés (7 jours)
- **Durée** : ~1-2min

#### 4️⃣ E2E Tests (Playwright)
- ✅ 30 tests E2E
- ✅ Chromium headless
- ✅ MongoDB service container
- ✅ Rapports HTML sauvegardés
- **Durée** : ~3-5min

#### 5️⃣ Security Audit
- ✅ `npm audit` pour vulnérabilités
- ✅ Échec si vulnérabilités critiques
- **Durée** : ~20s

#### 6️⃣ Summary
- ✅ Résumé visuel des résultats
- ✅ Liens vers artifacts
- ✅ Statistiques des tests

## 🎯 Total Durée Estimée

**~5-10 minutes** selon la charge GitHub Actions

## 📊 Artifacts Générés

### Jest Coverage Report
- **Nom** : `jest-coverage-report`
- **Contenu** : HTML coverage + lcov.info
- **Rétention** : 30 jours
- **Accès** : Actions → Run → Artifacts

### Playwright Report
- **Nom** : `playwright-report`
- **Contenu** : Rapport HTML interactif
- **Rétention** : 30 jours
- **Visualisation** : Dézipper et ouvrir `index.html`

### Next.js Build
- **Nom** : `nextjs-build`
- **Contenu** : Dossier `.next/`
- **Rétention** : 7 jours
- **Usage** : Déploiement ou debug

## 🔐 Secrets Requis

Configuration dans `Settings → Secrets and variables → Actions`

### Obligatoires
```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=...
```

### Optionnels (fonctionnalités avancées)
```env
# Sentry
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=...
SENTRY_PROJECT=...

# Codecov
CODECOV_TOKEN=...

# Stripe (si tests paiement)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🚀 Utilisation

### Visualiser les résultats

1. **Aller sur GitHub** : Repository → Actions
2. **Sélectionner run** : Dernier workflow exécuté
3. **Voir le summary** : Tableau de bord automatique
4. **Télécharger artifacts** : Coverage, Playwright reports

### Déboguer un échec

```bash
# 1. Identifier le job qui a échoué
# 2. Cliquer sur le job dans GitHub Actions
# 3. Consulter les logs

# Reproduire localement
npm test                    # Tests Jest
npm run test:e2e           # Tests Playwright
npm run lint               # ESLint
npx tsc --noEmit          # TypeScript
```

### Ignorer un check (temporaire)

```bash
# Dans le commit message
git commit -m "fix: urgent hotfix [skip ci]"
```

⚠️ **À éviter** : Contourne tous les tests

## 📈 Optimisations

### Cache NPM
- ✅ Activé via `cache: 'npm'`
- ✅ Accélère les installations

### Parallel Jobs
- ✅ Lint, Build, Security en parallèle
- ✅ Tests séquentiels (dépendances)

### Artifacts Compression
- ✅ Automatique par GitHub
- ✅ Upload/download rapide

## 🔧 Configuration Avancée

### Ajouter un job

```yaml
custom-job:
  name: Mon Job Personnalisé
  runs-on: ubuntu-latest
  needs: [lint]  # Optionnel : dépendance
  
  steps:
    - uses: actions/checkout@v4
    - name: Ma tâche
      run: echo "Hello World"
```

### Conditions d'exécution

```yaml
# Uniquement sur main
if: github.ref == 'refs/heads/main'

# Seulement si tests OK
if: success()

# Toujours exécuter (même si échec)
if: always()
```

### Variables d'environnement

```yaml
env:
  CUSTOM_VAR: value
  SECRET_VAR: ${{ secrets.MY_SECRET }}
```

## 📊 Badges de Statut

Ajouter au README.md :

```markdown
![CI/CD](https://github.com/Oxxvard/Ecommerceproject2026/actions/workflows/ci.yml/badge.svg)
```

Résultat : ![CI/CD](https://github.com/Oxxvard/Ecommerceproject2026/actions/workflows/ci.yml/badge.svg)

## 🐛 Troubleshooting

### Tests E2E échouent en CI
```bash
# Problème : Timeout du serveur Next.js
# Solution : Augmenter le timeout dans playwright.config.ts
webServer: {
  timeout: 180000,  # 3 minutes
}
```

### MongoDB connection failed
```bash
# Problème : Service MongoDB non démarré
# Solution : Vérifier health check dans ci.yml
```

### Out of memory
```bash
# Problème : Tests consomment trop de RAM
# Solution : Limiter workers
npm test -- --maxWorkers=2
```

### Artifacts trop volumineux
```bash
# Problème : Upload lent/échec
# Solution : Réduire rétention ou exclure fichiers
retention-days: 7  # Au lieu de 30
```

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright CI](https://playwright.dev/docs/ci)
- [Jest CI](https://jestjs.io/docs/cli#--ci)
- [Codecov](https://about.codecov.io/)

## 🎯 Prochaines Améliorations

- [ ] Deploy automatique sur Vercel (main)
- [ ] Preview deployments (PR)
- [ ] Notifications Slack/Discord
- [ ] Performance budgets (Lighthouse)
- [ ] Visual regression tests (Percy/Chromatic)
- [ ] Dependabot auto-merge

## ✅ Checklist Déploiement

Avant de merger une PR :

- [ ] ✅ Lint & Type Check passent
- [ ] ✅ Tous les tests Jest passent (79/79)
- [ ] ✅ Tous les tests E2E passent (30/30)
- [ ] ✅ Build réussit
- [ ] ✅ Pas de vulnérabilités critiques
- [ ] ✅ Coverage ≥ objectif (actuellement 20%, cible 80%)
- [ ] 📝 CHANGELOG mis à jour
- [ ] 📝 Documentation à jour

---

**Dernière mise à jour** : 2 janvier 2026  
**Statut** : ✅ Opérationnel  
**Total tests** : 109 (79 Jest + 30 Playwright)
