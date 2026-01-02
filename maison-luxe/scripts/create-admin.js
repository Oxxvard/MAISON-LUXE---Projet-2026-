#!/usr/bin/env node

// Charger les variables d'environnement depuis .env
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('=== Création compte admin ===\n');

    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maisonluxe';

    console.log('Connexion à MongoDB...');
    await mongoose.connect(dbUri);
    console.log('✓ Connecté à MongoDB\n');

    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
    }, { timestamps: true });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Vérifier si admin existe déjà
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@maisonluxe.com' },
        { email: 'florianvial0@gmail.com' },
        { role: 'admin' }
      ]
    });
    
    if (existingAdmin) {
      console.log('✅ Compte admin existant trouvé :');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nom: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
    } else {
      console.log('⚠️ Aucun admin trouvé, création...');
      
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      const newAdmin = await User.create({
        name: 'Admin',
        email: 'florianvial0@gmail.com',
        password: hashedPassword,
        role: 'admin',
      });
      
      console.log('✅ Nouveau compte admin créé :');
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Mot de passe: Admin123!`);
      console.log(`   Role: ${newAdmin.role}`);
    }

    await mongoose.connection.close();
    console.log('\n✓ Connexion fermée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createAdmin();
