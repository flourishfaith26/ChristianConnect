import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { askFaithChat } from '../services/faithChatService';

const router = Router();
router.use(requireAuth);

// ─── POST /api/faith-chat/ask ────────────────────────────────────────────────
/**
 * Ask a theological question to Faith Chat AI (Claude API)
 */
router.post('/ask', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      res.status(400).json({ error: 'question is required' });
      return;
    }

    const result = await askFaithChat(question);

    res.json(result);
  } catch (err) {
    console.error('[FaithChat Route Error]', err);
    res.status(500).json({ error: 'Failed to process faith chat request.' });
  }
});

export default router;
