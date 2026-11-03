import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdult } from '../middleware/requireAdult';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { Block } from '../models/Block';
import { User } from '../models/User';
import { isMongoConnected } from '../lib/mongoose';
import { store } from '../lib/persistence';
import { processMessageModeration, moderateText } from '../services/moderationService';
import { askFaithChat } from '../services/faithChatService';
import { io } from '../index';

const router = Router();

// In-memory dev store for conversation messages when database is offline
const devMessagesStore = new Map<string, any[]>([
  [
    'conv_ai_1',
    [
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
  ],
  [
    'conv_demo_1',
    [
      {
        id: 'msg_demo_1',
        conversationId: 'conv_demo_1',
        senderId: 'user_friend_1',
        content: 'Welcome to ChristianConnect! Grace and peace be with you.',
        mediaUrl: null,
        createdAt: new Date().toISOString(),
        moderationStatus: 'approved',
      },
    ],
  ],
]);

// All conversation routes require adult account
router.use(requireAuth, requireAdult);

// Helper to populate user details for participants
async function formatConversation(conv: any) {
  const participantUserIds = conv.participants?.map((p: any) => p.userId) ?? [];
  let userMap = new Map<string, any>();

  if (isMongoConnected() && participantUserIds.length > 0) {
    try {
      const users = await User.find({ _id: { $in: participantUserIds } })
        .select({ _id: 1, displayName: 1, avatarUrl: 1 })
        .lean();
      users.forEach((u: any) => userMap.set(String(u._id), u));
    } catch {
      // Ignored in fallback
    }
  }

  const participants = (conv.participants || []).map((p: any) => {
    const u = userMap.get(p.userId);
    return {
      user: {
        id: p.userId,
        displayName: u?.displayName || (p.userId === 'user_ai_assistant' ? 'Faith AI Companion ✝️' : 'Christian Friend'),
        avatarUrl: u?.avatarUrl || null,
      },
    };
  });

  return {
    id: String(conv._id || conv.id),
    lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt).toISOString() : null,
    lastMessagePreview: conv.lastMessagePreview || null,
    participants,
  };
}

// ─── GET /api/conversations ───────────────────────────────────────────────────
/**
 * List all DM conversations for the current user.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (isMongoConnected() && req.dbUserId) {
      const conversations = await Conversation.find({
        'participants.userId': req.dbUserId,
      })
        .sort({ lastMessageAt: -1 })
        .lean();

      if (conversations.length > 0) {
        const formatted = await Promise.all(conversations.map(formatConversation));
        res.json(formatted);
        return;
      }
    }

    // Fallback in dev or if no db conversations found
    res.json([
      {
        id: 'conv_ai_1',
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: 'Grace and peace! I am your Faith AI Companion. Ask me any Bible, theology, or prayer question!',
        participants: [
          { user: { id: req.dbUserId || 'dev_db_user_123', displayName: 'Grace Believer', avatarUrl: null } },
          { user: { id: 'user_ai_assistant', displayName: 'Faith AI Companion ✝️', avatarUrl: null } },
        ],
      },
      {
        id: 'conv_demo_1',
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: 'Welcome to ChristianConnect! Grace and peace be with you.',
        participants: [
          { user: { id: req.dbUserId || 'dev_db_user_123', displayName: 'Grace Believer', avatarUrl: null } },
          { user: { id: 'user_friend_1', displayName: 'John Elder (Pastor)', avatarUrl: null } },
        ],
      },
    ]);
  } catch (err) {
    console.error('[Conversations] list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/conversations ──────────────────────────────────────────────────
/**
 * Create or find an existing 1:1 conversation with another user.
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) { res.status(400).json({ error: 'recipientId is required' }); return; }
    if (recipientId === req.dbUserId) { res.status(400).json({ error: 'Cannot message yourself' }); return; }

    if (isMongoConnected() && req.dbUserId) {
      // Check block status
      const isBlocked = await Block.findOne({
        $or: [
          { initiatorId: req.dbUserId, targetId: recipientId },
          { initiatorId: recipientId, targetId: req.dbUserId },
        ],
      }).lean();

      if (isBlocked) {
        res.status(403).json({ error: 'Cannot start conversation — user is blocked' });
        return;
      }

      // Check existing conversation
      const existing = await Conversation.findOne({
        $and: [
          { 'participants.userId': req.dbUserId },
          { 'participants.userId': recipientId },
        ],
      }).lean();

      if (existing) {
        res.json(await formatConversation(existing));
        return;
      }

      // Create new conversation
      const newConv = await Conversation.create({
        participants: [
          { userId: req.dbUserId },
          { userId: recipientId },
        ],
      });

      res.status(201).json(await formatConversation(newConv));
      return;
    }

    // Development fallback
    const devConv = {
      id: `conv_dev_${Date.now()}`,
      lastMessageAt: new Date().toISOString(),
      lastMessagePreview: null,
      participants: [
        { user: { id: req.dbUserId || 'dev_db_user_123', displayName: 'Grace Believer', avatarUrl: null } },
        { user: { id: recipientId, displayName: 'Christian Friend', avatarUrl: null } },
      ],
    };
    res.status(201).json(devConv);
  } catch (err) {
    console.error('[Conversations] create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/conversations/:id/messages ─────────────────────────────────────
router.get('/:id/messages', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 100);

    if (isMongoConnected() && req.dbUserId) {
      // Verify user is a participant (skip check for AI and demo in dev)
      if (!id.includes('ai') && !id.includes('demo')) {
        const conv = await Conversation.findOne({
          _id: id,
          'participants.userId': req.dbUserId,
        }).lean();

        if (!conv) {
          res.status(403).json({ error: 'Not a participant in this conversation' });
          return;
        }

        // Update read cursor
        await Conversation.updateOne(
          { _id: id, 'participants.userId': req.dbUserId },
          { $set: { 'participants.$.lastReadAt': new Date() } }
        );
      }

      const rawMessages = await Message.find({
        conversationId: id,
        moderationStatus: { $ne: 'auto_rejected' },
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      if (rawMessages.length > 0) {
        const messages = rawMessages.reverse().map((m: any) => ({
          id: String(m._id),
          conversationId: m.conversationId,
          senderId: m.senderId,
          content: m.content,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
          moderationStatus: m.moderationStatus,
          createdAt: new Date(m.createdAt).toISOString(),
        }));
        res.json({ messages, hasMore: rawMessages.length === limit });
        return;
      }
    }

    // Dev store fallback
    const list = devMessagesStore.get(id) || [
      {
        id: `msg_welcome_${id}`,
        conversationId: id,
        senderId: 'user_friend_1',
        content: 'Welcome to ChristianConnect! Grace and peace be with you.',
        mediaUrl: null,
        createdAt: new Date().toISOString(),
        moderationStatus: 'approved',
      },
    ];
    res.json({ messages: list, hasMore: false });
  } catch (err) {
    console.error('[Conversations] get messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/conversations/:id/messages ────────────────────────────────────
router.post('/:id/messages', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, mediaUrl, mediaType } = req.body;

    if (!content && !mediaUrl) {
      res.status(400).json({ error: 'Message must have content or media' });
      return;
    }

    const currentUserId = req.dbUserId || 'dev_db_user_123';

    // 1. Verify participant if not dev/AI conversation
    if (isMongoConnected() && !id.includes('ai') && !id.includes('demo')) {
      const conv = await Conversation.findOne({
        _id: id,
        'participants.userId': currentUserId,
      }).lean();

      if (!conv) {
        res.status(403).json({ error: 'Not a participant in this conversation' });
        return;
      }
    }

    // 2. PRE-MODERATION: Run content moderation BEFORE broadcast to prevent moderation leaks
    let initialStatus = 'approved';
    let moderationReason: string | undefined;

    if (content) {
      const textMod = await moderateText(content);
      if (textMod.status === 'auto_rejected') {
        res.status(400).json({
          error: 'Message rejected by community safety guidelines.',
          reason: textMod.reason,
        });
        return;
      }
      initialStatus = textMod.status;
      moderationReason = textMod.reason;
    }

    // 3. Persist message in MongoDB if connected
    let savedMsg: any = null;
    if (isMongoConnected()) {
      savedMsg = await Message.create({
        conversationId: id,
        senderId: currentUserId,
        content: content || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        moderationStatus: initialStatus,
        moderationReason: moderationReason || null,
        moderatedAt: new Date(),
      });

      // Update conversation's lastMessageAt
      await Conversation.findByIdAndUpdate(id, {
        lastMessageAt: new Date(),
        lastMessagePreview: content ? content.slice(0, 100) : '📎 Media',
      });
    }

    const payload = savedMsg
      ? {
          id: String(savedMsg._id),
          conversationId: id,
          senderId: currentUserId,
          content: savedMsg.content,
          mediaUrl: savedMsg.mediaUrl,
          mediaType: savedMsg.mediaType,
          moderationStatus: savedMsg.moderationStatus,
          createdAt: new Date(savedMsg.createdAt).toISOString(),
        }
      : {
          id: `msg_user_${Date.now()}`,
          conversationId: id,
          senderId: currentUserId,
          content: content || '',
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          moderationStatus: initialStatus,
          createdAt: new Date().toISOString(),
        };

    // Store in dev memory map if offline
    const currentList = devMessagesStore.get(id) || [];
    currentList.push(payload);
    devMessagesStore.set(id, currentList);

    // 4. Broadcast ONLY ONCE to conversation room after moderation checks pass
    io.to(`conversation:${id}`).emit('message:new', payload);

    // 5. Handle Faith AI Companion response if chatting with AI
    if (id === 'conv_ai_1' || id.includes('ai')) {
      try {
        const aiResult = await askFaithChat(content || '');
        const aiMsgPayload = {
          id: `msg_ai_${Date.now()}`,
          conversationId: id,
          senderId: 'user_ai_assistant',
          content: aiResult.response,
          mediaUrl: null,
          mediaType: null,
          moderationStatus: 'approved',
          createdAt: new Date().toISOString(),
        };

        if (isMongoConnected()) {
          await Message.create({
            conversationId: id,
            senderId: 'user_ai_assistant',
            content: aiResult.response,
            moderationStatus: 'approved',
            moderatedAt: new Date(),
          });
        }

        currentList.push(aiMsgPayload);
        devMessagesStore.set(id, currentList);

        io.to(`conversation:${id}`).emit('message:new', aiMsgPayload);
        res.status(201).json({ ...payload, aiReply: aiMsgPayload });
        return;
      } catch (aiErr) {
        console.warn('[Conversations] FaithChat AI fallback error:', aiErr);
      }
    }

    res.status(201).json(payload);
  } catch (err) {
    console.error('[Conversations] send message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/conversations/block ───────────────────────────────────────────
router.post('/block', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) { res.status(400).json({ error: 'targetUserId required' }); return; }

    const initiatorId = req.dbUserId || 'dev_db_user_123';

    if (isMongoConnected()) {
      await Block.updateOne(
        { initiatorId, targetId: targetUserId },
        { $setOnInsert: { initiatorId, targetId: targetUserId } },
        { upsert: true }
      );
      res.json({ success: true, message: 'User blocked' });
      return;
    }

    res.json({ success: true, message: 'User blocked (dev mode)' });
  } catch (err) {
    console.error('[Conversations] block error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
