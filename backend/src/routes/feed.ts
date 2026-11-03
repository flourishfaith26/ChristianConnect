import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { getDailySpotlight } from '../data/dailySpotlight';
import { store, savePersistentStore } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

// In-memory feed items store for dev fallback & instant interaction
const inMemoryFeed: any[] = [
  {
    id: 'feed_spotlight_1',
    type: 'devotional',
    category: 'Devotional',
    title: "Walking in Faith When the Path Isn't Clear",
    content: "When Abraham was called to leave his homeland, he went out not knowing where he was going (Hebrews 11:8). God doesn't always show us the whole staircase before we take the first step. Faith is trusting His character when we can't see His full plan.",
    scriptureRef: 'Hebrews 11:8',
    mediaUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80',
    mediaType: 'image',
    author: { id: 'author_pastor_john', displayName: 'Pastor John Mark', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', badge: 'Verified Pastor' },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    likesCount: 128,
    isLiked: true,
    amenCount: 42,
    commentCount: 9,
    reshareCount: 14,
    isReshared: false,
    isSaved: true,
    hasReacted: true,
    comments: [
      { id: 'c1', authorName: 'Sarah M.', content: 'Amen! Needed this reminder today.', createdAt: '1h ago' },
      { id: 'c2', authorName: 'David K.', content: 'Stepping out in faith this week for a new job transition.', createdAt: '30m ago' }
    ]
  },
  {
    id: 'feed_sermon_1',
    type: 'sermon_clip',
    category: 'Sermons',
    title: 'Transforming Your Mind Through Scripture (Live Clip)',
    content: '"Do not be conformed to this world, but be transformed by the renewal of your mind." Watch this powerful clip on living with kingdom focus.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    mediaType: 'video',
    thumbnailUrl: 'https://images.unsplash.com/photo-1510936150000-409ba3fe203f?auto=format&fit=crop&w=1200&q=80',
    churchName: 'Grace Community Chapel',
    author: { id: 'author_pastor_emmanuel', displayName: 'Pastor Emmanuel', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', badge: 'Partner Church' },
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    likesCount: 245,
    isLiked: false,
    amenCount: 154,
    commentCount: 31,
    reshareCount: 47,
    isReshared: true,
    isSaved: false,
    hasReacted: false,
    comments: [
      { id: 'cs1', authorName: 'Grace B.', content: 'Such an anointed message pastor!', createdAt: '2h ago' }
    ]
  },
  {
    id: 'feed_testimony_1',
    type: 'testimony',
    category: 'Testimonies',
    title: 'Healed from Chronic Anxiety Through Community Prayer',
    content: 'After 3 years of struggling with severe panic attacks, our prayer partner group prayed over me last month. God has granted me supernatural peace that passes all understanding (Philippians 4:7)! All glory to Jesus!',
    mediaUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=1200&q=80',
    mediaType: 'image',
    author: { id: 'author_hannah_b', displayName: 'Hannah Bennett', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', badge: 'Prayer Warrior' },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    likesCount: 189,
    isLiked: true,
    amenCount: 88,
    commentCount: 15,
    reshareCount: 23,
    isReshared: false,
    isSaved: false,
    hasReacted: true,
    comments: [
      { id: 'c3', authorName: 'Michael R.', content: 'Glory to God! Hallelujah!', createdAt: '3h ago' },
      { id: 'c4', authorName: 'Rachel T.', content: 'So happy for you Hannah! God is faithful.', createdAt: '2h ago' }
    ]
  },
  {
    id: 'feed_prayer_1',
    type: 'prayer',
    category: 'Community',
    title: 'Prayer Urgent: Healing for My Grandmother',
    content: 'My grandmother was admitted to the ICU this morning with severe pneumonia. Please stand with our family in believing God for complete restoration and strength for the medical team.',
    isUrgent: true,
    author: { id: 'author_caleb_v', displayName: 'Caleb Vance', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    likesCount: 92,
    isLiked: false,
    amenCount: 112,
    commentCount: 28,
    reshareCount: 19,
    isReshared: false,
    isSaved: false,
    hasReacted: true,
    comments: [
      { id: 'c5', authorName: 'Pastor Samuel', content: 'Standing in faith with you Caleb. Declaring Jehovah Rapha over her!', createdAt: '6h ago' }
    ]
  },
  {
    id: 'feed_devotional_2',
    type: 'devotional',
    category: 'Devotional',
    title: 'The Peace That Surpasses Understanding in Troubled Times',
    content: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God (Philippians 4:6). God promises His peace will guard your heart.',
    scriptureRef: 'Philippians 4:6-7',
    mediaUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80',
    mediaType: 'image',
    author: { id: 'author_pastor_emmanuel', displayName: 'Pastor Emmanuel', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', badge: 'Verified Pastor' },
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    likesCount: 147,
    isLiked: false,
    amenCount: 65,
    commentCount: 12,
    reshareCount: 18,
    isReshared: false,
    isSaved: false,
    hasReacted: true,
    comments: []
  },
  {
    id: 'feed_sermon_2',
    type: 'sermon_clip',
    category: 'Sermons',
    title: 'Living a Life of Purpose in a Distracted Culture',
    content: 'Pastor Mark explores Ephesians 5:15-17 on making the most of every opportunity in days of uncertainty.',
    churchName: 'Hope Fellowship',
    author: { id: 'author_pastor_mark', displayName: 'Pastor Mark Driscoll', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80', badge: 'Guest Speaker' },
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    amenCount: 98,
    commentCount: 14,
    shareCount: 22,
    hasReacted: false,
    comments: []
  },
  {
    id: 'feed_apologetics_1',
    type: 'apologetics',
    category: 'Apologetics',
    title: 'How Can We Trust the Historical Accuracy of the Gospels?',
    content: 'A summary of historical manuscript evidence, early church father citations, and archaeological discoveries validating the Gospel accounts.',
    author: { id: 'author_dr_tim', displayName: 'Dr. Timothy Keller', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80', badge: 'Apologetics Scholar' },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    amenCount: 95,
    commentCount: 22,
    shareCount: 38,
    hasReacted: false,
    comments: []
  },
  {
    id: 'feed_apologetics_2',
    type: 'apologetics',
    category: 'Apologetics',
    title: 'Addressing the Problem of Evil and Suffering with Christian Hope',
    content: 'Why does God allow suffering? A deep dive into biblical theology, free will, and the ultimate restoration promised in Revelation 21.',
    author: { id: 'author_dr_william', displayName: 'Dr. William Lane Craig', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', badge: 'Christian Philosopher' },
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    amenCount: 130,
    commentCount: 45,
    shareCount: 52,
    hasReacted: true,
    comments: []
  }
];

// ─── GET /api/feed ────────────────────────────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const category = (req.query.category as string) || 'All';

    // Current user latest profile details from persistent store
    let currentDisplayName = store.user?.displayName || 'Flourish Faith';
    let currentAvatarUrl = store.user?.avatarUrl || null;

    // Attempt to pull real db items if Prisma connects
    let dbTestimonies: any[] = [];
    let dbPrayers: any[] = [];
    if (isDbConnected()) {
      try {
        if (req.userId) {
          const me = await prisma.user.findUnique({
            where: { clerkId: req.userId },
            select: { id: true, displayName: true, avatarUrl: true },
          });
          if (me) {
            currentDisplayName = me.displayName || currentDisplayName;
            currentAvatarUrl = me.avatarUrl || currentAvatarUrl;
          }
        }

        dbTestimonies = await prisma.testimony.findMany({
          take: 5,
          include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' }
        });
        dbPrayers = await prisma.prayerRequest.findMany({
          take: 5,
          include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' }
        });
      } catch {
        // Dev fallback mode
      }
    }

    // Merge persistent user feed items, in-memory items & db items
    const savedUserPosts = Array.isArray(store.feedItems) ? store.feedItems : [];
    let combinedFeed = [...savedUserPosts, ...inMemoryFeed];

    // Deduplicate by ID
    const seenIds = new Set<string>();
    combinedFeed = combinedFeed.filter(item => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    if (dbTestimonies.length > 0) {
      const convertedTestimonies = dbTestimonies.map(t => ({
        id: t.id,
        type: 'testimony',
        category: 'Testimonies',
        title: t.title,
        content: t.content,
        author: { id: t.author?.id || 'anon', displayName: t.author?.displayName || 'Anonymous', avatarUrl: t.author?.avatarUrl },
        createdAt: t.createdAt,
        amenCount: 12,
        commentCount: 2,
        shareCount: 4,
        hasReacted: false,
        comments: []
      }));
      combinedFeed = [...convertedTestimonies, ...combinedFeed];
    }

    // Filter by category if requested
    if (category !== 'All') {
      combinedFeed = combinedFeed.filter(item => 
        item.category.toLowerCase() === category.toLowerCase() || item.type.toLowerCase() === category.toLowerCase()
      );
    }

    // Enrich all user posts with the latest avatarUrl and displayName
    combinedFeed = combinedFeed.map(item => {
      const isUserAuthor =
        item.author?.id === req.userId ||
        item.author?.id === req.dbUserId ||
        item.author?.id === 'dev_user_demo_123' ||
        item.author?.id === 'dev_db_user_123' ||
        item.author?.id === store.user?.id ||
        item.author?.id === store.user?.clerkId ||
        item.author?.displayName === currentDisplayName ||
        item.author?.displayName === 'Flourish Faith' ||
        item.author?.displayName === 'Grace Believer';

      if (isUserAuthor) {
        return {
          ...item,
          author: {
            ...item.author,
            displayName: currentDisplayName,
            avatarUrl: currentAvatarUrl || item.author?.avatarUrl || null,
          },
        };
      }

      // Check if author profile avatar exists in userProfiles store
      if (item.author?.id && store.userProfiles?.[item.author.id]?.avatarUrl) {
        return {
          ...item,
          author: {
            ...item.author,
            avatarUrl: store.userProfiles[item.author.id].avatarUrl,
          },
        };
      }

      return item;
    });

    // Fetch fresh date-based Daily Spotlight (new Scripture verse and Devotional every day)
    const dailySpotlightItem = getDailySpotlight(new Date());

    const todayVerse = dailySpotlightItem.verse;
    const todayDevotional = dailySpotlightItem.devotional;

    const activeStories = [
      { id: 'story_1', authorName: 'Grace B.', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', title: 'Morning Prayer ☀️' },
      { id: 'story_2', authorName: 'David K.', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', title: 'Verse of the Day 📖' },
      { id: 'story_3', authorName: 'Sarah M.', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', title: 'Worship Night 🎵' },
      { id: 'story_4', authorName: 'Caleb V.', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', title: 'Bible Study Note ✍️' },
    ];

    res.json({
      todaySpotlight: {
        verse: todayVerse,
        devotional: todayDevotional,
        theme: dailySpotlightItem.theme,
        stories: activeStories,
      },
      feed: combinedFeed,
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not load feed' });
  }
});

// ─── POST /api/feed/post ─── Create a post with media ─────────────────────────
router.post('/post', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content, type, category, mediaUrl, mediaType, videoUrl, scriptureRef, authorDisplayName, authorAvatarUrl } = req.body;
    if (!content || content.trim().length < 5) {
      res.status(400).json({ error: 'Content must be at least 5 characters.' });
      return;
    }

    const resolvedMediaUrl = mediaUrl || videoUrl || null;
    const resolvedMediaType = mediaType || (videoUrl ? 'video' : mediaUrl ? 'image' : undefined);

    let authorName = authorDisplayName || store.user?.displayName || 'Flourish Faith';
    let authorAvatar = authorAvatarUrl || store.user?.avatarUrl || null;
    let authorId = req.dbUserId || req.userId || store.user?.id || 'dev_db_user_123';

    if (isDbConnected()) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: req.userId },
          select: { id: true, displayName: true, avatarUrl: true },
        });
        if (dbUser) {
          authorName = dbUser.displayName || authorName;
          authorAvatar = dbUser.avatarUrl || authorAvatar;
          authorId = dbUser.id;
        }
      } catch {
        // Dev fallback mode
      }
    }

    const newPost = {
      id: `feed_user_${Date.now()}`,
      type: type || 'testimony',
      category: category || 'Testimonies',
      title: title || 'Community Post',
      content: content.trim(),
      scriptureRef: scriptureRef || null,
      mediaUrl: resolvedMediaUrl,
      mediaType: resolvedMediaType,
      videoUrl: resolvedMediaType === 'video' ? resolvedMediaUrl : undefined,
      author: {
        id: authorId,
        displayName: authorName,
        avatarUrl: authorAvatar,
      },
      createdAt: new Date().toISOString(),
      likesCount: 1,
      isLiked: true,
      amenCount: 1,
      commentCount: 0,
      reshareCount: 0,
      isReshared: false,
      isSaved: false,
      hasReacted: true,
      comments: [],
    };

    inMemoryFeed.unshift(newPost);
    if (!Array.isArray(store.feedItems)) {
      store.feedItems = [];
    }
    store.feedItems.unshift(newPost);
    savePersistentStore();

    res.status(201).json({ success: true, post: newPost });
  } catch {
    res.status(500).json({ error: 'Could not create post' });
  }
});

// ─── POST /api/feed/:id/like ─── Toggle Love/Heart (Instagram style) ─────────
router.post('/:id/like', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = inMemoryFeed.find(f => f.id === id);
    if (item) {
      if (item.isLiked) {
        item.isLiked = false;
        item.likesCount = Math.max(0, (item.likesCount || 1) - 1);
      } else {
        item.isLiked = true;
        item.likesCount = (item.likesCount || 0) + 1;
      }
      res.json({ success: true, likesCount: item.likesCount, isLiked: item.isLiked });
      return;
    }
    res.json({ success: true, likesCount: 1, isLiked: true });
  } catch {
    res.status(500).json({ error: 'Could not process like' });
  }
});

// ─── POST /api/feed/:id/react ─── Toggle Amen / Praying ──────────────────────
router.post('/:id/react', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = inMemoryFeed.find(f => f.id === id);
    if (item) {
      if (item.hasReacted) {
        item.hasReacted = false;
        item.amenCount = Math.max(0, (item.amenCount || 1) - 1);
      } else {
        item.hasReacted = true;
        item.amenCount = (item.amenCount || 0) + 1;
      }
      res.json({ success: true, amenCount: item.amenCount, hasReacted: item.hasReacted });
      return;
    }
    res.json({ success: true, amenCount: 1, hasReacted: true });
  } catch {
    res.status(500).json({ error: 'Could not process reaction' });
  }
});

// ─── POST /api/feed/:id/reshare ─── Toggle Repost / Reshare ───────────────────
router.post('/:id/reshare', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = inMemoryFeed.find(f => f.id === id);
    if (item) {
      if (item.isReshared) {
        item.isReshared = false;
        item.reshareCount = Math.max(0, (item.reshareCount || 1) - 1);
      } else {
        item.isReshared = true;
        item.reshareCount = (item.reshareCount || 0) + 1;
      }
      res.json({ success: true, reshareCount: item.reshareCount, isReshared: item.isReshared });
      return;
    }
    res.json({ success: true, reshareCount: 1, isReshared: true });
  } catch {
    res.status(500).json({ error: 'Could not process reshare' });
  }
});

// ─── POST /api/feed/:id/save ─── Toggle Bookmark / Save ──────────────────────
router.post('/:id/save', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = inMemoryFeed.find(f => f.id === id);
    if (item) {
      item.isSaved = !item.isSaved;
      res.json({ success: true, isSaved: item.isSaved });
      return;
    }
    res.json({ success: true, isSaved: true });
  } catch {
    res.status(500).json({ error: 'Could not process bookmark' });
  }
});

// ─── POST /api/feed/:id/comment ─── Add comment ──────────────────────────────
router.post('/:id/comment', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Comment cannot be empty' });
      return;
    }

    const newComment = {
      id: `c_${Date.now()}`,
      authorName: 'Flourish Faith',
      content: content.trim(),
      createdAt: 'Just now',
    };

    const item = inMemoryFeed.find(f => f.id === id);
    if (item) {
      if (!item.comments) item.comments = [];
      item.comments.push(newComment);
      item.commentCount = (item.commentCount || 0) + 1;
    }

    res.json({ success: true, comment: newComment });
  } catch {
    res.status(500).json({ error: 'Could not add comment' });
  }
});

export default router;
