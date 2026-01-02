#!/usr/bin/env node

// Script pour créer des produits de démonstration sans CJ
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  longDescription: String,
  price: Number,
  compareAtPrice: Number,
  images: [String],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  inStock: Boolean,
  stockQuantity: Number,
  sku: String,
  cjPid: String,
  cjVid: String,
  tags: [String],
  featured: Boolean,
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  variants: [{
    name: String,
    values: [String],
  }],
  seo: {
    title: String,
    description: String,
    keywords: [String],
  },
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  image: String,
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  seo: {
    title: String,
    description: String,
    keywords: [String],
  },
}, { timestamps: true });

async function createDemoProducts() {
  try {
    console.log('🎭 Création de produits de démonstration...\n');
    
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maisonluxe';
    await mongoose.connect(dbUri);
    console.log('✓ Connecté à MongoDB\n');

    const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
    const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

    // Obtenir ou créer les catégories
    let watchCategory = await Category.findOne({ slug: 'montres' });
    if (!watchCategory) {
      watchCategory = await Category.create({
        name: 'Montres',
        slug: 'montres',
        description: 'Montres de luxe et accessoires horlogers',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
        isActive: true,
        sortOrder: 1
      });
    }

    let jewelryCategory = await Category.findOne({ slug: 'bijoux' });
    if (!jewelryCategory) {
      jewelryCategory = await Category.create({
        name: 'Bijoux',
        slug: 'bijoux',
        description: 'Bijoux précieux et accessoires de mode',
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
        isActive: true,
        sortOrder: 2
      });
    }

    // Produits de démonstration
    const demoProducts = [
      {
        name: 'Montre Classique Or',
        slug: 'montre-classique-or',
        description: 'Montre élégante en or 18 carats avec bracelet en cuir véritable',
        longDescription: 'Cette magnifique montre classique en or 18 carats allie tradition et modernité. Son cadran blanc nacré et ses aiguilles dorées offrent une lisibilité parfaite, tandis que le bracelet en cuir véritable garantit un confort optimal. Mouvement quartz suisse de haute précision.',
        price: 299.99,
        compareAtPrice: 399.99,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
          'https://images.unsplash.com/photo-1594576662179-908dc35c2c2c'
        ],
        category: watchCategory._id,
        inStock: true,
        stockQuantity: 15,
        sku: 'DEMO-WATCH-001',
        cjPid: 'DEMO001',
        tags: ['montre', 'or', 'classique', 'luxe'],
        featured: true,
        averageRating: 4.8,
        reviewCount: 24,
        weight: 150
      },
      {
        name: 'Bracelet Diamant Éternité',
        slug: 'bracelet-diamant-eternite',
        description: 'Bracelet en or blanc serti de diamants pour une élégance intemporelle',
        longDescription: 'Ce somptueux bracelet éternité en or blanc 18 carats est orné de diamants taille brillant soigneusement sélectionnés. Chaque pierre capture la lumière pour créer un éclat exceptionnel. Fermoir sécurisé avec chaînette de sécurité.',
        price: 1299.99,
        compareAtPrice: 1799.99,
        images: [
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
          'https://images.unsplash.com/photo-1602173574767-37ac01994b2a'
        ],
        category: jewelryCategory._id,
        inStock: true,
        stockQuantity: 8,
        sku: 'DEMO-JEWELRY-001',
        cjPid: 'DEMO002',
        tags: ['bracelet', 'diamant', 'or blanc', 'luxe'],
        featured: true,
        averageRating: 4.9,
        reviewCount: 18,
        weight: 25
      },
      {
        name: 'Montre Sport Premium',
        slug: 'montre-sport-premium',
        description: 'Montre sportive étanche avec fonctions avancées',
        longDescription: 'Montre sportive haut de gamme conçue pour les aventuriers. Boîtier en titane ultra-léger, étanchéité 300m, chronographe, alarme et rétroéclairage. Bracelet en silicone médical hypoallergénique.',
        price: 199.99,
        compareAtPrice: 279.99,
        images: [
          'https://images.unsplash.com/photo-1434493907317-a46b5bbe7834',
          'https://images.unsplash.com/photo-1592388208086-5b3ae3eb1830'
        ],
        category: watchCategory._id,
        inStock: true,
        stockQuantity: 22,
        sku: 'DEMO-WATCH-002',
        cjPid: 'DEMO003',
        tags: ['montre', 'sport', 'étanche', 'titane'],
        featured: false,
        averageRating: 4.6,
        reviewCount: 31,
        weight: 120
      },
      {
        name: 'Collier Perles Akoya',
        slug: 'collier-perles-akoya',
        description: 'Collier de perles Akoya cultivées du Japon, éclat naturel exceptionnel',
        longDescription: 'Ce magnifique collier présente des perles Akoya cultivées au Japon, réputées pour leur lustre exceptionnel et leur forme parfaitement ronde. Fermoir en or blanc 14 carats avec perle de sécurité. Longueur 45cm, diamètre perles 7-8mm.',
        price: 899.99,
        compareAtPrice: 1199.99,
        images: [
          'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0',
          'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908'
        ],
        category: jewelryCategory._id,
        inStock: true,
        stockQuantity: 12,
        sku: 'DEMO-JEWELRY-002',
        cjPid: 'DEMO004',
        tags: ['collier', 'perles', 'akoya', 'japon'],
        featured: true,
        averageRating: 4.7,
        reviewCount: 15,
        weight: 40
      },
      {
        name: 'Montre Squelette Mécanique',
        slug: 'montre-squelette-mecanique',
        description: 'Montre mécanique squelette avec mécanisme visible',
        longDescription: 'Cette fascinante montre squelette dévoile la beauté de son mouvement mécanique automatique. Boîtier en acier inoxydable poli, cadran transparent, réserve de marche 42h. Un chef-d\'œuvre d\'horlogerie à porter au poignet.',
        price: 449.99,
        compareAtPrice: 599.99,
        images: [
          'https://images.unsplash.com/photo-1547996160-81dfa63595aa',
          'https://images.unsplash.com/photo-1509048191080-d2d77220d247'
        ],
        category: watchCategory._id,
        inStock: true,
        stockQuantity: 6,
        sku: 'DEMO-WATCH-003',
        cjPid: 'DEMO005',
        tags: ['montre', 'squelette', 'mécanique', 'automatique'],
        featured: false,
        averageRating: 4.9,
        reviewCount: 12,
        weight: 180
      }
    ];

    // Supprimer les anciens produits de démo
    await Product.deleteMany({ cjPid: { $regex: /^DEMO/ } });
    console.log('🧹 Anciens produits de démo supprimés');

    // Créer les nouveaux produits
    let created = 0;
    for (const productData of demoProducts) {
      try {
        const product = await Product.create(productData);
        console.log(`✅ ${product.name} - ${product.price}€ (Stock: ${product.stockQuantity})`);
        created++;
      } catch (error) {
        console.error(`❌ Erreur création ${productData.name}:`, error.message);
      }
    }

    console.log(`\n🎉 ${created} produits de démonstration créés avec succès !`);
    console.log('\n📋 Récapitulatif :');
    console.log(`- ${await Category.countDocuments({ isActive: true })} catégories actives`);
    console.log(`- ${await Product.countDocuments()} produits total`);
    console.log(`- ${await Product.countDocuments({ featured: true })} produits mis en avant`);
    
    await mongoose.connection.close();
    console.log('\n✓ Connexion fermée');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createDemoProducts();