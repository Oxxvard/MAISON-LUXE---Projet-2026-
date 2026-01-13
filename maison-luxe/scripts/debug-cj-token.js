#!/usr/bin/env node
/**
 * Debug script - Vérifie le format du token CJ
 */

require('dotenv').config();
const https = require('https');

const CJ_API_KEY = process.env.CJ_API_KEY;

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

console.log('🔍 Vérification du Token CJ...\n');

const authReq = https.request(authOptions, (authRes) => {
  let authData = '';

  authRes.on('data', (chunk) => {
    authData += chunk;
  });

  authRes.on('end', () => {
    try {
      const authResponse = JSON.parse(authData);
      console.log('Full Response:', JSON.stringify(authResponse, null, 2));
      
      if (authResponse.code === 200) {
        console.log('\n✅ Token obtenu avec succès!');
        console.log('Type of data:', typeof authResponse.data);
        console.log('Data value:', authResponse.data);
        
        if (typeof authResponse.data === 'object' && authResponse.data !== null) {
          console.log('Data keys:', Object.keys(authResponse.data));
        }
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
    }
  });
});

authReq.on('error', (error) => {
  console.error('Connection error:', error.message);
});

authReq.write(authPayload);
authReq.end();
