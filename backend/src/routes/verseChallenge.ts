import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { store, savePersistentStore } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

// Helper to get start of current week (Monday 00:00:00 UTC)
function getStartOfWeek(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  date.setUTCDate(diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

const DEFAULT_WEEKLY_VERSES = [
  { ref: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.', reference: 'Philippians 4:13 (NIV)' },
  { ref: 'Proverbs 3:5-6', text: 'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', reference: 'Proverbs 3:5-6 (NIV)' },
  { ref: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', reference: 'Romans 8:28 (NIV)' },
  { ref: 'Joshua 1:9', text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.', reference: 'Joshua 1:9 (NIV)' },
  { ref: 'Isaiah 40:31', text: 'But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', reference: 'Isaiah 40:31 (NIV)' },
];

const getCurrentChallengeHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      const v = DEFAULT_WEEKLY_VERSES[0];
      const uid = req.dbUserId || 'dev_db_user_123';
      const streak = store.verseStreaks[uid] || { currentStreak: 3, longestStreak: 7 };
      const latestAttempt = store.verseAttempts.find((a: any) => a.userId === uid);

      res.json({
        challenge: {
          id: 'verse_dev_1',
          weekStart: getStartOfWeek().toISOString(),
          verseRef: v.ref,
          verseText: v.text,
          verseReference: v.reference,
        },
        userAttempt: latestAttempt || null,
        streak,
      });
      return;
    }
    const weekStart = getStartOfWeek();

    let challenge = await prisma.memoryVerseChallenge.findUnique({
      where: { weekStart },
    });

    if (!challenge) {
      const weekIndex = Math.floor(weekStart.getTime() / (7 * 24 * 60 * 60 * 1000)) % DEFAULT_WEEKLY_VERSES.length;
      const v = DEFAULT_WEEKLY_VERSES[weekIndex];

      challenge = await prisma.memoryVerseChallenge.create({
        data: {
          weekStart,
          verseRef: v.ref,
          verseText: v.text,
          verseReference: v.reference,
        },
      });
    }

    const userAttempt = await prisma.userVerseAttempt.findFirst({
      where: { userId: req.dbUserId!, challengeId: challenge.id },
      orderBy: { attemptedAt: 'desc' },
    });

    const streak = await prisma.verseStreak.findUnique({
      where: { userId: req.dbUserId! },
    });

    res.json({
      challenge,
      userAttempt,
      streak: streak ?? { currentStreak: 0, longestStreak: 0 },
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      const v = DEFAULT_WEEKLY_VERSES[0];
      const uid = req.dbUserId || 'dev_db_user_123';
      const streak = store.verseStreaks[uid] || { currentStreak: 3, longestStreak: 7 };
      const latestAttempt = store.verseAttempts.find((a: any) => a.userId === uid);

      res.json({
        challenge: {
          id: 'verse_dev_1',
          weekStart: getStartOfWeek().toISOString(),
          verseRef: v.ref,
          verseText: v.text,
          verseReference: v.reference,
        },
        userAttempt: latestAttempt || null,
        streak,
      });
      return;
    }
    console.error('[VerseChallenge] current error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.get('/current', getCurrentChallengeHandler);
router.get('/daily', getCurrentChallengeHandler);

// ─── POST /api/verse-challenge/attempt ────────────────────────────────────────
router.post('/attempt', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { challengeId, submittedText } = req.body;

    if (!challengeId || !submittedText) {
      res.status(400).json({ error: 'challengeId and submittedText are required' }); return;
    }

    const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').trim().split(/\s+/);
    const targetWords = normalize(DEFAULT_WEEKLY_VERSES[0].text);
    const submittedWords = normalize(submittedText);

    let matchCount = 0;
    targetWords.forEach((word, i) => {
      if (submittedWords[i] === word) matchCount++;
    });

    const score = Math.round((matchCount / targetWords.length) * 100);
    const isCorrect = score >= 80;

    const uid = req.dbUserId || 'dev_db_user_123';
    const now = new Date();

    const attempt = {
      id: `attempt_${Date.now()}`,
      userId: uid,
      challengeId,
      score,
      isCorrect,
      attemptedAt: now.toISOString(),
    };
    store.verseAttempts.unshift(attempt);

    const userStreak = store.verseStreaks[uid] || { currentStreak: 0, longestStreak: 0 };
    if (isCorrect) {
      userStreak.currentStreak += 1;
      if (userStreak.currentStreak > userStreak.longestStreak) {
        userStreak.longestStreak = userStreak.currentStreak;
      }
    }
    userStreak.lastAttemptDate = now.toISOString();
    store.verseStreaks[uid] = userStreak;

    savePersistentStore();

    res.json({
      attempt,
      score,
      isCorrect,
      streak: userStreak,
      message: isCorrect ? '🎉 Great job! Memory verse completed.' : 'Keep practicing! Try again anytime.',
    });
  } catch (err) {
    console.error('[VerseChallenge] attempt error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/verse-challenge/streak ─────────────────────────────────────────
router.get('/streak', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const streak = await prisma.verseStreak.findUnique({
      where: { userId: req.dbUserId! },
    });
    res.json(streak ?? { currentStreak: 0, longestStreak: 0 });
  } catch {
    if (process.env.NODE_ENV === 'development') {
      const uid = req.dbUserId || 'dev_db_user_123';
      const streak = store.verseStreaks[uid] || { currentStreak: 3, longestStreak: 7 };
      res.json(streak);
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
