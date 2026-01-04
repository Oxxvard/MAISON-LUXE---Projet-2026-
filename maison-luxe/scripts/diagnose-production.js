#!/usr/bin/env node

/**
 * Script de diagnostic pour identifier les problèmes en production
 * Usage: node scripts/diagnose-production.js
 */

require('dotenv').config();

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'RESEND_API_KEY',
];

const OPTIONAL_ENV_VARS = [
  'CJ_API_KEY',
  'CJ_API_SECRET',
  'CJ_API_URL',
  'SENTRY_DSN',
];

console.log('🔍 Diagnostic de la configuration de production\n');

// 1. Vérifier les variables d'environnement requises
console.log('1️⃣  Variables d\'environnement REQUISES:');
let missingRequired = [];
REQUIRED_ENV_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`   ❌ ${varName}: MANQUANTE`);
    missingRequired.push(varName);
  } else {
    const masked = varName.includes('SECRET') || varName.includes('KEY') 
      ? `${value.substring(0, 8)}...` 
      : value.length > 50 
        ? `${value.substring(0, 30)}...`
        : value;
    console.log(`   ✅ ${varName}: ${masked}`);
  }
});

// 2. Vérifier les variables optionnelles
console.log('\n2️⃣  Variables d\'environnement OPTIONNELLES:');
let missingOptional = [];
OPTIONAL_ENV_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`   ⚠️  ${varName}: Non définie`);
    missingOptional.push(varName);
  } else {
    const masked = varName.includes('SECRET') || varName.includes('KEY') 
      ? `${value.substring(0, 8)}...` 
      : value;
    console.log(`   ✅ ${varName}: ${masked}`);
  }
});

// 3. Test de connexion MongoDB
console.log('\n3️⃣  Test de connexion MongoDB:');
(async () => {
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ Connexion MongoDB réussie');
    await mongoose.connection.close();
  } catch (error) {
    console.log(`   ❌ Erreur MongoDB: ${error.message}`);
  }

  // 4. Test de l'API CJ
  if (process.env.CJ_API_KEY) {
    console.log('\n4️⃣  Test de l\'authentification CJ:');
    try {
      const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: process.env.CJ_API_KEY,
        }),
      });

      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        console.log('   ✅ Authentification CJ réussie');
        console.log(`   📝 Token obtenu: ${data.data.accessToken.substring(0, 15)}...`);
      } else {
        console.log(`   ❌ Authentification CJ échouée: ${data.message || 'Erreur inconnue'}`);
        console.log(`   📝 Code: ${data.code}`);
        console.log(`   📝 Réponse complète:`, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log(`   ❌ Erreur lors du test CJ: ${error.message}`);
    }
  } else {
    console.log('\n4️⃣  Test de l\'authentification CJ:');
    console.log('   ⚠️  CJ_API_KEY non définie - test ignoré');
  }

  // 5. Test de l'API Stripe
  console.log('\n5️⃣  Test de l\'API Stripe:');
  try {
    const response = await fetch('https://api.stripe.com/v1/customers?limit=1', {
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
    });

    if (response.ok) {
      console.log('   ✅ Authentification Stripe réussie');
    } else {
      const error = await response.text();
      console.log(`   ❌ Authentification Stripe échouée: ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur lors du test Stripe: ${error.message}`);
  }

  // 6. Vérifier le fichier de cache CJ
  console.log('\n6️⃣  Cache de token CJ:');
  const fs = require('fs');
  const path = require('path');
  const cacheFile = path.join(process.cwd(), 'tmp', 'cj-token.json');
  
  try {
    if (fs.existsSync(cacheFile)) {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      const expiresIn = Math.round((cache.expiry - Date.now()) / 1000 / 60);
      
      if (expiresIn > 0) {
        console.log(`   ✅ Cache valide (expire dans ${expiresIn} minutes)`);
      } else {
        console.log(`   ⚠️  Cache expiré (depuis ${Math.abs(expiresIn)} minutes)`);
      }
    } else {
      console.log('   ℹ️  Aucun fichier de cache trouvé');
    }
  } catch (error) {
    console.log(`   ⚠️  Erreur lecture cache: ${error.message}`);
  }

  // 7. Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DU DIAGNOSTIC\n');
  
  if (missingRequired.length > 0) {
    console.log('❌ PROBLÈME CRITIQUE:');
    console.log(`   Variables requises manquantes: ${missingRequired.join(', ')}`);
    console.log('   → L\'application ne peut pas fonctionner correctement\n');
  }
  
  if (missingOptional.length > 0) {
    console.log('⚠️  AVERTISSEMENT:');
    console.log(`   Variables optionnelles manquantes: ${missingOptional.join(', ')}`);
    console.log('   → Certaines fonctionnalités peuvent ne pas être disponibles\n');
  }
  
  if (missingRequired.length === 0 && missingOptional.length === 0) {
    console.log('✅ Toutes les variables d\'environnement sont configurées!\n');
  }

  console.log('💡 RECOMMANDATIONS:');
  
  if (!process.env.CJ_API_KEY) {
    console.log('   • Configurer CJ_API_KEY pour activer le dropshipping');
  }
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('   • Définir NODE_ENV=production pour la production');
  }
  
  console.log('   • Vérifier que ces variables sont aussi définies sur Vercel');
  console.log('   • Utiliser "vercel env pull" pour synchroniser les variables');
  
  console.log('\n' + '='.repeat(60));
  
  process.exit(missingRequired.length > 0 ? 1 : 0);
})();
