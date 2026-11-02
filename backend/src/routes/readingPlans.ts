import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { ReadingPlanFocus } from '@prisma/client';
import { fetchPassage } from '../services/bibleService';
import readingPlanTemplates from '../data/reading-plan-templates.json';
import { store, savePersistentStore } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

// ─── GET /api/reading-plans/templates ────────────────────────────────────────
router.get('/templates', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json(readingPlanTemplates);
});

// ─── POST /api/reading-plans ─── Start a plan ────────────────────────────────
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { templateId, reminderTime } = req.body;

    const template = (readingPlanTemplates as any[]).find((t) => t.id === templateId);
    if (!template) { res.status(404).json({ error: 'Reading plan template not found' }); return; }

    if (!isDbConnected()) {
      const plan = {
        id: `plan_dev_${Date.now()}`,
        userId: req.dbUserId || 'dev_db_user_123',
        templateId: template.id,
        name: template.name,
        lengthDays: template.days,
        currentDay: 1,
        focus: template.focus,
        isActive: true,
        startDate: new Date().toISOString(),
        targetEndDate: new Date(Date.now() + template.days * 86400000).toISOString(),
        reminderTime: reminderTime || '08:00',
        streak: 0,
        longestStreak: 0,
        days: template.dailyPassages.map((day: any, i: number) => ({
          id: `day_${i + 1}`,
          dayNumber: i + 1,
          passageRef: day.ref,
          passageLabel: day.label,
          isCompleted: false,
          completedAt: null,
        })),
      };
      store.readingPlans = [plan];
      savePersistentStore();
      res.status(201).json(plan);
      return;
    }

    const user = await prisma.user.findUnique({ where: { clerkId: req.userId }, select: { id: true } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    // Deactivate any existing active plan
    await prisma.readingPlan.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    const startDate = new Date();
    const targetEndDate = new Date(startDate);
    targetEndDate.setDate(targetEndDate.getDate() + template.days);

    const plan = await prisma.readingPlan.create({
      data: {
        userId: user.id,
        templateId: template.id,
        name: template.name,
        lengthDays: template.days,
        focus: template.focus as ReadingPlanFocus,
        startDate,
        targetEndDate,
        reminderTime: reminderTime || null,
        // Create all day records
        days: {
          create: template.dailyPassages.map((day: any, i: number) => ({
            dayNumber: i + 1,
            passageRef: day.ref,
            passageLabel: day.label,
          })),
        },
      },
      include: { days: { orderBy: { dayNumber: 'asc' }, take: 1 } },
    });

    res.status(201).json(plan);
  } catch (err) {
    console.error('[ReadingPlans] create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/reading-plans/me ────────────────────────────────────────────────
router.get('/me', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      const plan = store.readingPlans.find((p: any) => p.isActive) || store.readingPlans[0] || null;
      if (!plan) { res.json({ plan: null }); return; }
      const today = plan.days.find((d: any) => d.dayNumber === plan.currentDay) || plan.days[0];
      const completedCount = plan.days.filter((d: any) => d.isCompleted).length;
      res.json({ plan, today, completedCount, progressPercent: Math.round((completedCount / plan.lengthDays) * 100) });
      return;
    }

    const user = await prisma.user.findUnique({ where: { clerkId: req.userId }, select: { id: true } });
    if (!user) {
      const plan = store.readingPlans.find((p: any) => p.isActive) || null;
      res.json({ plan, today: plan?.days?.[0] || null, completedCount: 0, progressPercent: 0 });
      return;
    }

    const plan = await prisma.readingPlan.findFirst({
      where: { userId: user.id, isActive: true },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!plan) { res.json({ plan: null }); return; }

    // Find today's day
    const today = plan.days.find((d) => d.dayNumber === plan.currentDay);
    const completedCount = plan.days.filter((d) => d.isCompleted).length;

    res.json({ plan, today, completedCount, progressPercent: Math.round((completedCount / plan.lengthDays) * 100) });
  } catch {
    const plan = store.readingPlans.find((p: any) => p.isActive) || null;
    res.json({ plan, today: plan?.days?.[0] || null, completedCount: 0, progressPercent: 0 });
  }
});

// ─── POST /api/reading-plans/me/progress ─────────────────────────────────────
router.post('/me/progress', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { notes } = req.body;

    if (!isDbConnected()) {
      const plan = store.readingPlans.find((p: any) => p.isActive) || store.readingPlans[0];
      if (!plan) { res.status(404).json({ error: 'No active reading plan' }); return; }
      const today = plan.days.find((d: any) => d.dayNumber === plan.currentDay);
      if (today) {
        today.isCompleted = true;
        today.completedAt = new Date().toISOString();
        today.notes = notes || null;
      }
      plan.streak = (plan.streak || 0) + 1;
      plan.longestStreak = Math.max(plan.longestStreak || 0, plan.streak);
      if (plan.currentDay < plan.lengthDays) plan.currentDay++;
      savePersistentStore();
      res.json({ success: true, streak: plan.streak, longestStreak: plan.longestStreak, isComplete: plan.currentDay >= plan.lengthDays });
      return;
    }

    const user = await prisma.user.findUnique({ where: { clerkId: req.userId }, select: { id: true } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const plan = await prisma.readingPlan.findFirst({
      where: { userId: user.id, isActive: true },
      include: { days: true },
    });
    if (!plan) { res.status(404).json({ error: 'No active reading plan' }); return; }

    const today = plan.days.find((d) => d.dayNumber === plan.currentDay);
    if (!today) { res.status(400).json({ error: 'No day found for current progress' }); return; }
    if (today.isCompleted) { res.json({ message: 'Already completed today', plan }); return; }

    // Mark day complete
    await prisma.readingPlanDay.update({
      where: { id: today.id },
      data: { isCompleted: true, completedAt: new Date(), notes: notes || null },
    });

    // Calculate streak
    const yesterday = plan.days.find((d) => d.dayNumber === plan.currentDay - 1);
    const isStreakAlive = !yesterday || yesterday.isCompleted;
    const newStreak = isStreakAlive ? plan.streak + 1 : 1;
    const newLongest = Math.max(plan.longestStreak, newStreak);

    const nextDay = plan.currentDay + 1;
    const isComplete = nextDay > plan.lengthDays;

    await prisma.readingPlan.update({
      where: { id: plan.id },
      data: {
        currentDay: isComplete ? plan.currentDay : nextDay,
        streak: newStreak,
        longestStreak: newLongest,
        isActive: !isComplete,
        completedAt: isComplete ? new Date() : null,
      },
    });

    res.json({ success: true, streak: newStreak, longestStreak: newLongest, isComplete });
  } catch (err) {
    console.error('[ReadingPlans] progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/reading-plans/me/passage ───────────────────────────────────────
router.get('/me/passage', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      const plan = store.readingPlans.find((p: any) => p.isActive) || store.readingPlans[0];
      const today = plan?.days?.find((d: any) => d.dayNumber === (plan.currentDay || 1)) || {
        dayNumber: 1,
        passageRef: 'Matthew 1-4',
        passageLabel: 'The Genealogy, Birth, and Temptation of Jesus',
      };
      const translation = 'NIV';
      const passage = await fetchPassage(today.passageRef, translation);
      res.json({ passage, day: today, translation });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: req.userId },
      include: { profile: { select: { bibleTranslation: true } } },
    });
    if (!user) {
      const translation = 'NIV';
      const passage = await fetchPassage('Matthew 1-4', translation);
      res.json({ passage, day: { dayNumber: 1, passageRef: 'Matthew 1-4', passageLabel: 'Matthew 1-4' }, translation });
      return;
    }

    const plan = await prisma.readingPlan.findFirst({
      where: { userId: user.id, isActive: true },
      include: {
        days: { where: { dayNumber: { gte: 1 } }, orderBy: { dayNumber: 'asc' } },
      },
    });
    if (!plan) {
      const translation = 'NIV';
      const passage = await fetchPassage('Matthew 1-4', translation);
      res.json({ passage, day: { dayNumber: 1, passageRef: 'Matthew 1-4', passageLabel: 'Matthew 1-4' }, translation });
      return;
    }

    const today = plan.days.find((d) => d.dayNumber === plan.currentDay);
    if (!today) { res.status(404).json({ error: 'No passage for today' }); return; }

    const translation = user.profile?.bibleTranslation ?? 'NIV';
    const passage = await fetchPassage(today.passageRef, translation);

    res.json({ passage, day: today, translation });
  } catch (err) {
    const translation = 'NIV';
    const passage = await fetchPassage('Matthew 1-4', translation);
    res.json({ passage, day: { dayNumber: 1, passageRef: 'Matthew 1-4', passageLabel: 'Matthew 1-4' }, translation });
  }
});

export default router;
