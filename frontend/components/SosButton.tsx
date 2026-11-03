'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

interface Props {
  targetType: 'message' | 'user' | 'group';
  targetId: string;
  /** The ID of the user to also block */
  targetUserId?: string;
  className?: string;
}

type Step = 'idle' | 'confirm' | 'submitting' | 'done' | 'error';

export default function SosButton({ targetType, targetId, targetUserId, className = '' }: Props) {
  const { getToken } = useAuth();
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSos() {
    setStep('submitting');
    try {
      const token = await getToken();
      await apiRequest('/api/safety/sos', {
        method: 'POST', token: token ?? undefined,
        body: JSON.stringify({ targetType, targetId, targetUserId }),
      });
      setStep('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'SOS failed');
      setStep('error');
    }
  }

  return (
    <>
      <button
        id={`sos-btn-${targetType}-${targetId}`}
        type="button"
        onClick={() => setStep('confirm')}
        className={className}
        title="SOS — Report, Block, and Alert Moderator"
        aria-label="SOS safety button"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '6px 10px', borderRadius: 'var(--radius-md)',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        🆘 SOS
      </button>

      {step !== 'idle' && (
        <div
          role="dialog" aria-modal="true" aria-labelledby="sos-modal-title"
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget && step !== 'submitting') setStep('idle'); }}
        >
          <div className="glass-strong animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>

            {step === 'confirm' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🆘</div>
                  <h2 id="sos-modal-title" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#fca5a5' }}>
                    SOS — Safety Alert
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    This will <strong>immediately</strong>:
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  {[
                    '📋 File a priority report with our moderation team',
                    '🚫 Block this user from contacting you',
                    '🔔 Send an urgent alert to a human moderator',
                  ].map((item) => (
                    <div key={item} style={{
                      padding: '10px 14px', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-overlay)', fontSize: '14px',
                    }}>{item}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-outline"
                    onClick={() => setStep('idle')} style={{ flex: '0 0 auto' }}>Cancel</button>
                  <button
                    id="sos-confirm-btn" type="button"
                    onClick={handleSos}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                      background: 'rgba(239,68,68,0.8)', border: 'none', color: 'white',
                      fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                    }}
                  >
                    🆘 Confirm SOS
                  </button>
                </div>
              </>
            )}

            {step === 'submitting' && (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                <p style={{ fontWeight: 600 }}>Sending SOS alert...</p>
              </div>
            )}

            {step === 'done' && (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>SOS Submitted</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                  The user has been blocked and our moderation team has been alerted.
                  You are safe — they can no longer contact you.
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  If you are in immediate danger, please call 911 or text 988.
                </p>
                <button type="button" className="btn btn-primary" style={{ width: '100%' }}
                  onClick={() => setStep('idle')}>Close</button>
              </div>
            )}

            {step === 'error' && (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                <p style={{ color: '#fca5a5', marginBottom: '16px' }}>{errorMsg}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  If this keeps happening, please email safety@christianconnect.app
                </p>
                <button type="button" className="btn btn-outline" onClick={() => setStep('idle')}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
