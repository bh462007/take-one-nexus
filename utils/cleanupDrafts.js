const { pool } = require('../config/db');

let lastCleanupAt = 0;
let cleanupRunning = false;

const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Cleans abandoned Razorpay draft uploads.
 *
 * Normal payment transitions (verify/cancel/webhook) remove drafts
 * themselves. This handles users closing checkout without completing payment.
 *
 * @param {boolean} force - Bypass time throttle; use on server boot
 * @returns {Promise<number>} Rows deleted
 */
async function cleanupExpiredDrafts(force = false) {
  const now = Date.now();

  if (cleanupRunning) return 0;

  if (!force && now - lastCleanupAt < CLEANUP_INTERVAL_MS) return 0;

  cleanupRunning = true;

  try {
    const [result] = await pool.query(`
      DELETE sd
      FROM script_drafts sd
      LEFT JOIN script_upload_payments sup
        ON  sup.draft_id = sd.id
        AND sup.status = 'verified'
      WHERE sd.expires_at IS NOT NULL
        AND sd.expires_at < NOW()
        AND sup.draft_id IS NULL
    `);

    lastCleanupAt = Date.now();

    if (result.affectedRows > 0) {
      console.log(
        `[DraftCleanup] Removed ${result.affectedRows} expired unpaid draft(s)`
      );
    }

    return result.affectedRows;

  } catch (err) {
    console.error('[DraftCleanup] Cleanup failed:', err.message);
    return 0;

  } finally {
    cleanupRunning = false;
  }
}

module.exports = { cleanupExpiredDrafts };