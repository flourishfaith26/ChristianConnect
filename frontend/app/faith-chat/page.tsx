'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export default function FaithChatPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Peace be with you! I can help you study scripture, compare denominational views (Protestant, Catholic, Reformed, etc.), or understand biblical history. What theological question is on your mind today?' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setSending(true);

    try {
      const token = await getToken();
      const res = await apiRequest<{ response: string; isCrisis?: boolean; requiresRedirect?: boolean }>(
        '/api/faith-chat/ask',
        {
          method: 'POST',
          token: token ?? undefined,
          body: JSON.stringify({ question: userMessage }),
        }
      );

      if (res.requiresRedirect || res.isCrisis) {
        setShowCrisis(true);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: '⚠️ Crisis Warning: I have detected terms that suggest self-harm or abuse. Please view our crisis support resources immediately.',
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { sender: 'ai', text: res.response }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Forgive me, I encountered an error. Please try again in a moment.' },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BackButton />
          <div style={{ fontSize: '20px' }}>📖</div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 700 }}>Scripture Q&A</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scripture study & theological Q&A</p>
          </div>
        </div>
        <Link href="/safety" className="btn btn-outline btn-sm">🛡️ Crisis Support</Link>
      </header>

      {/* Messages Feed */}
      <main style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map((msg, i) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '12px 16px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isUser ? 'var(--brand-primary)' : 'var(--bg-overlay)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          {sending && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
                background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)', fontSize: '13px',
              }}>
                Typing theological study references... ✍️
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Form */}
      <footer style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <form onSubmit={handleSend} style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '10px' }}>
          <input
            type="text" className="form-input" placeholder="Compare Protestant and Catholic views on justification, ask about Job, etc..."
            value={input} onChange={(e) => setInput(e.target.value)} disabled={sending}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim() || sending}>
            Ask
          </button>
        </form>
      </footer>

      {/* Crisis Warning Modal Overlay */}
      {showCrisis && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div className="glass-strong animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🆘</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#fca5a5' }}>
              We Care About Your Safety
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
              If you or a loved one are going through crisis, self-harm thoughts, or face threat of domestic abuse,
              know that you are not alone and help is immediately available.
            </p>

            <div style={{
              background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
              padding: '16px', marginBottom: '24px', textAlign: 'left',
            }}>
              <p style={{ fontWeight: 700, color: 'white', marginBottom: '4px' }}>📞 Call/Text 988 Suicide Line</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Free, confidential, available 24/7. Text HOME to 741741 to reach the Crisis Text Line.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowCrisis(false)}>Close Warning</button>
              <Link href="/safety" className="btn btn-primary" style={{ flex: 1 }}>
                View Safety Page
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
