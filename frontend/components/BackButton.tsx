'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export default function BackButton({
  href = '/dashboard',
  label = 'Back to Dashboard',
  className = '',
}: BackButtonProps) {
  const router = useRouter();

  return (
    <div style={{ marginBottom: '16px' }} className={className}>
      <button
        onClick={() => router.push(href)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#ffffff',
          color: '#2e7d32',
          border: '1px solid rgba(46, 125, 50, 0.25)',
          padding: '6px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2e7d32';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.color = '#2e7d32';
        }}
      >
        <span style={{ fontSize: '15px', lineHeight: 1 }}>←</span>
        <span>{label}</span>
      </button>
    </div>
  );
}
