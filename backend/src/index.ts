import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createClerkClient, verifyToken as clerkVerifyToken } from '@clerk/backend';
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

import { prisma, setDbConnected } from './lib/prisma';
import { connectMongo } from './lib/mongoose';
import { setOnline, setOffline } from './services/presenceService';
import { Conversation } from './models/Conversation';

// Routes — Phase 0
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import reportsRouter from './routes/reports';
import adminRouter from './routes/admin';
import moderationRouter from './routes/moderation';

// Routes — Phase 1
import profileRouter from './routes/profile';
import conversationsRouter from './routes/conversations';
import groupsRouter from './routes/groups';
import prayerRouter from './routes/prayer';
import readingPlansRouter from './routes/readingPlans';
import devotionalsRouter from './routes/devotionals';
import scriptureRouter from './routes/scripture';
import notificationsRouter from './routes/notifications';
import safetyRouter from './routes/safety';

// Routes — Phase 2
import accountabilityRouter from './routes/accountability';
import mentorshipRouter from './routes/mentorship';
import apologeticsRouter from './routes/apologetics';
import testimoniesRouter from './routes/testimonies';
import faithChatRouter from './routes/faithChat';
import searchRouter from './routes/search';
import hubsRouter from './routes/hubs';

// Routes — Dating Phase
import datingRouter from './routes/dating';
import verificationRouter from './routes/verification';

// Routes — Phase 3 Daily Engagement
import storiesRouter from './routes/stories';
import verseChallengeRouter from './routes/verseChallenge';
import journalRouter from './routes/journal';
import sermonNotesRouter from './routes/sermonNotes';
import recommendationsRouter from './routes/recommendations';
import feedRouter from './routes/feed';
import friendsRouter from './routes/friends';

// Routes — Phase 4 In-Person & Live Ministry Bridge
import eventsRouter from './routes/events';
import livestreamsRouter from './routes/livestreams';
import audioRoomsRouter from './routes/audioRooms';
import partnerRouter from './routes/partner';
import coursesRouter from './routes/courses';
import familyDevotionalsRouter from './routes/familyDevotionals';

// Routes — Phase 5 Growth & Ecosystem
import paymentsRouter from './routes/payments';
import missionariesRouter from './routes/missionaries';
import calendarSyncRouter from './routes/calendarSync';

const app = express();
const httpServer = createServer(app);

// ─── Dynamic CORS Allowed Origins ────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Server-to-server or non-browser client
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV === 'development') {
    return origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  }
  return false;
};

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

// NOTE: Clerk webhook route needs raw body — mount BEFORE express.json()
app.use('/api/clerk-webhook', express.raw({ type: 'application/json' }));

// Persona webhook also needs raw body for signature verification
app.use('/api/verification/webhook', express.raw({ type: 'application/json' }));

// General JSON body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
// Phase 0
app.use('/api/clerk-webhook', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/moderation', moderationRouter);

// Phase 1
app.use('/api/profile', profileRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/prayer', prayerRouter);
app.use('/api/reading-plans', readingPlansRouter);
app.use('/api/devotionals', devotionalsRouter);
app.use('/api/scripture', scriptureRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/safety', safetyRouter);

// Phase 2
app.use('/api/accountability', accountabilityRouter);
app.use('/api/mentorship', mentorshipRouter);
app.use('/api/apologetics', apologeticsRouter);
app.use('/api/testimonies', testimoniesRouter);
app.use('/api/faith-chat', faithChatRouter);
app.use('/api/search', searchRouter);
app.use('/api/hubs', hubsRouter);

// Dating Phase
app.use('/api/dating', datingRouter);
app.use('/api/verification', verificationRouter);

// Phase 3 Daily Engagement
app.use('/api/stories', storiesRouter);
app.use('/api/verse-challenge', verseChallengeRouter);
app.use('/api/journal', journalRouter);
app.use('/api/sermon-notes', sermonNotesRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/feed', feedRouter);
app.use('/api/friends', friendsRouter);

// Phase 4 In-Person & Live Ministry Bridge
app.use('/api/events', eventsRouter);
app.use('/api/livestreams', livestreamsRouter);
app.use('/api/audio-rooms', audioRoomsRouter);
app.use('/api/partner', partnerRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/family-devotionals', familyDevotionalsRouter);

// Phase 5 Growth & Ecosystem
app.use('/api/payments', paymentsRouter);
app.use('/api/missionaries', missionariesRouter);
app.use('/api/calendar', calendarSyncRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server Error]', err);
    res.status(500).json({
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { message: err.message }),
    });
  }
);

// ─── Socket.io Connection Handler ────────────────────────────────────────────
// Map socket.id → userId for presence cleanup on disconnect
const socketUserMap = new Map<string, string>();

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // ── Auth: client sends Clerk token on connect ─────────────────────────────
  socket.on('auth', async ({ token }: { token: string }) => {
    try {
      if (!token) {
        socket.disconnect(true);
        return;
      }

      // Strictly allow dev_ token only when in development environment
      if (process.env.NODE_ENV === 'development' && token.startsWith('dev_')) {
        socket.data.userId = 'dev_db_user_123';
        socketUserMap.set(socket.id, 'dev_db_user_123');
        console.log(`[Socket] Dev mode authenticated: ${socket.id} → userId: dev_db_user_123`);
        return;
      }

      if (!process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY.includes('PLACEHOLDER')) {
        if (process.env.NODE_ENV === 'development') {
          socket.data.userId = 'dev_db_user_123';
          socketUserMap.set(socket.id, 'dev_db_user_123');
          console.log(`[Socket] Dev mode fallback authenticated: ${socket.id}`);
          return;
        }
        console.error('[Socket Auth] Missing CLERK_SECRET_KEY in production');
        socket.disconnect(true);
        return;
      }

      const { sub: clerkId } = await clerkVerifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
      const user = await prisma.user.findUnique({
        where: { clerkId }, select: { id: true, isBanned: true },
      });
      if (!user || user.isBanned) { socket.disconnect(true); return; }

      socket.data.userId = user.id;
      socketUserMap.set(socket.id, user.id);

      await setOnline(user.id);
      socket.broadcast.emit('presence:update', { userId: user.id, isOnline: true });
      console.log(`[Socket] Authenticated: ${socket.id} → userId: ${user.id}`);
    } catch {
      socket.disconnect(true);
    }
  });

  // ── Join a group room ─────────────────────────────────────────────────────
  socket.on('join:group', (groupId: string) => {
    if (!socket.data.userId) {
      socket.emit('error', { message: 'Unauthorized: Authentication required before joining rooms' });
      return;
    }
    socket.join(`group:${groupId}`);
  });

  // ── Join a DM conversation room (verified participant) ─────────────────────
  socket.on('join:conversation', async (conversationId: string) => {
    const currentUserId = socket.data.userId;
    if (!currentUserId) {
      socket.emit('error', { message: 'Unauthorized: Authentication required before joining rooms' });
      return;
    }

    try {
      // In dev or for demo/AI conversations, allow instant join
      if (
        conversationId.includes('ai') ||
        conversationId.includes('demo') ||
        (process.env.NODE_ENV === 'development' && currentUserId === 'dev_db_user_123')
      ) {
        socket.join(`conversation:${conversationId}`);
        return;
      }

      const conv = await Conversation.findOne({
        _id: conversationId,
        'participants.userId': currentUserId,
      }).lean();

      if (!conv) {
        socket.emit('error', { message: 'Unauthorized: Not a participant in this conversation' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
    } catch (err) {
      console.error('[Socket] join:conversation verification error:', err);
      socket.emit('error', { message: 'Internal error checking room authorization' });
    }
  });

  // ── Leave rooms ───────────────────────────────────────────────────────────
  socket.on('leave:group', (groupId: string) => socket.leave(`group:${groupId}`));
  socket.on('leave:conversation', (convId: string) => socket.leave(`conversation:${convId}`));

  // ── Typing indicators ─────────────────────────────────────────────────────
  socket.on('typing:start', ({ room, displayName }: { room: string; displayName: string }) => {
    socket.to(room).emit('typing:update', {
      userId: socket.data.userId,
      displayName,
      isTyping: true,
    });
  });

  socket.on('typing:stop', ({ room }: { room: string }) => {
    socket.to(room).emit('typing:update', {
      userId: socket.data.userId,
      isTyping: false,
    });
  });

  // ── Presence keepalive (client pings every 20s) ───────────────────────────
  socket.on('presence:ping', async () => {
    if (socket.data.userId) {
      await setOnline(socket.data.userId);
    }
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    const userId = socketUserMap.get(socket.id);
    if (userId) {
      socketUserMap.delete(socket.id);
      // Check if user has other connected sockets before marking offline
      const allSockets = await io.fetchSockets();
      const hasOtherSockets = allSockets.some(
        (s) => s.id !== socket.id && s.data.userId === userId
      );
      if (!hasOtherSockets) {
        await setOffline(userId);
        socket.broadcast.emit('presence:update', { userId, isOnline: false });
      }
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function start() {
  try {
    // Attempt connection check (give Atlas enough time for TLS handshake)
    await Promise.race([
      connectMongo(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 8000)),
    ]);
    setDbConnected(true);
    console.log('[DB] MongoDB connected via Mongoose');
  } catch (err) {
    setDbConnected(false);
    console.warn('[DB] MongoDB not connected — running in resilient persistent fallback mode');
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] ChristianConnect backend running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
  });
}

start();
