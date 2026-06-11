import prisma from './prisma';
import pusher from './pusher-server';

export async function awardCreditTask(userId: number, triggerType: string) {
  try {
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) return;

    // Find the task
    const task = await prisma.creditTask.findFirst({
      where: { trigger_type: triggerType, is_active: true }
    });

    if (!task) {
      console.log(`[CREDITS_AWARD] No active credit task found for trigger type: ${triggerType}`);
      return;
    }

    // Check if already completed (optimistic check to avoid unnecessary transactions)
    const existingCompletion = await prisma.userCompletedTask.findFirst({
      where: {
        user_id: numericUserId,
        task_id: task.id
      }
    });

    if (existingCompletion) {
      console.log(`[CREDITS_AWARD] User ${numericUserId} already completed task ${task.id} (${triggerType})`);
      return;
    }

    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Mark as completed
      await tx.userCompletedTask.create({
        data: {
          user_id: numericUserId,
          task_id: task.id,
          credits_awarded: task.credits_rewarded
        }
      });

      // Update user credits
      await tx.user.update({
        where: { id: numericUserId },
        data: {
          credits: {
            increment: task.credits_rewarded
          }
        }
      });

      // Record transaction
      await tx.creditTransaction.create({
        data: {
          user_id: numericUserId,
          amount: task.credits_rewarded,
          type: 'CREDIT',
          reason: `Reward: ${task.name}`
        }
      });
    });

    console.log(`[CREDITS_AWARD] Successfully rewarded ${task.credits_rewarded} credits to user ${numericUserId} for ${triggerType}`);

    // Broadcast update via Pusher
    try {
      await pusher.trigger('global-events', 'leaderboard-update', {});
    } catch (e: any) {
      console.error('[PUSHER_TRIGGER_ERROR]', e.message);
    }
  } catch (error: any) {
    // Handle P2002 unique constraint violation (concurrent duplicate completion attempts)
    if (error.code === 'P2002') {
      console.log(`[CREDITS_AWARD] Concurrent completion attempt detected for user ${userId} and trigger ${triggerType}. Ignoring duplicate.`);
      return;
    }
    console.error(`[CREDITS_AWARD_ERROR] Failed to award credits for ${triggerType}:`, error.message);
  }
}
