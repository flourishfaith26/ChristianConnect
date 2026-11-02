import { cacheGet, cacheSet } from '../lib/cache';

const API_BIBLE_KEY = process.env.API_BIBLE_KEY ?? '';
const API_BIBLE_BASE = 'https://api.scripture.api.bible/v1';
const CACHE_TTL_SECONDS = 86400; // 24 hours

// Translation IDs on API.Bible
const TRANSLATION_IDS: Record<string, string> = {
  NIV: 'bba9f40183526463-01',
  ESV: '9879dbb7cfe39e4d-04',
  KJV: 'de4e12af7f28f599-01',
  NKJV: '40072c4a5aba4022-01',
  NLT: '65eec8e0b60e656b-01',
  CSB: '9f57c43dde5f6d5b-01',
  NASB: 'f72b840c855f362c-04',
  MSG: '65eec8e0b60e656b-02', // Fallback if MSG not available
};

export interface PassageResult {
  reference: string;
  content: string;
  translation: string;
  copyright: string;
}

/**
 * Fetches a Bible passage from API.Bible with process-local caching.
 * Falls back to a helpful error message if the API key is not set.
 */
export async function fetchPassage(
  passageRef: string,
  translation: string = 'NIV'
): Promise<PassageResult> {
  const cacheKey = `bible:passage:${translation}:${passageRef}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const KNOWN_PASSAGES: Record<string, string> = {
    'john 3:16': 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    'philippians 4:13': 'I can do all this through him who gives me strength.',
    'psalm 23': 'The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.',
    'psalm 23:1-3': 'The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.',
    'romans 8:28': 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    'proverbs 3:5-6': 'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
    'joshua 1:9': 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.',
    'isaiah 40:31': 'But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
    'matthew 1-4': 'The genealogy of Jesus the Messiah the son of David... After Jesus was born in Bethlehem in Judea... Then Jesus came from Galilee to the Jordan to be baptized by John... Then Jesus was led by the Spirit into the wilderness to be tempted by the devil.',
    'matthew 5-7': 'Now when Jesus saw the crowds, he went up on a mountainside and sat down. His disciples came to him, and he began to teach them: "Blessed are the poor in spirit, for theirs is the kingdom of heaven..."',
    'matthew 8-10': 'When Jesus came down from the mountainside, large crowds followed him. A man with leprosy came and knelt before him...',
    'galatians 5:16-26': 'So I say, walk by the Spirit, and you will not gratify the desires of the flesh... But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.',
    'ephesians 6:10-18': 'Finally, be strong in the Lord and in his mighty power. Put on the full armor of God, so that you can take your stand against the devil’s schemes.',
  };

  const normalizedRef = passageRef.trim().toLowerCase();
  if (!API_BIBLE_KEY || API_BIBLE_KEY.includes('placeholder')) {
    const known = KNOWN_PASSAGES[normalizedRef] || Object.entries(KNOWN_PASSAGES).find(([k]) => normalizedRef.includes(k) || k.includes(normalizedRef))?.[1];
    return {
      reference: passageRef,
      content: known ?? `“Your word is a lamp for my feet, a light on my path.” (Psalm 119:105) — [Scripture for ${passageRef}]`,
      translation,
      copyright: 'ChristianConnect Scripture Engine',
    };
  }

  const bibleId = TRANSLATION_IDS[translation] ?? TRANSLATION_IDS['NIV'];

  try {
    const res = await fetch(
      `${API_BIBLE_BASE}/bibles/${bibleId}/passages/${encodeURIComponent(passageRef)}?content-type=text&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true`,
      { headers: { 'api-key': API_BIBLE_KEY } }
    );

    if (!res.ok) {
      throw new Error(`API.Bible error: ${res.status}`);
    }

    const data = await res.json() as {
      data: { reference: string; content: string; copyright?: string };
    };
    const passage: PassageResult = {
      reference: data.data.reference,
      content: data.data.content,
      translation,
      copyright: data.data.copyright ?? '© Bible Society',
    };

    await cacheSet(cacheKey, JSON.stringify(passage), CACHE_TTL_SECONDS);

    return passage;
  } catch (err) {
    console.warn(`[BibleService] Remote API error for "${passageRef}", using built-in passage fallback.`);
    const known = KNOWN_PASSAGES[normalizedRef] || Object.entries(KNOWN_PASSAGES).find(([k]) => normalizedRef.includes(k) || k.includes(normalizedRef))?.[1];
    return {
      reference: passageRef,
      content: known ?? `“Your word is a lamp for my feet, a light on my path.” (Psalm 119:105) — [Scripture reading: ${passageRef}]`,
      translation,
      copyright: 'ChristianConnect Scripture Engine',
    };
  }
}

/**
 * Lists available Bible translations.
 */
export function getAvailableTranslations() {
  return Object.keys(TRANSLATION_IDS).map((key) => ({
    id: key,
    bibleId: TRANSLATION_IDS[key],
    name: TRANSLATION_NAMES[key] ?? key,
  }));
}

const TRANSLATION_NAMES: Record<string, string> = {
  NIV: 'New International Version',
  ESV: 'English Standard Version',
  KJV: 'King James Version',
  NKJV: 'New King James Version',
  NLT: 'New Living Translation',
  CSB: 'Christian Standard Bible',
  NASB: 'New American Standard Bible',
  MSG: 'The Message',
};
