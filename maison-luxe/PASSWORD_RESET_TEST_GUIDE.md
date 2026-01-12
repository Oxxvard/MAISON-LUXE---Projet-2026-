# 🧪 Guide de test - Password Reset

## Prérequis
- Serveur Next.js démarré : `npm run dev`
- MongoDB connecté (Atlas ou local)
- Un compte utilisateur existant

## Test 1 : Via l'interface utilisateur

### Étape 1 : Demander un reset
1. Ouvrez http://localhost:3000/auth/signin
2. Cliquez sur le lien **"Mot de passe oublié ?"** sous le champ mot de passe
3. Entrez votre email (ex: admin@maisonluxe.com)
4. Cliquez sur **"Envoyer le lien de réinitialisation"**
5. Vous devriez voir un message de confirmation

### Étape 2 : Récupérer le lien de reset

**En mode développement** (pas d'email Resend configuré):
- Ouvrez la console du terminal où tourne `npm run dev`
- Cherchez le lien qui commence par `http://localhost:3000/auth/reset-password/`
- Il ressemble à : `http://localhost:3000/auth/reset-password/abc123def456...`

**En mode production** (avec Resend configuré):
- Vérifiez votre boîte email
- Ouvrez l'email de Maison Luxe
- Cliquez sur le bouton "Réinitialiser mon mot de passe"

### Étape 3 : Définir un nouveau mot de passe
1. Ouvrez le lien de reset (depuis la console ou l'email)
2. Vous arrivez sur `/auth/reset-password/[token]`
3. Entrez un nouveau mot de passe **fort** :
   - ✅ Au moins 8 caractères
   - ✅ Une majuscule
   - ✅ Une minuscule
   - ✅ Un chiffre
   - ✅ Un caractère spécial
   - Exemple: `MonNouveauPass123!`
4. Confirmez le mot de passe (même valeur)
5. Cliquez sur **"Réinitialiser le mot de passe"**
6. Vous êtes redirigé vers `/auth/signin`

### Étape 4 : Se connecter avec le nouveau mot de passe
1. Sur la page de connexion
2. Entrez votre email
3. Entrez le **nouveau** mot de passe
4. Cliquez sur "Se connecter"
5. ✅ Vous devriez être connecté avec succès

## Test 2 : Via le script automatique

```bash
# Test avec l'email par défaut (admin@maisonluxe.com)
node scripts/test-password-reset-api.js

# Test avec un email spécifique
node scripts/test-password-reset-api.js votre@email.com
```

Ce script va :
1. ✅ Envoyer une demande de reset à l'API
2. ✅ Récupérer le token de reset (mode dev)
3. ✅ Tester la réinitialisation du mot de passe
4. ✅ Afficher les résultats dans la console

## Cas de test à vérifier

### ✅ Cas valides
- [ ] Email existant → message de succès
- [ ] Token valide + mot de passe fort → succès
- [ ] Connexion avec nouveau mot de passe → succès

### ⚠️ Cas d'erreur attendus
- [ ] Email inexistant → **même message** de succès (sécurité anti-énumération)
- [ ] Token invalide → erreur "Token invalide ou expiré"
- [ ] Token expiré (après 1h) → erreur "Token invalide ou expiré"
- [ ] Token déjà utilisé → erreur "Token invalide ou expiré"
- [ ] Mot de passe faible → erreur de validation
- [ ] Réutiliser l'ancien mot de passe → erreur "Nouveau mot de passe identique à l'ancien"

### 🔒 Tests de sécurité
- [ ] Token est hashé en base de données (vérifier MongoDB)
- [ ] Token expire après 1 heure
- [ ] Token ne peut être utilisé qu'une fois
- [ ] Pas de différence de réponse entre email existant/inexistant

## Vérification en base de données

### Voir les tokens de reset créés
```javascript
// Dans MongoDB Atlas ou Compass
db.passwordresets.find({}).sort({createdAt: -1}).limit(5)
```

Vous devriez voir:
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  token: "a7f3b2e1...", // Token HASHÉ (SHA256)
  expiresAt: ISODate("2025-01-15T15:30:00Z"),
  used: false,
  createdAt: ISODate("2025-01-15T14:30:00Z")
}
```

### Vérifier que le mot de passe a changé
```javascript
// Le hash bcrypt du mot de passe devrait être différent
db.users.findOne({email: "admin@maisonluxe.com"}, {password: 1})
```

## Scénarios avancés

### Test d'expiration
1. Créer un token
2. Modifier manuellement `expiresAt` dans MongoDB pour être dans le passé
3. Essayer d'utiliser le token → devrait échouer

### Test de réutilisation
1. Utiliser un token avec succès
2. Essayer de réutiliser le même token → devrait échouer (`used: true`)

### Test de nettoyage TTL
1. Créer un token
2. Attendre que `expiresAt` soit passé
3. Attendre quelques minutes (MongoDB TTL s'exécute toutes les 60 secondes)
4. Vérifier que le document a été supprimé automatiquement

## Troubleshooting

### ❌ "Cannot connect to server"
→ Le serveur Next.js n'est pas démarré. Lancez `npm run dev`

### ❌ "Token invalide" immédiatement
→ Vérifiez que vous utilisez le bon token (celui de la console/email)

### ❌ "Le lien ne s'affiche pas dans la console"
→ Vérifiez que `NODE_ENV !== 'production'` ou regardez les logs Sentry

### ❌ "Email non reçu"
→ En dev sans Resend configuré, c'est normal. Utilisez le lien de la console.
→ En prod, vérifiez `RESEND_API_KEY` dans `.env`

### ❌ "Validation password échoue"
→ Assurez-vous que le mot de passe contient :
   - Au moins 8 caractères
   - 1 majuscule (A-Z)
   - 1 minuscule (a-z)
   - 1 chiffre (0-9)
   - 1 caractère spécial (!@#$%^&*...)

## Résultat attendu

✅ **Fonctionnalité complète et sécurisée** :
- Flow utilisateur fluide
- Validation en temps réel
- Messages clairs
- Sécurité renforcée
- Nettoyage automatique

🎉 **Prêt pour la production** (après avoir configuré Resend) !
