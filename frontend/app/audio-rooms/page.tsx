'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface AudioRoom {
  id: string;
  title: string;
  description: string | null;
  type: string;
  isLive: boolean;
  host: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  _count: { speakers: number };
}

export default function AudioRoomsPage() {
  const { getToken } = useAuth();
  const [rooms, setRooms] = useState<AudioRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('prayer_night');
  const [saving, setSaving] = useState(false);

  const loadRooms = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<AudioRoom[]>('/api/audio-rooms', {
        token: token ?? undefined,
      });
      setRooms(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const token = await getToken();
      const newRoom = await apiRequest<AudioRoom>('/api/audio-rooms', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          type,
        }),
      });

      setRooms(prev => [newRoom, ...prev]);
      setShowCreate(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create audio room');
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
              🎙️ Live Audio Rooms
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Join live prayer nights, &quot;Ask a Pastor&quot; Q&A sessions, and interactive voice discussions.
            </p>
          </div>

          <button type="button" onClick={() => setShowCreate(true)} className="btn btn-primary">
            + Host Audio Room
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Loading audio rooms...
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎧</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No active audio rooms</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Host a prayer night or Q&A session with your community!
            </p>
            <button type="button" onClick={() => setShowCreate(true)} className="btn btn-primary">
              Host an Audio Room →
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {rooms.map(room => (
            <Link
              key={room.id}
              href={`/audio-rooms/${room.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card card-interactive animate-fade-in" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '3px 10px', borderRadius: '99px',
                  }}>
                    {room.type.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--brand-gold)', fontWeight: 600 }}>
                    🎙️ {room._count.speakers} Participants
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  {room.title}
                </h3>

                <p style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '12px' }}>
                  Host: {room.host.displayName}
                </p>

                {room.description && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                    {room.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span className="btn btn-outline btn-sm">
                    🎧 Join Audio Room →
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
                🎙️ Host a Live Audio Room
              </h2>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="room-title" className="form-label">Room Title *</label>
                  <input
                    id="room-title"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Wednesday Night Live Prayer & Worship"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="room-type" className="form-label">Room Type</label>
                  <select
                    id="room-type"
                    className="form-input"
                    value={type}
                    onChange={e => setType(e.target.value)}
                  >
                    <option value="prayer_night">🙏 Prayer Night</option>
                    <option value="ask_pastor">🗣️ Ask a Pastor Q&A</option>
                    <option value="group_discussion">🤝 Group Discussion</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="room-desc" className="form-label">Description</label>
                  <textarea
                    id="room-desc"
                    className="form-input"
                    rows={3}
                    placeholder="Topics to discuss, host introduction, or guidelines..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Creating Room...' : '🎙️ Open Room'}
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
