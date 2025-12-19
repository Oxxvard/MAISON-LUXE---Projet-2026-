require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/maisonluxe';
  console.log('Connecting to MongoDB:', uri);
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;

  const ordersCount = await db.collection('orders').countDocuments();
  const productsCount = await db.collection('products').countDocuments();
  const usersCount = await db.collection('users').countDocuments();
  const reviewsCount = await db.collection('reviews').countDocuments();

  console.log('Counts:');
  console.log(' orders:', ordersCount);
  console.log(' products:', productsCount);
  console.log(' users:', usersCount);
  console.log(' reviews:', reviewsCount);

  const recentOrder = await db.collection('orders').find().sort({ createdAt: -1 }).limit(1).toArray();
  console.log('\nMost recent order sample:');
  console.log(JSON.stringify(recentOrder[0], null, 2));

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('DB check failed:', err);
  process.exit(1);
});
