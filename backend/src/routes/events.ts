import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdult } from '../middleware/requireAdult';
import { prisma, isDbConnected } from '../lib/prisma';
import { store, savePersistentStore } from '../lib/persistence';
import { EventType, RsvpStatus } from '@prisma/client';

const router = Router();
router.use(requireAuth);

// ─── GET /api/events ─────────────────────────────────────────────────────────
/**
 * Search and filter events by city, region, type, or date.
 * Returns RSVP counts and current user's RSVP status.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json(store.events);
      return;
    }

    const { city, region, type, search } = req.query;

    const events = await prisma.event.findMany({
      where: {
        ...(city && { locationCity: { contains: city as string, mode: 'insensitive' } }),
        ...(region && { locationRegion: { contains: region as string, mode: 'insensitive' } }),
        ...(type && { type: type as EventType }),
        ...(search && {
          OR: [
            { title: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } },
            { organization: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
        rsvps: {
          select: { userId: true, status: true },
        },
        _count: { select: { rsvps: true } },
      },
      orderBy: { eventDate: 'asc' },
      take: 50,
    });

    const enriched = events.map(e => {
      const myRsvp = e.rsvps.find(r => r.userId === req.dbUserId!)?.status || null;
      const goingCount = e.rsvps.filter(r => r.status === 'going').length;
      return {
        ...e,
        myRsvp,
        goingCount,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.json(store.events);
  }
});

// ─── POST /api/events ────────────────────────────────────────────────────────
/**
 * Create an event (church service, conference, retreat, small group).
 */
router.post('/', requireAdult, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, type, locationCity, locationRegion, address, eventDate, organization } = req.body;

    if (!title?.trim() || !locationCity?.trim() || !locationRegion?.trim() || !eventDate) {
      res.status(400).json({ error: 'title, locationCity, locationRegion, and eventDate are required' }); return;
    }

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        type: type as EventType || EventType.service,
        locationCity: locationCity.trim(),
        locationRegion: locationRegion.trim(),
        address: address?.trim() || null,
        eventDate: new Date(eventDate),
        createdById: req.dbUserId!,
        organization: organization?.trim() || null,
      },
      include: { createdBy: { select: { id: true, displayName: true, avatarUrl: true } } },
    });

    // Auto-RSVP creator as 'going'
    await prisma.eventRsvp.create({
      data: { eventId: event.id, userId: req.dbUserId!, status: RsvpStatus.going },
    });

    res.status(201).json(event);
  } catch (err) {
    console.error('[Events] create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/events/:id/rsvp ───────────────────────────────────────────────
/**
 * RSVP to an event (going, maybe, declined).
 */
router.post('/:id/rsvp', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = Object.values(RsvpStatus);
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' }); return;
    }

    const rsvp = await prisma.eventRsvp.upsert({
      where: { eventId_userId: { eventId: id, userId: req.dbUserId! } },
      create: { eventId: id, userId: req.dbUserId!, status },
      update: { status },
    });

    res.json(rsvp);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
