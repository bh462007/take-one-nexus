/**
 * Diagnostic Script: Check Task Synchronization Issue
 * 
 * This script checks both Task and CreditTask tables to verify
 * the synchronization bug between Admin Panel and Leaderboard.
 */
require('dotenv').config();
const { pool } = require('../config/db');
async function checkTaskSync() {
  console.log('\n=== TASK SYNCHRONIZATION DIAGNOSTIC ===\n');
  
  const connection = await pool.getConnection();
  
  try {
    // Check Task table (where Admin Panel writes)
    console.log('📋 Tasks in Task table (Admin Panel writes here):');
    console.log('─'.repeat(80));
    const [tasks] = await connection.query(`
      SELECT id, title, description, credits, reward_credits, 
             conversation_id, created_at
      FROM tasks 
      WHERE conversation_id IS NULL
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (tasks.length === 0) {
      console.log('❌ No admin tasks found in Task table');
    } else {
      console.table(tasks);
    }
    
    console.log('\n');
    
    // Check CreditTask table (where Leaderboard reads from)
    console.log('💰 Tasks in credit_tasks table (Leaderboard reads from here):');
    console.log('─'.repeat(80));
    const [creditTasks] = await connection.query(`
      SELECT id, name, description, credits_rewarded, 
             trigger_type, is_active, created_at
      FROM credit_tasks 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (creditTasks.length === 0) {
      console.log('❌ No tasks found in CreditTask table');
    } else {
      console.table(creditTasks);
    }
    
    console.log('\n');
    
    // Analysis
    console.log('🔍 ANALYSIS:');
    console.log('─'.repeat(80));
    console.log(`Tasks in Task table: ${tasks.length}`);
    console.log(`Tasks in CreditTask table: ${creditTasks.length}`);
    
    if (tasks.length > 0 && creditTasks.length === 0) {
      console.log('\n❌ BUG CONFIRMED: Admin tasks exist but are NOT synced to credit_tasks table');
      console.log('   → Admin Panel writes to tasks table');
      console.log('   → Leaderboard reads from credit_tasks table');
      console.log('   → No synchronization mechanism exists\n');
    } else if (tasks.length === 0 && creditTasks.length === 0) {
      console.log('\n⚠️  No tasks in either table. Create a task in Admin Panel first.\n');
    } else if (creditTasks.length > 0) {
      console.log('\n✅ credit_tasks table has tasks (may be manually created or from old system)\n');
    }
    
    // Check UserCompletedTask table
    console.log('\n📊 User Completed Tasks:');
    console.log('─'.repeat(80));
    const [completedTasks] = await connection.query(`
      SELECT uct.id, uct.user_id, uct.task_id as credit_task_id, 
             ct.name as task_name, uct.completed_at
      FROM user_completed_tasks uct
      LEFT JOIN credit_tasks ct ON uct.task_id = ct.id
      ORDER BY uct.completed_at DESC
      LIMIT 5
    `);
    
    if (completedTasks.length === 0) {
      console.log('No completed tasks yet');
    } else {
      console.table(completedTasks);
    }
    
    console.log('\n=== END DIAGNOSTIC ===\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}
checkTaskSync().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
