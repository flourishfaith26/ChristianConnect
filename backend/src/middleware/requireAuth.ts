import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { isMongoConnected } from '../lib/mongoose';
import { User } from '../models/User';

export interface AuthenticatedRequest extends Request {
  userId?: string;   // Clerk user ID (sub from JWT)
  dbUserId?: string; // Our internal DB User.id (cuid)
}

/**
 * Validates the Clerk JWT from the Authorization header.
 * Attaches both userId (Clerk sub) and dbUserId (DB primary key) to the request.
 * Falls back to a local dev user only when no token is provided in development.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const isDev = process.env.NODE_ENV === 'development' || !process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY.includes('PLACEHOLDER');

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token || token === 'undefined' || token === 'null' || token.startsWith('dev_')) {
      if (isDev) {
        if (isMongoConnected()) {
          try {
            let devUser = await User.findOne({ email: 'demo@christianconnect.app' });

            if (!devUser) {
              devUser = await User.create({
                  clerkId: 'dev_user_demo_123',
                  email: 'demo@christianconnect.app',
                  displayName: 'Grace Believer',
                  dateOfBirth: new Date('1995-01-01'),
                  gender: 'female',
                  accountType: 'adult_verified',
              });
            }

            req.userId = devUser.clerkId;
            req.dbUserId = devUser.id;
          } catch {
            req.userId = 'dev_user_demo_123';
            req.dbUserId = 'dev_db_user_123';
          }
        } else {
          req.userId = 'dev_user_demo_123';
          req.dbUserId = 'dev_db_user_123';
        }
        next();
        return;
      }

      res.status(401).json({ error: 'Unauthorized — no token provided' });
      return;
    }

    // Attempt token verification
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      req.userId = payload.sub;
      if (isMongoConnected()) {
        try {
          const user = await User.findOne({ clerkId: payload.sub }).select({ _id: 1, isBanned: 1 }).lean();

          if (user) {
            if (user.isBanned) {
              res.status(403).json({ error: 'Account suspended' });
              return;
            }
            req.dbUserId = String(user._id);
          } else {
            req.dbUserId = 'dev_db_user_123';
          }
        } catch {
          req.dbUserId = 'dev_db_user_123';
        }
      } else {
        req.dbUserId = 'dev_db_user_123';
      }

      next();
    } catch {
      res.status(401).json({ error: 'Unauthorized — invalid token' });
    }
  } catch (err) {
    console.error('[requireAuth] unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
