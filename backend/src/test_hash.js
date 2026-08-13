const bcrypt = require('bcryptjs');

const run = async () => {
  const hashInDb = '$2b$10$wN2V8u78qK7s6L6F7nZfIeP4c6Opx6Dfg0gq8d1n6548nC/w/zUqG';
  
  const matches = await bcrypt.compare('password123', hashInDb);
  console.log('Does "password123" match hash in DB?', matches);

  const newHash = await bcrypt.hash('password123', 10);
  console.log('Valid new bcrypt hash of "password123":', newHash);
};

run();
