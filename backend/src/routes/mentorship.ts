import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdult } from '../middleware/requireAdult';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(requireAuth, requireAdult);

const CURRICULUM = [
  { week: 1, title: 'Assurance of Salvation', goal: 'Read Romans 8 and discuss the assurance we have in Christ.' },
  { week: 2, title: 'Prayer Basics', goal: 'Read Matthew 6:5-15 (The Lord\'s Prayer) and practice praying together.' },
  { week: 3, title: 'Finding a Local Church', goal: 'Discuss the importance of corporate fellowship and identify local options.' },
  { week: 4, title: 'Living the Christian Walk', goal: 'Read Galatians 5:16-26 and talk about walking by the Holy Spirit.' },
];

// ─── POST /api/mentorship/mentor-signup ──────────────────────────────────────
/**
 * Sign up as a verified mentor
 */
router.post('/mentor-signup', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { yearsAsBeliever, willingToMentor, pastoralBackground, maxMentees } = req.body;

    if (willingToMentor && (!yearsAsBeliever || yearsAsBeliever < 1)) {
      res.status(400).json({ error: 'Please enter a valid number of years as a believer.' });
      return;
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId: req.dbUserId! },
      create: {
        userId: req.dbUserId!,
        isWillingToMentor: willingToMentor ?? true,
        yearsAsBeliever: yearsAsBeliever ? parseInt(yearsAsBeliever) : null,
        pastoralBackground: pastoralBackground || null,
        maxMentees: maxMentees ? parseInt(maxMentees) : 3,
      },
      update: {
        isWillingToMentor: willingToMentor !== undefined ? willingToMentor : true,
        yearsAsBeliever: yearsAsBeliever !== undefined ? parseInt(yearsAsBeliever) : undefined,
        pastoralBackground: pastoralBackground !== undefined ? pastoralBackground : undefined,
        maxMentees: maxMentees !== undefined ? parseInt(maxMentees) : undefined,
      },
    });

    res.json({ success: true, profile });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/mentorship/status ──────────────────────────────────────────────
/**
 * Retrieve active mentorship relationships
 */
router.get('/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.dbUserId! },
      include: {
        profile: true,
        mentorshipsAsMentor: {
          where: { status: 'active' },
          include: { mentee: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
        mentorshipsAsMentee: {
          where: { status: 'active' },
          include: { mentor: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const activeMentor = user.mentorshipsAsMentee[0]?.mentor ?? null;
    const activeMentees = user.mentorshipsAsMentor.map(m => m.mentee);
    const activeRelationship = user.mentorshipsAsMentee[0] ?? user.mentorshipsAsMentor[0] ?? null;

    res.json({
      profile: user.profile,
      activeMentor,
      activeMentees,
      activeRelationship,
      curriculum: CURRICULUM,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/mentorship/request ────────────────────────────────────────────
/**
 * A convert requests to match with a mentor.
 * Finds a mentor with remaining mentee capacity.
 */
router.post('/request', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.dbUserId! },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user already has a mentor
    const existing = await prisma.mentorshipRelation.findFirst({
      where: { menteeId: user.id, status: 'active' },
    });

    if (existing) {
      res.status(400).json({ error: 'You already have an active mentor relationship.' });
      return;
    }

    // Find mentor with capacity (count of active relations < maxMentees)
    const mentors = await prisma.userProfile.findMany({
      where: {
        isWillingToMentor: true,
        userId: { not: user.id },
        user: { isBanned: false, accountType: { not: 'minor_content_only' } },
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    let matchedMentorId: string | null = null;
    for (const m of mentors) {
      const activeCount = await prisma.mentorshipRelation.count({
        where: { mentorId: m.userId, status: 'active' },
      });
      if (activeCount < m.maxMentees) {
        matchedMentorId = m.userId;
        break;
      }
    }

    if (!matchedMentorId) {
      res.json({ success: false, message: 'All mentors are currently fully occupied. We will match you as soon as a mentor becomes available.' });
      return;
    }

    const matchedMentor = mentors.find(m => m.userId === matchedMentorId);

    const relation = await prisma.mentorshipRelation.create({
      data: {
        mentorId: matchedMentorId,
        menteeId: user.id,
        status: 'active',
      },
    });

    res.json({ success: true, mentor: matchedMentor?.user, relation });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/mentorship/advance ────────────────────────────────────────────
/**
 * Advance curriculum progress by 1 week
 */
router.post('/advance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { relationId } = req.body;
    if (!relationId) {
      res.status(400).json({ error: 'relationId is required' });
      return;
    }

    const relation = await prisma.mentorshipRelation.findUnique({
      where: { id: relationId },
    });

    if (!relation || (relation.mentorId !== req.dbUserId && relation.menteeId !== req.dbUserId)) {
      res.status(403).json({ error: 'Not authorized to modify this relationship.' });
      return;
    }

    if (relation.status !== 'active') {
      res.status(400).json({ error: 'Relationship is not active.' });
      return;
    }

    const currentProgress = relation.curriculumProgress as number[];
    const nextWeek = relation.currentWeek + 1;
    const isCompleted = relation.currentWeek >= 4;

    const updated = await prisma.mentorshipRelation.update({
      where: { id: relationId },
      data: {
        currentWeek: isCompleted ? relation.currentWeek : nextWeek,
        status: isCompleted ? 'completed' : 'active',
        curriculumProgress: [...(Array.isArray(currentProgress) ? currentProgress : []), relation.currentWeek],
      },
    });

    res.json({ success: true, relation: updated, isCompleted });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
