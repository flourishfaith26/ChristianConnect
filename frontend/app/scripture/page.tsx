'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import BackButton from '@/components/BackButton';

interface Passage { reference: string; content: string; translation: string; }
interface Commentary { title: string; text: string; source: string; }

const TRANSLATIONS = ['NIV', 'ESV', 'KJV', 'NKJV', 'NLT', 'CSB'];
const QUICK_PASSAGES = [
  { label: 'John 3', ref: 'JHN.3', display: 'John 3' },
  { label: 'Romans 8', ref: 'ROM.8', display: 'Romans 8' },
  { label: 'Psalm 23', ref: 'PSA.23', display: 'Psalm 23' },
  { label: 'Matthew 5', ref: 'MAT.5', display: 'Matthew 5' },
  { label: 'Genesis 1', ref: 'GEN.1', display: 'Genesis 1' },
  { label: 'Psalm 51', ref: 'PSA.51', display: 'Psalm 51' },
];

export default function ScripturePage() {
  const { getToken } = useAuth();
  const [passageRef, setPassageRef] = useState('');
  const [translation, setTranslation] = useState('NIV');
  const [passage, setPassage] = useState<Passage | null>(null);
  const [commentary, setCommentary] = useState<Commentary | null>(null);
  const [loadingPassage, setLoadingPassage] = useState(false);
  const [loadingCommentary, setLoadingCommentary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPassage(ref?: string) {
    const r = ref ?? passageRef.trim();
    if (!r) { setError('Please enter a passage reference'); return; }
    setError(null);
    setLoadingPassage(true); setLoadingCommentary(true);
    setPassage(null); setCommentary(null);

    try {
      const token = await getToken();

      // Fetch passage and commentary in parallel
      const [passageRes, commentaryRes] = await Promise.allSettled([
        apiRequest<Passage>(`/api/scripture/passage?ref=${encodeURIComponent(r)}&translation=${translation}`, { token: token ?? undefined }),
        apiRequest<{ commentary: Commentary }>(`/api/scripture/commentary?passage=${encodeURIComponent(r)}`, { token: token ?? undefined }),
      ]);

      if (passageRes.status === 'fulfilled') setPassage(passageRes.value);
      else setError('Could not load passage. Check your API.Bible key or try a different reference.');

      if (commentaryRes.status === 'fulfilled') setCommentary(commentaryRes.value.commentary);
    } finally {
      setLoadingPassage(false); setLoadingCommentary(false);
    }
  }

  return (
    <div className="page-container">
      <BackButton />
      <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, marginBottom: '6px' }}>📚 Scripture Explanations</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
        Bible text from API.Bible alongside Matthew Henry's Commentary (public domain).
      </p>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          id="passage-ref-input" type="text" className="form-input"
          placeholder="e.g. John 3:16 or Romans 8"
          value={passageRef} onChange={(e) => setPassageRef(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchPassage(); }}
          style={{ flex: 1 }}
        />
        <select
          id="translation-select" className="form-input" value={translation}
          onChange={(e) => setTranslation(e.target.value)} style={{ width: '100px' }}>
          {TRANSLATIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button id="passage-search-btn" type="button" className="btn btn-primary"
          onClick={() => fetchPassage()} disabled={loadingPassage}>
          {loadingPassage ? '...' : 'Search'}
        </button>
      </div>

      {/* Quick access */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '28px' }}>
        {QUICK_PASSAGES.map((p) => (
          <button key={p.ref} id={`quick-${p.ref}`} type="button"
            onClick={() => { setPassageRef(p.ref); fetchPassage(p.ref); }}
            style={{
              padding: '4px 12px', borderRadius: '99px', fontSize: '12px', cursor: 'pointer',
              background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)', transition: 'all 0.15s',
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {error && <div className="form-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}

      {/* Content — two columns on large screens */}
      {(passage || commentary) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="animate-fade-in">

          {/* Passage */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>📖 {passage?.reference ?? 'Loading...'}</h3>
              {passage && (
                <span style={{
                  fontSize: '11px', color: 'var(--brand-primary)', fontWeight: 700,
                  background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '99px',
                }}>{passage.translation}</span>
              )}
            </div>
            {loadingPassage && <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading passage...</div>}
            {passage && (
              <>
                <div
                  style={{
                    fontSize: '14px', lineHeight: 1.8, color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-serif)', maxHeight: '500px', overflow: 'auto',
                  }}
                  dangerouslySetInnerHTML={{ __html: passage.content }}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  © {passage.translation} — via API.Bible
                </p>
              </>
            )}
          </div>

          {/* Commentary */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>🔍 Matthew Henry's Commentary</h3>
            {loadingCommentary && <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading commentary...</div>}
            {!loadingCommentary && !commentary && (
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                No commentary available for this passage yet. More passages are being added regularly.
              </div>
            )}
            {commentary && (
              <>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-gold)' }}>{commentary.title}</h4>
                <div style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--text-secondary)', maxHeight: '460px', overflow: 'auto' }}>
                  {commentary.text.split('\n\n').map((p, i) => (
                    <p key={i} style={{ marginBottom: '14px' }}>{p}</p>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{commentary.source}</p>
              </>
            )}
          </div>
        </div>
      )}

      {!passage && !commentary && !error && !loadingPassage && (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📖</div>
          <p>Search for a passage or click one of the quick links above.</p>
        </div>
      )}
    </div>
  );
}
