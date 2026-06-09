const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// CRITICAL: Razorpay webhooks demand raw request body for matching HMAC signatures
router.post(
    '/webhook/razorpay',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        const signature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!signature || !webhookSecret) {
            return res.status(400).json({ error: 'Missing webhook verification signatures' });
        }

        try {
            // 🔒 1. Cryptographic HMAC Verification
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(req.body)
                .digest('hex');

            if (expectedSignature !== signature) {
                return res.status(400).json({ error: 'Invalid cryptographic checksum signature' });
            }

            const payload = JSON.parse(req.body.toString());
            
            // Extract entities based on typical Razorpay event formats (e.g., payment.captured)
            const paymentEntity = payload.payload?.payment?.entity;
            const orderId = paymentEntity?.order_id;
            const paymentId = paymentEntity?.id;
            
            // Credits and User ID passed inside Razorpay Notes mapping
            const userId = paymentEntity?.notes?.user_id ? parseInt(paymentEntity.notes.user_id) : null;
            const creditsToAllocate = paymentEntity?.notes?.credits ? parseInt(paymentEntity.notes.credits) : 0;

            if (!orderId || !userId || !paymentId) {
                return res.status(422).json({ error: 'Missing mandatory tracking metadata parameters' });
            }

            // 🔄 2. Atomic Isolation & Pessimistic Locking Sequence
            const transactionResult = await prisma.$transaction(async (tx) => {
                
                // MySQL Row-Level Lock: Stops concurrent webhook fires for the exact same Order ID
                const existingPayments = await tx.$queryRaw`
                    SELECT * FROM script_upload_payments 
                    WHERE razorpay_order_id = ${orderId} 
                    FOR UPDATE
                `;
                
                const paymentRecord = existingPayments[0];

                if (!paymentRecord) {
                    throw new Error('Order tracking record not found in structural database engine');
                }

                // Idempotency Layer Guard: If status is already processed, intercept early
                if (paymentRecord.status === 'SUCCESS' || paymentRecord.status === 'captured') {
                    return {
                        status: 'cached',
                        message: 'Idempotency Intercept: This payment loop was already executed.'
                    };
                }

                // 3. Update the Script Upload Payment Status
                await tx.scriptUploadPayment.update({
                    where: { razorpay_order_id: orderId },
                    data: {
                        razorpay_payment_id: paymentId,
                        razorpay_signature: signature,
                        status: 'SUCCESS',
                        updated_at: new Date()
                    }
                });

                // 4. Update User Credits Ledger (Matches schema model explicitly)
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        credits: { increment: creditsToAllocate }
                    }
                });

                // 5. Insert History Track into CreditTransaction mapping
                await tx.creditTransaction.create({
                    data: {
                        user_id: userId,
                        amount: creditsToAllocate,
                        reason: `Razorpay Webhook Auto Allocation: Order ${orderId}`,
                        type: 'CREDIT'
                    }
                });

                return {
                    status: 'processed',
                    message: 'Webhook pipeline synchronized and transaction closed clean.'
                };
            }, {
                timeout: 3000 // 3-second thread protection timeout to protect MySQL connection pools
            });

            // Return HTTP 200 for both fresh and deduplicated events
            return res.status(200).json({
                success: true,
                meta: transactionResult.message
            });

        } catch (error) {
            console.error(`[CRITICAL WEBHOOK ERROR]: ${error.message}`);
            // Report to Sentry here if required by acceptance criteria
            return res.status(500).json({ error: 'Internal pipeline optimization fault' });
        }
    }
);

module.exports = router;