import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { AccountType, Gender } from '@prisma/client';
import { sendParentalConsentEmail } from '../services/emailService';
import { store, savePersistentStore } from '../lib/persistence';
import crypto from 'crypto';

const router = Router();

// All routes require auth
router.use(requireAuth);

// ─── GET /api/users/me ────────────────────────────────────────────────────────
router.get('/me', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      if (req.userId === 'dev_user_demo_123') {
        res.json(store.user);
        return;
      }

      res.status(503).json({ error: 'Account database is unavailable' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: req.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        gender: true,
        accountType: true,
        statementOfFaithAccepted: true,
        parentConsentGiven: true,
        isBanned: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User account not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error('[Users] get current user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/users/me ─────────────────────────────────────────────────────
/**
 * Updates the current user's profile.
 * CRITICAL: accountType is explicitly blocked from being updated here.
 * It can only be set during the onboarding flow via the complete-onboarding endpoint.
 */
router.patch('/me', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { displayName, bio, avatarUrl } = req.body;

    if (!isDbConnected()) {
      if (displayName) store.user.displayName = displayName;
      if (bio !== undefined) store.user.bio = bio;
      if (avatarUrl) store.user.avatarUrl = avatarUrl;
      savePersistentStore();
      res.json(store.user);
      return;
    }

    // SAFETY: explicitly strip any attempt to update accountType
    // This ensures accountType can NEVER be changed by a user action
    const { accountType: _stripped, isBanned: _banned, ..._ } = req.body;

    const user = await prisma.user.update({
      where: { clerkId: req.userId },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl && { avatarUrl }),
      },
      select: {
        id: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        accountType: true,
      },
    });

    res.json(user);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      const { displayName, bio, avatarUrl } = req.body;
      if (displayName) store.user.displayName = displayName;
      if (bio !== undefined) store.user.bio = bio;
      if (avatarUrl) store.user.avatarUrl = avatarUrl;
      savePersistentStore();
      res.json(store.user);
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/users/complete-onboarding ─────────────────────────────────────
/**
 * Called at the end of the signup wizard to:
 * 1. Set dateOfBirth, gender, displayName
 * 2. Calculate account type from DOB
 * 3. Mark statementOfFaithAccepted = true
 * 4. Trigger parental consent email for minors
 *
 * This is the ONLY endpoint that may set accountType.
 */
router.post('/complete-onboarding', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.status(503).json({ error: 'Account database is unavailable; onboarding was not saved' });
      return;
    }

    const { dateOfBirth, gender, displayName, statementOfFaithAccepted, parentEmail } = req.body;

    if (!dateOfBirth || !gender || !displayName) {
      res.status(400).json({ error: 'dateOfBirth, gender, and displayName are required' });
      return;
    }

    if (statementOfFaithAccepted !== true) {
      res.status(400).json({
        error: 'Statement of Faith must be accepted to create an account',
      });
      return;
    }

    // Validate gender
    const validGenders: Gender[] = ['male', 'female', 'prefer_not_to_say'];
    if (!validGenders.includes(gender)) {
      res.status(400).json({ error: 'Invalid gender value' });
      return;
    }

    // Calculate age from DOB
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear() -
      (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);

    if (isNaN(dob.getTime()) || dob > today) {
      res.status(400).json({ error: 'Invalid date of birth' });
      return;
    }

    // Determine account type based on age
    let accountType: AccountType;
    let parentConsentToken: string | undefined;

    if (age < 18) {
      accountType = AccountType.minor_content_only;

      if (!parentEmail) {
        res.status(400).json({
          error: 'Parent or guardian email is required for users under 18',
        });
        return;
      }

      // Generate a signed token for the parental consent link
      parentConsentToken = crypto.randomBytes(32).toString('hex');

      // Fire parental consent email asynchronously
      sendParentalConsentEmail(parentEmail, displayName, parentConsentToken).catch((err) => {
        console.error('[Onboarding] Failed to send parental consent email:', err);
      });
    } else {
      accountType = AccountType.adult_unverified;
    }

    const user = await prisma.user.update({
      where: { clerkId: req.userId },
      data: {
        dateOfBirth: dob,
        gender: gender as Gender,
        displayName,
        accountType,
        statementOfFaithAccepted: true,
        ...(parentEmail && { parentEmail }),
        ...(parentConsentToken && { parentConsentToken }),
      },
      select: {
        id: true,
        displayName: true,
        accountType: true,
        statementOfFaithAccepted: true,
        parentConsentGiven: true,
      },
    });

    res.json({ user, isMinor: age < 18 });
  } catch (err) {
    console.error('[Onboarding] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/users/parental-consent ────────────────────────────────────────
/**
 * Called when a parent clicks the consent link in their email.
 * Validates the token and marks parentConsentGiven = true.
 */
router.post('/parental-consent', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Consent token is required' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { parentConsentToken: token },
    });

    if (!user) {
      res.status(404).json({ error: 'Invalid or expired consent token' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        parentConsentGiven: true,
        parentConsentToken: null, // invalidate token after use
      },
    });

    res.json({ success: true, message: 'Parental consent recorded. Thank you!' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
