const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validator');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { captureError } = require('../src/lib/sentry');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * GET /api/community/pricing-configs
 * Returns the seeding/pricing settings
 */
router.get('/pricing-configs', authenticateUser, async (req, res) => {
  try {
    const configs = await prisma.communityPricingConfig.findMany();
    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('[Community] Get pricing error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/community/my-community
 * Get current user's community if they are a member/owner
 */
router.get('/my-community', authenticateUser, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    
    // Find membership
    const memberRecord = await prisma.communityMember.findFirst({
      where: { user_id: userId },
      include: {
        community: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    avatar_url: true
                  }
                }
              }
            },
            groups: {
              include: {
                conversation: true
              }
            }
          }
        }
      }
    });

    if (!memberRecord) {
      return res.json({ success: true, inCommunity: false });
    }

    res.json({
      success: true,
      inCommunity: true,
      role: memberRecord.role,
      community: memberRecord.community
    });
  } catch (error) {
    console.error('[Community] Get my community error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/community/create-order
 * Create a Razorpay order for community subscription
 */
const createOrderValidation = [
  body('planType').isIn(['Starter', 'Growth', 'Custom']).withMessage('Invalid plan type'),
  body('memberCount').optional().isInt({ min: 1 }).withMessage('Member count must be positive integer'),
  validateRequest
];

router.post('/create-order', authenticateUser, createOrderValidation, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { planType, memberCount } = req.body;

    // Check if user is already in a community
    const existingMembership = await prisma.communityMember.findFirst({
      where: { user_id: userId }
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of a community.'
      });
    }

    // Retrieve pricing config
    const config = await prisma.communityPricingConfig.findUnique({
      where: { plan_type: planType }
    });

    if (!config) {
      return res.status(404).json({ success: false, message: 'Plan configuration not found' });
    }

    let price = Number(config.base_price);
    let maxMembers = config.max_members;

    if (planType === 'Custom') {
      if (!memberCount) {
        return res.status(400).json({ success: false, message: 'Member count is required for Custom plan' });
      }
      price = Number(config.base_price) + (Number(memberCount) * Number(config.per_member_price));
      maxMembers = Number(memberCount);
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(503).json({ success: false, message: 'Razorpay keys are not configured' });
    }

    // Call Razorpay API
    const amountInPaise = Math.round(price * 100);
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `community_sub_${userId}_${Date.now()}`,
        notes: {
          userId: String(userId),
          planType,
          maxMembers: String(maxMembers)
        }
      })
    });

    const orderData = await response.json();

    if (!response.ok || !orderData.id) {
      throw new Error(orderData.error?.description || 'Razorpay order creation failed');
    }

    // Create community subscription record
    await prisma.communitySubscription.create({
      data: {
        user_id: userId,
        plan_type: planType,
        max_members: maxMembers,
        price: price,
        currency: 'INR',
        razorpay_order_id: orderData.id,
        status: 'pending'
      }
    });

    res.json({
      success: true,
      keyId,
      order: {
        id: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency
      }
    });
  } catch (error) {
    console.error('[Community] Create order error:', error.message);
    captureError(error, { action: 'community_order_creation_failed', extra: { userId: req.user.id } });
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/community/verify-payment
 * Verify Razorpay payment and create the community
 */
const verifyPaymentValidation = [
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Signature is required'),
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Community name must be between 3 and 100 characters'),
  body('description').optional().trim(),
  validateRequest
];

router.post('/verify-payment', authenticateUser, verifyPaymentValidation, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, name, description } = req.body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(503).json({ success: false, message: 'Razorpay keys are not configured' });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.warn(`[Community] Invalid signature for Order: ${razorpay_order_id}`);
      await prisma.communitySubscription.updateMany({
        where: { razorpay_order_id },
        data: { status: 'failed', updated_at: new Date() }
      });
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Retrieve pending subscription
    const subscription = await prisma.communitySubscription.findUnique({
      where: { razorpay_order_id }
    });

    if (!subscription || subscription.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending subscription found for this order' });
    }

    // Create community in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Community
      const community = await tx.community.create({
        data: {
          name,
          description: description || '',
          owner_id: userId,
          max_members: subscription.max_members
        }
      });

      // 2. Add Owner as a Member
      await tx.communityMember.create({
        data: {
          community_id: community.id,
          user_id: userId,
          role: 'Owner'
        }
      });

      // 3. Create General Conversation
      const conversation = await tx.conversation.create({
        data: {
          is_group: true,
          name: 'General',
          members: {
            create: [
              { user_id: userId, role: 'Director' }
            ]
          }
        }
      });

      // 4. Create Community Group mapping
      await tx.communityGroup.create({
        data: {
          community_id: community.id,
          conversation_id: conversation.id,
          name: 'General'
        }
      });

      // 5. Update Subscription to Active
      await tx.communitySubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          community_id: community.id,
          razorpay_payment_id,
          razorpay_signature
        }
      });

      return community;
    });

    res.status(201).json({
      success: true,
      message: 'Community created successfully',
      data: result
    });
  } catch (error) {
    console.error('[Community] Verify payment error:', error.message);
    captureError(error, { action: 'community_payment_verification_failed', extra: { body: req.body } });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/community/dashboard
 * Fetch stats for community dashboard (Owner/Moderator only)
 */
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    // Find the community where user is owner or moderator
    const membership = await prisma.communityMember.findFirst({
      where: {
        user_id: userId,
        role: { in: ['Owner', 'Moderator'] }
      },
      include: {
        community: {
          include: {
            members: true,
            groups: true
          }
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied: Community Management permissions required' });
    }

    const { community } = membership;
    const activeSub = await prisma.communitySubscription.findFirst({
      where: { community_id: community.id, status: 'active' },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: {
        communityId: community.id,
        name: community.name,
        description: community.description,
        avatar_url: community.avatar_url,
        banner_url: community.banner_url,
        owner_id: community.owner_id,
        max_members: community.max_members,
        memberCount: community.members.length,
        groupCount: community.groups.length,
        planType: activeSub ? activeSub.plan_type : 'Free',
        price: activeSub ? activeSub.price : 0
      }
    });
  } catch (error) {
    console.error('[Community] Get dashboard error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/community/members
 * Get list of community members
 */
router.get('/members', authenticateUser, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    // Find caller's community
    const myMembership = await prisma.communityMember.findFirst({
      where: { user_id: userId }
    });

    if (!myMembership) {
      return res.status(400).json({ success: false, message: 'You are not a member of any community' });
    }

    const members = await prisma.communityMember.findMany({
      where: { community_id: myMembership.community_id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar_url: true
          }
        }
      }
    });

    res.json({ success: true, data: members });
  } catch (error) {
    console.error('[Community] Get members error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/community/members/invite
 * Invite a user by email to join the community (Owner/Moderator only)
 */
const inviteMemberValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  validateRequest
];

router.post('/members/invite', authenticateUser, inviteMemberValidation, async (req, res) => {
  try {
    const callerId = Number(req.user.id);
    const { email } = req.body;

    // Verify caller is Owner or Moderator
    const myMembership = await prisma.communityMember.findFirst({
      where: {
        user_id: callerId,
        role: { in: ['Owner', 'Moderator'] }
      },
      include: {
        community: {
          include: {
            members: true,
            groups: true
          }
        }
      }
    });

    if (!myMembership) {
      return res.status(403).json({ success: false, message: 'Access denied: Community Management permissions required' });
    }

    const { community } = myMembership;

    // Check community capacity limit
    if (community.members.length >= community.max_members) {
      return res.status(400).json({
        success: false,
        message: `Community membership limit reached (${community.max_members} max). Please upgrade your subscription.`
      });
    }

    // Find invitee user
    const targetUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Crew member with this email not found' });
    }

    // Check if user is already in a community
    const targetMembership = await prisma.communityMember.findFirst({
      where: { user_id: targetUser.id }
    });

    if (targetMembership) {
      return res.status(400).json({
        success: false,
        message: 'This crew member is already a member of a community.'
      });
    }

    // Add member to community & General group in transaction
    const generalGroup = community.groups.find(g => g.name === 'General');

    await prisma.$transaction(async (tx) => {
      // Add CommunityMember record
      await tx.communityMember.create({
        data: {
          community_id: community.id,
          user_id: targetUser.id,
          role: 'Member'
        }
      });

      // Add to General Conversation
      if (generalGroup) {
        await tx.conversationMember.create({
          data: {
            conversation_id: generalGroup.conversation_id,
            user_id: targetUser.id,
            role: 'Member'
          }
        });
      }
    });

    res.json({
      success: true,
      message: `${targetUser.name} has been added to the community.`
    });
  } catch (error) {
    console.error('[Community] Invite member error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * DELETE /api/community/members/:userId
 * Remove a user from the community (Owner/Moderator rules apply)
 */
router.delete('/members/:userId', authenticateUser, async (req, res) => {
  try {
    const callerId = Number(req.user.id);
    const targetUserId = Number(req.params.userId);

    if (callerId === targetUserId) {
      return res.status(400).json({ success: false, message: 'You cannot remove yourself. Community Owners must delete or transfer community.' });
    }

    // Get caller's membership
    const callerMembership = await prisma.communityMember.findFirst({
      where: { user_id: callerId }
    });

    if (!callerMembership || !['Owner', 'Moderator'].includes(callerMembership.role)) {
      return res.status(403).json({ success: false, message: 'Access denied: Community Management permissions required' });
    }

    // Get target's membership
    const targetMembership = await prisma.communityMember.findFirst({
      where: {
        user_id: targetUserId,
        community_id: callerMembership.community_id
      }
    });

    if (!targetMembership) {
      return res.status(404).json({ success: false, message: 'Member not found in your community' });
    }

    // Role hierarchies:
    // Owner can remove anyone (except self)
    // Moderator can remove Member but NOT Owner or another Moderator
    if (callerMembership.role === 'Moderator' && ['Owner', 'Moderator'].includes(targetMembership.role)) {
      return res.status(403).json({ success: false, message: 'Access denied: Moderators cannot remove other moderators or owners' });
    }

    // Find all group conversation IDs for this community
    const communityGroups = await prisma.communityGroup.findMany({
      where: { community_id: callerMembership.community_id },
      select: { conversation_id: true }
    });
    const conversationIds = communityGroups.map(g => g.conversation_id);

    // Remove from community and conversations in transaction
    await prisma.$transaction([
      // Remove from CommunityMember
      prisma.communityMember.delete({
        where: { id: targetMembership.id }
      }),
      // Remove from ConversationMember for all community groups
      prisma.conversationMember.deleteMany({
        where: {
          user_id: targetUserId,
          conversation_id: { in: conversationIds }
        }
      })
    ]);

    res.json({ success: true, message: 'Member successfully removed from the community' });
  } catch (error) {
    console.error('[Community] Remove member error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/community/groups
 * Create a new group inside the community (Owner/Moderator only)
 */
const createGroupValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Group name must be between 2 and 100 characters'),
  validateRequest
];

router.post('/groups', authenticateUser, createGroupValidation, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { name } = req.body;

    // Find user's membership and check if Owner/Moderator
    const myMembership = await prisma.communityMember.findFirst({
      where: {
        user_id: userId,
        role: { in: ['Owner', 'Moderator'] }
      },
      include: {
        community: {
          include: {
            groups: true,
            members: true
          }
        }
      }
    });

    if (!myMembership) {
      return res.status(403).json({ success: false, message: 'Access denied: Community Management permissions required' });
    }

    const { community } = myMembership;

    // Limit check: max 50 groups
    if (community.groups.length >= 50) {
      return res.status(400).json({ success: false, message: 'Maximum limit of 50 groups reached' });
    }

    // Create group conversation with all community members added
    const memberIds = community.members.map(m => m.user_id);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Conversation
      const conversation = await tx.conversation.create({
        data: {
          is_group: true,
          name: name,
          members: {
            create: memberIds.map(id => ({
              user_id: id,
              role: id === userId ? 'Director' : 'Member'
            }))
          }
        }
      });

      // 2. Create Community Group mapping
      const communityGroup = await tx.communityGroup.create({
        data: {
          community_id: community.id,
          conversation_id: conversation.id,
          name: name
        },
        include: {
          conversation: true
        }
      });

      return communityGroup;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('[Community] Create group error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * DELETE /api/community/groups/:groupId
 * Delete a group from the community (Owner/Moderator only, except General)
 */
router.delete('/groups/:groupId', authenticateUser, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const groupId = Number(req.params.groupId);

    // Verify caller has permissions
    const myMembership = await prisma.communityMember.findFirst({
      where: {
        user_id: userId,
        role: { in: ['Owner', 'Moderator'] }
      }
    });

    if (!myMembership) {
      return res.status(403).json({ success: false, message: 'Access denied: Community Management permissions required' });
    }

    // Find the community group
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId }
    });

    if (!group || group.community_id !== myMembership.community_id) {
      return res.status(404).json({ success: false, message: 'Group not found in your community' });
    }

    if (group.name === 'General') {
      return res.status(400).json({ success: false, message: 'The General announcement channel cannot be deleted' });
    }

    // Delete community group and cascade the conversation deletion
    await prisma.$transaction([
      prisma.communityGroup.delete({
        where: { id: groupId }
      }),
      prisma.conversation.delete({
        where: { id: group.conversation_id }
      })
    ]);

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('[Community] Delete group error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
