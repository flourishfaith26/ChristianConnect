import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { prisma } from '../lib/prisma';
import { processMessageModeration } from '../services/moderationService';

const router = Router();

// ─── POST /api/moderation/messages/:id/process ───────────────────────────────
/**
 * Internal endpoint to trigger moderation on a message.
 * Called by the backend itself after a message is saved.
 * Also exposed for admin retriggers.
 */
router.post(
  '/messages/:id/process',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const message = await prisma.message.findUnique({ where: { id } });
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      // Run moderation asynchronously — respond immediately
      processMessageModeration(id).catch((err) => {
        console.error(`[Moderation] Failed to process message ${id}:`, err);
      });

      res.json({ success: true, message: `Moderation triggered for message ${id}` });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
