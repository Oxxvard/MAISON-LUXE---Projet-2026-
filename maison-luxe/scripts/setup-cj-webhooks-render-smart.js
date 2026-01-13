#!/usr/bin/env node
/**
 * Script de configuration des webhooks CJ Dropshipping - VERSION SMART
 * Évite le rate limit en utilisant le refresh token (valide 180 jours)
 * 
 * Flow:
 * 1. Essaie d'utiliser un refresh token sauvegardé
 * 2. Si absent/expiré, obtient un nouveau token via getAccessToken
 * 3. Sauvegarde le refresh token pour futures exécutions
 * 4. Configure les webhooks immédiatement
 */

require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

const CJ_API_KEY = process.env.CJ_API_KEY;
const RENDER_BASE_URL = 'https://maison-luxe.onrender.com';
const TOKEN_FILE = path.join(__dirname, '../.cj-tokens.json');

console.log('🔧 Configuration des Webhooks CJ Dropshipping - VERSION SMART\n');
console.log('📍 Base URL:', RENDER_BASE_URL);
console.log('🔑 CJ_API_KEY:', CJ_API_KEY ? '✅ Configuré' : '❌ Manquant\n');

if (!CJ_API_KEY) {
  console.error('❌ Erreur: CJ_API_KEY manquant dans .env');
  process.exit(1);
}

// Essayer de charger les tokens existants
let savedTokens = null;
if (fs.existsSync(TOKEN_FILE)) {
  try {
    savedTokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    console.log('📋 Tokens sauvegardés trouvés (refresh token valide 180 jours)\n');
  } catch (e) {
    console.log('⚠️ Fichier de tokens corrompu, on va en obtenir de nouveaux\n');
  }
}

if (savedTokens && savedTokens.refreshToken) {
  console.log('📋 Step 1️⃣: Utilisation du refresh token sauvegardé...\n');
  refreshAccessToken(savedTokens.refreshToken);
} else {
  console.log('📋 Step 1️⃣: Obtention d\'un nouveau Access Token...\n');
  getNewAccessToken();
}

// ============ OBTENIR UN NOUVEAU TOKEN ============
function getNewAccessToken() {
  const authPayload = JSON.stringify({
    apiKey: CJ_API_KEY
  });

  const authOptions = {
    hostname: 'developers.cjdropshipping.com',
    path: '/api2.0/v1/authentication/getAccessToken',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(authPayload)
    }
  };

  const authReq = https.request(authOptions, (authRes) => {
    let authData = '';

    authRes.on('data', (chunk) => {
      authData += chunk;
    });

    authRes.on('end', () => {
      try {
        const authResponse = JSON.parse(authData);

        if (authResponse.code !== 200 || !authResponse.data || !authResponse.data.accessToken) {
          console.log('❌ Erreur lors de l\'obtention du token:');
          console.log('Code:', authResponse.code);
          console.log('Message:', authResponse.message);
          process.exit(1);
        }

        const accessToken = authResponse.data.accessToken;
        const refreshToken = authResponse.data.refreshToken;

        console.log('✅ Access Token obtenu!\n');

        // Sauvegarder les tokens pour futures exécutions
        saveTokens(accessToken, refreshToken);

        // Configurer les webhooks
        configureWebhooks(accessToken);

      } catch (error) {
        console.error('❌ Erreur lors du parsing du token:');
        console.error(authData);
        process.exit(1);
      }
    });
  });

  authReq.on('error', (error) => {
    console.error('❌ Erreur de connexion lors de l\'obtention du token:');
    console.error(error.message);
    process.exit(1);
  });

  authReq.write(authPayload);
  authReq.end();
}

// ============ RAFRAÎCHIR LE TOKEN ============
function refreshAccessToken(refreshToken) {
  const refreshPayload = JSON.stringify({
    refreshToken: refreshToken
  });

  const refreshOptions = {
    hostname: 'developers.cjdropshipping.com',
    path: '/api2.0/v1/authentication/refreshAccessToken',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(refreshPayload)
    }
  };

  const refreshReq = https.request(refreshOptions, (refreshRes) => {
    let refreshData = '';

    refreshRes.on('data', (chunk) => {
      refreshData += chunk;
    });

    refreshRes.on('end', () => {
      try {
        const refreshResponse = JSON.parse(refreshData);

        if (refreshResponse.code === 200 && refreshResponse.data && refreshResponse.data.accessToken) {
          const accessToken = refreshResponse.data.accessToken;
          const newRefreshToken = refreshResponse.data.refreshToken;

          console.log('✅ Refresh Token utilisé avec succès!\n');

          // Sauvegarder les nouveaux tokens
          saveTokens(accessToken, newRefreshToken);

          // Configurer les webhooks
          configureWebhooks(accessToken);

        } else {
          console.log('⚠️ Refresh token expiré ou invalide, obtention d\'un nouveau token...\n');
          // Refresh token expiré, obtenir un nouveau
          getNewAccessToken();
        }

      } catch (error) {
        console.error('❌ Erreur lors du refresh:');
        console.error(refreshData);
        process.exit(1);
      }
    });
  });

  refreshReq.on('error', (error) => {
    console.error('❌ Erreur de connexion lors du refresh:');
    console.error(error.message);
    process.exit(1);
  });

  refreshReq.write(refreshPayload);
  refreshReq.end();
}

// ============ SAUVEGARDER LES TOKENS ============
function saveTokens(accessToken, refreshToken) {
  const tokens = {
    accessToken: accessToken,
    refreshToken: refreshToken,
    savedAt: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 jours
  };

  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    console.log('💾 Tokens sauvegardés dans', TOKEN_FILE);
    console.log('   Valide jusqu\'au:', tokens.expiryDate, '\n');
  } catch (error) {
    console.warn('⚠️ Impossible de sauvegarder les tokens:', error.message, '\n');
  }
}

// ============ CONFIGURER LES WEBHOOKS ============
function configureWebhooks(accessToken) {
  console.log('📋 Step 2️⃣: Configuration des webhooks...\n');

  const webhookPayload = {
    product: {
      type: 'ENABLE',
      callbackUrls: [
        `${RENDER_BASE_URL}/api/webhook/cj/product`
      ]
    },
    stock: {
      type: 'ENABLE',
      callbackUrls: [
        `${RENDER_BASE_URL}/api/webhook/cj/stock`
      ]
    },
    order: {
      type: 'ENABLE',
      callbackUrls: [
        `${RENDER_BASE_URL}/api/webhook/cj/order`
      ]
    },
    logistics: {
      type: 'ENABLE',
      callbackUrls: [
        `${RENDER_BASE_URL}/api/webhook/cj/logistics`
      ]
    }
  };

  console.log('Configuration à envoyer:');
  console.log(JSON.stringify(webhookPayload, null, 2));

  const webhookPayloadStr = JSON.stringify(webhookPayload);

  const webhookOptions = {
    hostname: 'developers.cjdropshipping.com',
    path: '/api2.0/v1/webhook/set',
    method: 'POST',
    headers: {
      'CJ-Access-Token': accessToken,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(webhookPayloadStr)
    }
  };

  console.log('\n📤 Envoi de la configuration des webhooks...\n');

  const webhookReq = https.request(webhookOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);

        if (response.code === 200 && response.result === true) {
          console.log('✅✅✅ SUCCESS! Webhooks configurés avec succès!\n');
          console.log('📌 Webhooks activés sur Render:');
          console.log('  • Product:', `${RENDER_BASE_URL}/api/webhook/cj/product`);
          console.log('  • Stock:', `${RENDER_BASE_URL}/api/webhook/cj/stock`);
          console.log('  • Order:', `${RENDER_BASE_URL}/api/webhook/cj/order`);
          console.log('  • Logistics:', `${RENDER_BASE_URL}/api/webhook/cj/logistics`);
          console.log('\n✨ CJ va maintenant envoyer les événements à ces URLs!');
          console.log('\n💡 Prochaine exécution: Utilisera le refresh token (pas de rate limit!)');
          process.exit(0);
        } else {
          console.log('❌ Erreur lors de la configuration des webhooks:');
          console.log('Code:', response.code);
          console.log('Message:', response.message);
          console.log('Details:', JSON.stringify(response, null, 2));
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Erreur lors du parsing de la réponse:');
        console.error(data);
        process.exit(1);
      }
    });
  });

  webhookReq.on('error', (error) => {
    console.error('❌ Erreur de connexion lors de la configuration:');
    console.error(error.message);
    process.exit(1);
  });

  webhookReq.write(webhookPayloadStr);
  webhookReq.end();
}
