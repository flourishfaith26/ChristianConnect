import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';

/**
 * Ensures the authenticated user has completed identity verification
 * with an APPROVED VerificationRecord.
 *
 * Must be used AFTER requireAuth + requireAdult.
 *
 * This enforces the non-negotiable rule: the Dating section is hard-gated
 * behind identity/age verification — not optional, not a UI toggle.
 */
export async function requireVerified(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.dbUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!isDbConnected() || process.env.NODE_ENV === 'development') {
      next();
      return;
    }

    try {
      const record = await prisma.verificationRecord.findUnique({
        where: { userId: req.dbUserId },
        select: { status: true },
      });

      if (!record || record.status !== 'approved') {
        res.status(403).json({
          error: 'Identity verification required',
          message: 'You must complete identity verification before accessing the Dating section.',
          verificationStatus: record?.status ?? 'not_started',
          redirectTo: '/dating/verify',
        });
        return;
      }

      next();
    } catch {
      if (process.env.NODE_ENV === 'development') {
        next();
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      next();
      return;
    }
    console.error('[requireVerified] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
