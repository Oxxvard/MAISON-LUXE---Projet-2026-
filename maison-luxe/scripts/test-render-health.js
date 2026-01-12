#!/usr/bin/env node
/**
 * Test le health check de Render
 */

const https = require('https');

const RENDER_URL = 'https://maison-luxe.onrender.com';

console.log('🔍 Testing Render deployment health...\n');

// Test 1: Homepage
console.log('📡 Test 1: Homepage GET /');
https.get(RENDER_URL, (res) => {
  console.log(`   Status: ${res.statusCode}`);
  console.log(`   Headers:`, res.headers);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('   ✅ Homepage OK');
    } else {
      console.log('   ❌ Homepage failed');
      console.log('   Response:', data.substring(0, 500));
    }
    
    // Test 2: Health endpoint
    testHealthEndpoint();
  });
}).on('error', (err) => {
  console.log('   ❌ Connection error:', err.message);
  process.exit(1);
});

function testHealthEndpoint() {
  console.log('\n📡 Test 2: Health endpoint GET /api/version');
  https.get(`${RENDER_URL}/api/version`, (res) => {
    console.log(`   Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('   ✅ Health check OK');
        console.log('   Response:', data);
      } else {
        console.log('   ❌ Health check failed');
        console.log('   Response:', data);
      }
    });
  }).on('error', (err) => {
    console.log('   ❌ Connection error:', err.message);
  });
}
