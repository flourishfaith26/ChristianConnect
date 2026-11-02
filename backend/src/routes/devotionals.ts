import { Router, Request, Response } from 'express';
import devotionalsData from '../data/devotionals.json';

const router = Router();
const devotionals = devotionalsData as Record<string, { title: string; passage: string; content: string }>;

function getTodayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

/** Get the closest available devotional key >= given MM-DD */
function findClosestKey(key: string): string | null {
  const allKeys = Object.keys(devotionals).sort();
  if (allKeys.length === 0) return null;
  if (allKeys.includes(key)) return key;
  for (const k of allKeys) {
    if (k >= key) return k;
  }
  return allKeys[allKeys.length - 1];
}

function getFallbackEntry(key: string): { date: string; title: string; passage: string; content: string } {
  const day = parseInt(key.split('-')[1] || '1', 10);
  if (day % 2 === 0) {
    return {
      date: key,
      title: 'Walking by Faith',
      passage: '2 Corinthians 5:7',
      content: 'For we walk by faith, not by sight.\n\nFaith does not deny reality — it transcends it. When Paul wrote these words, he was speaking to believers who faced real persecution, real suffering, and real uncertainty. Yet his counsel was not to escape into denial but to walk: steady, forward movement guided not by what the eyes report but by what the Spirit witnesses.\n\nWalking by faith is not dramatic. It is the quiet daily choice to trust what God has said over what circumstances suggest. Every step taken in faith is an act of worship.',
    };
  }
  return {
    date: key,
    title: 'His Mercies Are New Every Morning',
    passage: 'Lamentations 3:22-23',
    content: 'The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.\n\nLamentations is not a joyful book. It was written in the ashes of destruction, when the prophet had every reason to despair. And yet from within that devastation, Jeremiah discovered something that difficulty alone can teach: that God\'s mercies are most visible when all else has failed.\n\nEvery morning you wake up, you receive a fresh supply of His grace. Yesterday\'s failures do not exhaust it. This morning\'s fears do not diminish it. Great is His faithfulness.',
  };
}

// ─── GET /api/devotionals/today ───────────────────────────────────────────────
router.get('/today', (_req: Request, res: Response): void => {
  const key = getTodayKey();
  const closestKey = findClosestKey(key);
  if (!closestKey) {
    res.json(getFallbackEntry(key));
    return;
  }
  const entry = devotionals[closestKey];
  res.json({ date: closestKey, ...entry });
});

// ─── GET /api/devotionals/:month/:day ─────────────────────────────────────────
router.get('/:month/:day', (req: Request, res: Response): void => {
  const { month, day } = req.params;
  const key = `${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const exactEntry = devotionals[key];
  if (exactEntry) {
    res.json({ date: key, ...exactEntry });
    return;
  }
  const closestKey = findClosestKey(key);
  if (!closestKey) {
    res.json(getFallbackEntry(key));
    return;
  }
  const entry = devotionals[closestKey];
  res.json({ date: closestKey, ...entry });
});

export default router;
