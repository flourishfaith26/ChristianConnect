import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';
import { store, savePersistentStore } from '../lib/persistence';

const router = Router();
router.use(requireAuth);

// ─── GET /api/journal ─────────────────────────────────────────────────────────
/**
 * List all non-deleted journal entries for the current user.
 * Strictly private — only accessible by the owner.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json(store.journalEntries);
      return;
    }

    const { search, tag } = req.query;

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId: req.dbUserId!,
        isDeleted: false,
        ...(tag && { tags: { has: tag as string } }),
        ...(search && {
          OR: [
            { title: { contains: search as string, mode: 'insensitive' } },
            { body: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(entries);
  } catch (err) {
    res.json(store.journalEntries);
  }
});

// ─── POST /api/journal ────────────────────────────────────────────────────────
/**
 * Create a private journal entry.
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, body, content, tags } = req.body;
    const journalText = body || content;

    if (!title?.trim() || !journalText?.trim()) {
      res.status(400).json({ error: 'Title and body are required' }); return;
    }

    if (!isDbConnected()) {
      const newEntry = {
        id: `journal_${Date.now()}`,
        userId: req.dbUserId || 'dev_db_user_123',
        title: title.trim(),
        content: journalText.trim(),
        body: journalText.trim(),
        tags: tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.journalEntries.unshift(newEntry);
      savePersistentStore();
      res.status(201).json(newEntry);
      return;
    }

    const cleanTags = Array.isArray(tags)
      ? tags.map((t: string) => String(t).trim().toLowerCase()).filter(Boolean)
      : [];

    const entry = await prisma.journalEntry.create({
      data: {
        userId: req.dbUserId!,
        title: title.trim(),
        body: body.trim(),
        tags: cleanTags,
      },
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error('[Journal] create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/journal/:id ───────────────────────────────────────────────────
/**
 * Update an existing journal entry.
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, body, tags } = req.body;

    const existing = await prisma.journalEntry.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      res.status(404).json({ error: 'Journal entry not found' }); return;
    }
    if (existing.userId !== req.dbUserId) {
      res.status(403).json({ error: 'Not authorized' }); return;
    }

    const cleanTags = Array.isArray(tags)
      ? tags.map((t: string) => String(t).trim().toLowerCase()).filter(Boolean)
      : undefined;

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(body && { body: body.trim() }),
        ...(cleanTags !== undefined && { tags: cleanTags }),
      },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/journal/:id ──────────────────────────────────────────────────
/**
 * Soft delete a journal entry.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.journalEntry.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      res.status(404).json({ error: 'Journal entry not found' }); return;
    }
    if (existing.userId !== req.dbUserId) {
      res.status(403).json({ error: 'Not authorized' }); return;
    }

    await prisma.journalEntry.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json({ success: true, message: 'Journal entry deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/journal/export ─────────────────────────────────────────────────
/**
 * Export all non-deleted journal entries for the current user as a Markdown file.
 */
router.get('/export', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId: req.dbUserId!, isDeleted: false },
      orderBy: { createdAt: 'asc' },
    });

    let markdown = `# ChristianConnect — My Faith Journal\n\n`;
    markdown += `*Exported on ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}*\n\n---\n\n`;

    if (entries.length === 0) {
      markdown += `*No journal entries found.*\n`;
    } else {
      for (const entry of entries) {
        const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        markdown += `## ${entry.title}\n`;
        markdown += `**Date:** ${dateStr}\n`;
        if (entry.tags.length > 0) {
          markdown += `**Tags:** ${entry.tags.map(t => `#${t}`).join(' ')}\n`;
        }
        markdown += `\n${entry.body}\n\n---\n\n`;
      }
    }

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="christianconnect-journal-${Date.now()}.md"`);
    res.send(markdown);
  } catch (err) {
    console.error('[Journal] export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
