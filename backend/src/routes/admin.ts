import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { prisma } from '../lib/prisma';
import { AdminActionType } from '@prisma/client';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// ─── GET /api/admin/queue ─────────────────────────────────────────────────────
/**
 * Returns the admin moderation queue:
 * - Flagged/auto-rejected messages (hidden from end users until reviewed)
 * - Pending reports
 */
router.get('/queue', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [flaggedMessages, pendingReports] = await Promise.all([
      prisma.message.findMany({
        where: {
          moderationStatus: { in: ['flagged', 'auto_rejected'] },
        },
        include: {
          sender: {
            select: { id: true, displayName: true, email: true, accountType: true },
          },
          group: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.report.findMany({
        where: { status: 'pending' },
        include: {
          reporter: {
            select: { id: true, displayName: true, email: true },
          },
          targetMessage: {
            select: { id: true, content: true, mediaUrl: true, moderationStatus: true },
          },
          targetUser: {
            select: { id: true, displayName: true, email: true, accountType: true },
          },
          targetGroup: {
            select: { id: true, name: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    res.json({
      flaggedMessages,
      pendingReports,
      counts: {
        flaggedMessages: flaggedMessages.length,
        pendingReports: pendingReports.length,
      },
    });
  } catch (err) {
    console.error('[Admin] Queue error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/admin/messages/:id ───────────────────────────────────────────
/**
 * Approve or reject a flagged message.
 * action: "approve" | "reject"
 */
router.patch('/messages/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: 'action must be "approve" or "reject"' });
      return;
    }

    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    await prisma.message.update({
      where: { id },
      data: {
        moderationStatus: action === 'approve' ? 'approved' : 'auto_rejected',
        moderationReason: action === 'reject' ? (notes ?? 'Rejected by admin') : undefined,
      },
    });

    // Log the admin action
    if (req.dbUserId) {
      await prisma.adminAction.create({
        data: {
          adminId: req.dbUserId,
          action: action === 'approve'
            ? AdminActionType.approve_message
            : AdminActionType.reject_message,
          targetType: 'message',
          targetId: id,
          notes,
        },
      });
    }

    res.json({ success: true, action });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/admin/reports/:id ────────────────────────────────────────────
/**
 * Resolve or dismiss a report.
 * action: "resolve" | "dismiss"
 */
router.patch('/reports/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reviewNote } = req.body;

    if (!['resolve', 'dismiss'].includes(action)) {
      res.status(400).json({ error: 'action must be "resolve" or "dismiss"' });
      return;
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    await prisma.report.update({
      where: { id },
      data: {
        status: action === 'resolve' ? 'resolved' : 'dismissed',
        reviewedBy: req.dbUserId,
        reviewNote,
      },
    });

    if (req.dbUserId) {
      await prisma.adminAction.create({
        data: {
          adminId: req.dbUserId,
          action: action === 'resolve'
            ? AdminActionType.resolve_report
            : AdminActionType.dismiss_report,
          targetType: 'report',
          targetId: id,
          notes: reviewNote,
        },
      });
    }

    res.json({ success: true, action });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/admin/users/:id/ban ───────────────────────────────────────────
/**
 * Ban a user.
 */
router.post('/users/:id/ban', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.isBanned) {
      res.status(400).json({ error: 'User is already banned' });
      return;
    }

    await prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedBy: req.dbUserId,
      },
    });

    if (req.dbUserId) {
      await prisma.adminAction.create({
        data: {
          adminId: req.dbUserId,
          action: AdminActionType.ban_user,
          targetType: 'user',
          targetId: id,
          notes,
        },
      });
    }

    res.json({ success: true, message: `User ${id} has been banned` });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/admin/users/:id/ban ─────────────────────────────────────────
/**
 * Unban a user.
 */
router.delete('/users/:id/ban', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: { id },
      data: { isBanned: false, bannedAt: null, bannedBy: null },
    });

    if (req.dbUserId) {
      await prisma.adminAction.create({
        data: {
          adminId: req.dbUserId,
          action: AdminActionType.unban_user,
          targetType: 'user',
          targetId: id,
        },
      });
    }

    res.json({ success: true, message: `User ${id} has been unbanned` });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/admin/audit-log ─────────────────────────────────────────────────
router.get('/audit-log', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const actions = await prisma.adminAction.findMany({
      include: {
        admin: { select: { id: true, displayName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(actions);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
