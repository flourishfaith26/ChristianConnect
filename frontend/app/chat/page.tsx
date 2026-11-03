'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { io as socketIO, Socket } from 'socket.io-client';
import { apiRequest } from '@/lib/api';
import SosButton from '@/components/SosButton';
import OnlineIndicator from '@/components/OnlineIndicator';
import TypingIndicator from '@/components/TypingIndicator';
import ReportButton from '@/components/ReportButton';
import BackButton from '@/components/BackButton';

interface Participant {
  user: { id: string; displayName: string; avatarUrl: string | null };
}
interface Conversation {
  id: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  participants: Participant[];
}
interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  mediaUrl: string | null;
  createdAt: string;
  moderationStatus: string;
}

export default function ChatPage() {
  const { getToken, userId: clerkId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mobile: track whether we show panel or sidebar
  const [mobileShowPanel, setMobileShowPanel] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentDbUserId = useRef<string | null>(null);

  // ── Init Socket.io ──────────────────────────────────────────────────────────
  useEffect(() => {
    let socket: Socket;
    (async () => {
      try {
        const token = await getToken();
        socket = socketIO(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000', {
          transports: ['polling', 'websocket'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('auth', { token });
        });

        socket.on('message:new', (msg: DirectMessage) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        });

        socket.on('typing:update', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
          setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
        });

        socket.on('presence:update', ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
          setOnlineUsers((prev) => ({ ...prev, [userId]: isOnline }));
        });

        // Keepalive ping every 20 seconds
        const pingInterval = setInterval(() => socket.emit('presence:ping'), 20_000);
        socket.on('disconnect', () => clearInterval(pingInterval));
      } catch (err: any) {
        console.warn('[ChatPage] Socket init error:', err.message);
      }
    })();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [getToken]);

  // ── Open a conversation ─────────────────────────────────────────────────────
  const openConversation = useCallback(async (convId: string) => {
    setActiveConvId(convId);
    setMobileShowPanel(true);
    socketRef.current?.emit('join:conversation', convId);

    try {
      setError(null);
      const token = await getToken();
      const data = await apiRequest<{ messages: DirectMessage[] }>(
        `/api/conversations/${convId}/messages`, { token: token ?? undefined }
      );
      setMessages(data.messages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err: any) {
      console.warn('[ChatPage] Open conversation error:', err.message);
      setError(err.message || 'Cannot reach the server — make sure the backend is running on port 4000.');
    }
  }, [getToken]);

  // ── Load conversations ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const token = await getToken();
        const me = await apiRequest<{ id: string }>('/api/profile/me', { token: token ?? undefined }).catch(() => null);
        if (me?.id) {
          currentDbUserId.current = me.id;
        } else {
          currentDbUserId.current = 'dev_db_user_123';
        }

        const data = await apiRequest<Conversation[]>('/api/conversations', { token: token ?? undefined });
        setConversations(data);
        if (data.length > 0) {
          const defaultConv = data.find((c) => c.id === 'conv_ai_1') ?? data[0];
          openConversation(defaultConv.id);
        }
      } catch (err: any) {
        console.warn('[ChatPage] Load conversations error:', err.message);
        setError(err.message || 'Cannot reach the server — make sure the backend is running on port 4000.');
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken, openConversation]);

  // ── Send message ─────────────────────────────────────────────────────────────
  async function sendMessage() {
    if (!draft.trim() || !activeConvId || sending) return;
    const content = draft.trim();
    setDraft('');
    setSending(true);

    const tempId = `msg_opt_${Date.now()}`;
    const tempMsg: DirectMessage = {
      id: tempId,
      conversationId: activeConvId,
      senderId: currentDbUserId.current || 'dev_db_user_123',
      content,
      mediaUrl: null,
      createdAt: new Date().toISOString(),
      moderationStatus: 'approved',
    };

    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const token = await getToken();
      const res = await apiRequest<{ id?: string; aiReply?: DirectMessage }>(
        `/api/conversations/${activeConvId}/messages`, {
          method: 'POST', token: token ?? undefined,
          body: JSON.stringify({ content }),
        }
      );
      if (res?.aiReply) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === res.aiReply!.id)) return prev;
          return [...prev, res.aiReply!];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
      socketRef.current?.emit('typing:stop', { room: `conversation:${activeConvId}` });
    } catch (err: any) {
      console.warn('[ChatPage] Send message error:', err.message);
      setError(err.message || 'Cannot reach the server — make sure the backend is running on port 4000.');
    } finally {
      setSending(false);
    }
  }

  // ── Typing emit ──────────────────────────────────────────────────────────────
  function handleDraftChange(val: string) {
    setDraft(val);
    if (!activeConvId) return;
    socketRef.current?.emit('typing:start', {
      room: `conversation:${activeConvId}`,
      displayName: 'You',
    });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', { room: `conversation:${activeConvId}` });
    }, 2000);
  }

  // Get the other participant in a 1:1 DM
  function getOtherParticipant(conv: Conversation) {
    if (conv.participants.length === 1) return conv.participants[0].user;
    const nonMe = conv.participants.find((p) => {
      if (currentDbUserId.current && p.user.id === currentDbUserId.current) return false;
      if (p.user.displayName === 'Grace Believer' && conv.participants.length > 1) return false;
      return true;
    });
    return nonMe?.user ?? conv.participants[1]?.user ?? conv.participants[0]?.user;
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherUser = activeConv ? getOtherParticipant(activeConv) : null;
  const isAnyoneTyping = Object.values(typingUsers).some(Boolean);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* ── Sidebar: Conversation List ──────────────────────────────────────── */}
      <aside className={`chat-sidebar-responsive${mobileShowPanel ? ' chat-sidebar-hidden-mobile' : ''}`}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <BackButton />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Messages</h2>
          {error && (
            <div style={{
              marginTop: '10px', padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
              <span>⚠️ {error}</span>
              <button
                type="button"
                onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
                className="btn btn-xs btn-outline"
                style={{ fontSize: '11px', alignSelf: 'flex-start', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              >
                🔄 Retry Connection
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading...
            </div>
          )}
          {!loading && conversations.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No conversations yet.<br />Start one from a friend's profile.
            </div>
          )}
          {conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            return (
              <button
                key={conv.id}
                id={`conv-${conv.id}`}
                type="button"
                aria-label={`Open conversation with ${other?.displayName ?? 'user'}`}
                onClick={() => openConversation(conv.id)}
                style={{
                  width: '100%', padding: '14px 16px', textAlign: 'left',
                  background: activeConvId === conv.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                  borderLeft: activeConvId === conv.id ? '3px solid var(--brand-primary)' : '3px solid transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'var(--gradient-brand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700, overflow: 'hidden',
                  }}>
                    {other?.avatarUrl
                      ? <img src={other.avatarUrl} alt={`${other?.displayName ?? 'User'}'s avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : other?.displayName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <OnlineIndicator isOnline={onlineUsers[other?.id ?? ''] ?? false} size={10} />
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {other?.displayName ?? 'Unknown'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.lastMessagePreview ?? 'Start a conversation'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Main: Message Thread ────────────────────────────────────────────── */}
      <main className={`chat-panel-responsive${!mobileShowPanel ? ' chat-panel-hidden-mobile' : ''}`}>
        {!activeConvId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '40px' }}>💬</div>
            <p style={{ fontSize: '16px' }}>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Back to conversation list on mobile */}
                <button
                  type="button"
                  className="chat-back-mobile btn btn-ghost btn-sm"
                  onClick={() => setMobileShowPanel(false)}
                  aria-label="Back to messages"
                >
                  ← Back
                </button>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--gradient-brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, overflow: 'hidden',
                }}>
                  {otherUser?.avatarUrl
                    ? <img src={otherUser.avatarUrl} alt={`${otherUser?.displayName ?? 'User'}'s avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : otherUser?.displayName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700 }}>{otherUser?.displayName}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <OnlineIndicator isOnline={onlineUsers[otherUser?.id ?? ''] ?? false} size={8} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {onlineUsers[otherUser?.id ?? ''] ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {otherUser && (
                  <ReportButton targetType="user" targetId={otherUser.id} label="Report" />
                )}
                {otherUser && activeConvId && (
                  <SosButton targetType="user" targetId={otherUser.id} targetUserId={otherUser.id} />
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg) => {
                const isMine =
                  msg.senderId === currentDbUserId.current ||
                  msg.senderId === 'dev_db_user_123' ||
                  msg.id.startsWith('msg_opt_') ||
                  msg.id.startsWith('msg_user_');
                return (
                  <div key={msg.id} style={{
                    display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
                    gap: '8px', alignItems: 'flex-end',
                  }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMine ? 'var(--brand-primary)' : 'var(--bg-elevated)',
                      color: isMine ? '#ffffff' : 'var(--text-primary)', fontSize: '14px', lineHeight: 1.5,
                    }}>
                      {msg.content}
                      {msg.moderationStatus === 'flagged' && (
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                          ⚠️ Under review
                        </div>
                      )}
                    </div>
                    {!isMine && (
                      <ReportButton targetType="message" targetId={msg.id} label="" className="opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                );
              })}
              {isAnyoneTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '16px 20px', borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)', display: 'flex', gap: '10px', alignItems: 'flex-end',
            }}>
              <textarea
                id="chat-input"
                name="chatMessage"
                aria-label="Type your message"
                className="form-input"
                style={{ flex: 1, resize: 'none', minHeight: '44px', maxHeight: '120px' }}
                placeholder="Type a message..."
                value={draft}
                rows={1}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
              />
              <button
                id="chat-send-btn"
                type="button"
                className="btn btn-primary"
                aria-label="Send message"
                onClick={sendMessage}
                disabled={!draft.trim() || sending}
                style={{ padding: '10px 18px', flexShrink: 0 }}
              >
                <span aria-hidden="true">{sending ? '...' : '↑'}</span>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
