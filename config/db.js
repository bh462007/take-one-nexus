const mysql = require('mysql2/promise');

// Parse DATABASE_URL if available (common in managed MySQL providers)
const parseConnectionString = (url) => {
  try {
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);
    if (match) {
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: Number(match[4]),
        database: match[5].split('?')[0],
      };
    }
  } catch (err) {
    console.error('[DB] Failed to parse DATABASE_URL:', err.message);
  }
  return null;
};

const dbConfig = process.env.DATABASE_URL 
  ? parseConnectionString(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'take_one',
    };

const poolConfig = {
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: process.env.NODE_ENV === 'production' ? 5 : 10, // Fewer connections in serverless prod
  queueLimit: 0,
  connectTimeout: 15000, // 15 seconds for cloud DBs
  // SSL support is critical for production DBs like Aiven, DigitalOcean, PlanetScale
  ssl: (process.env.DB_SSL === 'true' || process.env.DATABASE_URL?.includes('sslmode=require')) 
    ? { rejectUnauthorized: true } 
    : undefined
};

const pool = mysql.createPool(poolConfig);

async function connectDB() {
  const { host, database, user } = dbConfig;
  
  try {
    if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
      console.warn('--- DATABASE CONFIGURATION WARNING ---');
      console.warn('Neither DB_HOST nor DATABASE_URL is set.');
      console.warn('Defaulting to localhost which may fail in production.');
      console.warn('--------------------------------------');
    }
    
    console.log(`[DB] Attempting connection to ${database} at ${host}...`);
    
    const connection = await pool.getConnection();
    console.log('[DB] ✅ MySQL connected successfully');
    
    // Quick check to see if we can query
    const [rows] = await connection.query('SELECT 1 as connected');
    if (rows[0].connected === 1) {
      console.log('[DB] ✅ Query test passed');
    }
    
    connection.release();
  } catch (error) {
    console.error('[DB] ❌ CRITICAL: MySQL connection failed!');
    console.error(`[DB] Target: ${user}@${host}/${database}`);
    console.error(`[DB] Error Code: ${error.code}`);
    console.error(`[DB] Error Message: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('[DB] HINT: Connection refused. Check if the DB host is reachable and the port is correct.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('[DB] HINT: Access denied. Check your DB_USER and DB_PASSWORD.');
    } else if (error.message.includes('SSL')) {
      console.error('[DB] HINT: SSL error. Try setting DB_SSL=true if your provider requires encrypted connections.');
    }
    
    // We don't crash the app here, but API calls will fail later with "Database unavailable"
  }
}

module.exports = {
  pool,
  connectDB,
  dbConfig
};

