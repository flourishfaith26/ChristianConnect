import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { store } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

// ─── GET /api/notifications ──────────────────────────────────────────────────
router.get('/', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json({ notifications: store.notifications, unreadCount: store.notifications.filter((n: any) => !n.isRead).length });
});

// ─── POST /api/notifications/fcm-token ───────────────────────────────────────
router.post('/fcm-token', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token, platform } = req.body;
    if (!token || !platform) {
      res.status(400).json({ error: 'token and platform are required' }); return;
    }

    if (!isDbConnected()) {
      res.json({ success: true });
      return;
    }

    const user = await prisma.user.findUnique({ where: { clerkId: req.userId }, select: { id: true } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    await prisma.fcmToken.upsert({
      where: { token },
      create: { userId: user.id, token, platform },
      update: { updatedAt: new Date() },
    });

    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// ─── DELETE /api/notifications/fcm-token ─────────────────────────────────────
router.delete('/fcm-token', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) { res.status(400).json({ error: 'token is required' }); return; }

    if (!isDbConnected()) {
      res.json({ success: true });
      return;
    }

    await prisma.fcmToken.deleteMany({ where: { token } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
