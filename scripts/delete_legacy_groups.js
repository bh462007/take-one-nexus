/**
 * Migration Script: Delete Legacy Groups and Notify Users
 * 
 * This script identifies all group conversations that are NOT part of the new
 * community/group architecture, creates notifications for all members, and
 * deletes the legacy group conversations.
 */
require('dotenv').config();
const { pool } = require('../config/db');
const { createNotification } = require('../utils/notifications');

async function deleteLegacyGroups() {
  console.log('\n=== LEGACY GROUP DELETION & NOTIFICATION START ===\n');
  
  const connection = await pool.getConnection();
  
  try {
    // 1. Find all legacy group conversations
    // A legacy group conversation has is_group = true but has no record in the community_groups table
    const [legacyGroups] = await connection.query(`
      SELECT c.id, c.name 
      FROM conversations c
      LEFT JOIN community_groups cg ON c.id = cg.conversation_id
      WHERE c.is_group = 1 AND cg.conversation_id IS NULL
    `);
    
    console.log(`Found ${legacyGroups.length} legacy group conversation(s) to process.\n`);
    
    if (legacyGroups.length === 0) {
      console.log('No legacy group conversations found. Cleanup complete.');
      return;
    }
    
    for (const group of legacyGroups) {
      const groupName = group.name || 'Unnamed Group';
      console.log(`Processing Group: "${groupName}" (ID: ${group.id})`);
      
      // 2. Fetch all members of this group
      const [members] = await connection.query(`
        SELECT user_id 
        FROM conversation_members 
        WHERE conversation_id = ?
      `, [group.id]);
      
      console.log(`- Found ${members.length} member(s) in this group.`);
      
      // 3. Create notifications for all members
      for (const member of members) {
        try {
          await createNotification({
            userId: member.user_id,
            type: 'system',
            title: 'Group Deactivated',
            body: `The group "${groupName}" has been deleted as we have transitioned to the new Community/Group system. Please check with your community leaders to join the new groups!`,
            linkUrl: '/chat'
          });
          console.log(`  - Notified user ID: ${member.user_id}`);
        } catch (err) {
          console.error(`  - Failed to notify user ID ${member.user_id}:`, err.message);
        }
      }
      
      // 4. Delete the group conversation (foreign keys cascade will clean up members/messages/tasks)
      const [deleteResult] = await connection.query(`
        DELETE FROM conversations 
        WHERE id = ?
      `, [group.id]);
      
      if (deleteResult.affectedRows > 0) {
        console.log(`- Successfully deleted group conversation ID: ${group.id}\n`);
      } else {
        console.log(`- Failed/Warning: Group conversation ID ${group.id} was not deleted.\n`);
      }
    }
    
    console.log('=== LEGACY GROUP DELETION & NOTIFICATION COMPLETE ===\n');
    
  } catch (error) {
    console.error('❌ Critical Error during migration:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

deleteLegacyGroups().catch(err => {
  console.error('Fatal error running migration:', err);
  process.exit(1);
});
