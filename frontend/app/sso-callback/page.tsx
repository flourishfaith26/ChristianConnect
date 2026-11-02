'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  return (
    <div className="page-center" style={{ background: 'var(--bg-base)', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Completing sign in...
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
