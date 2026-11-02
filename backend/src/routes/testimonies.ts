import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { store, savePersistentStore } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

// ─── GET /api/testimonies ────────────────────────────────────────────────────
/**
 * Retrieve testimonies with author details and flat encouragements
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      const enriched = (store.testimonies || []).map((t) => {
        const isMe = t.authorId === 'dev_db_user_123' || t.author?.id === store.user?.id || t.author?.displayName === store.user?.displayName;
        if (isMe) {
          return {
            ...t,
            author: {
              ...t.author,
              displayName: store.user?.displayName || t.author?.displayName || 'Flourish Faith',
              avatarUrl: store.user?.avatarUrl || t.author?.avatarUrl || null,
            },
          };
        }
        return t;
      });
      res.json(enriched);
      return;
    }
    const testimonies = await prisma.testimony.findMany({
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        encouragements: {
          include: {
            author: { select: { id: true, displayName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(testimonies);
  } catch {
    if (process.env.NODE_ENV === 'development') {
      res.json([
        {
          id: 'testimony_demo_1',
          title: 'God Restored My Marriage & Faith',
          content: 'Through prayer and counseling, God worked a miracle in our family. Never give up hope!',
          authorId: store.user?.id || 'dev_db_user_123',
          author: { id: store.user?.id || 'dev_db_user_123', displayName: store.user?.displayName || 'Flourish Faith', avatarUrl: store.user?.avatarUrl || null },
          encouragements: [
            {
              id: 'enc_1',
              content: 'Praise God! What an inspiring testimony.',
              author: { id: 'user_friend_1', displayName: 'John Elder', avatarUrl: null },
            },
          ],
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/testimonies ───────────────────────────────────────────────────
/**
 * Post a testimony
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;

    if (!title || !content || !title.trim() || !content.trim()) {
      res.status(400).json({ error: 'title and content are required' });
      return;
    }

    if (!isDbConnected()) {
      const newTestimony = {
        id: `testimony_dev_${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        authorId: store.user?.id || 'dev_db_user_123',
        author: {
          id: store.user?.id || 'dev_db_user_123',
          displayName: store.user?.displayName || 'Flourish Faith',
          avatarUrl: store.user?.avatarUrl || null,
        },
        encouragements: [],
        createdAt: new Date().toISOString(),
      };
      if (!Array.isArray(store.testimonies)) {
        store.testimonies = [];
      }
      store.testimonies.unshift(newTestimony);
      savePersistentStore();
      res.status(201).json(newTestimony);
      return;
    }

    const testimony = await prisma.testimony.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId: req.dbUserId!,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        encouragements: true,
      },
    });

    res.status(201).json(testimony);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/testimonies/:id/encourage ──────────────────────────────────────
/**
 * Post an encouragement (flat comment, replies/debate threads are strictly disabled)
 */
router.post('/:id/encourage', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const testimony = await prisma.testimony.findUnique({
      where: { id: req.params.id },
    });

    if (!testimony) {
      res.status(404).json({ error: 'Testimony not found' });
      return;
    }

    const encouragement = await prisma.testimonyEncouragement.create({
      data: {
        content: content.trim(),
        testimonyId: req.params.id,
        authorId: req.dbUserId!,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    res.status(201).json(encouragement);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
