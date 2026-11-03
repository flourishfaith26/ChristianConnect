'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const FEATURE_INFOS: Record<string, { title: string; desc: string; icon: string; phase: string }> = {
  // dating has been shipped — redirect handled below
  accountability: {
    title: 'Accountability Partners',
    desc: 'Find same-gender partners to walk together in daily faith, hold each other accountable, share struggles privately, and encourage spiritual growth.',
    icon: '🛡️',
    phase: 'Phase 2 MVP',
  },
  mentorship: {
    title: 'New Convert Mentorship',
    desc: 'Connecting new believers with experienced, mature mentors in their local area or denomination for guidance, discipleship, and prayer.',
    icon: '🌱',
    phase: 'Phase 3',
  },
  apologetics: {
    title: 'Apologetics Forums',
    desc: 'Engage in thoughtful, respectful discussion defending and explaining Christian doctrine. Supported by resources, articles, and expert guides.',
    icon: '⚔️',
    phase: 'Phase 3',
  },
  'faith-chat': {
    title: 'Scripture Q&A',
    desc: 'Ask complex theological questions and get answers grounded in sound Christian theology, with scripture citations and indexed references.',
    icon: '📖',
    phase: 'Phase 2 MVP',
  },
  stories: {
    title: 'Stories',
    desc: 'Share short, 24-hour expiring moments of your daily walk, church life, scripture notes, and prayer requests with your trusted circles.',
    icon: '📸',
    phase: 'Phase 2 MVP',
  },
};

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const featureKey = searchParams.get('feature') ?? 'stories';

  // Features shipped — redirect to live pages
  if (featureKey === 'dating') {
    if (typeof window !== 'undefined') window.location.replace('/dating');
    return <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>Redirecting to Dating...</div>;
  }
  if (featureKey === 'stories') {
    if (typeof window !== 'undefined') window.location.replace('/stories');
    return <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>Redirecting to Stories...</div>;
  }

  const info = FEATURE_INFOS[featureKey] ?? FEATURE_INFOS.stories;

  return (
    <div className="glass animate-fade-in" style={{ width: '100%', maxWidth: '540px', padding: '40px', textAlign: 'center' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '16px',
        background: 'var(--brand-primary)', margin: '0 auto 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '32px',
      }}>{info.icon}</div>

      <span style={{
        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--brand-gold)', background: 'rgba(245,158,11,0.1)',
        padding: '4px 12px', borderRadius: '99px', display: 'inline-block', marginBottom: '16px',
      }}>
        Coming in {info.phase}
      </span>

      <h1 style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', fontWeight: 700, marginBottom: '12px' }}>
        {info.title}
      </h1>

      <p style={{
        fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7,
        marginBottom: '32px', padding: '0 12px',
      }}>
        {info.desc}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button type="button" className="btn btn-primary" onClick={() => window.history.back()}>
          ← Go Back
        </button>
        <Link href="/dashboard" className="btn btn-outline">
          Dashboard Home
        </Link>
      </div>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <Suspense fallback={
        <div className="glass" style={{ width: '100%', maxWidth: '540px', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--text-muted)' }}>Loading...</div>
        </div>
      }>
        <ComingSoonContent />
      </Suspense>
    </div>
  );
}
