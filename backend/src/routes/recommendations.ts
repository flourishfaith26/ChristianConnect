import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma } from '../lib/prisma';
import { RecommendationType } from '@prisma/client';

const router = Router();
router.use(requireAuth);

// Default seed content items if DB recommendations are empty
const DEFAULT_RECOMMENDATIONS = [
  {
    id: 'rec-1',
    title: 'Defending the Faith: Evidence for the Resurrection',
    type: 'apologetics' as RecommendationType,
    category: 'Apologetics',
    tags: ['apologetics', 'resurrection', 'evidences'],
    summary: 'Historical and textual evidence for the resurrection of Jesus Christ.',
    url: '/apologetics',
  },
  {
    id: 'rec-2',
    title: 'New Believer Guide: 5 Foundations of Christian Growth',
    type: 'devotional' as RecommendationType,
    category: 'New Convert',
    tags: ['new_convert', 'basics', 'discipleship'],
    summary: 'Essential daily practices for building a strong foundation in Christ.',
    url: '/mentorship',
  },
  {
    id: 'rec-3',
    title: 'Scripture Memory: Hiding God’s Word in Your Heart',
    type: 'article' as RecommendationType,
    category: 'Scripture',
    tags: ['scripture', 'memory', 'psalms'],
    summary: 'Practical tools and techniques for memorizing key Bible passages.',
    url: '/verse-challenge',
  },
  {
    id: 'rec-4',
    title: 'Christ-Centered Relationships & Marriage',
    type: 'article' as RecommendationType,
    category: 'Relationships',
    tags: ['dating', 'marriage', 'relationships', 'purity'],
    summary: 'Biblical wisdom on navigating courtship, marriage, and intentional relationships.',
    url: '/dating',
  },
  {
    id: 'rec-5',
    title: 'Effective Prayer: Walking Closely with God Daily',
    type: 'devotional' as RecommendationType,
    category: 'Prayer',
    tags: ['prayer', 'accountability', 'devotion'],
    summary: 'How to build a consistent, deeply rewarding prayer life.',
    url: '/prayer',
  },
];

// ─── GET /api/recommendations ────────────────────────────────────────────────
/**
 * Rule-based recommendation engine.
 * Computes user interest tags based on:
 * 1. User's joined groups & active sections
 * 2. `UserActivityTag` interaction scores
 * Returns ranked content recommendations.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // 1. Gather user's activity tags
    const activityTags = await prisma.userActivityTag.findMany({
      where: { userId: req.dbUserId! },
      orderBy: { score: 'desc' },
      take: 10,
    });
    const userTagScores = new Map(activityTags.map(t => [t.tag, t.score]));

    // 2. Gather user's group types for implicit interest rules
    const userMemberships = await prisma.groupMember.findMany({
      where: { userId: req.dbUserId!, isPending: false },
      include: { group: { select: { type: true, studyFocus: true } } },
    });

    for (const m of userMemberships) {
      const type = m.group.type;
      userTagScores.set(type, (userTagScores.get(type) ?? 0) + 2);
      if (m.group.studyFocus) {
        userTagScores.set(m.group.studyFocus.toLowerCase(), (userTagScores.get(m.group.studyFocus.toLowerCase()) ?? 0) + 2);
      }
    }

    // 3. Fetch active recommendations from DB or fallback
    const dbRecs = await prisma.contentRecommendation.findMany({
      where: { isActive: true },
      take: 20,
    });

    const candidatePool = dbRecs.length > 0 ? dbRecs : DEFAULT_RECOMMENDATIONS;

    // 4. Rank candidate items by matching score
    const ranked = candidatePool.map(item => {
      let score = 1; // baseline
      for (const tag of item.tags) {
        if (userTagScores.has(tag)) {
          score += userTagScores.get(tag)!;
        }
      }
      return { ...item, relevanceScore: score };
    });

    ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({ recommendations: ranked });
  } catch (err) {
    console.error('[Recommendations] feed error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/recommendations/activity ─────────────────────────────────────
/**
 * Record a user interaction tag to personalize future recommendations.
 */
router.post('/activity', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tag } = req.body;
    if (!tag?.trim()) {
      res.status(400).json({ error: 'tag is required' }); return;
    }

    const cleanTag = tag.trim().toLowerCase();

    await prisma.userActivityTag.upsert({
      where: { userId_tag: { userId: req.dbUserId!, tag: cleanTag } },
      create: { userId: req.dbUserId!, tag: cleanTag, score: 1 },
      update: { score: { increment: 1 } },
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
