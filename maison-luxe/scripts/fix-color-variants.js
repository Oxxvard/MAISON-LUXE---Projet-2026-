#!/usr/bin/env node
/**
 * Script pour corriger les colorVariants manquants des produits
 * Utilise les données CJ pour créer les colorVariants si ils sont vides
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI manquante dans .env');
  process.exit(1);
}

async function fixColorVariants() {
  console.log('=== Correction des colorVariants manquants ===\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connexion à MongoDB...');
    await client.connect();
    console.log('✓ Connecté à MongoDB');
    
    const db = client.db();
    const productsCollection = db.collection('products');
    
    // Trouver les produits avec colorVariants vides mais avec données CJ
    const productsToFix = await productsCollection.find({
      $or: [
        { colorVariants: { $exists: false } },
        { colorVariants: { $size: 0 } }
      ],
      'cjData.variants': { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`\n📋 Trouvé ${productsToFix.length} produits à corriger\n`);
    
    let fixedCount = 0;
    
    for (const product of productsToFix) {
      console.log(`🔧 Correction: ${product.name}`);
      console.log(`   Slug: ${product.slug}`);
      
      const colorVariants = [];
      const variants = product.cjData?.variants || [];
      
      // Extraire les couleurs des variantes CJ
      const colorMap = new Map();
      
      for (const variant of variants) {
        const color = variant.variantKey || variant.variantNameEn || 'Standard';
        const image = variant.variantImage;
        
        if (!colorMap.has(color)) {
          colorMap.set(color, {
            color: color,
            images: image ? [image] : [],
            cjVid: variant.vid
          });
        } else if (image && !colorMap.get(color).images.includes(image)) {
          colorMap.get(color).images.push(image);
        }
      }
      
      // Convertir en array
      const newColorVariants = Array.from(colorMap.values());
      
      if (newColorVariants.length > 0) {
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { colorVariants: newColorVariants } }
        );
        
        console.log(`   ✓ Ajouté ${newColorVariants.length} variantes:`, newColorVariants.map(v => v.color).join(', '));
        fixedCount++;
      } else {
        console.log(`   ⚠️  Aucune variante trouvée pour ce produit`);
      }
      
      console.log('');
    }
    
    console.log(`\n🎉 Correction terminée:`);
    console.log(`   - ${fixedCount} produits corrigés`);
    console.log(`   - ${productsToFix.length - fixedCount} produits ignorés`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✓ Connexion fermée');
  }
}

fixColorVariants();