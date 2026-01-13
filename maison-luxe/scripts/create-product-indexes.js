#!/usr/bin/env node

/**
 * Script pour créer les indexes MongoDB optimaux pour les filtres
 * Usage: node scripts/create-product-indexes.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function createIndexes() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    console.log('📊 Création des indexes...\n');

    // Index pour filtre prix
    await productsCollection.createIndex({ price: 1 });
    console.log('✅ Index créé: price (croissant)');

    // Index pour filtre notes
    await productsCollection.createIndex({ rating: -1 });
    console.log('✅ Index créé: rating (décroissant)');

    // Index pour filtre stock
    await productsCollection.createIndex({ stock: 1 });
    console.log('✅ Index créé: stock');

    // Index pour filtre catégorie
    await productsCollection.createIndex({ category: 1 });
    console.log('✅ Index créé: category');

    // Index pour tri par date de création
    await productsCollection.createIndex({ createdAt: -1 });
    console.log('✅ Index créé: createdAt (décroissant)');

    // Index pour tri par nom
    await productsCollection.createIndex({ name: 1 });
    console.log('✅ Index créé: name (alphabétique)');

    // Index composé pour filtres multiples fréquents
    await productsCollection.createIndex({ 
      category: 1, 
      price: 1, 
      rating: -1 
    });
    console.log('✅ Index composé créé: category + price + rating');

    // Index composé pour produits en stock par catégorie
    await productsCollection.createIndex({ 
      category: 1, 
      stock: 1 
    });
    console.log('✅ Index composé créé: category + stock');

    // Index pour recherche textuelle (bonus)
    await productsCollection.createIndex({ 
      name: 'text', 
      description: 'text' 
    });
    console.log('✅ Index de recherche textuelle créé: name + description');

    console.log('\n🎉 Tous les indexes ont été créés avec succès !');
    console.log('\n📈 Liste des indexes:');
    
    const indexes = await productsCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(index.key)}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Déconnecté de MongoDB');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createIndexes();
