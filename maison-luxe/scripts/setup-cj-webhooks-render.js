#!/usr/bin/env node
/**
 * Script de configuration des webhooks CJ Dropshipping pour Render
 * Étapes:
 * 1. Obtient un Access Token via /api2.0/v1/authentication/getAccessToken
 * 2. Utilise ce token pour configurer les webhooks via /api2.0/v1/webhook/set
 */

require('dotenv').config();
const https = require('https');

const CJ_API_KEY = process.env.CJ_API_KEY;
const RENDER_BASE_URL = 'https://maison-luxe.onrender.com';

console.log('🔧 Configuration des Webhooks CJ Dropshipping\n');
console.log('📍 Base URL:', RENDER_BASE_URL);
console.log('🔑 CJ_API_KEY:', CJ_API_KEY ? '✅ Configuré' : '❌ Manquant\n');

if (!CJ_API_KEY) {
  console.error('❌ Erreur: CJ_API_KEY manquant dans .env');
  process.exit(1);
}

// ÉTAPE 1: Obtenir un Access Token
console.log('📋 Step 1️⃣: Obtention du Access Token...\n');

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
        console.log('Response:', JSON.stringify(authResponse, null, 2));
        process.exit(1);
      }

      const accessToken = authResponse.data.accessToken;
      console.log('✅ Access Token obtenu!\n');
      console.log('Token:', accessToken.substring(0, 30) + '...\n');

      // ÉTAPE 2: Configurer les webhooks avec ce token
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

// ÉTAPE 2: Configurer les webhooks
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
