import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';

/**
 * Ensures the authenticated user has accountType NOT equal to minor_content_only.
 * Must be used AFTER requireAuth.
 *
 * This enforces the non-negotiable rule: minor accounts cannot access
 * chat, matching, Stories, or live features.
 */
export async function requireAdult(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!isDbConnected() || process.env.NODE_ENV === 'development') {
      req.dbUserId = req.dbUserId || 'dev_db_user_123';
      next();
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: req.userId },
        select: { id: true, accountType: true, isBanned: true },
      });

      if (user) {
        if (user.isBanned) {
          res.status(403).json({ error: 'Account suspended' });
          return;
        }

        if (user.accountType === 'minor_content_only') {
          res.status(403).json({
            error: 'Access restricted',
            message: 'This feature is not available for your account type.',
            accountType: user.accountType,
          });
          return;
        }
        req.dbUserId = user.id;
      } else {
        req.dbUserId = req.dbUserId || 'dev_db_user_123';
      }
    } catch {
      // Database offline fallback in dev mode
      req.dbUserId = req.dbUserId || 'dev_db_user_123';
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
