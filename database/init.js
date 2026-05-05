require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initializeDatabase() {
  console.log('--- TAKE ONE Database Initialization ---');
  
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('Error: schema.sql not found at', schemaPath);
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  // Split the schema into individual statements
  // This is a simple split, assuming statements end with ;
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Found ${statements.length} SQL statements to execute.`);

  const connection = await pool.getConnection();
  try {
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip CREATE DATABASE and USE statements if they are problematic in managed environments
      if (statement.toUpperCase().startsWith('CREATE DATABASE') || statement.toUpperCase().startsWith('USE ')) {
        console.log(`Skipping administrative statement: ${statement.split('\n')[0]}...`);
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      try {
        await connection.query(statement);
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('  Notice: Table already exists, skipping.');
        } else {
          console.error(`  Error executing statement: ${err.message}`);
          // Continue with next statement anyway
        }
      }
    }
    console.log('--- Initialization complete! ---');
  } catch (error) {
    console.error('Fatal initialization error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

initializeDatabase().catch(err => {
  console.error('Unhandled error during initialization:', err);
  process.exit(1);
});
