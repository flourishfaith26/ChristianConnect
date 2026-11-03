import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { store, savePersistentStore } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

interface TimestampNote {
  timestamp: string; // e.g. "14:20" or "Part 1"
  text: string;
}

// ─── GET /api/sermon-notes ───────────────────────────────────────────────────
/**
 * List all sermon notes for the current user, ordered by sermon date.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json(store.sermonNotes);
      return;
    }

    const { search } = req.query;

    const notes = await prisma.sermonNote.findMany({
      where: {
        userId: req.dbUserId!,
        ...(search && {
          OR: [
            { sermonTitle: { contains: search as string, mode: 'insensitive' } },
            { speaker: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { sermonDate: 'desc' },
    });

    res.json(notes);
  } catch {
    res.json(store.sermonNotes);
  }
});

// ─── POST /api/sermon-notes ──────────────────────────────────────────────────
/**
 * Create a sermon note entry with timestamped key points.
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sermonTitle, speaker, sermonDate, notes } = req.body;

    if (!sermonTitle?.trim() && !req.body.title?.trim()) {
      res.status(400).json({ error: 'sermonTitle is required' }); return;
    }

    if (!isDbConnected()) {
      const newNote = {
        id: `sermon_${Date.now()}`,
        userId: req.dbUserId || 'dev_db_user_123',
        sermonTitle: sermonTitle || req.body.title || 'Sunday Sermon',
        title: sermonTitle || req.body.title || 'Sunday Sermon',
        speaker: speaker || 'Pastor',
        sermonDate: sermonDate || new Date().toISOString(),
        notes: notes || req.body.notes || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.sermonNotes.unshift(newNote);
      savePersistentStore();
      res.status(201).json(newNote);
      return;
    }

    const cleanNotes: TimestampNote[] = Array.isArray(notes)
      ? notes.map((n: { timestamp?: string; text?: string }) => ({
          timestamp: String(n.timestamp || '00:00').trim(),
          text: String(n.text || '').trim(),
        })).filter(n => n.text)
      : [];

    const note = await prisma.sermonNote.create({
      data: {
        userId: req.dbUserId!,
        sermonTitle: sermonTitle.trim(),
        speaker: speaker?.trim() || null,
        sermonDate: sermonDate ? new Date(sermonDate) : new Date(),
        notes: cleanNotes as any,
      },
    });

    res.status(201).json(note);
  } catch (err) {
    console.error('[SermonNotes] create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/sermon-notes/:id ──────────────────────────────────────────────
/**
 * Update a sermon note.
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sermonTitle, speaker, sermonDate, notes } = req.body;

    const existing = await prisma.sermonNote.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Sermon note not found' }); return; }
    if (existing.userId !== req.dbUserId) { res.status(403).json({ error: 'Not authorized' }); return; }

    const cleanNotes: TimestampNote[] | undefined = Array.isArray(notes)
      ? notes.map((n: { timestamp?: string; text?: string }) => ({
          timestamp: String(n.timestamp || '00:00').trim(),
          text: String(n.text || '').trim(),
        })).filter(n => n.text)
      : undefined;

    const updated = await prisma.sermonNote.update({
      where: { id },
      data: {
        ...(sermonTitle && { sermonTitle: sermonTitle.trim() }),
        ...(speaker !== undefined && { speaker: speaker?.trim() || null }),
        ...(sermonDate && { sermonDate: new Date(sermonDate) }),
        ...(cleanNotes !== undefined && { notes: cleanNotes as any }),
      },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/sermon-notes/:id ─────────────────────────────────────────────
/**
 * Delete a sermon note.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.sermonNote.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'Sermon note not found' }); return; }
    if (existing.userId !== req.dbUserId) { res.status(403).json({ error: 'Not authorized' }); return; }

    await prisma.sermonNote.delete({ where: { id } });
    res.json({ success: true, message: 'Sermon note deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
