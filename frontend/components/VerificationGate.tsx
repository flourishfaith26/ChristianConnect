'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

type VerificationStatus = 'not_started' | 'pending' | 'approved' | 'rejected' | 'requires_retry';

interface VerificationState {
  status: VerificationStatus;
  record: { provider: string; completedAt: string | null; rejectionReason: string | null } | null;
}

interface Props {
  children: React.ReactNode;
}

/**
 * VerificationGate — wraps any content that requires identity verification.
 * Shows appropriate UI for each verification state.
 * On 'approved', renders children.
 */
export default function VerificationGate({ children }: Props) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<VerificationState | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      const token = await getToken();
      const result = await apiRequest<VerificationState>('/api/verification/status', {
        token: token ?? undefined,
      });
      setState(result);
    } catch {
      setState({ status: 'not_started', record: null });
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Poll while pending
  useEffect(() => {
    if (state?.status !== 'pending') return;
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [state?.status, checkStatus]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔐</div>
        <p>Checking verification status...</p>
      </div>
    );
  }

  if (state?.status === 'approved') {
    return <>{children}</>;
  }

  // Not verified — show gate UI
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px',
    }}>
      <div className="card animate-fade-in" style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '48px 40px' }}>

        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: state?.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(46,125,50,0.1)',
          border: `2px solid ${state?.status === 'rejected' ? 'rgba(239,68,68,0.3)' : 'var(--border-default)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px', margin: '0 auto 24px',
        }}>
          {state?.status === 'pending' ? '⏳' : state?.status === 'rejected' ? '❌' : state?.status === 'requires_retry' ? '🔄' : '🛡️'}
        </div>

        {state?.status === 'pending' && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
              Verification in Progress
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
              Your identity verification is being processed. This usually takes just a few minutes.
              This page will automatically update when complete.
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px 20px', borderRadius: 'var(--radius-md)',
              background: 'rgba(46,125,50,0.08)', border: '1px solid var(--border-default)',
              fontSize: '13px', color: 'var(--brand-primary)',
            }}>
              <span className="animate-pulse-glow">●</span> Checking status automatically...
            </div>
          </>
        )}

        {state?.status === 'rejected' && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-danger)' }}>
              Verification Unsuccessful
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '8px' }}>
              We were unable to verify your identity.
            </p>
            {state.record?.rejectionReason && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Reason: {state.record.rejectionReason}
              </p>
            )}
            <button
              className="btn btn-primary"
              onClick={() => router.push('/dating/verify')}
            >
              Try Again
            </button>
          </>
        )}

        {state?.status === 'requires_retry' && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
              Verification Incomplete
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
              Your verification session expired before completion. Please start a new session.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => router.push('/dating/verify')}
            >
              Restart Verification
            </button>
          </>
        )}

        {(state?.status === 'not_started' || !state) && (
          <>
            <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '12px' }}>
              Identity Verification Required
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '8px' }}>
              To keep ChristianConnect safe, the Dating section requires identity and age verification.
              This is a <strong>one-time process</strong> that typically takes under 2 minutes.
            </p>
            <div style={{
              margin: '20px 0', padding: '16px',
              borderRadius: 'var(--radius-md)', background: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'left',
            }}>
              {[
                '✅ Confirm you are 18 or older',
                '✅ Verify your real identity',
                '✅ Protect everyone in the community',
              ].map(item => (
                <div key={item} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '4px 0' }}>
                  {item}
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={() => router.push('/dating/verify')}
            >
              🛡️ Verify My Identity
            </button>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', lineHeight: 1.6 }}>
              Powered by Persona. Your ID is processed securely and never stored on our servers.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
