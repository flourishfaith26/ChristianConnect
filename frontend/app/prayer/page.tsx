'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import PrayerCard from '@/components/PrayerCard';
import ReportButton from '@/components/ReportButton';
import BackButton from '@/components/BackButton';

interface PrayerRequest {
  id: string;
  title: string | null;
  content: string;
  isAnonymous: boolean;
  isAnswered: boolean;
  createdAt: string;
  author: { id: string; displayName: string; avatarUrl: string | null } | null;
  reactions: { type: string; userId: string; comment: string | null; user: { displayName: string } }[];
  _count: { reactions: number };
}

export default function PrayerPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<'wall' | 'partners'>('wall');
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', isAnonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWall = useCallback(async () => {
    const token = await getToken();
    const data = await apiRequest<{ requests: PrayerRequest[] }>('/api/prayer', { token: token ?? undefined });
    setRequests(data.requests);
    setLoading(false);
  }, [getToken]);

  useEffect(() => { loadWall(); }, [loadWall]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (form.content.trim().length < 10) {
      setError('Please write at least 10 characters.'); return;
    }
    setSubmitting(true); setError(null);
    try {
      const token = await getToken();
      await apiRequest('/api/prayer', {
        method: 'POST', token: token ?? undefined,
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ title: '', content: '', isAnonymous: false });
      loadWall();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally { setSubmitting(false); }
  }

  async function react(requestId: string, type: 'praying' | 'amen') {
    const token = await getToken();
    await apiRequest(`/api/prayer/${requestId}/react`, {
      method: 'POST', token: token ?? undefined,
      body: JSON.stringify({ type }),
    });
    loadWall();
  }

  async function markAnswered(requestId: string) {
    const token = await getToken();
    await apiRequest(`/api/prayer/${requestId}/answered`, {
      method: 'PATCH', token: token ?? undefined,
    });
    loadWall();
  }

  return (
    <div className="page-container">
      <BackButton />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, marginBottom: '6px' }}>🙏 Prayer Wall</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Share your needs and pray for one another. You can post anonymously.
          </p>
        </div>
        <button id="post-prayer-btn" type="button" className="btn btn-primary"
          onClick={() => setShowForm(true)}>+ Post Prayer</button>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {(['wall', 'partners'] as const).map((t) => (
          <button key={t} id={`prayer-tab-${t}`} type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              background: 'transparent', border: 'none',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--brand-primary)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
            {t === 'wall' ? '📋 Prayer Wall' : '🤝 Prayer Partners'}
          </button>
        ))}
      </div>

      {tab === 'wall' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>Loading prayers...</div>}
          {!loading && requests.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🕊️</div>
              No prayer requests yet. Be the first to share.
            </div>
          )}
          {requests.map((req) => (
            <PrayerCard key={req.id} request={req}
              onPray={() => react(req.id, 'praying')}
              onAmen={() => react(req.id, 'amen')}
              onMarkAnswered={() => markAnswered(req.id)}
            />
          ))}
        </div>
      )}

      {tab === 'partners' && (
        <PrayerPartnersTab getToken={getToken} />
      )}

      {/* Post Prayer Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '24px',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <form onSubmit={submitRequest} className="glass-strong animate-fade-in"
            style={{ width: '100%', maxWidth: '500px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Share a Prayer Request</h2>

            <div className="form-group">
              <label htmlFor="prayer-title" className="form-label">Title (optional)</label>
              <input id="prayer-title" type="text" className="form-input" placeholder="Brief title..."
                value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>

            <div className="form-group">
              <label htmlFor="prayer-content" className="form-label">Your prayer request *</label>
              <textarea id="prayer-content" className="form-input" rows={5} required
                placeholder="Share what's on your heart..."
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
              <span className="form-hint">{form.content.length} chars (min 10)</span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isAnonymous}
                onChange={(e) => setForm((p) => ({ ...p, isAnonymous: e.target.checked }))}
                style={{ accentColor: 'var(--brand-primary)' }} />
              <div>
                <span style={{ fontWeight: 600 }}>Post anonymously</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>— your name won't be shown</span>
              </div>
            </label>

            {error && <div className="form-error">⚠️ {error}</div>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button id="prayer-submit-btn" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Prayer 🙏'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function PrayerPartnersTab({ getToken }: { getToken: () => Promise<string | null> }) {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const data = await apiRequest<any[]>('/api/prayer/partners', { token: token ?? undefined });
      setPartners(data);
      setLoading(false);
    })();
  }, [getToken]);

  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>Finding partners...</div>;
  if (partners.length === 0) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>🙏</div>
      No prayer partners available right now. Check your profile settings to mark yourself as open.
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
      {partners.map((p) => (
        <div key={p.userId} className="card card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px',
            }}>
              {p.user.displayName?.[0] ?? '?'}
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>{p.user.displayName}</p>
              {p.denomination && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.denomination}</p>}
            </div>
          </div>
          {p.user.bio && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{p.user.bio}</p>}
          <button type="button" className="btn btn-primary" style={{ width: '100%', fontSize: '13px' }}>
            Connect 🙏
          </button>
        </div>
      ))}
    </div>
  );
}
