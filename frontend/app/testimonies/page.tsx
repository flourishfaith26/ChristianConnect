'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import BackButton from '@/components/BackButton';

interface Encouragement {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
}

interface Testimony {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
  encouragements: Encouragement[];
}

export default function TestimoniesPage() {
  const { getToken } = useAuth();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [showWrite, setShowWrite] = useState(false);
  const [submittingTestimony, setSubmittingTestimony] = useState(false);

  // Encouragement drafts keyed by testimonyId
  const [encouragementDrafts, setEncouragementDrafts] = useState<Record<string, string>>({});
  const [submittingEncouragement, setSubmittingEncouragement] = useState<Record<string, boolean>>({});

  async function loadTestimonies() {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await apiRequest<Testimony[]>('/api/testimonies', { token: token ?? undefined });
      setTestimonies(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTestimonies();
  }, []);

  async function postTestimony(e: React.FormEvent) {
    e.preventDefault();
    if (!draftTitle.trim() || !draftContent.trim()) return;
    setSubmittingTestimony(true);
    try {
      const token = await getToken();
      await apiRequest('/api/testimonies', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ title: draftTitle, content: draftContent }),
      });
      setDraftTitle('');
      setDraftContent('');
      setShowWrite(false);
      await loadTestimonies();
    } finally {
      setSubmittingTestimony(false);
    }
  }

  async function postEncouragement(testimonyId: string) {
    const draft = encouragementDrafts[testimonyId];
    if (!draft || !draft.trim()) return;
    setSubmittingEncouragement(p => ({ ...p, [testimonyId]: true }));
    try {
      const token = await getToken();
      await apiRequest(`/api/testimonies/${testimonyId}/encourage`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ content: draft }),
      });
      setEncouragementDrafts(p => ({ ...p, [testimonyId]: '' }));
      await loadTestimonies();
    } finally {
      setSubmittingEncouragement(p => ({ ...p, [testimonyId]: false }));
    }
  }

  return (
    <div className="page-container">
      <BackButton />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, marginBottom: '6px' }}>🕊️ Testimonies</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Share what God has done or how you came to faith. Encouragements only — no debate is permitted.
          </p>
        </div>
        <button id="write-testimony-btn" type="button" className="btn btn-primary" onClick={() => setShowWrite(true)}>
          Share Testimony
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>Loading testimonies...</div>
      ) : testimonies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
          No testimonies shared yet. Share how God has moved in your life!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
          {testimonies.map((t) => (
            <article key={t.id} className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-brand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700,
                  }}>
                    {t.author.displayName[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '14px' }}>{t.author.displayName}</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Shared testimony • {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>{t.title}</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{t.content}</p>
              </div>

              {/* Encouragement list */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  ❤️ Encouragements ({t.encouragements.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                  {t.encouragements.map((enc) => (
                    <div key={enc.id} style={{
                      padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)',
                      fontSize: '13px', border: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{enc.author.displayName}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(enc.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)' }}>{enc.content}</p>
                    </div>
                  ))}
                </div>

                {/* Write encouragement comment */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text" className="form-input" style={{ flex: 1 }}
                    placeholder="Leave an encouraging word..."
                    value={encouragementDrafts[t.id] ?? ''}
                    onChange={(e) => setEncouragementDrafts(p => ({ ...p, [t.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') postEncouragement(t.id); }}
                  />
                  <button
                    type="button" className="btn btn-primary btn-sm"
                    onClick={() => postEncouragement(t.id)}
                    disabled={submittingEncouragement[t.id]}
                  >
                    Encourage
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Write Testimony Modal */}
      {showWrite && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowWrite(false); }}>
          <form onSubmit={postTestimony} className="glass-strong animate-fade-in"
            style={{ width: '100%', maxWidth: '520px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Share Your Testimony</h2>

            <div className="form-group">
              <label htmlFor="testimony-title" className="form-label">Testimony Title *</label>
              <input id="testimony-title" type="text" className="form-input" required placeholder="e.g. How Jesus Restored My Family"
                value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="testimony-content" className="form-label">Your Story *</label>
              <textarea id="testimony-content" className="form-input" rows={8} required placeholder="Write your story of coming to faith or what God did in your life..."
                value={draftContent} onChange={(e) => setDraftContent(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowWrite(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingTestimony}>
                {submittingTestimony ? 'Sharing...' : 'Share Story'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
