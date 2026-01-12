// Script d'initialisation MongoDB pour Docker
// Exécuté automatiquement au premier démarrage

print('🚀 Initialisation de la base de données MaisonLuxe...');

// Créer la base de données
db = db.getSiblingDB('maisonluxe');

// Créer un utilisateur pour l'application
db.createUser({
  user: 'maisonluxe',
  pwd: 'maisonluxe123',
  roles: [
    {
      role: 'readWrite',
      db: 'maisonluxe'
    }
  ]
});

print('✅ Utilisateur maisonluxe créé');

// Créer les collections de base
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('categories');
db.createCollection('reviews');
db.createCollection('coupons');
db.createCollection('passwordresets');

print('✅ Collections créées');

// Créer les index
db.users.createIndex({ email: 1 }, { unique: true });
db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ name: 'text', description: 'text' });
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ stripeSessionId: 1 });
db.passwordresets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

print('✅ Index créés');

print('🎉 Base de données initialisée avec succès !');
