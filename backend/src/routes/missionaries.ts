import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { store } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

const SEED_MISSIONARIES = [
  {
    id: 'mission_1',
    name: 'David & Hannah Miller',
    organization: 'Global Field Missions',
    location: 'Chiang Mai, Thailand',
    bio: 'Serving unreached communities through local church planting, clean water initiatives, and youth discipleship programs.',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    prayerNeeds: ['For safety and wisdom during regional travel', 'For open hearts among local youth', 'For health and strength for our family'],
    givingUrl: 'https://christianconnect.app/giving',
    isVerified: true,
  },
  {
    id: 'mission_2',
    name: 'Grace Children Ministry',
    organization: 'Hope Africa Network',
    location: 'Nairobi, Kenya',
    bio: 'Providing Christian education, daily meals, and spiritual mentorship to over 400 orphaned children in Nairobi.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    prayerNeeds: ['Sufficient food supply for the new school term', 'Health and protection for staff and teachers', 'Provision for secondary school scholarships'],
    givingUrl: 'https://christianconnect.app/giving',
    isVerified: true,
  },
];

// ─── GET /api/missionaries ───────────────────────────────────────────────────
/**
 * Missionary / Ministry Spotlight Feed.
 */
router.get('/', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json(SEED_MISSIONARIES);
      return;
    }

    let missionaries = await prisma.missionary.findMany({
      where: { isVerified: true },
      orderBy: { createdAt: 'desc' },
    });

    if (missionaries.length === 0) {
      await prisma.missionary.createMany({
        data: SEED_MISSIONARIES.map(m => ({
          ...m,
          prayerNeeds: m.prayerNeeds as any,
        })),
      });
      missionaries = await prisma.missionary.findMany({
        where: { isVerified: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(missionaries);
  } catch (err) {
    res.json(SEED_MISSIONARIES);
  }
});

export default router;
