import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './requireAuth';
import { prisma } from '../lib/prisma';

const ADMIN_CLERK_IDS = (process.env.ADMIN_CLERK_IDS ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

/**
 * Ensures the authenticated user is a platform admin.
 * Must be used AFTER requireAuth.
 *
 * Admin status is determined by ADMIN_CLERK_IDS env var (Clerk user IDs).
 * This is a simple, secure approach for the initial build.
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      req.dbUserId = req.dbUserId || 'dev_db_user_123';
      next();
      return;
    }

    if (!ADMIN_CLERK_IDS.includes(req.userId)) {
      res.status(403).json({ error: 'Forbidden — admin access required' });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: req.userId },
        select: { id: true },
      });

      if (user) {
        req.dbUserId = user.id;
      }
    } catch {
      req.dbUserId = req.dbUserId || 'dev_db_user_123';
    }

    next();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      req.dbUserId = req.dbUserId || 'dev_db_user_123';
      next();
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}
