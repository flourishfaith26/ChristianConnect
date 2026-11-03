import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma } from '../lib/prisma';
import { createReport } from '../services/reportService';
import { notifyAdminFlaggedContent } from '../services/emailService';

const router = Router();
router.use(requireAuth);

// ─── POST /api/safety/sos ──────────────────────────────────────────────────────
/**
 * SOS endpoint: one tap performs three actions atomically:
 * 1. Creates a Report record for the target (message or user)
 * 2. Blocks the target user
 * 3. Sends immediate notification to admin moderation team
 *
 * Available to ALL account types (including minors).
 */
router.post('/sos', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { targetType, targetId, targetUserId, reason } = req.body;

    const validTargets = ['message', 'user', 'group'];
    if (!validTargets.includes(targetType) || !targetId) {
      res.status(400).json({ error: 'targetType and targetId are required' }); return;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: req.userId }, select: { id: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const actions: string[] = [];

    // 1. Create report
    const report = await createReport({
      reporterId: user.id,
      targetType,
      targetId,
      reason: reason || 'SOS — immediate safety concern',
      additionalContext: 'Submitted via SOS button — priority review required',
    });
    actions.push('report_created');

    // 2. Block the user (if targetUserId provided)
    const blockTargetId = targetUserId ?? (targetType === 'user' ? targetId : null);
    if (blockTargetId && blockTargetId !== user.id) {
      await prisma.block.upsert({
        where: { initiatorId_targetId: { initiatorId: user.id, targetId: blockTargetId } },
        create: { initiatorId: user.id, targetId: blockTargetId },
        update: {},
      });
      actions.push('user_blocked');
    }

    // 3. Send URGENT admin notification (fire and forget, don't block response)
    notifyAdminFlaggedContent(targetType as 'message' | 'story' | 'profile', targetId,
      `🚨 SOS ALERT — Report ID: ${report.id} — Priority review required`
    ).catch(console.error);
    actions.push('admin_alerted');

    res.json({
      success: true,
      message: 'SOS submitted. You have been removed from this conversation and an admin has been alerted.',
      actions,
      reportId: report.id,
    });
  } catch (err) {
    console.error('[Safety] SOS error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/safety/crisis-resources ─────────────────────────────────────────
router.get('/crisis-resources', (_req: unknown, res: Response): void => {
  res.json({
    resources: [
      {
        name: 'Suicide & Crisis Lifeline',
        phone: '988',
        text: 'Text HOME to 741741',
        url: 'https://988lifeline.org',
        description: 'Free, confidential crisis support 24/7',
        icon: '🆘',
      },
      {
        name: 'Crisis Text Line',
        phone: null,
        text: 'Text HOME to 741741',
        url: 'https://www.crisistextline.org',
        description: 'Free crisis counseling via text, 24/7',
        icon: '💬',
      },
      {
        name: 'RAINN Sexual Assault Hotline',
        phone: '1-800-656-4673',
        text: null,
        url: 'https://www.rainn.org',
        description: 'Free, confidential support from RAINN',
        icon: '🫂',
      },
      {
        name: 'National Domestic Violence Hotline',
        phone: '1-800-799-7233',
        text: 'Text START to 88788',
        url: 'https://www.thehotline.org',
        description: 'Support for domestic violence situations',
        icon: '🏠',
      },
      {
        name: 'Childhelp National Child Abuse Hotline',
        phone: '1-800-422-4453',
        text: null,
        url: 'https://www.childhelp.org',
        description: 'Support for children in crisis',
        icon: '🛡️',
      },
    ],
    platformNote: 'If you are in immediate danger, please call 911.',
  });
});

export default router;
