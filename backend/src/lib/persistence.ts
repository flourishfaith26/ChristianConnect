import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'persistent_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('[Persistence] Could not create data directory:', err);
  }
}

export interface PersistentStore {
  user: any;
  userProfiles: Record<string, any>;
  stories: any[];
  prayerRequests: any[];
  prayerPartners: any[];
  readingPlans: any[];
  verseStreaks: Record<string, { currentStreak: number; longestStreak: number; lastAttemptDate?: string }>;
  verseAttempts: any[];
  journalEntries: any[];
  sermonNotes: any[];
  feedItems: any[];
  feedReactions: Record<string, { amens: number; comments: any[]; hasReacted?: boolean }>;
  directMessages: Record<string, any[]>;
  conversations: any[];
  groups: any[];
  groupMessages: Record<string, any[]>;
  datingProfiles: any[];
  datingLikes: Record<string, string[]>;
  datingMatches: any[];
  datingPreferences: Record<string, any>;
  friendships: any[];
  friendRequests: any[];
  events: any[];
  eventRsvps: Record<string, string[]>;
  livestreams: any[];
  audioRooms: any[];
  mentorships: any[];
  accountabilityPairs: any[];
  apologetics: any[];
  testimonies: any[];
  courses: any[];
  familyDevotionals: any[];
  missionaries: any[];
  notifications: any[];
  blockedUsers: string[];
  reports: any[];
}

const DEFAULT_STORE: PersistentStore = {
  user: {
    id: 'dev_db_user_123',
    clerkId: 'dev_user_demo_123',
    email: 'demo@christianconnect.app',
    displayName: 'Grace Believer',
    bio: 'Walking in faith daily, passionate about intercessory prayer, worship, and community discipleship.',
    avatarUrl: null,
    gender: 'female',
    accountType: 'adult_verified',
    statementOfFaithAccepted: true,
    parentConsentGiven: true,
    isBanned: false,
    createdAt: new Date().toISOString(),
    profile: {
      faithBackground: 'several_years',
      denomination: 'non_denominational',
      joinReasons: ['fellowship', 'prayer', 'discipleship', 'dating'],
      bibleTranslation: 'NIV',
      openToPrayerPartner: true,
    },
  },
  userProfiles: {
    dev_db_user_123: {
      id: 'dev_db_user_123',
      displayName: 'Grace Believer',
      bio: 'Walking in faith daily, passionate about intercessory prayer, worship, and community discipleship.',
      gender: 'female',
      accountType: 'adult_verified',
      faithBackground: 'several_years',
      denomination: 'non_denominational',
    },
    dev_db_user_456: {
      id: 'dev_db_user_456',
      displayName: 'Caleb Strong',
      bio: 'Biomedical engineer, worship guitarist, serving in youth ministry and campus outreach.',
      gender: 'male',
      accountType: 'adult_verified',
      faithBackground: 'most_of_my_life',
      denomination: 'baptist',
    },
    dev_db_user_789: {
      id: 'dev_db_user_789',
      displayName: 'David Hope',
      bio: 'Worship leader, father of two, praying for community revival and biblical wisdom.',
      gender: 'male',
      accountType: 'adult_verified',
      faithBackground: 'several_years',
      denomination: 'pentecostal',
    },
    dev_db_user_101: {
      id: 'dev_db_user_101',
      displayName: 'Hannah Joy',
      bio: 'Graduate student studying theology, excited to pray through life’s seasons together.',
      gender: 'female',
      accountType: 'adult_verified',
      faithBackground: 'most_of_my_life',
      denomination: 'reformed',
    },
  },
  stories: [
    {
      id: 'story_demo_1',
      userId: 'dev_db_user_456',
      mediaUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      textOverlay: 'Morning sunrise and Psalm 23 devotion with the youth group. God is faithful!',
      verseRef: 'Psalm 23:1-3',
      visibility: 'everyone',
      groupId: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      moderationStatus: 'approved',
      createdAt: new Date().toISOString(),
      user: { id: 'dev_db_user_456', displayName: 'Caleb Strong', avatarUrl: null },
      views: [],
      isViewed: false,
    },
    {
      id: 'story_demo_2',
      userId: 'dev_db_user_789',
      mediaUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      textOverlay: 'Praying through the weekly memory verse during lunch break! 🙏',
      verseRef: 'Philippians 4:13',
      visibility: 'everyone',
      groupId: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      moderationStatus: 'approved',
      createdAt: new Date().toISOString(),
      user: { id: 'dev_db_user_789', displayName: 'David Hope', avatarUrl: null },
      views: [],
      isViewed: false,
    },
  ],
  prayerRequests: [
    {
      id: 'prayer_dev_1',
      title: 'Prayer for Peace & Family Healing',
      content: 'Please join me in praying for reconciliation and peace in my family this month.',
      isAnonymous: false,
      isAnswered: false,
      moderationStatus: 'approved',
      createdAt: new Date().toISOString(),
      author: { id: 'dev_db_user_123', displayName: 'Grace Believer', avatarUrl: null },
      reactions: [
        { type: 'praying', userId: 'dev_db_user_456', comment: 'Praying for you!', createdAt: new Date().toISOString(), user: { id: 'dev_db_user_456', displayName: 'Caleb Strong' } },
      ],
      _count: { reactions: 1 },
    },
    {
      id: 'prayer_dev_2',
      title: 'Praise Report! Job Found',
      content: 'Praise the Lord! After 3 months of searching, God provided a wonderful job opportunity.',
      isAnonymous: false,
      isAnswered: true,
      moderationStatus: 'approved',
      createdAt: new Date().toISOString(),
      author: { id: 'dev_db_user_456', displayName: 'Caleb Strong', avatarUrl: null },
      reactions: [],
      _count: { reactions: 0 },
    },
  ],
  prayerPartners: [
    {
      userId: 'dev_db_user_456',
      denomination: 'Non-Denominational / Evangelical',
      user: {
        id: 'dev_db_user_456',
        displayName: 'Caleb Strong',
        avatarUrl: null,
        bio: 'Walking in faith daily, passionate about intercessory prayer and encouraging one another.',
      },
    },
    {
      userId: 'dev_db_user_789',
      denomination: 'Baptist',
      user: {
        id: 'dev_db_user_789',
        displayName: 'David Hope',
        avatarUrl: null,
        bio: 'Worship leader, father of two, praying for community revival and wisdom.',
      },
    },
    {
      userId: 'dev_db_user_101',
      denomination: 'Presbyterian (PCA)',
      user: {
        id: 'dev_db_user_101',
        displayName: 'Hannah Joy',
        avatarUrl: null,
        bio: 'Graduate student studying theology, excited to pray through life’s seasons together.',
      },
    },
  ],
  readingPlans: [
    {
      id: 'plan_dev_1',
      userId: 'dev_db_user_123',
      templateId: 'gospels-in-30-days',
      name: 'The Gospels in 30 Days',
      lengthDays: 30,
      currentDay: 3,
      focus: 'gospels',
      isActive: true,
      startDate: new Date().toISOString(),
      targetEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      reminderTime: '08:00',
      days: [
        { id: 'day_1', dayNumber: 1, passageRef: 'Matthew 1-4', passageLabel: 'The Genealogy, Birth, and Temptation of Jesus', isCompleted: true, completedAt: new Date().toISOString() },
        { id: 'day_2', dayNumber: 2, passageRef: 'Matthew 5-7', passageLabel: 'The Sermon on the Mount', isCompleted: true, completedAt: new Date().toISOString() },
        { id: 'day_3', dayNumber: 3, passageRef: 'Matthew 8-10', passageLabel: 'Miracles and the Sending of the Twelve', isCompleted: false, completedAt: null },
      ],
    },
  ],
  verseStreaks: {
    dev_db_user_123: { currentStreak: 3, longestStreak: 7, lastAttemptDate: new Date().toISOString() },
  },
  verseAttempts: [],
  journalEntries: [
    {
      id: 'journal_1',
      userId: 'dev_db_user_123',
      title: 'Reflections on Psalm 23',
      content: 'The Lord is my shepherd, I lack nothing. In every valley of uncertainty, God’s peace guides my thoughts and calms my soul.',
      scriptureRef: 'Psalm 23:1-6',
      tags: ['peace', 'trust', 'psalms'],
      mood: 'peaceful',
      isPrivate: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  sermonNotes: [
    {
      id: 'sermon_1',
      userId: 'dev_db_user_123',
      title: 'Walking in the Spirit',
      speaker: 'Pastor Thomas',
      churchName: 'Grace Community Fellowship',
      scriptureRef: 'Galatians 5:16-26',
      notes: 'Key Takeaways:\n1. The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control.\n2. Keep in step with the Spirit daily.\n3. Crucify the flesh with its passions.',
      tags: ['holy-spirit', 'spiritual-growth'],
      sermonDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],
  feedItems: [
    {
      id: 'feed_1',
      authorId: 'dev_db_user_456',
      author: { id: 'dev_db_user_456', displayName: 'Caleb Strong', avatarUrl: null },
      content: '“Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!” (2 Corinthians 5:17). Thankful for God’s renewing grace this morning!',
      verseRef: '2 Corinthians 5:17',
      mediaUrl: null,
      type: 'scripture_share',
      amensCount: 14,
      commentsCount: 3,
      hasAmened: false,
      isBookmarked: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'feed_2',
      authorId: 'dev_db_user_101',
      author: { id: 'dev_db_user_101', displayName: 'Hannah Joy', avatarUrl: null },
      content: 'Starting the Romans 8 Bible study with friends today. What is your favorite verse from Romans 8?',
      verseRef: 'Romans 8:38-39',
      mediaUrl: null,
      type: 'discussion',
      amensCount: 9,
      commentsCount: 6,
      hasAmened: true,
      isBookmarked: true,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
  feedReactions: {
    feed_1: { amens: 14, comments: [], hasReacted: false },
    feed_2: { amens: 9, comments: [], hasReacted: true },
  },
  directMessages: {
    conv_demo_1: [
      {
        id: 'msg_1',
        conversationId: 'conv_demo_1',
        senderId: 'dev_db_user_456',
        content: 'Grace and peace! So glad to connect with you in ChristianConnect.',
        mediaUrl: null,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        moderationStatus: 'approved',
      },
    ],
    conv_ai_1: [
      {
        id: 'msg_ai_welcome',
        conversationId: 'conv_ai_1',
        senderId: 'user_ai_assistant',
        content: 'Grace and peace! I am your Faith AI Companion ✝️. Ask me any scripture, theology, or prayer question, and I will share biblical guidance with you!',
        mediaUrl: null,
        createdAt: new Date(Date.now() - 60000).toISOString(),
        moderationStatus: 'approved',
      },
    ],
  },
  conversations: [
    {
      id: 'conv_demo_1',
      lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
      lastMessagePreview: 'Grace and peace! So glad to connect with you in ChristianConnect.',
      participants: [
        { user: { id: 'dev_db_user_123', displayName: 'Grace Believer', avatarUrl: null } },
        { user: { id: 'dev_db_user_456', displayName: 'Caleb Strong', avatarUrl: null } },
      ],
    },
    {
      id: 'conv_ai_1',
      lastMessageAt: new Date(Date.now() - 60000).toISOString(),
      lastMessagePreview: 'Grace and peace! I am your Faith AI Companion ✝️...',
      participants: [
        { user: { id: 'dev_db_user_123', displayName: 'Grace Believer', avatarUrl: null } },
        { user: { id: 'user_ai_assistant', displayName: 'Faith AI Companion ✝️', avatarUrl: null } },
      ],
    },
  ],
  groups: [
    {
      id: 'group_demo_1',
      name: 'The Joshua Generation',
      description: 'A community for young believers to connect, study scripture, and encourage one another in purpose.',
      type: 'friendship',
      denominationTag: 'non_denominational',
      bibleTranslation: 'NIV',
      isPrivate: false,
      maxMembers: null,
      requiresApproval: false,
      createdById: 'dev_db_user_123',
      createdAt: new Date().toISOString(),
      _count: { members: 16 },
      createdBy: { id: 'dev_db_user_123', displayName: 'Grace Believer', avatarUrl: null },
    },
    {
      id: 'group_demo_2',
      name: 'Romans 8 Deep Dive',
      description: 'Weekly Bible study walking line by line through Paul’s epistle to the Romans.',
      type: 'bible_study',
      denominationTag: 'reformed',
      bibleTranslation: 'ESV',
      isPrivate: false,
      maxMembers: 25,
      requiresApproval: false,
      createdById: 'dev_db_user_456',
      createdAt: new Date().toISOString(),
      _count: { members: 12 },
      createdBy: { id: 'dev_db_user_456', displayName: 'Caleb Strong', avatarUrl: null },
    },
    {
      id: 'group_demo_3',
      name: 'Brothers in Christ Accountability',
      description: 'Strictly confidential, male-only brotherhood for purity, discipline, and daily prayer accountability.',
      type: 'accountability',
      denominationTag: 'non_denominational',
      bibleTranslation: 'NIV',
      isPrivate: true,
      maxMembers: 8,
      requiresApproval: true,
      createdById: 'dev_db_user_789',
      createdAt: new Date().toISOString(),
      _count: { members: 6 },
      createdBy: { id: 'dev_db_user_789', displayName: 'David Hope', avatarUrl: null },
    },
    {
      id: 'group_demo_4',
      name: 'Christian Apologetics & Reason',
      description: 'Defending the Christian worldview, answering tough theological questions, and engaging culture.',
      type: 'apologetics',
      denominationTag: 'non_denominational',
      bibleTranslation: 'ESV',
      isPrivate: false,
      maxMembers: 50,
      requiresApproval: false,
      createdById: 'dev_db_user_101',
      createdAt: new Date().toISOString(),
      _count: { members: 22 },
      createdBy: { id: 'dev_db_user_101', displayName: 'Hannah Joy', avatarUrl: null },
    },
  ],
  groupMessages: {},
  datingProfiles: [
    {
      userId: 'dev_db_user_456',
      user: {
        id: 'dev_db_user_456',
        displayName: 'Caleb Strong',
        gender: 'male',
        dateOfBirth: '1996-04-15T00:00:00.000Z',
        avatarUrl: null,
      },
      relationshipGoal: 'marriage',
      courtshipView: 'intentional_dating',
      marriageRoleView: 'complementarian',
      churchDenomination: 'Baptist',
      churchAttendance: 'Weekly',
      testimony: 'Grew up learning about God, but truly surrendered my life in college after experiencing His grace during a medical mission trip. Daily prayer and church community keep me anchored.',
      favoriteVerse: 'Proverbs 3:5-6',
      interests: ['Acoustic Guitar', 'Hiking', 'Medical Outreach', 'Theology Books', 'Coffee Roasting'],
      locationCity: 'Austin',
      locationState: 'TX',
      latitude: 30.2672,
      longitude: -97.7431,
      photos: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=800&q=80',
      ],
      moderationStatus: 'approved',
    },
    {
      userId: 'dev_db_user_789',
      user: {
        id: 'dev_db_user_789',
        displayName: 'David Hope',
        gender: 'male',
        dateOfBirth: '1994-09-20T00:00:00.000Z',
        avatarUrl: null,
      },
      relationshipGoal: 'marriage',
      courtshipView: 'traditional_courtship',
      marriageRoleView: 'complementarian',
      churchDenomination: 'Pentecostal',
      churchAttendance: 'Weekly + Midweek',
      testimony: 'God pulled me out of anxiety and gave me a heart of worship. Passionate about stewarding music and leadership to point people to Jesus.',
      favoriteVerse: 'Philippians 4:6-7',
      interests: ['Worship Ministry', 'Piano', 'Trail Running', 'Cooking Italian', 'Youth Mentoring'],
      locationCity: 'Dallas',
      locationState: 'TX',
      latitude: 32.7767,
      longitude: -96.7970,
      photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      ],
      moderationStatus: 'approved',
    },
  ],
  datingLikes: {},
  datingMatches: [],
  datingPreferences: {
    dev_db_user_123: {
      targetGender: 'male',
      minAge: 22,
      maxAge: 38,
      maxDistanceMiles: 100,
      denominations: ['Non-Denominational', 'Baptist', 'Presbyterian'],
    },
  },
  friendships: [
    {
      id: 'friend_1',
      userId: 'dev_db_user_456',
      user: { id: 'dev_db_user_456', displayName: 'Caleb Strong', avatarUrl: null, bio: 'Biomedical engineer, worship guitarist.' },
      status: 'accepted',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'friend_2',
      userId: 'dev_db_user_101',
      user: { id: 'dev_db_user_101', displayName: 'Hannah Joy', avatarUrl: null, bio: 'Theology student, excited to connect.' },
      status: 'accepted',
      createdAt: new Date().toISOString(),
    },
  ],
  friendRequests: [],
  events: [
    {
      id: 'event_1',
      title: 'Citywide Worship & Intercession Night',
      description: 'Join believers from across churches for an evening of unified worship, communion, and intercession.',
      location: 'Grace Community Auditorium — 400 Faith Way',
      startTime: new Date(Date.now() + 3 * 86400000).toISOString(),
      endTime: new Date(Date.now() + 3 * 86400000 + 7200000).toISOString(),
      isOnline: false,
      streamUrl: null,
      rsvpCount: 84,
      isRsvpd: true,
    },
    {
      id: 'event_2',
      title: 'Virtual Scripture Apologetics Roundtable',
      description: 'Live interactive Q&A discussing historical evidence for the Resurrection and manuscripts reliability.',
      location: 'ChristianConnect Live Audio Room',
      startTime: new Date(Date.now() + 5 * 86400000).toISOString(),
      endTime: new Date(Date.now() + 5 * 86400000 + 5400000).toISOString(),
      isOnline: true,
      streamUrl: 'https://christianconnect.app/audio-rooms/apologetics-live',
      rsvpCount: 42,
      isRsvpd: false,
    },
  ],
  eventRsvps: {
    event_1: ['dev_db_user_123'],
  },
  livestreams: [
    {
      id: 'stream_1',
      title: 'Live Sunday Morning Service — Walking in Victory',
      churchName: 'Grace Fellowship Church',
      speaker: 'Pastor Michael Scott',
      viewerCount: 240,
      streamUrl: 'https://www.youtube.com/embed/live_stream?channel=placeholder',
      isLive: true,
      startedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
  audioRooms: [
    {
      id: 'room_1',
      title: 'Morning Prayer & Scripture Meditation Room 🙏',
      hostDisplayName: 'Pastor David',
      participantCount: 18,
      isPrayerRoom: true,
      isLive: true,
    },
  ],
  mentorships: [
    {
      id: 'mentor_1',
      mentorId: 'dev_db_user_456',
      mentor: { id: 'dev_db_user_456', displayName: 'Caleb Strong', avatarUrl: null },
      focusArea: 'Campus & Workplace Evangelism',
      status: 'active',
      startedAt: new Date().toISOString(),
    },
  ],
  accountabilityPairs: [],
  apologetics: [
    {
      id: 'apol_1',
      question: 'How can we trust the historical reliability of the New Testament manuscripts?',
      category: 'Manuscripts & Textual Criticism',
      summary: 'With over 5,800 Greek manuscripts and tens of thousands of early translations, the New Testament has unparalleled textual corroboration in antiquity.',
      scriptureRefs: ['Luke 1:1-4', '2 Peter 1:16', '1 John 1:1-3'],
      views: 340,
    },
    {
      id: 'apol_2',
      question: 'Why does God allow suffering and pain in the world?',
      category: 'Problem of Evil & Theodicy',
      summary: 'Christian theology shows that suffering entered through human free will and rebellion, but God enters into our pain through the Cross and redeems all things for eternity.',
      scriptureRefs: ['Romans 8:18-28', 'Genesis 50:20', 'Revelation 21:4'],
      views: 520,
    },
  ],
  testimonies: [
    {
      id: 'testimony_1',
      authorId: 'dev_db_user_456',
      author: { id: 'dev_db_user_456', displayName: 'Caleb Strong', avatarUrl: null },
      title: 'Healed from chronic anxiety through community prayer',
      content: 'For two years I battled debilitating panic attacks. When my home church small group laid hands on me and prayed continuously, the Spirit broke every chain. Today I am completely free!',
      encouragementsCount: 28,
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ],
  courses: [
    {
      id: 'course_1',
      title: 'Foundations of Christian Discipleship',
      instructor: 'Dr. James Anderson',
      lessonsCount: 8,
      durationHours: 4.5,
      thumbnailUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      description: 'Master core Christian doctrine, spiritual disciplines, Bible reading methods, and prayer habits.',
    },
  ],
  familyDevotionals: [
    {
      id: 'fam_1',
      title: 'The Armor of God Family Dinner Guide',
      targetAge: 'Ages 6-14',
      durationMinutes: 15,
      passageRef: 'Ephesians 6:10-18',
      summary: 'Interactive discussion questions, scripture memory challenge, and closing family prayer for dinnertime.',
    },
  ],
  missionaries: [
    {
      id: 'mission_1',
      name: 'The Alvarez Family',
      field: 'Youth & Medical Outreach in Guatemala',
      bio: 'Serving orphanages, establishing clean water filters, and planting youth Bible clubs.',
      photoUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
      financialGoalMonthly: 4500,
      currentMonthlySupport: 3800,
    },
  ],
  notifications: [
    {
      id: 'notif_1',
      title: 'New Prayer Wall Amen',
      message: 'Caleb Strong prayed for your request “Prayer for Peace & Family Healing”.',
      type: 'prayer_reaction',
      isRead: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'notif_2',
      title: 'Weekly Verse Challenge Ready',
      message: 'This week’s memory verse is live: Philippians 4:13. Test your memory!',
      type: 'verse_challenge',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  blockedUsers: [],
  reports: [],
};

let inMemoryState: PersistentStore = { ...DEFAULT_STORE };

// Load store from disk on startup
export function loadPersistentStore(): PersistentStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      inMemoryState = {
        ...DEFAULT_STORE,
        ...parsed,
        user: { ...DEFAULT_STORE.user, ...(parsed.user || {}) },
        userProfiles: { ...DEFAULT_STORE.userProfiles, ...(parsed.userProfiles || {}) },
      };
      console.log('[Persistence] Loaded persistent store from disk');
    } else {
      savePersistentStore();
      console.log('[Persistence] Initialized fresh persistent store on disk');
    }
  } catch (err) {
    console.warn('[Persistence] Could not load store from disk, using fallback in-memory state:', err);
  }
  return inMemoryState;
}

// Debounced save to disk
let saveTimeout: NodeJS.Timeout | null = null;

export function savePersistentStore(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(inMemoryState, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Persistence] Error saving store to disk:', err);
    }
  }, 100);
}

// Initialize on module import
loadPersistentStore();

export const store = inMemoryState;
