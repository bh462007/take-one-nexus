const express = require('express');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { authenticateUser } = require('../middleware/auth');
const { captureError } = require('../src/lib/sentry');
const Pusher = require('pusher');

const router = express.Router();

// Configure Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
  useTLS: true
});

async function safeQuery(sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error(`[Payments DB Query Failed]: ${sql}`);
    console.error(`Error: ${error.message}`);
    captureError(error, {
      action: 'payments_database_query_failure',
      extra: { sql, params }
    });
    throw error;
  }
}

/**
 * POST /api/payments/create-order
 * Create a draft script and generate a Razorpay order
 */
router.post('/create-order', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, genre, synopsis, poster_url, roles_needed, status, media_links, role_data, work_type } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Script title is required' });
    }

    // 1. Create draft in script_drafts
    const draftResult = await safeQuery(
      `INSERT INTO script_drafts (
        user_id, title, genre, synopsis, poster_url, roles_needed, 
        status, media_links, role_data, work_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        title,
        genre || 'General',
        synopsis || '',
        poster_url || null,
        roles_needed || null,
        status || 'Open for collaboration',
        media_links || null,
        role_data || null,
        work_type || 'Script'
      ]
    );

    const draftId = draftResult.insertId;

    // 2. Setup Razorpay order parameters
    const amount = 4900; // Rs 49.00 in paise
    const currency = 'INR';
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    // Check if we should use Simulated Mode
    const isSimulated = !keyId || keyId.startsWith('rzp_test_placeholder') || !keySecret;

    let orderId = '';

    if (isSimulated) {
      // Generate a mock order ID
      orderId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
      console.log(`[Payments] Simulated order created for Draft #${draftId}: ${orderId}`);
    } else {
      // Call Razorpay API to create actual order
      try {
        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
          },
          body: JSON.stringify({
            amount,
            currency,
            receipt: `draft_${draftId}`,
            notes: {
              userId: String(userId),
              draftId: String(draftId)
            }
          })
        });

        const orderData = await response.json();

        if (!response.ok || !orderData.id) {
          throw new Error(orderData.error?.description || 'Razorpay order creation failed');
        }

        orderId = orderData.id;
      } catch (razorpayError) {
        console.error('[Payments] Razorpay API Error:', razorpayError.message);
        captureError(razorpayError, { action: 'razorpay_order_creation_failed', extra: { draftId, userId } });
        
        // Fallback to simulated mode so service is not completely broken
        orderId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
        console.warn('[Payments] Falling back to Simulated Order ID due to Razorpay API error.');
      }
    }

    // 3. Save pending payment record
    await safeQuery(
      `INSERT INTO script_upload_payments (
        user_id, draft_id, razorpay_order_id, amount, currency, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [userId, draftId, orderId, amount / 100, currency]
    );

    res.json({
      success: true,
      order_id: orderId,
      draft_id: draftId,
      amount,
      currency,
      key_id: isSimulated ? 'rzp_test_placeholder' : keyId,
      is_simulated: isSimulated || orderId.startsWith('order_sim_')
    });

  } catch (error) {
    console.error('Create order error:', error.message);
    res.status(500).json({ success: false, message: 'Could not prepare payment order' });
  }
});

/**
 * POST /api/payments/verify
 * Verify payment signature and promote script draft to scripts list
 */
router.post('/verify', authenticateUser, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, draft_id } = req.body;

    if (!razorpay_order_id || !draft_id) {
      return res.status(400).json({ success: false, message: 'Missing order ID or draft ID' });
    }

    // Check if this was a simulated transaction
    const isSimulated = razorpay_order_id.startsWith('order_sim_');

    if (!isSimulated) {
      // Verify signature using crypto
      const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        console.warn(`[Payments] Invalid signature for Order: ${razorpay_order_id}`);
        return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid signature' });
      }
    }

    // Start transaction to promote script safely
    await connection.beginTransaction();

    // 1. Get payment row & verify ownership
    const [payments] = await connection.query(
      'SELECT * FROM script_upload_payments WHERE razorpay_order_id = ? AND user_id = ? LIMIT 1',
      [razorpay_order_id, userId]
    );

    if (payments.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Payment transaction record not found' });
    }

    const paymentRecord = payments[0];
    if (paymentRecord.status === 'successful') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Payment has already been verified and processed' });
    }

    // 2. Fetch draft script
    const [drafts] = await connection.query(
      'SELECT * FROM script_drafts WHERE id = ? AND user_id = ? LIMIT 1',
      [draft_id, userId]
    );

    if (drafts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Script draft not found' });
    }

    const draft = drafts[0];

    // 3. Promote draft to scripts table
    const [insertResult] = await connection.query(
      `INSERT INTO scripts (
        user_id, title, genre, synopsis, poster_url, roles_needed, 
        status, media_links, role_data, work_type, approval_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [
        draft.user_id,
        draft.title,
        draft.genre,
        draft.synopsis,
        draft.poster_url,
        draft.roles_needed,
        draft.status,
        draft.media_links,
        draft.role_data,
        draft.work_type
      ]
    );

    const scriptId = insertResult.insertId;

    // 4. Update payment transaction record to successful
    await connection.query(
      `UPDATE script_upload_payments 
       SET status = 'successful', 
           razorpay_payment_id = ?, 
           razorpay_signature = ?, 
           script_id = ?, 
           updated_at = NOW() 
       WHERE id = ?`,
      [
        razorpay_payment_id || `pay_sim_${crypto.randomBytes(8).toString('hex')}`,
        razorpay_signature || 'simulated_signature',
        scriptId,
        paymentRecord.id
      ]
    );

    await connection.commit();
    console.log(`[Payments] Verification Successful! Draft #${draft_id} promoted to Script #${scriptId}`);

    // 5. Trigger Pusher message for real-time notifications
    try {
      if (process.env.PUSHER_APP_ID) {
        pusher.trigger('admin-dashboard', 'update', {
          type: 'NEW_SCRIPT',
          scriptId,
          title: draft.title
        });
      }
    } catch (pusherErr) {
      console.error('[Payments] Pusher trigger failed:', pusherErr.message);
    }

    res.json({
      success: true,
      message: 'Payment verified and script transmitted successfully',
      script_id: scriptId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Verify payment error:', error.message);
    captureError(error, { action: 'payments_verification_failure', extra: { body: req.body } });
    res.status(500).json({ success: false, message: 'Could not complete payment verification' });
  } finally {
    connection.release();
  }
});

module.exports = router;
