'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

interface Props {
  targetType: 'message' | 'user' | 'group';
  targetId: string;
  /** Optional label — defaults to "Report" */
  label?: string;
  /** Optional custom class */
  className?: string;
}

const REPORT_REASONS = [
  'Inappropriate or offensive content',
  'Harassment or bullying',
  'Spam or misleading content',
  'Sexual or explicit content',
  'Hate speech or discrimination',
  'Dangerous or harmful content',
  'Impersonation',
  'Other (specify below)',
];

type Step = 'idle' | 'open' | 'submitting' | 'success' | 'error';

export default function ReportButton({ targetType, targetId, label = 'Report', className = '' }: Props) {
  const { getToken } = useAuth();
  const [step, setStep] = useState<Step>('idle');
  const [reason, setReason] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  function openModal() { setStep('open'); }
  function closeModal() {
    setStep('idle');
    setReason('');
    setAdditionalContext('');
    setErrorMsg('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!reason) {
      setErrorMsg('Please select a reason for your report.');
      return;
    }

    setStep('submitting');
    setErrorMsg('');

    try {
      const token = await getToken();
      await apiRequest('/api/reports', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ targetType, targetId, reason, additionalContext }),
      });
      setStep('success');
      // Auto-close after 3 seconds
      setTimeout(closeModal, 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit report.');
      setStep('error');
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        id={`report-btn-${targetType}-${targetId}`}
        type="button"
        onClick={openModal}
        className={`btn btn-ghost btn-sm ${className}`}
        aria-label={`Report this ${targetType}`}
        title={`Report this ${targetType}`}
        style={{
          color: '#94a3b8',
          fontSize: '11px',
          gap: '3px',
          padding: '2px 6px',
          borderRadius: '6px',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        <span>{label}</span>
      </button>

      {/* Modal backdrop */}
      {step !== 'idle' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="glass-strong animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>

            {step === 'success' ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                  Report Submitted
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Thank you. Our moderation team will review this shortly. We take all reports seriously.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 id="report-modal-title" style={{ fontSize: '20px', fontWeight: 700 }}>
                    Report {targetType.charAt(0).toUpperCase() + targetType.slice(1)}
                  </h2>
                  <button
                    type="button" onClick={closeModal}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 8px', fontSize: '18px' }}
                    aria-label="Close report dialog"
                  >
                    ✕
                  </button>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-8px' }}>
                  Reports are anonymous. Our team reviews every report, usually within 24 hours.
                </p>

                {/* Reason selection */}
                <div className="form-group">
                  <label className="form-label">Reason for report</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {REPORT_REASONS.map((r) => (
                      <label
                        key={r}
                        htmlFor={`report-reason-${r.slice(0, 10).replace(/\s/g, '-')}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', borderRadius: 'var(--radius-md)',
                          border: reason === r ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                          background: reason === r ? 'rgba(99,102,241,0.08)' : 'var(--bg-overlay)',
                          cursor: 'pointer', transition: 'all 0.15s ease',
                          fontSize: '14px', color: reason === r ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        <input
                          id={`report-reason-${r.slice(0, 10).replace(/\s/g, '-')}`}
                          type="radio"
                          name="report-reason"
                          value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          style={{ accentColor: 'var(--brand-primary)' }}
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional context */}
                <div className="form-group">
                  <label htmlFor="report-context" className="form-label">Additional context (optional)</label>
                  <textarea
                    id="report-context"
                    className="form-input"
                    rows={3}
                    placeholder="Provide any additional details that might help our team..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    maxLength={500}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {errorMsg && <div className="form-error">⚠️ {errorMsg}</div>}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={closeModal} className="btn btn-outline" style={{ flex: '0 0 auto' }}>
                    Cancel
                  </button>
                  <button
                    id="report-submit-btn"
                    type="submit"
                    className="btn btn-danger"
                    style={{ flex: 1 }}
                    disabled={!reason || step === 'submitting'}
                  >
                    {step === 'submitting' ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
