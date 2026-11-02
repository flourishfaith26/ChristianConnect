'use client';

import { useState } from 'react';

interface Props {
  onNext: (dateOfBirth: string, age: number) => void;
}

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export default function AgeGate({ onNext }: Props) {
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Max date = today (can't be born in the future)
  const maxDate = new Date().toISOString().split('T')[0];
  // Min date = 100 years ago (reasonable upper bound)
  const minDate = new Date(new Date().setFullYear(new Date().getFullYear() - 100))
    .toISOString()
    .split('T')[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!dob) {
      setError('Please enter your date of birth.');
      return;
    }

    const dobDate = new Date(dob);
    const age = calculateAge(dobDate);

    if (isNaN(dobDate.getTime())) {
      setError('Please enter a valid date.');
      return;
    }

    if (age < 0 || age > 120) {
      setError('Please enter a valid date of birth.');
      return;
    }

    onNext(dob, age);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          What's your date of birth?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          We use this to ensure you have the right account type and access level.
          This information is kept private.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="dob-input" className="form-label">Date of Birth</label>
        <input
          id="dob-input"
          type="date"
          className="form-input"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          max={maxDate}
          min={minDate}
          required
          aria-describedby={error ? 'dob-error' : undefined}
        />
        {error && (
          <span id="dob-error" className="form-error">
            ⚠️ {error}
          </span>
        )}
        <span className="form-hint">
          Your exact date of birth — not just the year.
        </span>
      </div>

      <div style={{
        padding: '14px 16px', borderRadius: 'var(--radius-md)',
        background: 'rgba(46, 125, 50, 0.06)', border: '1px solid rgba(46, 125, 50, 0.2)',
        fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        🔒 <strong style={{ color: 'var(--brand-primary)' }}>Privacy note:</strong> Your date of
        birth is used only to verify your age and determine your account type. It is never
        displayed publicly.
      </div>

      <button
        id="dob-next-btn"
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%', padding: '14px' }}
        disabled={!dob}
      >
        Continue →
      </button>
    </form>
  );
}
