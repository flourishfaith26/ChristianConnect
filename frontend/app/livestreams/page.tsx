'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  streamUrl: string;
  isLive: boolean;
  viewersCount: number;
  host: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export default function LiveStreamsPage() {
  const { getToken } = useAuth();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const loadStreams = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<LiveStream[]>('/api/livestreams', {
        token: token ?? undefined,
      });
      setStreams(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadStreams(); }, [loadStreams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const token = await getToken();
      const newStream = await apiRequest<LiveStream>('/api/livestreams', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          streamUrl: streamUrl.trim() || undefined,
        }),
      });

      setStreams(prev => [newStream, ...prev]);
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setStreamUrl('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not start stream');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '4px' }}>
              🎥 Live Sermon Streams
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Watch live church services and ministry broadcasts with real-time community chat.
            </p>
          </div>

          <button type="button" onClick={() => setShowCreate(true)} className="btn btn-primary">
            + Start Broadcast
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Loading live streams...
          </div>
        )}

        {!loading && streams.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📡</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No live streams right now</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Check back during Sunday service hours or start your own ministry broadcast!
            </p>
            <button type="button" onClick={() => setShowCreate(true)} className="btn btn-primary">
              Start a Live Stream →
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {streams.map(stream => (
            <Link
              key={stream.id}
              href={`/livestreams/${stream.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card card-interactive animate-fade-in" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  {stream.isLive ? (
                    <span style={{
                      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: 'white', background: '#dc2626', padding: '3px 10px', borderRadius: '99px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <span className="animate-pulse-glow">●</span> LIVE
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ended</span>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--brand-gold)', fontWeight: 600 }}>
                    👀 {stream.viewersCount} Viewers
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  {stream.title}
                </h3>

                <p style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '12px' }}>
                  Hosted by: {stream.host.displayName}
                </p>

                {stream.description && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                    {stream.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span className="btn btn-outline btn-sm">
                    {stream.isLive ? '🔴 Watch Stream & Chat →' : 'View Stream Info →'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Modal */}
        {showCreate && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}>
            <div className="card animate-fade-in" style={{ maxWidth: '560px', width: '100%', padding: '32px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>
                🎥 Start a Live Broadcast
              </h2>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="stream-title" className="form-label">Broadcast Title *</label>
                  <input
                    id="stream-title"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sunday Morning Sermon Live"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stream-url" className="form-label">Stream Playback URL (Mux / Cloudflare)</label>
                  <input
                    id="stream-url"
                    type="url"
                    className="form-input"
                    placeholder="https://... (leave blank for sample stream)"
                    value={streamUrl}
                    onChange={e => setStreamUrl(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stream-desc" className="form-label">Description</label>
                  <textarea
                    id="stream-desc"
                    className="form-input"
                    rows={3}
                    placeholder="Service details, preacher info, or theme..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Starting Broadcast...' : '🔴 Go Live Now'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
