import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { fetchPassage } from '../services/bibleService';
import matthewHenryIndex from '../data/matthew-henry-index.json';

const router = Router();

// ─── GET /api/scripture/passage?ref=&translation= ────────────────────────────
router.get('/passage', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ref, translation } = req.query;
    if (!ref) { res.status(400).json({ error: 'ref is required' }); return; }

    const text = await fetchPassage(ref as string, (translation as string) || 'NIV');
    res.json(text);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch passage' });
  }
});

// ─── GET /api/scripture/commentary?passage=Gen.1 ─────────────────────────────
router.get('/commentary', requireAuth, (req: Request, res: Response): void => {
  const { passage } = req.query;
  if (!passage) { res.status(400).json({ error: 'passage is required' }); return; }

  // Normalize passage reference for lookup (e.g. "Gen.1", "GEN.1", "Genesis 1")
  const normalized = (passage as string).toLowerCase()
    .replace(/\s+/g, '.')
    .replace('genesis', 'gen').replace('exodus', 'exo')
    .replace('matthew', 'mat').replace('john', 'jhn')
    .replace('romans', 'rom').replace('psalms', 'psa').replace('psalm', 'psa')
    .replace('proverbs', 'pro').replace('acts', 'act')
    .replace('revelation', 'rev').replace('luke', 'luk')
    .replace('mark', 'mrk');

  const index = matthewHenryIndex as Record<string, { title: string; text: string; source: string }>;
  const commentary = index[normalized] ?? index[normalized.split('.').slice(0, 2).join('.')] ?? null;

  if (!commentary) {
    res.status(404).json({
      error: `No commentary found for "${passage}"`,
      note: 'Matthew Henry Commentary — public domain',
    });
    return;
  }

  res.json({ passage, commentary });
});

export default router;
