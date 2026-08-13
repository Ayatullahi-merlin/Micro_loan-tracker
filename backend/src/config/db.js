const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const isTest = process.env.NODE_ENV === 'test';

if (!connectionString && !isTest) {
  console.error('CRITICAL: DATABASE_URL is not set in environment variables!');
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';
const isSupabase = connectionString ? connectionString.includes('supabase') : false;

const pool = new Pool({
  connectionString: connectionString || 'postgresql://dummy:dummy@localhost:5432/dummy',
  ssl: isProduction || isSupabase ? { rejectUnauthorized: false } : false
});

// Test connection on startup (skipped in test mode)
if (!isTest) {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('Database connection failed:', err.message);
    } else {
      console.log('Successfully connected to the PostgreSQL database.');
      release();
    }
  });
}

module.exports = {
  query: (text, params) => {
    // Log queries in development
    if (!isProduction) {
      console.log('Executing query:', text, params || []);
    }
    return pool.query(text, params);
  },
  pool
};
