'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

interface ActivePartnership {
  id: string;
  status: string;
  createdAt: string;
}

interface Partner {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

const FOCUS_AREAS = [
  { value: 'purity', label: '🛡️ Purity / Integrity', desc: 'Walk in righteousness, pure thoughts, and clean habits.' },
  { value: 'addiction_recovery', label: '🫂 Addiction Recovery', desc: 'Support and check-ins to break free from dependencies.' },
  { value: 'prayer_consistency', label: '🙏 Prayer Consistency', desc: 'Encouragement to build a strong, daily conversational prayer life.' },
  { value: 'general_growth', label: '🌱 General Spiritual Growth', desc: 'General mentorship, reading habits, and scripture obedience.' },
];

export default function AccountabilityPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [partnership, setPartnership] = useState<ActivePartnership | null>(null);
  const [focus, setFocus] = useState('');
  const [description, setDescription] = useState('');
  const [submittingIntake, setSubmittingIntake] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchStatusMsg, setMatchStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<{
        partner: Partner | null;
        activePartnership: ActivePartnership | null;
        profile: { accountabilityFocus: string | null; accountabilityIntake: string | null } | null;
      }>('/api/accountability/status', { token: token ?? undefined });

      setPartner(res.partner);
      setPartnership(res.activePartnership);
      if (res.profile) {
        setFocus(res.profile.accountabilityFocus ?? '');
        setDescription(res.profile.accountabilityIntake ?? '');
      }
    } catch {
      setError('Could not load status.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  async function submitIntake(e: React.FormEvent) {
    e.preventDefault();
    if (!focus) {
      setError('Please select a focus area.');
      return;
    }
    setSubmittingIntake(true);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest('/api/accountability/intake', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ focus, description, open: true }),
      });
      await checkStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmittingIntake(false);
    }
  }

  async function findMatch() {
    setMatching(true);
    setError(null);
    setMatchStatusMsg(null);
    try {
      const token = await getToken();
      const res = await apiRequest<{ success: boolean; message?: string; partner: Partner | null; partnership: ActivePartnership | null }>(
        '/api/accountability/match',
        { method: 'POST', token: token ?? undefined }
      );
      if (res.success) {
        setPartner(res.partner);
        setPartnership(res.partnership);
      } else {
        setMatchStatusMsg(res.message ?? 'No match found yet.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Match failed.');
    } finally {
      setMatching(false);
    }
  }

  async function closePartnership() {
    if (!partnership) return;
    if (!confirm('Are you sure you want to end this accountability partnership? This cannot be undone.')) return;
    try {
      const token = await getToken();
      await apiRequest('/api/accountability/close', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ partnershipId: partnership.id }),
      });
      await checkStatus();
    } catch {
      setError('Failed to close partnership.');
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>Loading accountability module...</div>;
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, marginBottom: '6px' }}>🛡️ Accountability Partners</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Find same-gender partners for spiritual accountability. Focus areas are private and only used for matching.
        </p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}

      {/* Active Partnership Card */}
      {partnership && partner ? (
        <div className="glass" style={{ padding: '32px', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛡️</div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Active Partnership</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            You are currently paired in accountability with:
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '12px',
            padding: '16px 24px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-overlay)',
            marginBottom: '32px', border: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%', background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700,
            }}>
              {partner.displayName[0].toUpperCase()}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 700, fontSize: '16px' }}>{partner.displayName}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Same-Gender Accountability Partner</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a href="/chat" className="btn btn-primary">💬 Open DMs</a>
            <button type="button" className="btn btn-outline" onClick={closePartnership}>Close Partnership</button>
          </div>
        </div>
      ) : (
        /* Intake form & Matching Request */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <form onSubmit={submitIntake} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>1. Accountability Intake Survey</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Select what focus area you want to match for. Your answers are private.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FOCUS_AREAS.map((item) => (
                <label
                  key={item.value}
                  htmlFor={`focus-${item.value}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: focus === item.value ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                    background: focus === item.value ? 'rgba(99,102,241,0.1)' : 'var(--bg-overlay)',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    id={`focus-${item.value}`} type="radio" name="focus"
                    value={item.value} checked={focus === item.value}
                    onChange={() => setFocus(item.value)}
                    style={{ accentColor: 'var(--brand-primary)' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.label}</span>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="intake-desc" className="form-label">Optional Details (intake questions, private)</label>
              <textarea
                id="intake-desc" className="form-input" rows={4}
                placeholder="What details are you seeking support for? (e.g. daily habits, recovery goals...)"
                value={description} onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submittingIntake}>
              {submittingIntake ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>

          {/* Trigger Match */}
          <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>2. Seek Accountability Partner</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Trigger same-gender match matching algorithm now.
            </p>

            {matchStatusMsg && (
              <div style={{
                padding: '12px', borderRadius: 'var(--radius-md)',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                color: '#fcd34d', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5,
              }}>
                {matchStatusMsg}
              </div>
            )}

            <button
              id="match-btn" type="button" className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              onClick={findMatch} disabled={matching || !focus}
            >
              {matching ? 'Running Matching Algorithm...' : 'Find Same-Gender Partner'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
