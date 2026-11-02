'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

interface Speaker {
  id: string;
  role: 'host' | 'speaker' | 'listener';
  isMuted: boolean;
  handRaised: boolean;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

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
  speakers: Speaker[];
}

export default function AudioRoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken } = useAuth();

  const [room, setRoom] = useState<AudioRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSelfMuted, setIsSelfMuted] = useState(true);
  const [handRaised, setHandRaised] = useState(false);

  const loadRoom = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<AudioRoom>(`/api/audio-rooms/${id}`, {
        token: token ?? undefined,
      });
      setRoom(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    loadRoom();
    // Join as listener on load
    getToken().then(token => {
      apiRequest(`/api/audio-rooms/${id}/join`, {
        method: 'POST',
        token: token ?? undefined,
      }).catch(() => {});
    });
  }, [id, getToken, loadRoom]);

  const toggleRaiseHand = async () => {
    const newHandState = !handRaised;
    setHandRaised(newHandState);
    try {
      const token = await getToken();
      await apiRequest(`/api/audio-rooms/${id}/speaker-status`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ handRaised: newHandState }),
      });
      loadRoom();
    } catch {
      setHandRaised(!newHandState);
    }
  };

  const toggleSelfMute = async () => {
    const newMuteState = !isSelfMuted;
    setIsSelfMuted(newMuteState);
    try {
      const token = await getToken();
      await apiRequest(`/api/audio-rooms/${id}/speaker-status`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ isMuted: newMuteState }),
      });
      loadRoom();
    } catch {
      setIsSelfMuted(!newMuteState);
    }
  };

  const handleHostMuteUser = async (targetUserId: string, mute: boolean) => {
    try {
      const token = await getToken();
      await apiRequest(`/api/audio-rooms/${id}/speaker-status`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ targetUserId, isMuted: mute }),
      });
      loadRoom();
    } catch {
      alert('Could not update speaker mute status');
    }
  };

  const handleHostPromote = async (targetUserId: string, newRole: 'speaker' | 'listener') => {
    try {
      const token = await getToken();
      await apiRequest(`/api/audio-rooms/${id}/speaker-status`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ targetUserId, role: newRole, isMuted: newRole === 'listener' }),
      });
      loadRoom();
    } catch {
      alert('Could not update speaker role');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Joining audio room...</div>
      </div>
    );
  }

  if (!room) return null;

  const stageSpeakers = room.speakers.filter(s => s.role === 'host' || s.role === 'speaker');
  const listeners = room.speakers.filter(s => s.role === 'listener');

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: '32px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <a href="/audio-rooms" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
          ← Leave Room & Back to Audio Rooms
        </a>

        {/* Room Card */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '32px', border: '1px solid #334155' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '3px 10px', borderRadius: '99px', textTransform: 'uppercase' }}>
                {room.type.replace('_', ' ')}
              </span>
              <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '8px 0 4px' }}>
                {room.title}
              </h1>
              {room.description && (
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                  {room.description}
                </p>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>
                ● Live Stage
              </span>
            </div>
          </div>

          {/* Speakers Stage */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
              🎙️ On Stage (Speakers)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
              {stageSpeakers.map(s => (
                <div key={s.id} style={{
                  background: '#0f172a', padding: '16px', borderRadius: '12px', textAlign: 'center',
                  border: s.isMuted ? '1px solid #334155' : '2px solid #22c55e',
                  position: 'relative',
                }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%', background: 'var(--brand-primary)', margin: '0 auto 10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', overflow: 'hidden',
                  }}>
                    {s.user.avatarUrl ? (
                      <img src={s.user.avatarUrl} alt={s.user.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      s.user.displayName[0].toUpperCase()
                    )}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.user.displayName}
                  </p>
                  <span style={{ fontSize: '11px', color: s.role === 'host' ? '#f59e0b' : '#94a3b8' }}>
                    {s.role === 'host' ? '👑 Host' : s.isMuted ? '🔇 Muted' : '🎙️ Speaking'}
                  </span>

                  {/* Host control dropdown / mute toggle */}
                  {room.host.id === s.user.id && (
                    <button
                      type="button"
                      onClick={() => handleHostMuteUser(s.user.id, !s.isMuted)}
                      style={{ marginTop: '8px', fontSize: '10px', padding: '2px 8px', background: '#334155', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
                    >
                      {s.isMuted ? 'Unmute' : 'Mute'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Listeners Area */}
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
              🎧 Listeners ({listeners.length})
            </h3>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {listeners.map(l => (
                <div key={l.id} style={{
                  background: '#0f172a', padding: '8px 14px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>{l.user.displayName}</span>
                  {l.handRaised && <span style={{ fontSize: '14px' }}>✋ Raised Hand</span>}

                  {/* Host action to promote listener to speaker stage */}
                  <button
                    type="button"
                    onClick={() => handleHostPromote(l.user.id, 'speaker')}
                    style={{ fontSize: '10px', background: '#22c55e', border: 'none', color: 'white', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                  >
                    + Stage
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* User Controls Bottom Bar */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button
              type="button"
              className={`btn ${handRaised ? 'btn-gold' : 'btn-outline'}`}
              onClick={toggleRaiseHand}
            >
              {handRaised ? '✋ Lower Hand' : '✋ Raise Hand to Speak'}
            </button>

            <button
              type="button"
              className={`btn ${isSelfMuted ? 'btn-outline' : 'btn-primary'}`}
              onClick={toggleSelfMute}
            >
              {isSelfMuted ? '🔇 Mic Off' : '🎙️ Mic On'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
