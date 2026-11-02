'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

// ── Step data ─────────────────────────────────────────────────────────────────
const FAITH_OPTIONS = [
  { value: 'new_to_faith', label: 'New to faith', desc: 'I\'m just starting to explore Christianity', icon: '🌱' },
  { value: 'less_than_a_year', label: 'Less than a year', desc: 'Relatively new believer', icon: '🕊️' },
  { value: 'several_years', label: 'Several years', desc: 'Growing in my faith journey', icon: '🌿' },
  { value: 'most_of_my_life', label: 'Most of my life', desc: 'Lifelong follower of Christ', icon: '✝️' },
];

const DENOMINATION_OPTIONS = [
  { value: 'catholic', label: 'Catholic' },
  { value: 'baptist', label: 'Baptist' },
  { value: 'pentecostal', label: 'Pentecostal' },
  { value: 'non_denominational', label: 'Non-denominational' },
  { value: 'orthodox', label: 'Orthodox' },
  { value: 'reformed', label: 'Reformed / Presbyterian' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const JOIN_REASON_OPTIONS = [
  { value: 'friendship', label: 'Friendship', icon: '🤝', desc: 'Meet fellow believers' },
  { value: 'bible_study', label: 'Bible Study', icon: '📖', desc: 'Study Scripture together' },
  { value: 'prayer_partner', label: 'Prayer Partner', icon: '🙏', desc: 'Pray with someone regularly' },
  { value: 'accountability', label: 'Accountability', icon: '🛡️', desc: 'Grow with an accountability partner' },
  { value: 'mentorship', label: 'Mentorship', icon: '🌱', desc: 'Guide or be guided in faith' },
  { value: 'devotionals', label: 'Devotionals', icon: '☀️', desc: 'Daily spiritual readings' },
  { value: 'apologetics', label: 'Apologetics', icon: '⚔️', desc: 'Defend and explore the faith' },
  { value: 'general_connection', label: 'General Connection', icon: '💬', desc: 'Faith-based community' },
];

export default function OnboardingStep2Page() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [step, setStep] = useState<'faith' | 'denomination' | 'reasons'>('faith');
  const [faithBackground, setFaithBackground] = useState('');
  const [denomination, setDenomination] = useState('');
  const [joinReasons, setJoinReasons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleReason(value: string) {
    setJoinReasons((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  }

  async function handleFinish() {
    if (joinReasons.length === 0) {
      setError('Please select at least one reason for joining.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      await apiRequest('/api/profile/onboarding-step2', {
        method: 'POST', token: token ?? undefined,
        body: JSON.stringify({ faithBackground, denomination, joinReasons }),
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gradient-hero)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div className="glass" style={{ width: '100%', maxWidth: '560px', padding: '40px 36px' }}>

        {/* Progress */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {(['faith', 'denomination', 'reasons'] as const).map((s, i) => (
              <div key={s} style={{
                flex: 1, height: '3px', borderRadius: '99px',
                background: ['faith', 'denomination', 'reasons'].indexOf(step) >= i
                  ? 'var(--brand-primary)' : 'var(--border-subtle)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Step {step === 'faith' ? '1' : step === 'denomination' ? '2' : '3'} of 3 — Tell us about yourself
          </p>
        </div>

        {/* ── Step 1: Faith Background ──────────────────────────────────────── */}
        {step === 'faith' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
              Where are you in your faith journey?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              This helps us match you with the right community.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {FAITH_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`faith-${opt.value}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: faithBackground === opt.value
                      ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                    background: faithBackground === opt.value
                      ? 'rgba(99,102,241,0.1)' : 'var(--bg-overlay)',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    id={`faith-${opt.value}`} type="radio" name="faith"
                    value={opt.value} checked={faithBackground === opt.value}
                    onChange={() => setFaithBackground(opt.value)}
                    style={{ accentColor: 'var(--brand-primary)' }}
                  />
                  <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                id="faith-skip-btn" type="button" className="btn btn-outline"
                onClick={() => setStep('denomination')} style={{ flex: '0 0 auto' }}
              >Skip</button>
              <button
                id="faith-next-btn" type="button" className="btn btn-primary"
                onClick={() => setStep('denomination')} style={{ flex: 1 }}
              >Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Denomination ──────────────────────────────────────────── */}
        {step === 'denomination' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
              Your church tradition
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Optional — helps match you with Bible study groups of the same tradition.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '28px' }}>
              {DENOMINATION_OPTIONS.map((opt) => (
                <label
                  key={opt.value} htmlFor={`denom-${opt.value}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: denomination === opt.value
                      ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                    background: denomination === opt.value
                      ? 'rgba(99,102,241,0.1)' : 'var(--bg-overlay)',
                    fontSize: '14px', fontWeight: denomination === opt.value ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    id={`denom-${opt.value}`} type="radio" name="denomination"
                    value={opt.value} checked={denomination === opt.value}
                    onChange={() => setDenomination(opt.value)}
                    style={{ accentColor: 'var(--brand-primary)' }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button id="denom-back-btn" type="button" className="btn btn-outline"
                onClick={() => setStep('faith')} style={{ flex: '0 0 auto' }}>← Back</button>
              <button id="denom-next-btn" type="button" className="btn btn-primary"
                onClick={() => setStep('reasons')} style={{ flex: 1 }}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Why You Joined ────────────────────────────────────────── */}
        {step === 'reasons' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
              What brings you to ChristianConnect?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Select all that apply — your dashboard will be personalized based on your choices.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              {joinReasons.length} selected
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              {JOIN_REASON_OPTIONS.map((opt) => {
                const selected = joinReasons.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    id={`reason-${opt.value}`}
                    type="button"
                    onClick={() => toggleReason(opt.value)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      gap: '4px', padding: '12px', borderRadius: 'var(--radius-md)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      border: selected ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      background: selected ? 'rgba(99,102,241,0.12)' : 'var(--bg-overlay)',
                    }}
                    aria-pressed={selected}
                  >
                    <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            {error && <div className="form-error" style={{ marginBottom: '12px' }}>⚠️ {error}</div>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button id="reasons-back-btn" type="button" className="btn btn-outline"
                onClick={() => setStep('denomination')} style={{ flex: '0 0 auto' }}
                disabled={isSubmitting}>← Back</button>
              <button
                id="reasons-finish-btn" type="button" className="btn btn-primary"
                onClick={handleFinish} style={{ flex: 1 }}
                disabled={joinReasons.length === 0 || isSubmitting}
              >
                {isSubmitting ? 'Setting up your community...' : 'Enter ChristianConnect ✝'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
