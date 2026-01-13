#!/usr/bin/env node

/**
 * Script pour tester les filtres avancés
 * Usage: node scripts/test-filters.js
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testFilters() {
  console.log('🧪 Test des filtres avancés\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const tests = [
    {
      name: 'Tous les produits',
      url: '/api/products',
      validate: (data) => Array.isArray(data)
    },
    {
      name: 'Filtre prix minimum (100€)',
      url: '/api/products?minPrice=100',
      validate: (data) => data.every(p => p.price >= 100)
    },
    {
      name: 'Filtre prix maximum (500€)',
      url: '/api/products?maxPrice=500',
      validate: (data) => data.every(p => p.price <= 500)
    },
    {
      name: 'Filtre prix range (100€ - 500€)',
      url: '/api/products?minPrice=100&maxPrice=500',
      validate: (data) => data.every(p => p.price >= 100 && p.price <= 500)
    },
    {
      name: 'Filtre notes minimum (3 étoiles)',
      url: '/api/products?minRating=3',
      validate: (data) => data.every(p => (p.rating || 0) >= 3)
    },
    {
      name: 'Filtre notes minimum (4 étoiles)',
      url: '/api/products?minRating=4',
      validate: (data) => data.every(p => (p.rating || 0) >= 4)
    },
    {
      name: 'Filtre stock disponible',
      url: '/api/products?inStock=true',
      validate: (data) => data.every(p => p.stock > 0)
    },
    {
      name: 'Tri prix croissant',
      url: '/api/products?sort=price',
      validate: (data) => {
        for (let i = 1; i < data.length; i++) {
          if (data[i].price < data[i-1].price) return false;
        }
        return true;
      }
    },
    {
      name: 'Tri prix décroissant',
      url: '/api/products?sort=-price',
      validate: (data) => {
        for (let i = 1; i < data.length; i++) {
          if (data[i].price > data[i-1].price) return false;
        }
        return true;
      }
    },
    {
      name: 'Filtres combinés (prix + notes + stock)',
      url: '/api/products?minPrice=100&maxPrice=500&minRating=3&inStock=true',
      validate: (data) => data.every(p => 
        p.price >= 100 && 
        p.price <= 500 && 
        (p.rating || 0) >= 3 && 
        p.stock > 0
      )
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const res = await fetch(`${BASE_URL}${test.url}`);
      const data = await res.json();

      if (!res.ok) {
        console.log(`❌ ${test.name}`);
        console.log(`   Status: ${res.status}`);
        console.log(`   Error: ${data.error || data.message}\n`);
        failed++;
        continue;
      }

      const isValid = test.validate(data);
      
      if (isValid) {
        console.log(`✅ ${test.name}`);
        console.log(`   Résultats: ${data.length} produit(s)\n`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   Validation échouée`);
        console.log(`   Résultats: ${data.length} produit(s)\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Erreur: ${error.message}\n`);
      failed++;
    }
  }

  console.log('━'.repeat(50));
  console.log(`\n📊 Résultats: ${passed}/${tests.length} tests réussis`);
  if (failed > 0) {
    console.log(`⚠️  ${failed} test(s) échoué(s)\n`);
    process.exit(1);
  } else {
    console.log('🎉 Tous les tests sont passés !\n');
  }
}

// Attendre que le serveur soit prêt
setTimeout(() => {
  testFilters().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}, 1000);
