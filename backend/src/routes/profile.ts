import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { FaithBackground, Denomination, JoinReason, BibleTranslation } from '@prisma/client';
import { store, savePersistentStore } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

// ─── GET /api/profile/me ──────────────────────────────────────────────────────
router.get('/me', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json({
        ...store.user,
        profile: store.user.profile || {
          faithBackground: 'several_years',
          denomination: 'non_denominational',
          church: 'Grace Fellowship',
          favoriteVerse: 'Philippians 4:13',
          favoriteVerseText: 'I can do all this through him who gives me strength.',
          spiritualGifts: ['Teaching', 'Worship', 'Encouragement'],
          lifeStage: 'Young Adult',
          bibleTranslation: 'NIV',
          city: store.user.city || 'Austin',
          region: store.user.region || 'Texas',
          openToPrayerPartner: true,
          joinReasons: ['fellowship', 'prayer', 'bible_study'],
        },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: req.userId },
      include: { profile: true },
    });
    if (!user) {
      res.json(store.user);
      return;
    }
    res.json(user);
  } catch {
    res.json(store.user);
  }
});

// ─── GET /api/profile/:userId ─────────────────────────────────────────────────
router.get('/:userId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      const p = store.userProfiles[req.params.userId] || {
        id: req.params.userId,
        displayName: 'Faith Believer',
        bio: 'Walking in faith daily.',
        avatarUrl: null,
        bannerUrl: null,
        accountType: 'adult_verified',
        createdAt: new Date().toISOString(),
        profile: {
          faithBackground: 'several_years',
          denomination: 'non_denominational',
          church: 'Community Church',
          favoriteVerse: 'Proverbs 3:5-6',
          spiritualGifts: ['Prayer', 'Hospitality'],
          joinReasons: ['fellowship'],
          bibleTranslation: 'NIV',
          openToPrayerPartner: true,
        },
      };
      res.json(p);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true, displayName: true, avatarUrl: true, bio: true,
        accountType: true, createdAt: true,
        profile: {
          select: {
            faithBackground: true, denomination: true,
            joinReasons: true, bibleTranslation: true,
            openToPrayerPartner: true,
          },
        },
      },
    });
    if (!user) {
      const p = store.userProfiles[req.params.userId] || { id: req.params.userId, displayName: 'Believer' };
      res.json(p);
      return;
    }
    res.json(user);
  } catch {
    const p = store.userProfiles[req.params.userId] || { id: req.params.userId, displayName: 'Believer' };
    res.json(p);
  }
});

// ─── PATCH /api/profile/me ────────────────────────────────────────────────────
router.patch('/me', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      displayName, bio, avatarUrl, bannerUrl, city, region,
      faithBackground, denomination, church, favoriteVerse, favoriteVerseText,
      spiritualGifts, lifeStage, joinReasons, bibleTranslation,
      bibleStudyFocus, studySchedule, openToPrayerPartner,
    } = req.body;

    if (!isDbConnected()) {
      if (displayName) store.user.displayName = displayName;
      if (bio !== undefined) store.user.bio = bio;
      if (avatarUrl !== undefined) store.user.avatarUrl = avatarUrl;
      if (bannerUrl !== undefined) store.user.bannerUrl = bannerUrl;
      if (city !== undefined) store.user.city = city;
      if (region !== undefined) store.user.region = region;

      store.user.profile = {
        ...(store.user.profile || {}),
        ...(faithBackground !== undefined && { faithBackground }),
        ...(denomination !== undefined && { denomination }),
        ...(church !== undefined && { church }),
        ...(favoriteVerse !== undefined && { favoriteVerse }),
        ...(favoriteVerseText !== undefined && { favoriteVerseText }),
        ...(spiritualGifts !== undefined && { spiritualGifts }),
        ...(lifeStage !== undefined && { lifeStage }),
        ...(joinReasons !== undefined && { joinReasons }),
        ...(bibleTranslation !== undefined && { bibleTranslation }),
        ...(bibleStudyFocus !== undefined && { bibleStudyFocus }),
        ...(studySchedule !== undefined && { studySchedule }),
        ...(openToPrayerPartner !== undefined && { openToPrayerPartner }),
      };

      savePersistentStore();
      res.json({ success: true, user: store.user, profile: store.user.profile });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: req.userId }, select: { id: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    // Update base user fields
    if (displayName || bio !== undefined || avatarUrl !== undefined || city !== undefined || region !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(displayName && { displayName }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(city !== undefined && { city }),
          ...(region !== undefined && { region }),
        },
      });
    }

    // Upsert profile
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        faithBackground,
        denomination,
        joinReasons: joinReasons ?? [],
        bibleTranslation: bibleTranslation ?? 'NIV',
        bibleStudyFocus,
        studySchedule,
        openToPrayerPartner: openToPrayerPartner ?? false,
      },
      update: {
        ...(faithBackground !== undefined && { faithBackground }),
        ...(denomination !== undefined && { denomination }),
        ...(joinReasons !== undefined && { joinReasons }),
        ...(bibleTranslation !== undefined && { bibleTranslation }),
        ...(bibleStudyFocus !== undefined && { bibleStudyFocus }),
        ...(studySchedule !== undefined && { studySchedule }),
        ...(openToPrayerPartner !== undefined && { openToPrayerPartner }),
      },
    });

    res.json({ success: true, profile });
  } catch (err) {
    console.error('[Profile] patch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
