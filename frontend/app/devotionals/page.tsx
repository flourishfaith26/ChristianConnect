'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import BackButton from '@/components/BackButton';

interface DevotionalEntry {
  date: string; title: string; passage: string; content: string;
}

function formatMonthDay(d: Date) {
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function displayDate(mmdd: string) {
  const [m, d] = mmdd.split('-').map(Number);
  return new Date(2024, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export default function DevotionalsPage() {
  const { getToken } = useAuth();
  const [entry, setEntry] = useState<DevotionalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => formatMonthDay(new Date()));

  async function loadDevotional(mmdd: string) {
    setLoading(true); setNotFound(false);
    try {
      const token = await getToken();
      const [m, d] = mmdd.split('-');
      const data = await apiRequest<DevotionalEntry>(`/api/devotionals/${m}/${d}`, { token: token ?? undefined });
      setEntry(data);
    } catch {
      setNotFound(true); setEntry(null);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadDevotional(currentDate); }, [currentDate]);

  function navigate(direction: -1 | 1) {
    const [m, d] = currentDate.split('-').map(Number);
    const date = new Date(2024, m - 1, d);
    date.setDate(date.getDate() + direction);
    setCurrentDate(formatMonthDay(date));
  }

  const isToday = currentDate === formatMonthDay(new Date());

  return (
    <div className="page-container">
      <BackButton />
      <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, marginBottom: '6px' }}>☀️ Daily Devotional</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
        My Utmost for His Highest — Oswald Chambers (Public Domain)
      </p>

      {/* Date navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <button id="devo-prev-btn" type="button" className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>
          ← Previous
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 700 }}>{displayDate(currentDate)}</p>
          {isToday && (
            <span style={{
              fontSize: '11px', color: 'var(--brand-gold)', fontWeight: 700,
              background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '99px',
            }}>TODAY</span>
          )}
        </div>
        <button id="devo-next-btn" type="button" className="btn btn-outline btn-sm" onClick={() => navigate(1)}>
          Next →
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>Loading devotional...</div>
      )}

      {notFound && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📖</div>
          <p style={{ color: 'var(--text-muted)' }}>No devotional entry for {displayDate(currentDate)}.</p>
          {!isToday && (
            <button type="button" className="btn btn-outline" style={{ marginTop: '16px' }}
              onClick={() => setCurrentDate(formatMonthDay(new Date()))}>
              Go to Today
            </button>
          )}
        </div>
      )}

      {entry && !loading && (
        <div className="animate-fade-in">
          {/* Verse / passage */}
          <div className="glass" style={{ padding: '24px', marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Today's Passage
            </p>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-gold)', fontFamily: 'var(--font-serif)' }}>
              {entry.passage}
            </p>
          </div>

          {/* Entry content */}
          <div className="card">
            <h2 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-serif)', marginBottom: '20px' }}>
              {entry.title}
            </h2>
            <div style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              {entry.content.split('\n\n').map((para, i) => (
                <p key={i} style={{ marginBottom: i < entry.content.split('\n\n').length - 1 ? '16px' : 0 }}>
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Attribution */}
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
            From <em>My Utmost for His Highest</em> by Oswald Chambers (1927) — Public Domain
          </div>
        </div>
      )}
    </div>
  );
}
