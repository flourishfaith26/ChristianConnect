'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useAuth } from '@clerk/nextjs';
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

interface ChatMsg {
  id: string;
  user: string;
  text: string;
  time: string;
}

export default function LiveStreamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken } = useAuth();

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { id: '1', user: 'Pastor Timothy', text: 'Welcome everyone to today’s live service! 🙏', time: '10:00' },
    { id: '2', user: 'Sarah M.', text: 'Amen! Watching from Lagos.', time: '10:01' },
    { id: '3', user: 'David K.', text: 'Praise God for this word.', time: '10:02' },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const loadStream = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<LiveStream>(`/api/livestreams/${id}`, {
        token: token ?? undefined,
      });
      setStream(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => { loadStream(); }, [loadStream]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg: ChatMsg = {
      id: String(Date.now()),
      user: 'You',
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMsgs(prev => [...prev, newMsg]);
    setInputMsg('');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading live stream...</div>
      </div>
    );
  }

  if (!stream) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/livestreams" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
          ← Back to All Streams
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {stream.isLive && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', background: '#dc2626', padding: '3px 10px', borderRadius: '99px' }}>
              🔴 LIVE NOW
            </span>
          )}
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            Hosted by {stream.host.displayName}
          </span>
        </div>
      </div>

      {/* Main Grid: Video + Live Chat Sidebar */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: 0 }}>
        
        {/* Left: Video Player */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden',
          }}>
            <video src={stream.streamUrl} controls autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div>
            <h1 style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', fontWeight: 700, marginBottom: '8px' }}>
              {stream.title}
            </h1>
            {stream.description && (
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                {stream.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Live Chat Sidebar */}
        <div style={{
          borderLeft: '1px solid rgba(255,255,255,0.1)', background: '#121212',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '14px' }}>
            💬 Live Community Chat
          </div>

          {/* Messages List */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chatMsgs.map(m => (
              <div key={m.id} style={{ fontSize: '13px', lineHeight: 1.5 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginRight: '6px' }}>{m.time}</span>
                <strong style={{ color: 'var(--brand-primary)', marginRight: '6px' }}>{m.user}:</strong>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>{m.text}</span>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Say something encouraging..."
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '8px', background: '#222', border: '1px solid #333', color: 'white', fontSize: '13px',
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
