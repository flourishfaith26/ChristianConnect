import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdult } from '../middleware/requireAdult';
import { requireVerified } from '../middleware/requireVerified';
import { prisma, isDbConnected } from '../lib/prisma';
import { store, savePersistentStore } from '../lib/persistence';
import { processDatingProfileModeration } from '../services/moderationService';
import { io } from '../index';
import { RelationshipGoal, CourtshipView, MarriageRoleView } from '@prisma/client';

const router = Router();

// All dating routes require: authenticated adult + verified identity
router.use(requireAuth, requireAdult, requireVerified);

const RESOURCE_UNLOCK_DAYS = parseInt(process.env.DATING_RESOURCE_UNLOCK_DAYS ?? '7', 10);

// ─── Pre-marriage resource library ────────────────────────────────────────────
// Content displayed once the engagement threshold is reached.
// Configurable via DATING_RESOURCE_UNLOCK_DAYS env var.
const PREMARRIAGE_RESOURCES = [
  {
    id: 'communication',
    title: 'Christian Communication in Relationships',
    category: 'Communication',
    icon: '💬',
    description: 'Biblical principles for honest, loving communication. Ephesians 4:15 — "speaking the truth in love."',
    topics: [
      'Active listening as a spiritual discipline',
      'Resolving conflict through Matthew 18 principles',
      'How to express needs without manipulation',
      'Creating space for vulnerability and trust',
    ],
    scripture: 'Ephesians 4:15, James 1:19, Proverbs 15:1',
  },
  {
    id: 'finances',
    title: 'Financial Alignment Before Marriage',
    category: 'Finances',
    icon: '💰',
    description: 'Stewardship, generosity, and financial compatibility for Christian couples.',
    topics: [
      'Biblical view of money and generosity (Luke 16:10-12)',
      'Budgeting together as an act of partnership',
      'Debt, savings, and tithing expectations',
      'How to have the "money conversation" early',
    ],
    scripture: 'Luke 16:10-12, Proverbs 21:5, Malachi 3:10',
  },
  {
    id: 'faith-alignment',
    title: 'Faith Compatibility Discussion Guide',
    category: 'Faith',
    icon: '✝️',
    description: 'Questions every Christian couple should discuss: church, prayer, theology, and raising children.',
    topics: [
      'Denominational differences and how to navigate them',
      'Prayer as a couple — practical guide',
      'Raising children in the faith',
      'Spiritual headship and mutual submission (Ephesians 5)',
    ],
    scripture: 'Ephesians 5:21-33, Amos 3:3, 2 Corinthians 6:14',
  },
  {
    id: 'courtship-boundaries',
    title: 'Purity and Boundaries in Christian Courtship',
    category: 'Boundaries',
    icon: '🛡️',
    description: 'Honoring God together — setting physical, emotional, and digital boundaries.',
    topics: [
      'Physical boundaries and accountability',
      'Emotional intimacy vs. physical intimacy',
      'Involving mentors and community',
      'Guarding your heart (Proverbs 4:23)',
    ],
    scripture: 'Proverbs 4:23, 1 Thessalonians 4:3-5, 1 Corinthians 6:18-20',
  },
];

// ─── GET /api/dating/profile/me ───────────────────────────────────────────────
/**
 * Returns the current user's own dating profile.
 */
router.get('/profile/me', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json(store.datingProfiles[0] || null);
      return;
    }

    const profile = await prisma.datingProfile.findUnique({
      where: { userId: req.dbUserId! },
    });
    res.json(profile ?? null);
  } catch {
    res.json(store.datingProfiles[0] || null);
  }
});

// ─── POST /api/dating/profile ─────────────────────────────────────────────────
/**
 * Create or update the dating profile.
 * Immediately triggers moderation — profile starts as 'pending' until cleared.
 */
router.post('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      ageRangeMin, ageRangeMax, relationshipGoal,
      courtshipView, marriageRoleView, openToLongDistance,
      bio, promptAnswers, isVisible,
    } = req.body;

    // Validate required enums
    const validGoals = Object.values(RelationshipGoal);
    const validCourtship = Object.values(CourtshipView);
    const validMarriage = Object.values(MarriageRoleView);

    if (!validGoals.includes(relationshipGoal)) {
      res.status(400).json({ error: 'Invalid relationshipGoal' }); return;
    }
    if (!validCourtship.includes(courtshipView)) {
      res.status(400).json({ error: 'Invalid courtshipView' }); return;
    }
    if (!validMarriage.includes(marriageRoleView)) {
      res.status(400).json({ error: 'Invalid marriageRoleView' }); return;
    }

    // Validate age range
    const minAge = Math.max(18, parseInt(ageRangeMin) || 18);
    const maxAge = Math.min(80, parseInt(ageRangeMax) || 45);
    if (minAge > maxAge) {
      res.status(400).json({ error: 'ageRangeMin must be less than or equal to ageRangeMax' }); return;
    }

    // Validate promptAnswers — max 3, each with question + answer strings
    const prompts = Array.isArray(promptAnswers) ? promptAnswers.slice(0, 3) : [];
    const cleanPrompts = prompts.map((p: { question: string; answer: string }) => ({
      question: String(p.question ?? '').slice(0, 120),
      answer: String(p.answer ?? '').slice(0, 400),
    }));

    const profile = await prisma.datingProfile.upsert({
      where: { userId: req.dbUserId! },
      create: {
        userId: req.dbUserId!,
        ageRangeMin: minAge,
        ageRangeMax: maxAge,
        relationshipGoal,
        courtshipView,
        marriageRoleView,
        openToLongDistance: openToLongDistance ?? false,
        bio: bio?.slice(0, 500) || null,
        promptAnswers: cleanPrompts,
        isVisible: isVisible !== false,
        moderationStatus: 'pending',
      },
      update: {
        ageRangeMin: minAge,
        ageRangeMax: maxAge,
        relationshipGoal,
        courtshipView,
        marriageRoleView,
        openToLongDistance: openToLongDistance ?? false,
        bio: bio?.slice(0, 500) || null,
        promptAnswers: cleanPrompts,
        isVisible: isVisible !== false,
        moderationStatus: 'pending',
        moderationReason: null,
      },
    });

    // Run moderation asynchronously
    processDatingProfileModeration(profile.id).catch(console.error);

    res.status(201).json({ success: true, profile, note: 'Your profile is being reviewed and will appear in the browse feed shortly.' });
  } catch (err) {
    console.error('[Dating] profile save error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/dating/profile/me ───────────────────────────────────────────────
router.get('/profile/me', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json(store.datingProfiles[0] || null);
      return;
    }

    const profile = await prisma.datingProfile.findUnique({
      where: { userId: req.dbUserId! },
    });
    res.json(profile);
  } catch {
    res.json(store.datingProfiles[0] || null);
  }
});

// ─── GET /api/dating/resources ────────────────────────────────────────────────
router.get('/resources', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json({ resources: PREMARRIAGE_RESOURCES, unlocked: true });
});

// ─── GET /api/dating/candidates ───────────────────────────────────────────────
/**
 * Browse verified, approved, opposite-gender dating profiles.
 * Excludes: blocked users, already-liked, already-matched, self.
 * Paginates via cursor (last seen userId).
 */
router.get('/candidates', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      const candidates = store.datingProfiles.map((p) => ({
        id: p.userId,
        displayName: p.user.displayName,
        avatarUrl: p.photos?.[0] || null,
        city: p.locationCity,
        region: p.locationState,
        age: 28,
        profile: {
          denomination: p.churchDenomination,
          faithBackground: 'several_years',
          joinReasons: ['dating', 'fellowship'],
        },
        datingProfile: {
          id: `dp_${p.userId}`,
          ageRangeMin: 22,
          ageRangeMax: 38,
          relationshipGoal: p.relationshipGoal,
          courtshipView: p.courtshipView,
          marriageRoleView: p.marriageRoleView,
          openToLongDistance: true,
          bio: p.testimony,
          promptAnswers: [
            { question: 'My favorite verse and why', answer: `${p.favoriteVerse} because God's peace leads my heart.` },
            { question: 'What I look for in a godly spouse', answer: 'A deep love for Christ, intentional communication, and shared kingdom purpose.' },
          ],
        },
      }));

      res.json({
        candidates,
        hasMore: false,
        nextCursor: null,
      });
      return;
    }
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string || '10'), 20);

    // Load current user's gender and age for filtering
    const currentUser = await prisma.user.findUnique({
      where: { id: req.dbUserId! },
      select: {
        gender: true,
        dateOfBirth: true,
        datingProfile: { select: { ageRangeMin: true, ageRangeMax: true } },
      },
    });

    if (!currentUser) {
      res.status(404).json({ error: 'User not found' }); return;
    }

    // Only male/female can use dating section — prefer_not_to_say is excluded
    if (currentUser.gender === 'prefer_not_to_say') {
      res.status(403).json({
        error: 'Dating section requires a declared gender',
        message: 'Users who selected "Prefer not to say" are not included in the dating feature.',
      });
      return;
    }

    const oppositeGender = currentUser.gender === 'male' ? 'female' : 'male';

    // IDs to exclude: already liked + already matched + blocks
    const [givenLikes, existingMatches, blocks] = await Promise.all([
      prisma.datingLike.findMany({
        where: { fromUserId: req.dbUserId! },
        select: { toUserId: true },
      }),
      prisma.datingMatch.findMany({
        where: { OR: [{ user1Id: req.dbUserId! }, { user2Id: req.dbUserId! }] },
        select: { user1Id: true, user2Id: true },
      }),
      prisma.block.findMany({
        where: { OR: [{ initiatorId: req.dbUserId! }, { targetId: req.dbUserId! }] },
        select: { initiatorId: true, targetId: true },
      }),
    ]);

    const likedIds = new Set(givenLikes.map(l => l.toUserId));
    const matchedIds = new Set([
      ...existingMatches.map(m => m.user1Id),
      ...existingMatches.map(m => m.user2Id),
    ]);
    const blockedIds = new Set([
      ...blocks.map(b => b.initiatorId),
      ...blocks.map(b => b.targetId),
    ]);

    const excludedIds = new Set([
      req.dbUserId!,
      ...likedIds,
      ...matchedIds,
      ...blockedIds,
    ]);

    // Calculate current user's age for filter
    const today = new Date();
    const myAge = today.getFullYear() - currentUser.dateOfBirth.getFullYear();

    const candidates = await prisma.user.findMany({
      where: {
        gender: oppositeGender,
        accountType: { not: 'minor_content_only' },
        isBanned: false,
        id: {
          not: { in: [...excludedIds] },
          ...(cursor ? { gt: cursor } : {}),
        },
        datingProfile: {
          moderationStatus: 'approved',
          isVisible: true,
          // Their age range must include my age
          ageRangeMin: { lte: myAge },
          ageRangeMax: { gte: myAge },
        },
        verificationRecord: { status: 'approved' },
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        dateOfBirth: true,
        city: true,
        region: true,
        profile: {
          select: {
            denomination: true,
            faithBackground: true,
            joinReasons: true,
          },
        },
        datingProfile: {
          select: {
            id: true,
            ageRangeMin: true,
            ageRangeMax: true,
            relationshipGoal: true,
            courtshipView: true,
            marriageRoleView: true,
            openToLongDistance: true,
            bio: true,
            promptAnswers: true,
          },
        },
      },
      take: limit,
      orderBy: { id: 'asc' },
    });

    // Calculate ages from DOB (don't expose raw DOB)
    const candidatesWithAge = candidates.map(c => {
      const age = today.getFullYear() - c.dateOfBirth.getFullYear() -
        (today < new Date(today.getFullYear(), c.dateOfBirth.getMonth(), c.dateOfBirth.getDate()) ? 1 : 0);
      const { dateOfBirth: _, ...rest } = c;
      return { ...rest, age };
    });

    res.json({
      candidates: candidatesWithAge,
      hasMore: candidates.length === limit,
      nextCursor: candidates.length === limit ? candidates[candidates.length - 1].id : null,
    });
  } catch (err) {
    console.error('[Dating] candidates error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/dating/like/:userId ────────────────────────────────────────────
/**
 * Express interest in another user's profile.
 * If they've already liked the current user, a DatingMatch is created
 * and a Conversation is automatically spawned.
 * Enforces opposite-gender only.
 */
router.post('/like/:userId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId: targetUserId } = req.params;

    if (targetUserId === req.dbUserId) {
      res.status(400).json({ error: 'Cannot like yourself' }); return;
    }

    // Load both users
    const [currentUser, targetUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.dbUserId! },
        select: { gender: true },
      }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true, displayName: true, gender: true,
          isBanned: true, accountType: true,
          verificationRecord: { select: { status: true } },
          datingProfile: { select: { isVisible: true, moderationStatus: true } },
        },
      }),
    ]);

    if (!currentUser || !targetUser) {
      res.status(404).json({ error: 'User not found' }); return;
    }

    // Enforce opposite-gender only
    if (currentUser.gender === 'prefer_not_to_say' || targetUser.gender === 'prefer_not_to_say') {
      res.status(403).json({ error: 'Dating section requires a declared gender for both users' }); return;
    }
    if (currentUser.gender === targetUser.gender) {
      res.status(403).json({ error: 'Dating section is for opposite-gender pairs only' }); return;
    }

    // Safety checks on target
    if (targetUser.isBanned) {
      res.status(403).json({ error: 'This profile is not available' }); return;
    }
    if (targetUser.accountType === 'minor_content_only') {
      res.status(403).json({ error: 'This profile is not available' }); return;
    }
    if (targetUser.verificationRecord?.status !== 'approved') {
      res.status(403).json({ error: 'This profile is not available' }); return;
    }

    // Check for existing block
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { initiatorId: req.dbUserId!, targetId: targetUserId },
          { initiatorId: targetUserId, targetId: req.dbUserId! },
        ],
      },
    });
    if (block) {
      res.status(403).json({ error: 'Cannot interact with this user' }); return;
    }

    // Check for existing match
    const existingMatch = await prisma.datingMatch.findFirst({
      where: {
        OR: [
          { user1Id: req.dbUserId!, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: req.dbUserId! },
        ],
      },
    });
    if (existingMatch) {
      res.json({ matched: true, isNew: false, match: existingMatch }); return;
    }

    // Create or no-op the like
    await prisma.datingLike.upsert({
      where: { fromUserId_toUserId: { fromUserId: req.dbUserId!, toUserId: targetUserId } },
      create: { fromUserId: req.dbUserId!, toUserId: targetUserId },
      update: {},
    });

    // Check for mutual like
    const mutualLike = await prisma.datingLike.findUnique({
      where: { fromUserId_toUserId: { fromUserId: targetUserId, toUserId: req.dbUserId! } },
    });

    if (!mutualLike) {
      // Not yet mutual — interest noted but anonymous
      res.json({ matched: false, message: 'Your interest has been noted.' });
      return;
    }

    // ── MUTUAL MATCH! ────────────────────────────────────────────────────────
    // Create Conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: req.dbUserId! },
            { userId: targetUserId },
          ],
        },
      },
    });

    // Create DatingMatch record
    const match = await prisma.datingMatch.create({
      data: {
        user1Id: req.dbUserId!,
        user2Id: targetUserId,
        conversationId: conversation.id,
      },
      include: {
        user2: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    // Notify both users via Socket.io
    io.emit(`dating:match:${req.dbUserId!}`, {
      match,
      partner: { id: targetUser.id, displayName: targetUser.displayName },
      conversationId: conversation.id,
    });
    io.emit(`dating:match:${targetUserId}`, {
      match,
      partner: { id: req.dbUserId!, displayName: 'Your match' },
      conversationId: conversation.id,
    });

    res.json({
      matched: true,
      isNew: true,
      match,
      conversationId: conversation.id,
      partner: { id: targetUser.id, displayName: targetUser.displayName },
    });
  } catch (err) {
    console.error('[Dating] like error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/dating/matches ──────────────────────────────────────────────────
/**
 * Returns all confirmed dating matches for the current user.
 * Also checks and updates resourcesUnlockedAt based on chat activity threshold.
 */
router.get('/matches', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      const mockMatch = {
        id: 'match_dev_1',
        partner: {
          id: 'user_dating_2',
          displayName: 'Rachel Adams',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        },
        conversationId: 'conv_demo_1',
        matchedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
        daysSinceMatch: 8,
        resourcesUnlocked: true,
        resourcesUnlockedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        daysUntilResources: 0,
      };
      res.json({ matches: [mockMatch], resourceUnlockDays: RESOURCE_UNLOCK_DAYS });
      return;
    }

    const matches = await prisma.datingMatch.findMany({
      where: {
        OR: [{ user1Id: req.dbUserId! }, { user2Id: req.dbUserId! }],
      },
      include: {
        user1: { select: { id: true, displayName: true, avatarUrl: true } },
        user2: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { matchedAt: 'desc' },
    });

    // For each match, check if resources should be unlocked
    const unlockCutoff = new Date();
    unlockCutoff.setDate(unlockCutoff.getDate() - RESOURCE_UNLOCK_DAYS);

    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const partner = match.user1Id === req.dbUserId ? match.user2 : match.user1;
        let resourcesUnlocked = !!match.resourcesUnlockedAt;

        // Auto-unlock if past threshold and not yet unlocked
        if (!resourcesUnlocked && match.matchedAt <= unlockCutoff && match.conversationId) {
          // Check if there has been any message activity
          const msgCount = await prisma.directMessage.count({
            where: { conversationId: match.conversationId },
          });

          if (msgCount > 0) {
            await prisma.datingMatch.update({
              where: { id: match.id },
              data: { resourcesUnlockedAt: new Date() },
            });
            resourcesUnlocked = true;
          }
        }

        const daysSinceMatch = Math.floor(
          (Date.now() - match.matchedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: match.id,
          partner,
          conversationId: match.conversationId,
          matchedAt: match.matchedAt,
          daysSinceMatch,
          resourcesUnlocked,
          resourcesUnlockedAt: match.resourcesUnlockedAt,
          daysUntilResources: resourcesUnlocked ? 0 : Math.max(0, RESOURCE_UNLOCK_DAYS - daysSinceMatch),
        };
      })
    );

    res.json({ matches: enrichedMatches, resourceUnlockDays: RESOURCE_UNLOCK_DAYS });
  } catch (err) {
    console.error('[Dating] matches error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/dating/matches/:matchId/resources ───────────────────────────────
/**
 * Returns the pre-marriage resource library for a specific match.
 * Only accessible after the engagement threshold has been reached.
 */
router.get('/matches/:matchId/resources', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const match = await prisma.datingMatch.findFirst({
      where: {
        id: req.params.matchId,
        OR: [{ user1Id: req.dbUserId! }, { user2Id: req.dbUserId! }],
      },
    });

    if (!match) {
      res.status(404).json({ error: 'Match not found' }); return;
    }

    if (!match.resourcesUnlockedAt) {
      const daysSince = Math.floor((Date.now() - match.matchedAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysLeft = Math.max(0, RESOURCE_UNLOCK_DAYS - daysSince);
      res.status(403).json({
        error: 'Resources not yet unlocked',
        message: `Pre-marriage resources unlock after ${RESOURCE_UNLOCK_DAYS} days of chatting. ${daysLeft} day(s) remaining.`,
        daysLeft,
      });
      return;
    }

    res.json({ resources: PREMARRIAGE_RESOURCES, unlockedAt: match.resourcesUnlockedAt });
  } catch (err) {
    console.error('[Dating] resources error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
