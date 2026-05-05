const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'take_one',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 // 10 seconds timeout for Vercel environments
});

async function connectDB() {
  try {
    console.log(`Attempting to connect to database: ${process.env.DB_NAME || 'take_one'} at ${process.env.DB_HOST || 'localhost'}`);
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully');
    connection.release();
  } catch (error) {
    console.error('MySQL connection failed!');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  connectDB
};
