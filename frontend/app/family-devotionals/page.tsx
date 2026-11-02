'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

interface FamilyDevotional {
  id: string;
  title: string;
  track: string;
  weekNumber: number;
  scriptureRef: string;
  reflection: string;
  discussionPoints: string[];
}

export default function FamilyDevotionalsPage() {
  const { getToken } = useAuth();
  const [devotionals, setDevotionals] = useState<FamilyDevotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<'marriage' | 'parenting'>('marriage');

  const loadDevotionals = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<FamilyDevotional[]>(`/api/family-devotionals?track=${activeTrack}`, {
        token: token ?? undefined,
      });
      setDevotionals(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken, activeTrack]);

  useEffect(() => { loadDevotionals(); }, [loadDevotionals]);

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '6px' }}>
            👨‍👩‍👧 Family & Marriage Devotional Tracks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Weekly guided devotional tracks for married couples small groups and grace-filled parenting.
          </p>
        </div>

        {/* Track Switcher Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', maxWidth: '360px' }}>
          <button
            type="button"
            onClick={() => setActiveTrack('marriage')}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activeTrack === 'marriage' ? 'var(--brand-primary)' : 'transparent',
              color: activeTrack === 'marriage' ? 'white' : 'var(--text-muted)',
              fontSize: '13px', fontWeight: 600,
            }}
          >
            💍 Marriage Track
          </button>
          <button
            type="button"
            onClick={() => setActiveTrack('parenting')}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activeTrack === 'parenting' ? 'var(--brand-primary)' : 'transparent',
              color: activeTrack === 'parenting' ? 'white' : 'var(--text-muted)',
              fontSize: '13px', fontWeight: 600,
            }}
          >
            👨‍👩‍👧 Parenting Track
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Loading family devotionals...
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {devotionals.map(dev => (
            <div key={dev.id} className="card animate-fade-in" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--brand-gold)', background: 'rgba(212,175,55,0.1)', padding: '3px 10px', borderRadius: '99px',
                }}>
                  Week {dev.weekNumber} • {dev.scriptureRef}
                </span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                {dev.title}
              </h2>

              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
                {dev.reflection}
              </p>

              {dev.discussionPoints?.length > 0 && (
                <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    💬 Discussion & Reflection Prompts
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dev.discussionPoints.map((p, idx) => (
                      <p key={idx} style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                        • {p}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
