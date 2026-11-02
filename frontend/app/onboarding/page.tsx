'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import AgeGate from '@/components/AgeGate';
import StatementOfFaithGate from '@/components/StatementOfFaithGate';
import ProfileSetup from '@/components/ProfileSetup';
import ParentalConsentStep from '@/components/ParentalConsentStep';
import { apiRequest } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface OnboardingData {
  dateOfBirth: string;          // ISO date string
  age: number;
  statementOfFaithAccepted: boolean;
  displayName: string;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  parentEmail?: string;
}

const STEPS = [
  { id: 1, label: 'Date of Birth' },
  { id: 2, label: 'Statement of Faith' },
  { id: 3, label: 'Your Profile' },
  { id: 4, label: 'Final Step' },   // parental consent or review
];

// ─── Page Component ───────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Partial<OnboardingData>>({});

  const totalSteps = data.age !== undefined && data.age < 18 ? 4 : 3;

  const updateData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  function goNext() {
    setError(null);
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    setStep((s) => s - 1);
  }

  async function handleComplete(parentEmail?: string) {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();

      await apiRequest('/api/users/complete-onboarding', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          displayName: data.displayName,
          statementOfFaithAccepted: true,
          parentEmail: parentEmail ?? data.parentEmail,
        }),
      });

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-center" style={{
      background: 'var(--bg-base)',
      flexDirection: 'column',
      gap: '32px',
    }}>
      {/* Background orbs */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46,125,50,0.06) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '0%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
        }} />
      </div>

      {/* Card */}
      <div className="glass-strong animate-fade-in" style={{
        width: '100%', maxWidth: '560px',
        padding: '40px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'var(--brand-primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 'bold',
          }}>✝</div>
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>
            Christian<span className="gradient-text">Connect</span>
          </span>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} totalSteps={totalSteps} steps={STEPS} />

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-md)',
            background: 'rgba(211, 47, 47, 0.08)', border: '1px solid rgba(211, 47, 47, 0.3)',
            color: 'var(--color-danger)', fontSize: '14px', marginTop: '16px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Step Content */}
        <div style={{ marginTop: '32px' }}>
          {step === 1 && (
            <AgeGate
              onNext={(dob, age) => {
                updateData({ dateOfBirth: dob, age });
                goNext();
              }}
            />
          )}

          {step === 2 && (
            <StatementOfFaithGate
              onAccepted={() => {
                updateData({ statementOfFaithAccepted: true });
                goNext();
              }}
              onBack={goBack}
            />
          )}

          {step === 3 && (
            <ProfileSetup
              defaultName=""
              onNext={(displayName, gender) => {
                updateData({ displayName, gender });
                if (data.age !== undefined && data.age < 18) {
                  goNext(); // go to parental consent
                } else {
                  handleComplete(); // complete onboarding for adults
                }
              }}
              onBack={goBack}
              isSubmitting={isSubmitting}
              isMinor={data.age !== undefined && data.age < 18}
            />
          )}

          {step === 4 && data.age !== undefined && data.age < 18 && (
            <ParentalConsentStep
              displayName={data.displayName ?? ''}
              onSubmit={(parentEmail) => handleComplete(parentEmail)}
              onBack={goBack}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step Indicator Component ─────────────────────────────────────────────────
function StepIndicator({
  currentStep,
  totalSteps,
  steps,
}: {
  currentStep: number;
  totalSteps: number;
  steps: { id: number; label: string }[];
}) {
  const visibleSteps = steps.slice(0, totalSteps);

  return (
    <div>
      <p style={{
        fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)',
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px',
      }}>
        Step {currentStep} of {totalSteps}
      </p>
      <div className="step-indicator">
        {visibleSteps.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < visibleSteps.length - 1 ? 1 : undefined }}>
            <div
              className={`step-dot ${
                currentStep > s.id
                  ? 'step-dot-complete'
                  : currentStep === s.id
                  ? 'step-dot-active'
                  : 'step-dot-inactive'
              }`}
              title={s.label}
            >
              {currentStep > s.id ? '✓' : s.id}
            </div>
            {i < visibleSteps.length - 1 && (
              <div
                className={`step-line ${currentStep > s.id ? 'step-line-complete' : ''}`}
              />
            )}
          </div>
        ))}
      </div>
      <p style={{ fontSize: '15px', color: 'var(--text-primary)', marginTop: '12px', fontWeight: 700 }}>
        {steps[currentStep - 1]?.label}
      </p>
    </div>
  );
}
