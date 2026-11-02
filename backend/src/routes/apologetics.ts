import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { prisma, isDbConnected } from '../lib/prisma';
import { store } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

const VALID_TOPICS = [
  'existence_of_god',
  'problem_of_evil',
  'resurrection_evidence',
  'science_and_faith',
  'textual_reliability',
  'comparative_religion',
];

// ─── GET /api/apologetics/questions ──────────────────────────────────────────
/**
 * Retrieve apologetics questions, optionally filtered by topic
 */
router.get('/questions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json(store.apologetics);
      return;
    }

    const { topic } = req.query;

    if (topic && !VALID_TOPICS.includes(topic as string)) {
      res.status(400).json({ error: 'Invalid apologetics topic' });
      return;
    }

    const questions = await prisma.apologeticsQuestion.findMany({
      where: {
        ...(topic && { topic: topic as string }),
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true, isTrustedApologist: true } },
        _count: { select: { answers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(questions);
  } catch {
    res.json(store.apologetics);
  }
});

// ─── POST /api/apologetics/questions ─────────────────────────────────────────
/**
 * Create a new question
 */
router.post('/questions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content, topic } = req.body;

    if (!title || !content || !topic) {
      res.status(400).json({ error: 'title, content, and topic are required' });
      return;
    }

    if (!VALID_TOPICS.includes(topic)) {
      res.status(400).json({ error: 'Invalid apologetics topic' });
      return;
    }

    const question = await prisma.apologeticsQuestion.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        topic,
        authorId: req.dbUserId!,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true, isTrustedApologist: true } },
      },
    });

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/apologetics/questions/:id ──────────────────────────────────────
router.get('/questions/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const question = await prisma.apologeticsQuestion.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true, isTrustedApologist: true } },
        answers: {
          include: {
            author: { select: { id: true, displayName: true, avatarUrl: true, isTrustedApologist: true } },
            _count: { select: { votes: true } },
          },
          orderBy: { upvotes: 'desc' },
        },
      },
    });

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json(question);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/apologetics/questions/:id/answers ─────────────────────────────
/**
 * Answer a question
 */
router.post('/questions/:id/answers', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const question = await prisma.apologeticsQuestion.findUnique({
      where: { id: req.params.id },
    });

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    const answer = await prisma.apologeticsAnswer.create({
      data: {
        content: content.trim(),
        questionId: req.params.id,
        authorId: req.dbUserId!,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true, isTrustedApologist: true } },
      },
    });

    res.status(201).json(answer);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/apologetics/answers/:id/vote ──────────────────────────────────
/**
 * Upvote or downvote an answer. Enforces one vote per user per answer.
 */
router.post('/answers/:id/vote', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { value } = req.body; // 1 (upvote) or -1 (downvote)

    if (value !== 1 && value !== -1) {
      res.status(400).json({ error: 'Value must be 1 or -1' });
      return;
    }

    const answer = await prisma.apologeticsAnswer.findUnique({
      where: { id: req.params.id },
    });

    if (!answer) {
      res.status(404).json({ error: 'Answer not found' });
      return;
    }

    // Upsert vote
    const vote = await prisma.apologeticsAnswerVote.upsert({
      where: {
        answerId_userId: {
          answerId: req.params.id,
          userId: req.dbUserId!,
        },
      },
      create: {
        answerId: req.params.id,
        userId: req.dbUserId!,
        value,
      },
      update: {
        value,
      },
    });

    // Recalculate upvotes sum for the answer
    const votesSum = await prisma.apologeticsAnswerVote.aggregate({
      where: { answerId: req.params.id },
      _sum: { value: true },
    });

    const totalUpvotes = votesSum._sum.value ?? 0;

    await prisma.apologeticsAnswer.update({
      where: { id: req.params.id },
      data: { upvotes: totalUpvotes },
    });

    res.json({ success: true, vote, totalUpvotes });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/apologetics/assign-badge (Admin-Only) ──────────────────────────
/**
 * Admin endpoint to toggle "Trusted Apologist" badge on a user
 */
router.post('/assign-badge', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { targetUserId, isTrusted } = req.body;

    if (!targetUserId) {
      res.status(400).json({ error: 'targetUserId is required' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isTrustedApologist: isTrusted ?? true },
      select: { id: true, displayName: true, isTrustedApologist: true },
    });

    res.json({ success: true, user: updatedUser });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
