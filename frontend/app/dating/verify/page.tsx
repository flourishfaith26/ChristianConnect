'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

type VerificationStatus = 'not_started' | 'pending' | 'approved' | 'rejected' | 'requires_retry';

export default function DatingVerifyPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus>('not_started');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [isDevStub, setIsDevStub] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const token = await getToken();
      const result = await apiRequest<{ status: VerificationStatus }>('/api/verification/status', {
        token: token ?? undefined,
      });
      setStatus(result.status);
      if (result.status === 'approved') {
        router.replace('/dating/profile');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Poll while pending
  useEffect(() => {
    if (status !== 'pending') return;
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, [status, checkStatus]);

  async function startVerification() {
    setStarting(true);
    setError(null);
    try {
      const token = await getToken();
      const result = await apiRequest<{ inquiryId: string; hostedUrl: string; isDevStub: boolean }>(
        '/api/verification/start',
        { method: 'POST', token: token ?? undefined }
      );
      setHostedUrl(result.hostedUrl);
      setIsDevStub(result.isDevStub);
      setStatus('pending');

      if (!result.isDevStub) {
        // Open Persona hosted flow in a new tab
        window.open(result.hostedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start verification. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  async function handleDevApprove() {
    setApproving(true);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest('/api/verification/dev-approve', {
        method: 'POST',
        token: token ?? undefined,
      });
      setStatus('approved');
      router.replace('/dating/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dev approve failed');
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔐</div>
          <p>Loading verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card animate-fade-in" style={{ maxWidth: '540px', width: '100%', padding: '48px 40px', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: status === 'approved' ? 'rgba(46,125,50,0.1)' : status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(46,125,50,0.1)',
          border: `2px solid ${status === 'approved' ? 'var(--brand-primary)' : status === 'rejected' ? 'var(--color-danger)' : 'var(--border-default)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', margin: '0 auto 28px',
        }}>
          {status === 'pending' ? '⏳' : status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '🛡️'}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '26px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '12px' }}>
          {status === 'pending' ? 'Verification in Progress' :
           status === 'approved' ? 'Identity Verified!' :
           status === 'rejected' ? 'Verification Failed' :
           status === 'requires_retry' ? 'Please Retry' :
           'Verify Your Identity'}
        </h1>

        {/* Description */}
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px' }}>
          {status === 'pending'
            ? 'Your verification is being processed. Please complete the form in the new tab that opened. This page updates automatically.'
            : status === 'approved'
            ? 'You are verified! Redirecting to your dating profile setup...'
            : status === 'rejected'
            ? 'We could not verify your identity. You may try again with a clearer photo ID.'
            : status === 'requires_retry'
            ? 'Your verification session expired. Please start a new session.'
            : 'To protect everyone on ChristianConnect, we require identity verification before accessing the Dating section. This is a one-time process.'}
        </p>

        {error && (
          <div className="form-error" style={{ marginBottom: '20px', justifyContent: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        {/* What to expect callout (only on not_started) */}
        {(status === 'not_started' || status === 'requires_retry') && (
          <div style={{
            textAlign: 'left', padding: '20px',
            borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)', marginBottom: '24px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '12px' }}>
              What you&apos;ll need:
            </p>
            {[
              '📷 A government-issued photo ID (passport, driver\'s licence, national ID)',
              '🤳 A short selfie video or photo for liveness check',
              '⏱️ About 2 minutes of your time',
            ].map(item => (
              <div key={item} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '4px 0', lineHeight: 1.5 }}>
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(status === 'not_started' || status === 'requires_retry' || status === 'rejected') && (
            <button
              id="start-verification-btn"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={startVerification}
              disabled={starting}
            >
              {starting ? 'Starting...' : '🛡️ Start Identity Verification'}
            </button>
          )}

          {status === 'pending' && hostedUrl && !isDevStub && (
            <a
              href={hostedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              ↗ Reopen Verification Form
            </a>
          )}

          {/* Dev stub only: shown in development without Persona key */}
          {status === 'pending' && isDevStub && (
            <div style={{
              padding: '16px', borderRadius: 'var(--radius-md)',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
              fontSize: '13px', color: '#fcd34d',
            }}>
              <p style={{ fontWeight: 700, marginBottom: '8px' }}>🛠️ Development Mode — No Persona Key</p>
              <p style={{ marginBottom: '12px', lineHeight: 1.5 }}>
                In production, this opens a real Persona verification form. For local testing, click below to instantly approve your account.
              </p>
              <button
                id="dev-approve-btn"
                className="btn btn-gold btn-sm"
                style={{ width: '100%' }}
                onClick={handleDevApprove}
                disabled={approving}
              >
                {approving ? 'Approving...' : '⚡ Dev: Approve Instantly'}
              </button>
            </div>
          )}

          <a href="/dashboard" style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>
            ← Back to Dashboard
          </a>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px', lineHeight: 1.6 }}>
          Your identity data is processed securely by Persona and is never stored on ChristianConnect servers.
          Verification is required by our Terms of Service for all Dating section users.
        </p>
      </div>
    </div>
  );
}
