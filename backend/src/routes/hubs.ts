import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(requireAuth);

// ─── GET /api/hubs ───────────────────────────────────────────────────────────
/**
 * Retrieve users and groups residing/matching in the same city/region
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.dbUserId! },
      select: { city: true, region: true },
    });

    if (!user || (!user.city && !user.region)) {
      res.json({ users: [], groups: [], message: 'Please set your city and region to view your hub.' });
      return;
    }

    const { city, region } = user;

    // Search users in the same area
    const usersInArea = await prisma.user.findMany({
      where: {
        id: { not: req.dbUserId! },
        isBanned: false,
        accountType: { not: 'minor_content_only' },
        OR: [
          ...(city ? [{ city: { equals: city, mode: 'insensitive' as any } }] : []),
          ...(region ? [{ region: { equals: region, mode: 'insensitive' as any } }] : []),
        ],
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        city: true,
        region: true,
        profile: { select: { denomination: true } },
      },
      take: 15,
    });

    // Search groups in the same area
    const groupsInArea = await prisma.group.findMany({
      where: {
        isPrivate: false,
        OR: [
          ...(city ? [{ description: { contains: city, mode: 'insensitive' as any } }] : []),
          ...(region ? [{ description: { contains: region, mode: 'insensitive' as any } }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        _count: { select: { members: true } },
      },
      take: 10,
    });

    res.json({
      city,
      region,
      users: usersInArea,
      groups: groupsInArea,
    });
  } catch (err) {
    console.error('[Hubs Error]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/hubs/location ─────────────────────────────────────────────────
/**
 * Update city and region location fields
 */
router.post('/location', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { city, region } = req.body;

    if (!city?.trim() || !region?.trim()) {
      res.status(400).json({ error: 'city and region are required' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.dbUserId! },
      data: {
        city: city.trim(),
        region: region.trim(),
      },
      select: { id: true, city: true, region: true },
    });

    res.json({ success: true, user: updated });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
