#!/usr/bin/env node
/**
 * Script pour nettoyer les descriptions HTML cassées des produits
 * Supprime les balises <img> non fermées et autres HTML invalide
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI manquante dans .env');
  process.exit(1);
}

function cleanDescription(desc) {
  if (!desc || typeof desc !== 'string') return desc;
  
  // Supprimer les balises img mal formées (sans fermeture)
  let cleaned = desc.replace(/<img[^>]*>/gi, '');
  
  // Nettoyer les espaces excessifs
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

async function cleanDescriptions() {
  console.log('=== Nettoyage des descriptions HTML ===\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connexion à MongoDB...');
    await client.connect();
    console.log('✓ Connecté à MongoDB');
    
    const db = client.db();
    const productsCollection = db.collection('products');
    
    // Trouver les produits avec descriptions contenant des balises img
    const productsToClean = await productsCollection.find({
      description: { $regex: '<img', $options: 'i' }
    }).toArray();
    
    console.log(`\n📋 Trouvé ${productsToClean.length} produits à nettoyer\n`);
    
    let cleanedCount = 0;
    
    for (const product of productsToClean) {
      const cleaned = cleanDescription(product.description);
      
      if (cleaned !== product.description) {
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { description: cleaned } }
        );
        
        console.log(`✓ ${product.name}`);
        cleanedCount++;
      }
    }
    
    console.log(`\n🎉 Nettoyage terminé:`);
    console.log(`   - ${cleanedCount} produits nettoyés`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✓ Connexion fermée');
  }
}

cleanDescriptions();