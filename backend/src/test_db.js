const db = require('./config/db');

const checkUsers = async () => {
  try {
    const res = await db.query('SELECT id, name, email, role, password_hash FROM users');
    console.log('--- seeded users ---');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error querying users:', error.message);
    process.exit(1);
  }
};

checkUsers();
