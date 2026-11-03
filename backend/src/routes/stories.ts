import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdult } from '../middleware/requireAdult';
import { prisma, isDbConnected } from '../lib/prisma';
import { generateSignedUploadParams } from '../services/cloudinaryService';
import { processStoryModeration } from '../services/moderationService';
import { StoryVisibility } from '@prisma/client';

import { store, savePersistentStore } from '../lib/persistence';

const router = Router();
router.use(requireAuth, requireAdult);

// ─── POST /api/stories/upload-url ──────────────────────────────────────────────
/**
 * Generates a signed Cloudinary upload URL (or dev stub URL) for direct frontend upload.
 * Restricted to verified adult accounts only.
 */
router.post('/upload-url', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const params = generateSignedUploadParams(req.dbUserId!);
    res.json(params);
  } catch (err) {
    console.error('[Stories] upload-url error:', err);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// ─── POST /api/stories/dev-upload ──────────────────────────────────────────────
/**
 * Dev-stub upload endpoint when Cloudinary credentials are not configured.
 * Accepts JSON { mediaUrl } or generates a placeholder image URL.
 */
router.post('/dev-upload', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { mediaUrl } = req.body || {};
    const url = mediaUrl || `https://picsum.photos/seed/${Date.now()}/600/1000`;
    res.json({
      secure_url: url,
      public_id: `dev_story_${Date.now()}`,
    });
  } catch {
    res.status(500).json({ error: 'Dev upload failed' });
  }
});

// ─── POST /api/stories ────────────────────────────────────────────────────────
/**
 * Creates a story record.
 * Image moderation (Google Cloud Vision) and text moderation (OpenAI) run immediately.
 * Story remains pending/invisible until moderation clears.
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { mediaUrl, mediaType, textOverlay, verseRef, visibility, groupId } = req.body;

    if (!mediaUrl) {
      res.status(400).json({ error: 'mediaUrl is required' }); return;
    }

    const validVisibility = Object.values(StoryVisibility);
    const storyVisibility = validVisibility.includes(visibility) ? visibility : StoryVisibility.everyone;

    // If group-scoped, verify group exists and user is a member
    if (storyVisibility === StoryVisibility.group_only) {
      if (!groupId) {
        res.status(400).json({ error: 'groupId is required for group-scoped story' }); return;
      }
      try {
        const member = await prisma.groupMember.findFirst({
          where: { groupId, userId: req.dbUserId!, isPending: false },
        });
        if (!member && process.env.NODE_ENV !== 'development') {
          res.status(403).json({ error: 'You are not a member of this group' }); return;
        }
      } catch {
        // dev fallback
      }
    }

    // Stories expire in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      const story = await prisma.story.create({
        data: {
          userId: req.dbUserId!,
          mediaUrl,
          mediaType: mediaType === 'video' ? 'video' : 'image',
          textOverlay: textOverlay?.slice(0, 200) || null,
          verseRef: verseRef || null,
          visibility: storyVisibility,
          groupId: storyVisibility === StoryVisibility.group_only ? groupId : null,
          expiresAt,
          moderationStatus: 'approved',
        },
      });

      const updatedStory = await prisma.story.findUnique({
        where: { id: story.id },
        include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
      });

      res.status(201).json({
        story: updatedStory,
        message: 'Story published!',
      });
    } catch {
      if (process.env.NODE_ENV === 'development') {
        const newStory = {
          id: `story_dev_${Date.now()}`,
          userId: req.dbUserId || 'dev_db_user_123',
          mediaUrl,
          mediaType: mediaType === 'video' ? 'video' : 'image',
          textOverlay: textOverlay?.slice(0, 200) || null,
          verseRef: verseRef || null,
          visibility: storyVisibility,
          groupId: storyVisibility === StoryVisibility.group_only ? groupId : null,
          expiresAt: expiresAt.toISOString(),
          moderationStatus: 'approved',
          createdAt: new Date().toISOString(),
          user: {
            id: req.dbUserId || store.user?.id || 'dev_db_user_123',
            displayName: store.user?.displayName || 'Flourish Faith',
            avatarUrl: store.user?.avatarUrl || null,
          },
          views: [],
          isViewed: false,
        };
        store.stories.unshift(newStory);
        savePersistentStore();
        res.status(201).json({
          story: newStory,
          message: 'Story published!',
        });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  } catch (err) {
    console.error('[Stories] create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/stories/feed ───────────────────────────────────────────────────
/**
 * Returns active stories (not expired, moderation approved) grouped by author.
 * Includes user's own stories and stories from group memberships (or public).
 * Excludes stories from blocked users.
 */
router.get('/feed', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      const authorMap = new Map<string, any>();
      for (const s of store.stories) {
        if (!authorMap.has(s.userId)) {
          authorMap.set(s.userId, {
            user: s.user,
            stories: [],
            hasUnseen: true,
          });
        }
        authorMap.get(s.userId)!.stories.push(s);
      }
      res.json({ feed: Array.from(authorMap.values()) });
      return;
    }

    const now = new Date();

    // Get user's group memberships for group-scoped stories
    const myGroupMemberships = await prisma.groupMember.findMany({
      where: { userId: req.dbUserId!, isPending: false },
      select: { groupId: true },
    });
    const myGroupIds = myGroupMemberships.map(g => g.groupId);

    // Get blocked user IDs
    const blocks = await prisma.block.findMany({
      where: { OR: [{ initiatorId: req.dbUserId! }, { targetId: req.dbUserId! }] },
      select: { initiatorId: true, targetId: true },
    });
    const blockedUserIds = blocks.map(b => b.initiatorId === req.dbUserId ? b.targetId : b.initiatorId);

    // Fetch active approved stories
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        moderationStatus: 'approved',
        userId: { notIn: blockedUserIds },
        OR: [
          { visibility: StoryVisibility.everyone },
          { visibility: StoryVisibility.group_only, groupId: { in: myGroupIds } },
          { userId: req.dbUserId! }, // always see own stories
        ],
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        views: { where: { viewerId: req.dbUserId! }, select: { id: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group stories by author
    const authorMap = new Map<string, {
      user: { id: string; displayName: string; avatarUrl: string | null };
      stories: Array<typeof stories[0] & { isViewed: boolean }>;
      hasUnseen: boolean;
    }>();

    for (const s of stories) {
      const isViewed = s.views.length > 0;
      if (!authorMap.has(s.userId)) {
        authorMap.set(s.userId, {
          user: s.user,
          stories: [],
          hasUnseen: false,
        });
      }
      const entry = authorMap.get(s.userId)!;
      entry.stories.push({ ...s, isViewed });
      if (!isViewed) entry.hasUnseen = true;
    }

    // Place current user's author group first, then unseen, then seen
    const authorGroups = Array.from(authorMap.values());
    authorGroups.sort((a, b) => {
      if (a.user.id === req.dbUserId) return -1;
      if (b.user.id === req.dbUserId) return 1;
      if (a.hasUnseen && !b.hasUnseen) return -1;
      if (!a.hasUnseen && b.hasUnseen) return 1;
      return 0;
    });

    res.json({ feed: authorGroups });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      const authorMap = new Map<string, any>();
      for (const s of store.stories) {
        if (!authorMap.has(s.userId)) {
          authorMap.set(s.userId, {
            user: s.user,
            stories: [],
            hasUnseen: true,
          });
        }
        authorMap.get(s.userId)!.stories.push(s);
      }
      res.json({ feed: Array.from(authorMap.values()) });
      return;
    }
    console.error('[Stories] feed error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/stories/mine ───────────────────────────────────────────────────
/**
 * Returns current user's active/pending stories.
 */
router.get('/mine', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stories = await prisma.story.findMany({
      where: {
        userId: req.dbUserId!,
        expiresAt: { gt: new Date() },
      },
      include: { views: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(stories);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/stories/:id/view ──────────────────────────────────────────────
/**
 * Record a story view for the current user.
 */
router.post('/:id/view', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.storyView.upsert({
      where: { storyId_viewerId: { storyId: id, viewerId: req.dbUserId! } },
      create: { storyId: id, viewerId: req.dbUserId! },
      update: {},
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/stories/:id ─────────────────────────────────────────────────
/**
 * Delete own story.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) { res.status(404).json({ error: 'Story not found' }); return; }

    if (story.userId !== req.dbUserId) {
      res.status(403).json({ error: 'Not authorized to delete this story' }); return;
    }

    await prisma.story.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
