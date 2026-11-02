'use client';

import { useState } from 'react';

interface Props {
  defaultName: string;
  isMinor: boolean;
  isSubmitting: boolean;
  onNext: (displayName: string, gender: 'male' | 'female' | 'prefer_not_to_say') => void;
  onBack: () => void;
}

export default function ProfileSetup({ defaultName, isMinor, isSubmitting, onNext, onBack }: Props) {
  const [displayName, setDisplayName] = useState(defaultName);
  const [gender, setGender] = useState<'male' | 'female' | 'prefer_not_to_say' | ''>('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!displayName.trim() || displayName.trim().length < 2) {
      setError('Please enter a display name of at least 2 characters.');
      return;
    }

    if (!gender) {
      setError('Please select a gender. This is required for community matching.');
      return;
    }

    onNext(displayName.trim(), gender as 'male' | 'female' | 'prefer_not_to_say');
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          Set up your profile
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          {isMinor
            ? "Let's get your content-only profile set up. One more step after this."
            : 'Almost there! Tell the community a little about yourself.'}
        </p>
      </div>

      {isMinor && (
        <div style={{
          padding: '14px 16px', borderRadius: 'var(--radius-md)',
          background: 'rgba(25, 118, 210, 0.08)',
          border: '1px solid rgba(25, 118, 210, 0.3)',
          fontSize: '13px', color: '#1565c0', lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 700 }}>📘 Content-Only Account</span> — Because you're under 18,
          your account will have access to Bible Reading Plans, Devotionals, Scripture Explanations,
          and Faith Chat. Chat, Stories, and Dating features are not available.
        </div>
      )}

      <div className="form-group">
        <label htmlFor="display-name-input" className="form-label">Display Name</label>
        <input
          id="display-name-input"
          type="text"
          className="form-input"
          placeholder="How should we call you?"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          required
          minLength={2}
        />
        <span className="form-hint">This is what others see. You can change it later.</span>
      </div>

      <div className="form-group">
        <label className="form-label">Gender</label>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Required for community matching and the Dating section (opposite-gender only).
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {GENDER_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`gender-${opt.value}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', borderRadius: 'var(--radius-md)',
                border: gender === opt.value
                  ? '2px solid var(--brand-primary)'
                  : '1px solid var(--border-default)',
                background: gender === opt.value
                  ? 'rgba(46, 125, 50, 0.08)'
                  : 'var(--bg-surface)',
                cursor: 'pointer', transition: 'all 0.2s ease',
                fontSize: '15px', fontWeight: 500,
                color: gender === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <input
                id={`gender-${opt.value}`}
                type="radio"
                name="gender"
                value={opt.value}
                checked={gender === opt.value}
                onChange={() => setGender(opt.value as typeof gender)}
                style={{ accentColor: 'var(--brand-primary)', width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '18px' }}>{opt.icon}</span>
              <div>
                <div>{opt.label}</div>
                {opt.note && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {opt.note}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="form-error">⚠️ {error}</div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          id="profile-back-btn"
          type="button"
          onClick={onBack}
          className="btn btn-outline"
          style={{ flex: '0 0 auto' }}
          disabled={isSubmitting}
        >
          ← Back
        </button>
        <button
          id="profile-next-btn"
          type="submit"
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={!displayName.trim() || !gender || isSubmitting}
        >
          {isSubmitting ? 'Creating your account...' : isMinor ? 'Next Step →' : 'Create My Account ✝'}
        </button>
      </div>
    </form>
  );
}

const GENDER_OPTIONS = [
  { value: 'male', icon: '♂', label: 'Male', note: undefined },
  { value: 'female', icon: '♀', label: 'Female', note: undefined },
  {
    value: 'prefer_not_to_say',
    icon: '—',
    label: 'Prefer not to say',
    note: 'Note: you will not appear in the Dating section.',
  },
];
