require('dotenv').config();
const { connectDB } = require('./config/db');

console.log('--- Database Connection Test ---');
console.log('Env loaded:', {
  DB_HOST: process.env.DB_HOST || '(not set)',
  DB_USER: process.env.DB_USER || '(not set)',
  DB_NAME: process.env.DB_NAME || '(not set)',
  DB_SSL: process.env.DB_SSL || '(not set)',
  HAS_URL: !!process.env.DATABASE_URL
});

connectDB().then(() => {
  console.log('--- Test Complete ---');
  process.exit(0);
}).catch(err => {
  console.error('Test failed with error:', err.message);
  process.exit(1);
});
