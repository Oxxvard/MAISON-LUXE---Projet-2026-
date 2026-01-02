# Configuration des Secrets GitHub

## 🔐 Secrets Requis pour CI/CD

Pour que le pipeline CI/CD fonctionne correctement, vous devez configurer les secrets suivants dans GitHub.

### 📍 Où configurer les secrets ?

1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Secrets and variables** → **Actions**
4. Cliquez sur **New repository secret**

---

## ✅ Secrets Obligatoires

### MONGODB_URI
**Description** : URI de connexion MongoDB Atlas  
**Format** : `mongodb+srv://username:password@cluster.mongodb.net/database`

**Comment l'obtenir :**
1. Connectez-vous à [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sélectionnez votre cluster
3. Cliquez sur **Connect** → **Connect your application**
4. Copiez la chaîne de connexion
5. Remplacez `<password>` par votre mot de passe

**Exemple :**
```
mongodb+srv://maisonluxe:MonMotDePasse123@cluster0.abc123.mongodb.net/maisonluxe?retryWrites=true&w=majority
```

---

### NEXTAUTH_SECRET
**Description** : Secret pour signer les tokens NextAuth  
**Format** : Chaîne aléatoire de 32+ caractères

**Comment le générer :**

**Option 1 - OpenSSL (recommandé):**
```bash
openssl rand -base64 32
```

**Option 2 - Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Exemple de résultat :**
```
a8f3d9e2b1c7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2
```

⚠️ **Important** : Ne partagez JAMAIS ce secret publiquement !

---

## 🔧 Secrets Optionnels (mais recommandés)

### SENTRY_AUTH_TOKEN
**Description** : Token pour upload des sourcemaps vers Sentry  
**Requis pour** : Monitoring des erreurs en production

**Comment l'obtenir :**
1. Connectez-vous à [Sentry](https://sentry.io/)
2. Settings → Account → API → Auth Tokens
3. Create New Token
4. Permissions : `project:releases` et `project:write`
5. Copiez le token

---

### SENTRY_ORG
**Description** : Nom de votre organisation Sentry  
**Format** : Slug de l'organisation (visible dans l'URL)

**Exemple :**
```
maison-luxe
```

---

### SENTRY_PROJECT
**Description** : Nom de votre projet Sentry  
**Format** : Slug du projet

**Exemple :**
```
maison-luxe-ecommerce
```

---

### CODECOV_TOKEN
**Description** : Token pour upload de la couverture de code  
**Requis pour** : Rapports de couverture publics

**Comment l'obtenir :**
1. Connectez-vous à [Codecov](https://codecov.io/)
2. Ajoutez votre repository
3. Copiez le token fourni

---

## 📋 Checklist de Configuration

### Étape 1 : Secrets obligatoires
- [ ] `MONGODB_URI` ajouté
- [ ] `NEXTAUTH_SECRET` généré et ajouté
- [ ] Secrets testés (voir section Tests ci-dessous)

### Étape 2 : Secrets optionnels (si applicable)
- [ ] `SENTRY_AUTH_TOKEN` ajouté (si Sentry utilisé)
- [ ] `SENTRY_ORG` ajouté (si Sentry utilisé)
- [ ] `SENTRY_PROJECT` ajouté (si Sentry utilisé)
- [ ] `CODECOV_TOKEN` ajouté (si coverage publique souhaitée)

### Étape 3 : Vérification
- [ ] Tous les secrets sont dans GitHub Secrets
- [ ] Aucun secret dans le code ou .env committé
- [ ] Premier push déclenche le workflow
- [ ] Workflow passe avec succès

---

## 🧪 Tester les Secrets Localement

Avant de les ajouter à GitHub, testez-les en local :

```bash
# 1. Créer un .env.test
cat > .env.test << EOF
MONGODB_URI=votre_uri_mongodb
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret
EOF

# 2. Charger et tester
export $(cat .env.test | xargs)
npm test

# 3. Si ça fonctionne, ajouter à GitHub Secrets
```

---

## ⚠️ Sécurité

### ✅ À FAIRE
- ✅ Utiliser des secrets différents pour dev/staging/prod
- ✅ Régénérer NEXTAUTH_SECRET tous les 6 mois
- ✅ Limiter les permissions des tokens (principe du moindre privilège)
- ✅ Activer l'authentification 2FA sur MongoDB Atlas et Sentry

### ❌ À NE JAMAIS FAIRE
- ❌ Committer des secrets dans le code
- ❌ Partager des secrets par email/chat
- ❌ Utiliser le même NEXTAUTH_SECRET en dev et prod
- ❌ Logger les valeurs des secrets

---

## 🔍 Vérifier que les Secrets Fonctionnent

Après avoir ajouté les secrets, faites un push pour déclencher le workflow :

```bash
git add .
git commit -m "test: verify CI/CD secrets configuration"
git push
```

Puis :
1. Allez sur **Actions** dans GitHub
2. Regardez le workflow en cours
3. Si **vert** ✅ : Secrets OK
4. Si **rouge** ❌ : Vérifiez les logs

### Logs courants en cas d'erreur

**Erreur MongoDB :**
```
MongooseServerSelectionError: Could not connect to any servers
```
→ Vérifiez MONGODB_URI (whitelist IP dans Atlas)

**Erreur NextAuth :**
```
No secret provided
```
→ Vérifiez NEXTAUTH_SECRET

**Erreur Sentry :**
```
Invalid Sentry token
```
→ Vérifiez SENTRY_AUTH_TOKEN et permissions

---

## 📚 Ressources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [MongoDB Atlas IP Whitelist](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options#environment-variables)
- [Sentry Auth Tokens](https://docs.sentry.io/product/accounts/auth-tokens/)

---

## 💡 Astuce : Script de Génération

Créez un script pour générer tous les secrets :

```bash
#!/bin/bash
# generate-secrets.sh

echo "=== Générateur de Secrets CI/CD ==="
echo ""

echo "NEXTAUTH_SECRET:"
openssl rand -base64 32
echo ""

echo "Copiez les secrets ci-dessus et ajoutez-les dans:"
echo "GitHub → Settings → Secrets and variables → Actions"
echo ""
echo "N'oubliez pas d'ajouter MONGODB_URI manuellement !"
```

Usage :
```bash
chmod +x generate-secrets.sh
./generate-secrets.sh
```

---

**Dernière mise à jour** : 2 janvier 2026  
**Statut** : Guide complet pour configuration CI/CD
