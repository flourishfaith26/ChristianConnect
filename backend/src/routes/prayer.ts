import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { PrayerReactionType } from '@prisma/client';
import { moderateText } from '../services/moderationService';

import { store, savePersistentStore } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

// ─── GET /api/prayer ─── Prayer wall feed ─────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      const enrichedRequests = (store.prayerRequests || []).map((r) => {
        if (r.isAnonymous) return r;
        const isMe = r.author?.id === 'dev_db_user_123' || r.author?.id === store.user?.id || r.author?.displayName === store.user?.displayName;
        if (isMe) {
          return {
            ...r,
            author: {
              ...r.author,
              displayName: store.user?.displayName || r.author?.displayName || 'Flourish Faith',
              avatarUrl: store.user?.avatarUrl || r.author?.avatarUrl || null,
            },
          };
        }
        return r;
      });
      res.json({ requests: enrichedRequests, hasMore: false });
      return;
    }

    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string || '20'), 50);
    const filterAnswered = req.query.answered === 'true';

    const requests = await prisma.prayerRequest.findMany({
      where: {
        moderationStatus: 'approved',
        ...(filterAnswered && { isAnswered: true }),
        ...(cursor && { id: { lt: cursor } }),
      },
      include: {
        author: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        reactions: {
          select: {
            type: true, userId: true, comment: true, createdAt: true,
            user: { select: { id: true, displayName: true } },
          },
        },
        _count: { select: { reactions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Mask author if anonymous
    const masked = requests.map((r) => ({
      ...r,
      author: r.isAnonymous ? null : r.author,
    }));

    res.json({ requests: masked, hasMore: requests.length === limit });
  } catch {
    res.json({ requests: store.prayerRequests, hasMore: false });
  }
});

// ─── POST /api/prayer ─── Create prayer request ──────────────────────────────
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { content, title, isAnonymous } = req.body;

    if (!content?.trim() || content.trim().length < 10) {
      res.status(400).json({ error: 'Prayer request must be at least 10 characters' }); return;
    }

    if (!isDbConnected()) {
      const newReq = {
        id: `prayer_dev_${Date.now()}`,
        title: title?.trim() || null,
        content: content.trim(),
        isAnonymous: isAnonymous ?? false,
        isAnswered: false,
        moderationStatus: 'approved',
        createdAt: new Date().toISOString(),
        author: isAnonymous ? null : {
          id: store.user?.id || 'dev_db_user_123',
          displayName: store.user?.displayName || 'Flourish Faith',
          avatarUrl: store.user?.avatarUrl || null,
        },
        reactions: [],
        _count: { reactions: 0 },
      };
      store.prayerRequests.unshift(newReq);
      savePersistentStore();
      res.status(201).json(newReq);
      return;
    }

    if (!content?.trim() || content.trim().length < 10) {
      res.status(400).json({ error: 'Prayer request must be at least 10 characters' }); return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { clerkId: req.userId }, select: { id: true } });
      const modResult = await moderateText(content);
      const request = await prisma.prayerRequest.create({
        data: {
          authorId: user?.id || req.dbUserId || 'dev_db_user_123',
          title: title?.trim() || null,
          content: content.trim(),
          isAnonymous: isAnonymous ?? false,
          moderationStatus: modResult.flagged ? 'auto_rejected' : 'approved',
          moderationReason: modResult.flagged ? modResult.categories.join(', ') : null,
        },
        include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
      });
      res.status(201).json(request);
    } catch {
      if (process.env.NODE_ENV === 'development') {
        const newReq = {
          id: `prayer_dev_${Date.now()}`,
          title: title?.trim() || null,
          content: content.trim(),
          isAnonymous: isAnonymous ?? false,
          isAnswered: false,
          moderationStatus: 'approved',
          createdAt: new Date().toISOString(),
          author: isAnonymous ? null : { id: 'dev_db_user_123', displayName: 'Flourish Faith', avatarUrl: null },
          reactions: [],
          _count: { reactions: 0 },
        };
        store.prayerRequests.unshift(newReq);
        savePersistentStore();
        res.status(201).json(newReq);
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/prayer/:id/answered ──────────────────────────────────────────
router.patch('/:id/answered', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    try {
      const user = await prisma.user.findUnique({ where: { clerkId: req.userId }, select: { id: true } });
      const request = await prisma.prayerRequest.findUnique({ where: { id: req.params.id } });

      if (request) {
        const updated = await prisma.prayerRequest.update({
          where: { id: req.params.id },
          data: { isAnswered: true, answeredAt: new Date() },
        });
        res.json(updated);
        return;
      }
    } catch {
      // Dev mode fallback
    }

    if (process.env.NODE_ENV === 'development') {
      const target = store.prayerRequests.find((p: any) => p.id === req.params.id);
      if (target) {
        target.isAnswered = true;
        savePersistentStore();
        res.json(target);
        return;
      }
    }

    res.status(404).json({ error: 'Prayer request not found' });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// ─── POST /api/prayer/:id/react ───────────────────────────────────────────────
router.post('/:id/react', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type, comment } = req.body;
    const validTypes = Object.values(PrayerReactionType);
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: 'Invalid reaction type. Use: praying, amen, comment' }); return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { clerkId: req.userId }, select: { id: true } });
      if (user) {
        let reaction;
        if (type !== 'comment') {
          reaction = await prisma.prayerReaction.upsert({
            where: {
              id: (await prisma.prayerReaction.findFirst({
                where: { prayerRequestId: req.params.id, userId: user.id, type },
              }))?.id ?? 'new',
            },
            create: { prayerRequestId: req.params.id, userId: user.id, type },
            update: {},
          });
        } else {
          reaction = await prisma.prayerReaction.create({
            data: { prayerRequestId: req.params.id, userId: user.id, type, comment: comment.trim() },
          });
        }
        res.status(201).json(reaction);
        return;
      }
    } catch {
      // Dev mode fallback
    }

    if (process.env.NODE_ENV === 'development') {
      const target = store.prayerRequests.find((p: any) => p.id === req.params.id);
      if (target) {
        target.reactions = target.reactions || [];
        target.reactions.push({
          type,
          userId: 'dev_db_user_123',
          comment: comment || (type === 'praying' ? 'Praying for you!' : 'Amen!'),
          createdAt: new Date().toISOString(),
          user: { id: 'dev_db_user_123', displayName: 'Flourish Faith' },
        });
        target._count = { reactions: target.reactions.length };
        savePersistentStore();
        res.status(201).json({ success: true });
        return;
      }
    }

    res.status(500).json({ error: 'Internal server error' });
  } catch (err) {
    console.error('[Prayer] react error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/prayer/partners ─── Browse for prayer partner matches ───────────
router.get('/partners', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json(store.prayerPartners);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: req.userId },
      select: { id: true, accountType: true },
    });
    if (!user) {
      res.json(store.prayerPartners);
      return;
    }
    if (user.accountType === 'minor_content_only') {
      res.status(403).json({ error: 'Prayer partner matching not available for this account type' }); return;
    }

    const partners = await prisma.userProfile.findMany({
      where: {
        openToPrayerPartner: true,
        userId: { not: user.id },
        user: { isBanned: false, accountType: { not: 'minor_content_only' } },
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true, bio: true } },
      },
      take: 20,
    });

    res.json(partners);
  } catch {
    res.json(store.prayerPartners);
  }
});

export default router;
