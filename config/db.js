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
  const host = process.env.DB_HOST || 'localhost';
  const name = process.env.DB_NAME || 'take_one';
  const user = process.env.DB_USER || 'root';
  
  try {
    if (!process.env.DB_HOST) {
      console.warn('--- DATABASE CONFIGURATION WARNING ---');
      console.warn('DB_HOST is not set, defaulting to localhost.');
      console.warn('In production (Vercel), this will cause ECONNREFUSED.');
      console.warn('Please ensure DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME are set in Vercel environment variables.');
      console.warn('--------------------------------------');
    }
    
    console.log(`[DB] Connecting to ${name} at ${host} (user: ${user})...`);
    
    const connection = await pool.getConnection();
    console.log('[DB] MySQL connected successfully');
    connection.release();
  } catch (error) {
    console.error('[DB] CRITICAL: MySQL connection failed!');
    console.error(`[DB] Target: ${user}@${host}/${name}`);
    console.error(`[DB] Error: ${error.code} - ${error.message}`);
    
    if (error.code === 'ECONNREFUSED' && host === 'localhost') {
      console.error('[DB] HINT: The server tried to connect to a local database but none was found. This usually means production environment variables are missing.');
    }
    
    // In serverless environments, we don't necessarily want to kill the process immediately
    // but we should definitely log the failure.
  }
}

module.exports = {
  pool,
  connectDB
};
