import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdult } from '../middleware/requireAdult';
import { prisma, isDbConnected } from '../lib/prisma';
import { store } from '../lib/persistence';
import { AudioRoomType } from '@prisma/client';

const router = Router();
router.use(requireAuth);

// ─── GET /api/audio-rooms ───────────────────────────────────────────────────
/**
 * List active audio rooms (Prayer Nights, Ask-a-Pastor Q&A, Group Discussions).
 */
router.get('/', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json(store.audioRooms);
      return;
    }

    const rooms = await prisma.audioRoom.findMany({
      where: { isLive: true },
      include: {
        host: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { speakers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rooms);
  } catch {
    res.json(store.audioRooms);
  }
});

// ─── POST /api/audio-rooms ──────────────────────────────────────────────────
/**
 * Create a live audio room (prayer night / ask pastor Q&A).
 */
router.post('/', requireAdult, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, type } = req.body;

    if (!title?.trim()) {
      res.status(400).json({ error: 'Title is required' }); return;
    }

    const roomType = Object.values(AudioRoomType).includes(type) ? type : AudioRoomType.prayer_night;

    const room = await prisma.audioRoom.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        type: roomType,
        hostId: req.dbUserId!,
        isLive: true,
      },
    });

    // Auto-add host as speaker with role 'host' and unmuted
    await prisma.audioRoomSpeaker.create({
      data: {
        roomId: room.id,
        userId: req.dbUserId!,
        role: 'host',
        isMuted: false,
      },
    });

    res.status(201).json(room);
  } catch (err) {
    console.error('[AudioRooms] create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/audio-rooms/:id ────────────────────────────────────────────────
/**
 * Room details with active speakers stage & listeners list.
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const room = await prisma.audioRoom.findUnique({
      where: { id: req.params.id },
      include: {
        host: { select: { id: true, displayName: true, avatarUrl: true } },
        speakers: {
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
      },
    });

    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
    res.json(room);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/audio-rooms/:id/join ──────────────────────────────────────────
/**
 * Join an audio room as a listener.
 */
router.post('/:id/join', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const speaker = await prisma.audioRoomSpeaker.upsert({
      where: { roomId_userId: { roomId: id, userId: req.dbUserId! } },
      create: { roomId: id, userId: req.dbUserId!, role: 'listener', isMuted: true },
      update: {},
    });
    res.json(speaker);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/audio-rooms/:id/speaker-status ────────────────────────────────
/**
 * Update speaker permissions (Host controls: mute/unmute, promote to speaker, raise hand).
 */
router.post('/:id/speaker-status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { targetUserId, role, isMuted, handRaised } = req.body;

    const room = await prisma.audioRoom.findUnique({ where: { id } });
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }

    const isHost = room.hostId === req.dbUserId!;
    const isSelf = targetUserId === req.dbUserId!;

    // Listeners can only raise/lower their own hand. Host can change role & mute status.
    if (!isHost && !isSelf) {
      res.status(403).json({ error: 'Host authorization required to modify other speakers' }); return;
    }

    const updated = await prisma.audioRoomSpeaker.update({
      where: { roomId_userId: { roomId: id, userId: targetUserId || req.dbUserId! } },
      data: {
        ...(isHost && role && { role }),
        ...(isHost && isMuted !== undefined && { isMuted }),
        ...(handRaised !== undefined && { handRaised }),
      },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
