require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'test',
  ssl: {
    rejectUnauthorized: true
  }
};

async function init() {
  let connection;
  try {
    console.log('[Init] Connecting to TiDB...');
    connection = await mysql.createConnection(config);
    console.log('[Init] Connected!');

    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolon, but ignore semicolons inside quotes if any (simplified)
    // Actually, we can just run the whole thing if the driver supports multiple statements
    // But it's safer to split or use a driver option
    
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('CREATE DATABASE') && !s.startsWith('USE'));

    console.log(`[Init] Found ${statements.length} statements to execute.`);

    for (let statement of statements) {
      console.log(`[Init] Executing: ${statement.substring(0, 50)}...`);
      await connection.query(statement);
    }

    console.log('[Init] ✅ Database initialized successfully!');
    
    // Test query
    const [rows] = await connection.query('SHOW TABLES');
    console.log('[Init] Tables in database:', rows);

  } catch (err) {
    console.error('[Init] ❌ Failed to initialize database:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

init();
