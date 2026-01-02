# 🚀 GUIDE DÉMARRAGE RAPIDE - MAISON LUXE PRODUCTION

## ✅ STATUT ACTUEL
- **Site live :** https://maison-luxe-five.vercel.app
- **Compte admin :** florianvial0@gmail.com (configuré)
- **CJ Dropshipping :** Connexion validée ✅
- **MongoDB :** Production connectée ✅

## 🎯 PROCHAINES ÉTAPES (15-30 min)

### 1. Connexion Admin (2 min)
1. Aller sur : https://maison-luxe-five.vercel.app/auth/signin
2. Email : `florianvial0@gmail.com` 
3. Mot de passe : [votre mot de passe admin]
4. Une fois connecté → Aller au Dashboard admin

### 2. Import Premiers Produits CJ (15 min)
1. **Accéder CJ Import :** https://maison-luxe-five.vercel.app/admin/cj-import
2. **Sélectionner catégorie :** "Montres" ou "Bijoux"  
3. **Rechercher produits :** 
   - Mots-clés suggérés : "luxury watch", "gold bracelet", "pearl necklace"
   - Le système recherche automatiquement sur CJ
4. **Importer 5-10 produits :**
   - Laisser prix automatique (× 1.7) ou personnaliser
   - Cliquer "Importer" pour chaque produit intéressant

### 3. Vérification Import (5 min)  
1. **Gestion produits :** https://maison-luxe-five.vercel.app/admin/products
2. Vérifier que les produits sont bien importés
3. Vérifier images, descriptions, prix

### 4. Test Parcours Client (10 min)
1. **Navigation site :** https://maison-luxe-five.vercel.app
2. **Voir produits :** Catalogue → Produits importés visibles
3. **Test panier :** Ajouter au panier → Voir panier
4. **Test checkout :** Procéder commande (mode test Stripe)

## 🔧 Configuration Webhooks Stripe (Important)

**Si pas encore fait, configurer dans Stripe Dashboard :**
- **URL webhook :** `https://maison-luxe-five.vercel.app/api/webhook/stripe`
- **Events :** checkout.session.completed, payment_intent.succeeded
- **Nouveau secret → Mettre à jour sur Vercel**

## 📞 Support

**En cas de problème :**
- Vérifier logs Vercel : https://vercel.com/maison-luxe/maison-luxe
- Tester connexions : `node scripts/test-cj-connection.js`
- Admin issues : `node scripts/create-admin.js`

**Mots-clés CJ recommandés :**
- **Montres :** luxury watch, skeleton watch, automatic watch
- **Bijoux :** gold bracelet, diamond necklace, pearl earrings  
- **Sacs :** designer bag, leather handbag, luxury clutch
- **Lunettes :** sunglasses, polarized glasses, aviator

---
**Version :** Production 1.3.0  
**Dernière MAJ :** 2 janvier 2026  
**Site :** https://maison-luxe-five.vercel.app  