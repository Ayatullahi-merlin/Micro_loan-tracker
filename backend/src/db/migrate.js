const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const runMigration = async () => {
  try {
    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing database migrations against PostgreSQL (Supabase)...');
    await db.query(schemaSql);

    console.log('✅ Schema migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

runMigration();
