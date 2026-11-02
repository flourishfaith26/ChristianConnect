import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdult } from '../middleware/requireAdult';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(requireAuth, requireAdult);

// ─── POST /api/accountability/intake ─────────────────────────────────────────
/**
 * Submit / update accountability intake preferences
 */
router.post('/intake', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { focus, description, open } = req.body;

    const validFocus = ['purity', 'addiction_recovery', 'prayer_consistency', 'general_growth'];
    if (focus && !validFocus.includes(focus)) {
      res.status(400).json({ error: 'Invalid accountability focus area' });
      return;
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId: req.dbUserId! },
      create: {
        userId: req.dbUserId!,
        openToAccountability: open ?? true,
        accountabilityFocus: focus || null,
        accountabilityIntake: description || null,
      },
      update: {
        openToAccountability: open !== undefined ? open : true,
        accountabilityFocus: focus !== undefined ? focus : undefined,
        accountabilityIntake: description !== undefined ? description : undefined,
      },
    });

    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/accountability/status ──────────────────────────────────────────
/**
 * Check matching status or active partnerships
 */
router.get('/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.dbUserId! },
      include: {
        profile: true,
        accountabilitiesInitiated: {
          where: { status: 'active' },
          include: { receiver: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
        accountabilitiesReceived: {
          where: { status: 'active' },
          include: { initiator: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const partner = user.accountabilitiesInitiated[0]?.receiver ?? user.accountabilitiesReceived[0]?.initiator ?? null;
    res.json({ profile: user.profile, partner, activePartnership: user.accountabilitiesInitiated[0] ?? user.accountabilitiesReceived[0] ?? null });
  } catch {
    if (process.env.NODE_ENV === 'development') {
      res.json({
        profile: { openToAccountability: true, accountabilityFocus: 'general_growth' },
        partner: { id: 'user_friend_1', displayName: 'John Elder', avatarUrl: null },
        activePartnership: { id: 'acc_demo_1', status: 'active' },
      });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/accountability/match ──────────────────────────────────────────
/**
 * Triggers accountability matching logic:
 * Enforces same-gender-only pairing. Matches based on shared focus areas.
 */
router.post('/match', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.dbUserId! },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      res.status(400).json({ error: 'Please submit your intake preferences first.' });
      return;
    }

    // Check if they already have an active partnership
    const existing = await prisma.accountabilityPartnership.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, status: 'active' },
          { receiverId: user.id, status: 'active' },
        ],
      },
    });

    if (existing) {
      res.status(400).json({ error: 'You already have an active accountability partnership.' });
      return;
    }

    // Search for candidates of same gender, open to accountability, not matching self
    const matchFocus = user.profile.accountabilityFocus;
    const partner = await prisma.userProfile.findFirst({
      where: {
        openToAccountability: true,
        userId: { not: user.id },
        user: {
          gender: user.gender, // SAME GENDER ONLY
          isBanned: false,
          accountType: { not: 'minor_content_only' },
          // Check if target user has no active accountability partnership
          accountabilitiesInitiated: { none: { status: 'active' } },
          accountabilitiesReceived: { none: { status: 'active' } },
        },
        // Match focus if possible
        ...(matchFocus && { accountabilityFocus: matchFocus }),
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    if (!partner) {
      res.json({ success: false, message: 'We could not find an immediate same-gender match. We will notify you once a candidate becomes available.' });
      return;
    }

    // Create partnership record
    const partnership = await prisma.accountabilityPartnership.create({
      data: {
        initiatorId: user.id,
        receiverId: partner.userId,
        status: 'active',
      },
      include: {
        receiver: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    res.json({ success: true, partner: partnership.receiver, partnership });
  } catch (err) {
    console.error('[Accountability Match Error]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/accountability/close ──────────────────────────────────────────
/**
 * End an active partnership
 */
router.post('/close', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { partnershipId } = req.body;
    if (!partnershipId) {
      res.status(400).json({ error: 'partnershipId is required' });
      return;
    }

    const partnership = await prisma.accountabilityPartnership.findUnique({
      where: { id: partnershipId },
    });

    if (!partnership || (partnership.initiatorId !== req.dbUserId && partnership.receiverId !== req.dbUserId)) {
      res.status(403).json({ error: 'Not authorized to modify this partnership.' });
      return;
    }

    await prisma.accountabilityPartnership.update({
      where: { id: partnershipId },
      data: { status: 'closed' },
    });

    res.json({ success: true, message: 'Partnership closed.' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
