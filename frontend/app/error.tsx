'use client';

import { useEffect } from 'react';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  const isClerkError =
    error?.message?.includes('Failed to load Clerk JS') ||
    error?.message?.includes('Clerk') ||
    (error as any)?.code === 'failed_to_load_clerk_js';

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '600px', margin: '4rem auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        {isClerkError ? '🛡️' : '⚠️'}
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>
        {isClerkError ? 'Authentication Service Unavailable' : 'Something went wrong'}
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
        {isClerkError
          ? 'Unable to connect to Clerk authentication services. This is commonly caused by ad-blockers, privacy extensions (such as uBlock Origin or Brave Shields), or network restrictions.'
          : error?.message || 'An unexpected error occurred.'}
      </p>
      {isClerkError && (
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>
          Tip: Disable ad-blockers for localhost:3000 to enable authentication features.
        </p>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#4f46e5',
            color: '#fff',
            border: 'none',
            padding: '0.6rem 1.25rem',
            borderRadius: '0.375rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => (window.location.href = '/')}
          style={{
            backgroundColor: '#f1f5f9',
            color: '#334155',
            border: '1px solid #cbd5e1',
            padding: '0.6rem 1.25rem',
            borderRadius: '0.375rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
