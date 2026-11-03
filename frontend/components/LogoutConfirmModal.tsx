'use client';

import { useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoutConfirmModal({ isOpen, onClose }: LogoutConfirmModalProps) {
  const { signOut } = useClerk();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isOpen) return null;

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      router.push('/');
    } catch {
      router.push('/');
    } finally {
      setLoggingOut(false);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loggingOut) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '28px 24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(46, 125, 50, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header Logo */}
        <div style={{ marginBottom: '16px' }}>
          <Logo size="md" />
        </div>

        {/* Warning Icon Badge */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            marginBottom: '16px',
            border: '2px solid #fca5a5',
          }}
        >
          🚪
        </div>

        {/* Title & Description */}
        <h3
          id="logout-modal-title"
          style={{
            fontSize: '19px',
            fontWeight: 800,
            color: '#1e293b',
            margin: '0 0 8px 0',
          }}
        >
          Are you sure you want to log out?
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: '#64748b',
            lineHeight: 1.5,
            margin: '0 0 24px 0',
          }}
        >
          You will need to sign back in to access your faith feed, daily devotionals, prayer groups, and fellowship chats.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loggingOut}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#334155',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmLogout}
            disabled={loggingOut}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            {loggingOut ? 'Logging Out...' : 'Yes, Log Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
