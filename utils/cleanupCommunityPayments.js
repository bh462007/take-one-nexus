const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let isRunning = false;

/**
 * Cleans up community subscription records with a 'pending' status that are older than 2 hours.
 */
async function cleanupPendingCommunityPayments() {
  if (isRunning) return;
  isRunning = true;
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const result = await prisma.communitySubscription.deleteMany({
      where: {
        status: 'pending',
        created_at: {
          lt: twoHoursAgo
        }
      }
    });
    if (result.count > 0) {
      console.log(`[CommunityPaymentCleanup] Successfully pruned ${result.count} abandoned pending payment(s) older than 2 hours.`);
    }
  } catch (error) {
    console.error('[CommunityPaymentCleanup] Error pruning abandoned payments:', error.message);
  } finally {
    isRunning = false;
  }
}

module.exports = { cleanupPendingCommunityPayments };
