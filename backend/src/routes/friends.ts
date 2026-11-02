import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { io } from '../index';

const router = Router();
router.use(requireAuth);

// Mock users store for dev mode / seed fallback
const DEMO_DISCOVERY_USERS = [
  {
    id: 'user_grace_believer',
    displayName: 'Grace Believer',
    handle: '@grace_believer',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    accountType: 'adult_verified',
    denomination: 'non_denominational',
    city: 'Dallas',
    region: 'TX',
    isMentor: true,
    sharedGroups: ['Romans Deep Dive Study Group', 'Grace Worship Team'],
    mutualFriendsCount: 4,
  },
  {
    id: 'user_david_k',
    displayName: 'David K.',
    handle: '@david_k',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    accountType: 'adult_verified',
    denomination: 'baptist',
    city: 'Dallas',
    region: 'TX',
    isMentor: false,
    sharedGroups: ['Young Adults Fellowship'],
    mutualFriendsCount: 2,
  },
  {
    id: 'user_sarah_m',
    displayName: 'Sarah M.',
    handle: '@sarah_m',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    accountType: 'adult_verified',
    denomination: 'pentecostal',
    city: 'Houston',
    region: 'TX',
    isMentor: true,
    sharedGroups: ['Prayer Partners Circle'],
    mutualFriendsCount: 3,
  },
  {
    id: 'user_caleb_v',
    displayName: 'Caleb Vance',
    handle: '@caleb_vance',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    accountType: 'adult_verified',
    denomination: 'non_denominational',
    city: 'Austin',
    region: 'TX',
    isMentor: false,
    sharedGroups: ['Men of Valor Discipleship'],
    mutualFriendsCount: 5,
  },
  {
    id: 'user_hannah_b',
    displayName: 'Hannah Bennett',
    handle: '@hannah_b',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    accountType: 'adult_verified',
    denomination: 'reformed',
    city: 'Dallas',
    region: 'TX',
    isMentor: true,
    sharedGroups: ['Romans Deep Dive Study Group'],
    mutualFriendsCount: 1,
  },
];

// In-memory friendship store for dev fallback
interface FriendshipRecord {
  id: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
  respondedAt?: string;
}

const inMemoryFriendships: FriendshipRecord[] = [
  {
    id: 'f_seed_1',
    requesterId: 'user_hannah_b',
    recipientId: 'dev_user_demo_123',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

// Helper: Get friendship status between current user and target user
function getFriendshipStatus(currentUserId: string, targetUserId: string): { status: string; friendshipId: string | null; isRequester: boolean } {
  const f = inMemoryFriendships.find(
    (item) =>
      (item.requesterId === currentUserId && item.recipientId === targetUserId) ||
      (item.requesterId === targetUserId && item.recipientId === currentUserId)
  );

  if (!f) return { status: 'none', friendshipId: null, isRequester: false };

  if (f.status === 'blocked') return { status: 'blocked', friendshipId: f.id, isRequester: f.requesterId === currentUserId };
  if (f.status === 'accepted') return { status: 'accepted', friendshipId: f.id, isRequester: f.requesterId === currentUserId };
  if (f.status === 'pending') {
    return f.requesterId === currentUserId
      ? { status: 'pending_sent', friendshipId: f.id, isRequester: true }
      : { status: 'pending_received', friendshipId: f.id, isRequester: false };
  }
  return { status: 'none', friendshipId: null, isRequester: false };
}

// ─── GET /api/friends/discovery ─── People Discovery Endpoint ────────────────
router.get('/discovery', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId || 'dev_user_demo_123';
    const q = (req.query.q as string || '').toLowerCase().trim();
    const denomination = (req.query.denomination as string || '').toLowerCase().trim();
    const city = (req.query.city as string || '').toLowerCase().trim();

    // Pull users from database if available, else fall back to demo discovery list
    let usersList: any[] = [];
    if (isDbConnected()) {
      try {
        const dbUsers = await prisma.user.findMany({
          where: {
            id: { not: currentUserId },
            accountType: { not: 'minor_content_only' },
            ...(q
              ? {
                  OR: [
                    { displayName: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
          take: 20,
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            accountType: true,
            city: true,
            region: true,
            profile: { select: { denomination: true, isWillingToMentor: true } },
          },
        });

        if (dbUsers.length > 0) {
          usersList = dbUsers.map((u) => ({
            id: u.id,
            displayName: u.displayName,
            handle: `@${u.displayName.toLowerCase().replace(/\s+/g, '_')}`,
            avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            accountType: u.accountType,
            denomination: u.profile?.denomination || 'prefer_not_to_say',
            city: u.city || 'Dallas',
            region: u.region || 'TX',
            isMentor: Boolean(u.profile?.isWillingToMentor),
            sharedGroups: ['ChristianConnect Community'],
            mutualFriendsCount: 2,
          }));
        }
      } catch {
        // Dev fallback
      }
    }

    if (usersList.length === 0) {
      usersList = DEMO_DISCOVERY_USERS.filter((u) => u.id !== currentUserId);
    }

    // Apply filtering
    let filtered = usersList.filter((user) => {
      // Safety Rule #1: Minors never appear in adult discovery
      if (user.accountType === 'minor_content_only') return false;

      if (q) {
        const matchesName = user.displayName.toLowerCase().includes(q);
        const matchesHandle = user.handle.toLowerCase().includes(q);
        if (!matchesName && !matchesHandle) return false;
      }

      if (denomination && denomination !== 'all') {
        if (user.denomination.toLowerCase() !== denomination) return false;
      }

      if (city && city !== 'all') {
        if (!user.city.toLowerCase().includes(city)) return false;
      }

      return true;
    });

    // Map each user with current friendship status relative to requester
    const discoveryCards = filtered.map((u) => {
      const rel = getFriendshipStatus(currentUserId, u.id);
      const sharedContext =
        u.sharedGroups.length > 0
          ? `Also in ${u.sharedGroups[0]}`
          : u.mutualFriendsCount > 0
          ? `${u.mutualFriendsCount} Mutual Friends`
          : `${u.city}, ${u.region}`;

      return {
        ...u,
        sharedContext,
        friendshipStatus: rel.status,
        friendshipId: rel.friendshipId,
      };
    });

    res.json({ users: discoveryCards });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch discovery users' });
  }
});

// ─── POST /api/friends/request ─── Send Friend Request ─────────────────────
router.post('/request', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId || 'dev_user_demo_123';
    const { recipientId } = req.body;

    if (!recipientId || recipientId === currentUserId) {
      res.status(400).json({ error: 'Invalid recipient ID' });
      return;
    }

    // Check existing relationship
    const rel = getFriendshipStatus(currentUserId, recipientId);
    if (rel.status === 'blocked') {
      res.status(403).json({ error: 'Cannot send request to this user' });
      return;
    }

    if (rel.status === 'pending_sent') {
      res.json({ success: true, status: 'pending_sent', friendshipId: rel.friendshipId });
      return;
    }

    if (rel.status === 'accepted') {
      res.json({ success: true, status: 'accepted', friendshipId: rel.friendshipId });
      return;
    }

    // Upsert friendship record
    const newRecord: FriendshipRecord = {
      id: `f_${Date.now()}`,
      requesterId: currentUserId,
      recipientId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Remove old record if present
    const existingIdx = inMemoryFriendships.findIndex(
      (item) =>
        (item.requesterId === currentUserId && item.recipientId === recipientId) ||
        (item.requesterId === recipientId && item.recipientId === currentUserId)
    );
    if (existingIdx !== -1) inMemoryFriendships.splice(existingIdx, 1);

    inMemoryFriendships.push(newRecord);

    // Broadcast Socket.io notification if recipient is online
    try {
      io?.to(`user:${recipientId}`).emit('friend_request_received', {
        id: newRecord.id,
        requesterId: currentUserId,
        createdAt: newRecord.createdAt,
      });
    } catch {
      // Socket not ready fallback
    }

    res.status(201).json({ success: true, status: 'pending_sent', friendshipId: newRecord.id });
  } catch {
    res.status(500).json({ error: 'Could not send friend request' });
  }
});

// ─── POST /api/friends/cancel ─── Cancel Sent Request ────────────────────────
router.post('/cancel', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId || 'dev_user_demo_123';
    const { recipientId } = req.body;

    const idx = inMemoryFriendships.findIndex(
      (item) => item.requesterId === currentUserId && item.recipientId === recipientId && item.status === 'pending'
    );

    if (idx !== -1) {
      inMemoryFriendships.splice(idx, 1);
    }

    res.json({ success: true, status: 'none' });
  } catch {
    res.status(500).json({ error: 'Could not cancel friend request' });
  }
});

// ─── POST /api/friends/accept ─── Accept Friend Request ──────────────────────
router.post('/accept', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId || 'dev_user_demo_123';
    const { requesterId } = req.body;

    const f = inMemoryFriendships.find(
      (item) => item.recipientId === currentUserId && item.requesterId === requesterId && item.status === 'pending'
    );

    if (f) {
      f.status = 'accepted';
      f.respondedAt = new Date().toISOString();

      // Emit real-time socket event back to requester
      try {
        io?.to(`user:${requesterId}`).emit('friend_request_accepted', {
          id: f.id,
          friendId: currentUserId,
        });
      } catch {
        // Socket optional
      }

      res.json({ success: true, status: 'accepted', friendshipId: f.id });
      return;
    }

    res.status(400).json({ error: 'Friend request not found' });
  } catch {
    res.status(500).json({ error: 'Could not accept friend request' });
  }
});

// ─── POST /api/friends/decline ─── Silently Decline Friend Request ──────────
router.post('/decline', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId || 'dev_user_demo_123';
    const { requesterId } = req.body;

    const idx = inMemoryFriendships.findIndex(
      (item) => item.recipientId === currentUserId && item.requesterId === requesterId && item.status === 'pending'
    );

    if (idx !== -1) {
      inMemoryFriendships[idx].status = 'declined';
      inMemoryFriendships[idx].respondedAt = new Date().toISOString();
    }

    // Silent decline: No notification sent to requester to prevent awkwardness
    res.json({ success: true, status: 'none' });
  } catch {
    res.status(500).json({ error: 'Could not decline friend request' });
  }
});

// ─── POST /api/friends/remove ─── Remove Accepted Friend ────────────────────
router.post('/remove', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId || 'dev_user_demo_123';
    const { friendId } = req.body;

    const idx = inMemoryFriendships.findIndex(
      (item) =>
        (item.requesterId === currentUserId && item.recipientId === friendId) ||
        (item.requesterId === friendId && item.recipientId === currentUserId)
    );

    if (idx !== -1) {
      inMemoryFriendships.splice(idx, 1);
    }

    res.json({ success: true, status: 'none' });
  } catch {
    res.status(500).json({ error: 'Could not remove friend' });
  }
});

// ─── POST /api/friends/block ─── Block User & Clean Up Requests ─────────────
router.post('/block', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId || 'dev_user_demo_123';
    const { targetUserId } = req.body;

    // Remove any active/pending connection
    const idx = inMemoryFriendships.findIndex(
      (item) =>
        (item.requesterId === currentUserId && item.recipientId === targetUserId) ||
        (item.requesterId === targetUserId && item.recipientId === currentUserId)
    );

    if (idx !== -1) inMemoryFriendships.splice(idx, 1);

    // Create block record
    inMemoryFriendships.push({
      id: `block_${Date.now()}`,
      requesterId: currentUserId,
      recipientId: targetUserId,
      status: 'blocked',
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, status: 'blocked' });
  } catch {
    res.status(500).json({ error: 'Could not block user' });
  }
});

// ─── GET /api/friends/inbox ─── Incoming Friend Requests Inbox ────────────────
router.get('/inbox', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId || 'dev_user_demo_123';

    const pendingIncoming = inMemoryFriendships.filter(
      (item) => item.recipientId === currentUserId && item.status === 'pending'
    );

    const requests = pendingIncoming.map((item) => {
      const requester = DEMO_DISCOVERY_USERS.find((u) => u.id === item.requesterId) || {
        id: item.requesterId,
        displayName: 'Faith Believer',
        handle: '@believer',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        accountType: 'adult_verified',
        denomination: 'baptist',
        city: 'Dallas',
        region: 'TX',
        sharedGroups: ['Romans Study Group'],
        mutualFriendsCount: 3,
      };

      return {
        id: item.id,
        createdAt: item.createdAt,
        requester: {
          ...requester,
          sharedContext: `Also in ${requester.sharedGroups[0] || 'Community'}`,
        },
      };
    });

    res.json({ requests, count: requests.length });
  } catch {
    res.status(500).json({ error: 'Could not fetch friend requests inbox' });
  }
});

// ─── GET /api/friends/list ─── Accepted Friends List ─────────────────────────
router.get('/list', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId || 'dev_user_demo_123';
    const q = (req.query.q as string || '').toLowerCase().trim();

    const acceptedRecords = inMemoryFriendships.filter(
      (item) => (item.requesterId === currentUserId || item.recipientId === currentUserId) && item.status === 'accepted'
    );

    const friendIds = acceptedRecords.map((item) => (item.requesterId === currentUserId ? item.recipientId : item.requesterId));

    let friends = DEMO_DISCOVERY_USERS.filter((u) => friendIds.includes(u.id));

    if (q) {
      friends = friends.filter((f) => f.displayName.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q));
    }

    res.json({ friends, count: friends.length });
  } catch {
    res.status(500).json({ error: 'Could not fetch friends list' });
  }
});

// Alias GET / to GET /list for compatibility
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUserId = req.userId || 'dev_user_demo_123';
  const acceptedRecords = inMemoryFriendships.filter(
    (item) => (item.requesterId === currentUserId || item.recipientId === currentUserId) && item.status === 'accepted'
  );
  const friendIds = acceptedRecords.map((item) => (item.requesterId === currentUserId ? item.recipientId : item.requesterId));
  let friends = DEMO_DISCOVERY_USERS.filter((u) => friendIds.includes(u.id));
  if (friends.length === 0) {
    friends = DEMO_DISCOVERY_USERS.slice(0, 3);
  }
  res.json({ friends, count: friends.length });
});

export default router;
