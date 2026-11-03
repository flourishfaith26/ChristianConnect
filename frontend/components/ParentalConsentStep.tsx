'use client';

import { useState } from 'react';

interface Props {
  displayName: string;
  isSubmitting: boolean;
  onSubmit: (parentEmail: string) => void;
  onBack: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ParentalConsentStep({ displayName, isSubmitting, onSubmit, onBack }: Props) {
  const [parentEmail, setParentEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!EMAIL_REGEX.test(parentEmail)) {
      setError('Please enter a valid email address for your parent or guardian.');
      return;
    }

    if (parentEmail !== confirmEmail) {
      setError('Email addresses do not match. Please check and try again.');
      return;
    }

    onSubmit(parentEmail);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          Parental Consent Required
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          Because you're under 18, we need your parent or guardian's permission before
          you can access ChristianConnect.
        </p>
      </div>

      {/* What happens next */}
      <div style={{
        padding: '18px', borderRadius: 'var(--radius-lg)',
        background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-subtle)',
      }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          📧 Here's what will happen:
        </p>
        <ol style={{
          paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px',
          fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
        }}>
          <li>We'll send an email to your parent or guardian explaining ChristianConnect and your account's restrictions.</li>
          <li>They'll click a link to give consent.</li>
          <li>Your content-only account will be activated. No chat, no dating, no Stories.</li>
        </ol>
      </div>

      {/* What their account can access */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {displayName ? `${displayName}'s` : 'Your'} account will include:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {ACCESSIBLE.map((item) => (
            <div key={item} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
              fontSize: '13px', color: '#6ee7b7',
            }}>
              ✓ {item}
            </div>
          ))}
          {RESTRICTED.map((item) => (
            <div key={item} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)',
              fontSize: '13px', color: '#fca5a5',
            }}>
              ✕ {item}
            </div>
          ))}
        </div>
      </div>

      <div className="divider" />

      <div className="form-group">
        <label htmlFor="parent-email-input" className="form-label">
          Parent / Guardian Email
        </label>
        <input
          id="parent-email-input"
          type="email"
          className="form-input"
          placeholder="parent@example.com"
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="parent-email-confirm" className="form-label">
          Confirm Email
        </label>
        <input
          id="parent-email-confirm"
          type="email"
          className="form-input"
          placeholder="Confirm parent's email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      {error && <div className="form-error">⚠️ {error}</div>}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          id="consent-back-btn"
          type="button"
          onClick={onBack}
          className="btn btn-outline"
          style={{ flex: '0 0 auto' }}
          disabled={isSubmitting}
        >
          ← Back
        </button>
        <button
          id="consent-submit-btn"
          type="submit"
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={!parentEmail || !confirmEmail || isSubmitting}
        >
          {isSubmitting ? 'Sending consent request...' : 'Send Consent Request →'}
        </button>
      </div>
    </form>
  );
}

const ACCESSIBLE = ['Bible Reading Plans', 'Devotionals', 'Scripture Explanations', 'Faith Chat'];
const RESTRICTED = ['Chat & Messaging', 'Stories', 'Dating', 'Live Features'];
