'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface AuthGateTarget {
  title: string;
  icon: string;
  route: string;
  desc?: string;
}

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  target?: AuthGateTarget | null;
}

export default function AuthGateModal({
  isOpen,
  onClose,
  target,
}: AuthGateModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetRoute = target?.route || '/dashboard';
  const targetTitle = target?.title || 'Christian Community Sections';
  const targetIcon = target?.icon || '✝️';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(10, 25, 12, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
    >
      <div
        className="glass-strong"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(46, 125, 50, 0.15)',
          border: '1px solid rgba(46, 125, 50, 0.25)',
          textAlign: 'center',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--bg-elevated, #f1f5f9)',
            border: 'none',
            fontSize: '18px',
            color: 'var(--text-secondary, #64748b)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Shield Logo & Target Icon Badge */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '18px' }}>
          <div
            style={{
              position: 'relative',
              width: '76px',
              height: '76px',
              margin: '0 auto',
              filter: 'drop-shadow(0 6px 16px rgba(46, 125, 50, 0.3))',
            }}
          >
            <Image
              src="/logo.png"
              alt="ChristianConnect Shield"
              width={152}
              height={152}
              priority
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          {target?.icon && (
            <div
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-8px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '2px solid var(--brand-primary, #2e7d32)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              {targetIcon}
            </div>
          )}
        </div>

        {/* Target Feature Pill */}
        <div style={{ marginBottom: '12px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: 'rgba(46, 125, 50, 0.1)',
              border: '1px solid rgba(46, 125, 50, 0.25)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--brand-primary, #2e7d32)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <span>🔒 Member Access Required</span>
          </span>
        </div>

        {/* Headline */}
        <h2
          id="auth-gate-title"
          style={{
            fontSize: '24px',
            fontWeight: 800,
            fontFamily: 'var(--font-serif, Georgia, serif)',
            color: 'var(--text-primary, #1e293b)',
            lineHeight: 1.25,
            margin: '0 0 10px 0',
          }}
        >
          Sign Up to Access <span className="gradient-text">{targetTitle}</span>
        </h2>

        {/* Inspiring Subtitle */}
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary, #475569)',
            lineHeight: 1.6,
            margin: '0 0 20px 0',
          }}
        >
          To enjoy the full experience, connect with fellow believers, join active study circles, and keep our community safe and Christ-centered, please sign up or log in.
        </p>

        {/* Platform Benefits Mini Strip */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(46,125,50,0.06) 0%, rgba(212,175,55,0.06) 100%)',
            border: '1px solid rgba(46, 125, 50, 0.15)',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '24px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--text-primary, #334155)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
            <span>100% Free Core Membership · No Credit Card</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
            <span>Live Prayer Intercession & Scripture Study</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
            <span>Safe, Minor-Protected, Faith-Moderated Sanctuary</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link
            href={`/sign-up?redirect_url=${encodeURIComponent(targetRoute)}`}
            className="btn btn-primary btn-lg glow"
            style={{
              width: '100%',
              fontSize: '16px',
              padding: '14px',
              borderRadius: '12px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <span>Create Free Account & Continue</span>
            <span>✨</span>
          </Link>

          <Link
            href={`/sign-in?redirect_url=${encodeURIComponent(targetRoute)}`}
            className="btn btn-outline btn-lg"
            style={{
              width: '100%',
              fontSize: '15px',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              background: '#ffffff',
            }}
          >
            <span>Log In to Existing Account</span>
            <span>→</span>
          </Link>
        </div>

        {/* Dismiss Text */}
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '12px',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px 8px',
            }}
          >
            Continue browsing landing page
          </button>
        </div>

      </div>
    </div>
  );
}
