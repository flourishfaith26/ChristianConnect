import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { store } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

const SEED_FAMILY_DEVOTIONALS = [
  {
    id: 'fam_dev_1',
    title: 'Loving Your Spouse Like Christ Loves the Church',
    track: 'marriage',
    weekNumber: 1,
    scriptureRef: 'Ephesians 5:25-33',
    reflection: 'Marriage is a living testimony of Christ’s unconditional covenant love for His Church. Sacrificial love, forgiveness, and intentional honor strengthen your sacred bond.',
    discussionPoints: ['How can we show practical, sacrificial love to each other this week?', 'What prayer can we pray together tonight?'],
  },
  {
    id: 'fam_dev_2',
    title: 'Building a Grace-Filled Home & Parenting with Purpose',
    track: 'parenting',
    weekNumber: 1,
    scriptureRef: 'Deuteronomy 6:6-7',
    reflection: 'Parenting is a spiritual stewardship. Raising children in faith happens in everyday moments — at mealtime, bedtime, and daily conversations.',
    discussionPoints: ['How do we model Christ’s patience when disciplining?', 'What family prayer routine can we establish starting today?'],
  },
];

// ─── GET /api/family-devotionals ─────────────────────────────────────────────
/**
 * List married couples and family/parenting devotional tracks.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { track } = req.query;

    if (!isDbConnected()) {
      let filtered = SEED_FAMILY_DEVOTIONALS;
      if (track) filtered = filtered.filter(d => d.track === track);
      res.json(filtered);
      return;
    }

    let devotionals = await prisma.familyDevotional.findMany({
      where: {
        ...(track && { track: track as string }),
      },
      orderBy: { weekNumber: 'asc' },
    });

    if (devotionals.length === 0) {
      await prisma.familyDevotional.createMany({
        data: SEED_FAMILY_DEVOTIONALS.map(d => ({
          ...d,
          discussionPoints: d.discussionPoints as any,
        })),
      });
      devotionals = await prisma.familyDevotional.findMany({
        where: { ...(track && { track: track as string }) },
        orderBy: { weekNumber: 'asc' },
      });
    }

    res.json(devotionals);
  } catch (err) {
    let filtered = SEED_FAMILY_DEVOTIONALS;
    if (req.query.track) filtered = filtered.filter(d => d.track === req.query.track);
    res.json(filtered);
  }
});

export default router;
