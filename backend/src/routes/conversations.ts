import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdult } from '../middleware/requireAdult';
import { prisma, isDbConnected } from '../lib/prisma';
import { store, savePersistentStore } from '../lib/persistence';
import { processMessageModeration } from '../services/moderationService';
import { askFaithChat } from '../services/faithChatService';
import { io } from '../index';

const router = Router();

// In-memory dev store for conversation messages when PostgreSQL is offline
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

// ─── GET /api/conversations ───────────────────────────────────────────────────
/**
 * List all DM conversations for the current user.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json(store.conversations);
      return;
    }
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: req.dbUserId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    res.json(conversations);
  } catch {
    if (process.env.NODE_ENV === 'development') {
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
      return;
    }
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

    // Check if recipient has blocked the current user
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { initiatorId: req.dbUserId, targetId: recipientId },
          { initiatorId: recipientId, targetId: req.dbUserId },
        ],
      },
    });
    if (block) { res.status(403).json({ error: 'Cannot start conversation — user is blocked' }); return; }

    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: req.dbUserId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
      include: {
        participants: {
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
      },
    });

    if (existing) { res.json(existing); return; }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: req.dbUserId! },
            { userId: recipientId },
          ],
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
      },
    });

    res.status(201).json(conversation);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      const devConv = {
        id: `conv_dev_${Date.now()}`,
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: null,
        participants: [
          { user: { id: req.dbUserId || 'dev_db_user_123', displayName: 'Grace Believer', avatarUrl: null } },
          { user: { id: req.body.recipientId || 'user_friend_1', displayName: 'Christian Friend', avatarUrl: null } },
        ],
      };
      res.status(201).json(devConv);
      return;
    }
    console.error('[Conversations] create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/conversations/:id/messages ─────────────────────────────────────
router.get('/:id/messages', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string || '50'), 100);

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId: req.dbUserId },
    });
    if (!participant) { res.status(403).json({ error: 'Not a participant in this conversation' }); return; }

    const messages = await prisma.directMessage.findMany({
      where: {
        conversationId: id,
        moderationStatus: { not: 'auto_rejected' },
        ...(cursor && { id: { lt: cursor } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Update read cursor
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id, userId: req.dbUserId! } },
      data: { lastReadAt: new Date() },
    });

    res.json({ messages: messages.reverse(), hasMore: messages.length === limit });
  } catch {
    if (process.env.NODE_ENV === 'development') {
      const convId = req.params.id;
      const list = devMessagesStore.get(convId) || [
        {
          id: `msg_welcome_${convId}`,
          conversationId: convId,
          senderId: 'user_friend_1',
          content: 'Welcome to ChristianConnect! Grace and peace be with you.',
          mediaUrl: null,
          createdAt: new Date().toISOString(),
          moderationStatus: 'approved',
        },
      ];
      res.json({ messages: list, hasMore: false });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/conversations/:id/messages ────────────────────────────────────
router.post('/:id/messages', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, mediaUrl, mediaType } = req.body;

    if (!content && !mediaUrl) { res.status(400).json({ error: 'Message must have content or media' }); return; }

    // Verify participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId: req.dbUserId },
    });
    if (!participant) { res.status(403).json({ error: 'Not a participant' }); return; }

    // Create message as pending
    const message = await prisma.directMessage.create({
      data: {
        conversationId: id,
        senderId: req.dbUserId!,
        content,
        mediaUrl,
        mediaType,
        moderationStatus: 'pending',
      },
    });

    // Update conversation last message
    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: content?.slice(0, 100) ?? '📎 Media',
      },
    });

    // Run moderation async — emit Socket.io event after
    processMessageModeration(message.id).then(async () => {
      const updated = await prisma.directMessage.findUnique({ where: { id: message.id } });
      if (updated && updated.moderationStatus !== 'auto_rejected') {
        io.to(`conversation:${id}`).emit('message:new', { ...updated, conversationId: id });
      }
    }).catch(console.error);

    // Emit immediately for the sender (optimistic)
    io.to(`conversation:${id}`).emit('message:new', { ...message, conversationId: id });

    res.status(201).json(message);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      const { id } = req.params;
      const userContent = req.body.content || '';
      const devMsg = {
        id: `msg_user_${Date.now()}`,
        conversationId: id,
        senderId: req.dbUserId || 'dev_db_user_123',
        content: userContent,
        mediaUrl: req.body.mediaUrl || null,
        mediaType: req.body.mediaType || null,
        moderationStatus: 'approved',
        createdAt: new Date().toISOString(),
      };

      const currentList = devMessagesStore.get(id) || [];
      currentList.push(devMsg);

      // Broadcast user message
      io.to(`conversation:${id}`).emit('message:new', devMsg);

      // If this is the AI conversation, invoke FaithChat AI response
      if (id === 'conv_ai_1' || id.includes('ai')) {
        try {
          const aiResult = await askFaithChat(userContent);
          const aiMsg = {
            id: `msg_ai_${Date.now()}`,
            conversationId: id,
            senderId: 'user_ai_assistant',
            content: aiResult.response,
            mediaUrl: null,
            mediaType: null,
            moderationStatus: 'approved',
            createdAt: new Date().toISOString(),
          };
          currentList.push(aiMsg);
          devMessagesStore.set(id, currentList);

          io.to(`conversation:${id}`).emit('message:new', aiMsg);
          res.status(201).json({ ...devMsg, aiReply: aiMsg });
          return;
        } catch {
          const fallbackAiMsg = {
            id: `msg_ai_${Date.now()}`,
            conversationId: id,
            senderId: 'user_ai_assistant',
            content: `Faith AI: "Trust in the LORD with all your heart and lean not on your own understanding." (Proverbs 3:5). God bless you!`,
            mediaUrl: null,
            mediaType: null,
            moderationStatus: 'approved',
            createdAt: new Date().toISOString(),
          };
          currentList.push(fallbackAiMsg);
          devMessagesStore.set(id, currentList);

          io.to(`conversation:${id}`).emit('message:new', fallbackAiMsg);
          res.status(201).json({ ...devMsg, aiReply: fallbackAiMsg });
          return;
        }
      }

      devMessagesStore.set(id, currentList);
      res.status(201).json(devMsg);
      return;
    }
    console.error('[Conversations] send message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/conversations/block ───────────────────────────────────────────
router.post('/block', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) { res.status(400).json({ error: 'targetUserId required' }); return; }

    await prisma.block.upsert({
      where: { initiatorId_targetId: { initiatorId: req.dbUserId!, targetId: targetUserId } },
      create: { initiatorId: req.dbUserId!, targetId: targetUserId },
      update: {},
    });

    res.json({ success: true, message: 'User blocked' });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
