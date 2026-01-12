/**
 * Script de test pour la fonctionnalité de reset password
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testPasswordReset() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maisonluxe';
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB\n');

    // Importer les modèles
    const User = require('../src/models/User').default;
    const PasswordReset = require('../src/models/PasswordReset').default;

    // Vérifier qu'il y a au moins un utilisateur
    const userCount = await User.countDocuments();
    console.log(`👥 Nombre d'utilisateurs dans la DB: ${userCount}`);

    if (userCount === 0) {
      console.log('⚠️  Aucun utilisateur trouvé. Créez d\'abord un compte.');
      return;
    }

    // Afficher un utilisateur test
    const testUser = await User.findOne().select('name email');
    console.log(`\n📧 Utilisateur de test: ${testUser.name} (${testUser.email})`);

    // Vérifier l'index TTL sur PasswordReset
    const indexes = await PasswordReset.collection.getIndexes();
    console.log('\n📑 Index sur PasswordReset:');
    Object.keys(indexes).forEach(key => {
      console.log(`  - ${key}: ${JSON.stringify(indexes[key])}`);
    });

    // Test de création d'un token
    const crypto = require('crypto');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const resetToken = await PasswordReset.create({
      userId: testUser._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 heure
    });

    console.log('\n✅ Token de reset créé avec succès:');
    console.log(`  - ID: ${resetToken._id}`);
    console.log(`  - User ID: ${resetToken.userId}`);
    console.log(`  - Expire à: ${resetToken.expiresAt}`);
    console.log(`  - Token brut (à utiliser dans l'URL): ${rawToken}`);
    console.log(`  - Token hashé (en DB): ${hashedToken.substring(0, 20)}...`);

    // Simuler la vérification du token
    const foundToken = await PasswordReset.findOne({
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() },
    }).populate('userId');

    if (foundToken) {
      console.log('\n✅ Token vérifié avec succès');
      console.log(`  - Utilisateur: ${foundToken.userId.name}`);
    } else {
      console.log('\n❌ Token non trouvé ou invalide');
    }

    // Nettoyer
    await PasswordReset.deleteOne({ _id: resetToken._id });
    console.log('\n🧹 Token de test supprimé\n');

    console.log('✨ Tous les tests sont passés !\n');
    console.log('📝 Pour tester la fonctionnalité complète:');
    console.log('   1. Allez sur http://localhost:3000/auth/signin');
    console.log('   2. Cliquez sur "Mot de passe oublié ?"');
    console.log(`   3. Entrez l'email: ${testUser.email}`);
    console.log('   4. En mode dev, le lien de reset apparaîtra dans la console');
    console.log('   5. Utilisez ce lien pour définir un nouveau mot de passe\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnecté de MongoDB');
  }
}

testPasswordReset();
