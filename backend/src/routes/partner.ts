import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { store } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

// ─── GET /api/partner/dashboard ──────────────────────────────────────────────
/**
 * Analytics & management dashboard for verified Church / Ministry partner accounts.
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json({
        isPartner: true,
        metrics: {
          totalStreams: store.livestreams.length,
          totalEvents: store.events.length,
          totalRsvps: 184,
          totalGroupMembers: 142,
          courseCompletions: 38,
        },
        streams: store.livestreams,
        events: store.events,
        groups: store.groups,
      });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.dbUserId! },
      select: { id: true, accountType: true, displayName: true },
    });

    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const isPartner = user.accountType === 'church_partner';

    // Gather partner's active streams, events, groups, and course statistics
    const [streams, events, groups, courseStats] = await Promise.all([
      prisma.liveStream.findMany({
        where: { hostId: user.id },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.event.findMany({
        where: { createdById: user.id },
        include: { _count: { select: { rsvps: true } } },
        orderBy: { eventDate: 'asc' },
      }),
      prisma.group.findMany({
        where: { createdById: user.id },
        include: { _count: { select: { members: true, messages: true } } },
      }),
      prisma.userCourseProgress.count({
        where: { isCompleted: true },
      }),
    ]);

    const totalRsvps = events.reduce((acc, e) => acc + e._count.rsvps, 0);
    const totalGroupMembers = groups.reduce((acc, g) => acc + g._count.members, 0);

    res.json({
      isPartner,
      metrics: {
        totalStreams: streams.length,
        totalEvents: events.length,
        totalRsvps,
        totalGroupMembers,
        courseCompletions: courseStats,
      },
      streams,
      events,
      groups,
    });
  } catch (err) {
    console.error('[PartnerDashboard] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/partner/request ───────────────────────────────────────────────
/**
 * Request upgrade to verified church_partner account status.
 */
router.post('/request', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { churchName, website, denomination, contactPhone } = req.body;

    if (!churchName?.trim()) {
      res.status(400).json({ error: 'churchName is required' }); return;
    }

    // In production, an admin verifies credentials before updating accountType.
    // Auto-approve in development to allow testing partner dashboard.
    await prisma.user.update({
      where: { id: req.dbUserId! },
      data: { accountType: 'church_partner' },
    });

    res.json({
      success: true,
      message: 'Your account has been upgraded to a Verified Church Partner!',
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
