const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const runSeed = async () => {
  try {
    console.log('Reading seed.sql...');
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Populating seed data into PostgreSQL (Supabase)...');
    await db.query(seedSql);

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

runSeed();
