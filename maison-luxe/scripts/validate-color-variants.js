#!/usr/bin/env node
/**
 * Script pour vérifier et corriger les colorVariants malformés
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI manquante dans .env');
  process.exit(1);
}

async function validateColorVariants() {
  console.log('=== Vérification et nettoyage des colorVariants ===\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connexion à MongoDB...');
    await client.connect();
    console.log('✓ Connecté à MongoDB');
    
    const db = client.db();
    const productsCollection = db.collection('products');
    
    // Trouver les produits qui ont colorVariants  
    const productsWithVariants = await productsCollection.find({
      colorVariants: { $exists: true, $type: 'array' }
    }).toArray();
    
    console.log(`\n📋 Trouvé ${productsWithVariants.length} produits avec colorVariants\n`);
    
    let fixedCount = 0;
    let problemCount = 0;
    
    for (const product of productsWithVariants) {
      const variants = product.colorVariants;
      
      if (!Array.isArray(variants)) {
        console.log(`❌ ${product.name} - colorVariants n'est pas un array`);
        problemCount++;
        continue;
      }
      
      // Vérifier chaque variante
      let hasIssues = false;
      const cleanedVariants = variants.map(v => {
        if (!v.color || typeof v.color !== 'string') {
          hasIssues = true;
          console.log(`   ⚠️  Variante sans color: ${JSON.stringify(v).substring(0, 50)}`);
        }
        
        if (!Array.isArray(v.images)) {
          hasIssues = true;
          console.log(`   ⚠️  Variante sans images array`);
          v.images = v.images ? [v.images] : [];
        }
        
        // Nettoyer les images vides
        v.images = v.images.filter((img: any) => img && typeof img === 'string');
        
        return {
          color: v.color || 'Unknown',
          images: v.images || [],
          ...(v.cjVid && { cjVid: v.cjVid })
        };
      });
      
      if (hasIssues) {
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { colorVariants: cleanedVariants } }
        );
        console.log(`✓ ${product.name} - Nettoyé`);
        fixedCount++;
      }
    }
    
    console.log(`\n🎉 Vérification terminée:`);
    console.log(`   - ${fixedCount} produits nettoyés`);
    console.log(`   - ${problemCount} produits avec problèmes sévères`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✓ Connexion fermée');
  }
}

validateColorVariants();
