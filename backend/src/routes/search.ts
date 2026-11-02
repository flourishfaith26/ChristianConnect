import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(requireAuth);

// ─── GET /api/search ──────────────────────────────────────────────────────────
/**
 * Searches across Groups, ApologeticsQuestions, and Testimonies concurrently
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string | undefined;

    if (!query || !query.trim()) {
      res.status(400).json({ error: 'Search query parameter "q" is required' });
      return;
    }

    const searchTerm = query.trim();

    // Query groups, apologetics questions, and testimonies concurrently using Prisma contains
    const [groups, questions, testimonies] = await Promise.all([
      prisma.group.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isPrivate: false,
        },
        select: { id: true, name: true, description: true, type: true },
        take: 10,
      }),
      prisma.apologeticsQuestion.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, topic: true, createdAt: true },
        take: 10,
      }),
      prisma.testimony.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, createdAt: true },
        take: 10,
      }),
    ]);

    res.json({
      groups,
      apologeticsQuestions: questions,
      testimonies,
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      res.json({
        groups: [
          { id: 'group_demo_1', name: 'The Joshua Generation', description: 'Young believers group', type: 'friendship' },
        ],
        apologeticsQuestions: [
          { id: 'q_demo_1', title: 'Why does God allow suffering?', topic: 'problem_of_evil', createdAt: new Date().toISOString() },
        ],
        testimonies: [
          { id: 't_demo_1', title: 'From Darkness into His Marvelous Light', createdAt: new Date().toISOString() },
        ],
      });
      return;
    }
    console.error('[Search Error]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
