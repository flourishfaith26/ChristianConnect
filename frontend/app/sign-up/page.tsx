'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs/legacy';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      setError('Please fill in all fields (First Name, Last Name, Email, Password).');
      return;
    }

    if (!isLoaded || !signUp) {
      setError('Sign-up is not ready yet. Please try again in a moment.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (awaitingEmailVerification) {
        const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });
        if (result.status === 'complete' && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          router.push('/onboarding');
          return;
        }

        setError('Email verification is not complete. Check the code and try again.');
        return;
      }

      const result = await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.push('/onboarding');
        return;
      }

      if (result.unverifiedFields.includes('email_address')) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setAwaitingEmailVerification(true);
        return;
      }

      setError('Account setup is incomplete. Please check your sign-up details and try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    if (!isLoaded || !signUp) {
      setError('Sign-up is not ready yet. Please try again in a moment.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/onboarding',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start Google sign-up. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="page-center" style={{ background: 'var(--bg-base)', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      <div className="glass-strong animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '36px', borderRadius: 'var(--radius-lg)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', marginBottom: '28px' }}>
          <Logo size="lg" withLink href="/" showText={false} />
          <h1 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-serif)', margin: 0 }}>
            Create Your Free Account
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {awaitingEmailVerification
              ? `Enter the verification code sent to ${email}`
              : 'Enter your basic details to start your faith journey'}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171', fontSize: '13px', marginBottom: '20px',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {awaitingEmailVerification ? (
            <div>
              <label htmlFor="verification-code" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Email verification code
              </label>
              <input
                id="verification-code"
                type="text"
                className="form-input"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%' }}
              />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '8px', width: '100%' }} disabled={loading}>
            {loading
              ? awaitingEmailVerification ? 'Verifying Email...' : 'Creating Account...'
              : awaitingEmailVerification ? 'Verify Email' : 'Continue to Essential Questions →'}
          </button>
        </form>

        {/* Divider */}
        {!awaitingEmailVerification && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>
        )}

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading || awaitingEmailVerification}
          className="btn"
          style={{
            width: '100%',
            background: '#ffffff',
            color: '#1f2937',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontWeight: 600,
            padding: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Sign In with Google
        </button>

        {/* Footer Link */}
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', margin: '24px 0 0 0' }}>
          Already have an account?{' '}
          <Link href="/sign-in" style={{ color: 'var(--brand-primary)', fontWeight: 700, textDecoration: 'none' }}>
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
}
