const { pool } = require('../config/db');

async function initializeModerationTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS moderation_reports (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        reporter_id INT UNSIGNED NOT NULL,
        moderator_id INT UNSIGNED DEFAULT NULL,
        target_type VARCHAR(40) NOT NULL,
        target_id INT UNSIGNED DEFAULT NULL,
        reason VARCHAR(160) NOT NULL,
        details TEXT DEFAULT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'open',
        moderator_notes TEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_reports_status (status, created_at),
        KEY idx_reports_reporter (reporter_id),
        KEY idx_reports_moderator (moderator_id),
        CONSTRAINT fk_reports_reporter
          FOREIGN KEY (reporter_id)
          REFERENCES users(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_reports_moderator
          FOREIGN KEY (moderator_id)
          REFERENCES users(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE
      )
    `);

    try {
      await pool.query(`
        ALTER TABLE moderation_reports
        ADD COLUMN moderator_id INT UNSIGNED DEFAULT NULL
      `);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.error('Error adding moderator_id to moderation_reports:', err.message);
      }
    }

    try {
      await pool.query(`
        ALTER TABLE moderation_reports
        ADD CONSTRAINT fk_reports_moderator
        FOREIGN KEY (moderator_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
      `);
    } catch (err) {
      // Ignore if constraint already exists
    }

    console.log('[DB] Moderation reports table initialized successfully');
  } catch (error) {
    console.error('Failed to initialize moderation_reports table:', error.message);
    throw error;
  }
}

module.exports = {
  initializeModerationTable
};
