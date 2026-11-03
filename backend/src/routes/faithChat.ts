import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { askFaithChat } from '../services/faithChatService';

const router = Router();
router.use(requireAuth);

// ─── Rate Limiter for AI / FaithChat Endpoint ────────────────────────────────
const faithChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10,             // Max 10 queries per minute per IP / client
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many theological questions asked. Please pause for a moment before asking again.',
  },
  keyGenerator: (req) => {
    // Rate limit per authenticated user if available, fallback to IP
    return (req as AuthenticatedRequest).userId || req.ip || 'anonymous';
  },
});

// ─── POST /api/faith-chat/ask ────────────────────────────────────────────────
/**
 * Ask a theological question to Faith Chat AI (Claude API)
 */
router.post('/ask', faithChatLimiter, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
