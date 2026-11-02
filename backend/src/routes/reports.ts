import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma } from '../lib/prisma';
import { createReport } from '../services/reportService';
import { ReportTargetType } from '@prisma/client';

const router = Router();

router.use(requireAuth);

// ─── POST /api/reports ────────────────────────────────────────────────────────
/**
 * Submit a report on a message, user, or group.
 * Available to any authenticated user (adult or minor).
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { targetType, targetId, reason, additionalContext } = req.body;

    // Validate targetType
    const validTargetTypes: ReportTargetType[] = ['message', 'user', 'group'];
    if (!validTargetTypes.includes(targetType)) {
      res.status(400).json({ error: 'targetType must be "message", "user", or "group"' });
      return;
    }

    if (!targetId || typeof targetId !== 'string') {
      res.status(400).json({ error: 'targetId is required' });
      return;
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      res.status(400).json({ error: 'reason is required (minimum 5 characters)' });
      return;
    }

    // Look up reporter's DB ID
    const reporter = await prisma.user.findUnique({
      where: { clerkId: req.userId },
      select: { id: true },
    });

    if (!reporter) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const report = await createReport({
      reporterId: reporter.id,
      targetType,
      targetId,
      reason: reason.trim(),
      additionalContext: additionalContext?.trim(),
    });

    res.status(201).json({
      success: true,
      reportId: report.id,
      message: 'Your report has been submitted. Our moderation team will review it.',
    });
  } catch (err) {
    console.error('[Reports] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
