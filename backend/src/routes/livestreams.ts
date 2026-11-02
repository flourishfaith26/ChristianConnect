import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdult } from '../middleware/requireAdult';
import { prisma, isDbConnected } from '../lib/prisma';
import { store } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

// ─── GET /api/livestreams ───────────────────────────────────────────────────
/**
 * List active and recent live streams.
 */
router.get('/', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json(store.livestreams);
      return;
    }

    const streams = await prisma.liveStream.findMany({
      include: {
        host: { select: { id: true, displayName: true, avatarUrl: true, accountType: true } },
      },
      orderBy: [{ isLive: 'desc' }, { startedAt: 'desc' }],
      take: 20,
    });
    res.json(streams);
  } catch {
    res.json(store.livestreams);
  }
});

// ─── POST /api/livestreams ──────────────────────────────────────────────────
/**
 * Create a live stream session.
 */
router.post('/', requireAdult, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, streamUrl } = req.body;

    if (!title?.trim()) {
      res.status(400).json({ error: 'Title is required' }); return;
    }

    const defaultUrl = streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    const stream = await prisma.liveStream.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        streamUrl: defaultUrl,
        hostId: req.dbUserId!,
        isLive: true,
      },
      include: { host: { select: { id: true, displayName: true, avatarUrl: true } } },
    });

    res.status(201).json(stream);
  } catch (err) {
    console.error('[LiveStreams] create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/livestreams/:id ────────────────────────────────────────────────
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stream = await prisma.liveStream.findUnique({
      where: { id: req.params.id },
      include: { host: { select: { id: true, displayName: true, avatarUrl: true } } },
    });

    if (!stream) { res.status(404).json({ error: 'Stream not found' }); return; }
    res.json(stream);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/livestreams/:id/status ───────────────────────────────────────
/**
 * Start or stop a live stream session.
 */
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { isLive } = req.body;
    const stream = await prisma.liveStream.findUnique({ where: { id: req.params.id } });
    if (!stream) { res.status(404).json({ error: 'Stream not found' }); return; }
    if (stream.hostId !== req.dbUserId) { res.status(403).json({ error: 'Not authorized' }); return; }

    const updated = await prisma.liveStream.update({
      where: { id: req.params.id },
      data: {
        isLive: Boolean(isLive),
        ...(!isLive && { endedAt: new Date() }),
      },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
