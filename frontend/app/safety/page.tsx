import type { Metadata } from 'next';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export const metadata: Metadata = {
  title: 'Safety Center — ChristianConnect',
  description: 'How to report, block, and get help. ChristianConnect is committed to your safety.',
};

export default function SafetyCenterPage() {
  return (
    <div className="page-container">
      <BackButton />

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          }}>🛡️</div>
          <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700 }}>Safety Center</h1>
        </div>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Your safety is our highest priority. ChristianConnect is designed with safeguards at every level.
          This page explains how to protect yourself and get help.
        </p>
      </div>

      {/* Crisis banner */}
      <div style={{
        padding: '20px 24px', borderRadius: 'var(--radius-lg)',
        background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.3)',
        marginBottom: '32px',
      }}>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#fca5a5', marginBottom: '8px' }}>
          🆘 If you are in immediate danger, call 911 now.
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Crisis support lines available 24/7:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          {CRISIS_RESOURCES.map((r) => (
            <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-overlay)', textDecoration: 'none',
                fontSize: '13px', color: 'var(--text-secondary)', transition: 'background 0.15s',
              }}>
              <span>{r.icon}</span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.contact}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Safety sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* How to report */}
        <Section id="reporting" icon="📋" title="How to Report Content">
          <p>Every message, profile, and prayer request has a <strong>Report</strong> button. Tap it to:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            <li>Select a reason (harassment, inappropriate content, spam, etc.)</li>
            <li>Add optional context to help our team understand the issue</li>
            <li>Submit — reports are anonymous and reviewed within 24 hours</li>
          </ul>
        </Section>

        {/* SOS button */}
        <Section id="sos" icon="🆘" title="The SOS Button">
          <p>
            Inside every chat, you'll find an <strong>SOS button</strong> (red shield icon). Tapping it
            performs three actions in one tap:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {['Files a report immediately', 'Blocks the other person from contacting you', 'Sends an urgent alert to our moderation team'].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)',
              }}>
                <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{i + 1}</span>
                <span style={{ fontSize: '14px' }}>{item}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '10px' }}>
            You can also block any user from their profile page without submitting a report.
          </p>
        </Section>

        {/* Account safety */}
        <Section id="accounts" icon="👤" title="Account Safety">
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Age-gated accounts:</strong> Users under 18 are placed on content-only accounts automatically — they cannot access chat, dating, Stories, or live features.</li>
            <li><strong>Statement of Faith gate:</strong> All accounts must affirm foundational Christian beliefs before accessing the community.</li>
            <li><strong>Dating is opposite-gender only.</strong></li>
            <li><strong>All messages are moderated</strong> before or immediately after delivery.</li>
            <li><strong>Verified adults only</strong> can create sub-groups or initiate 1:1 chats.</li>
          </ul>
        </Section>

        {/* Moderation */}
        <Section id="moderation" icon="⚖️" title="Our Moderation Approach">
          <p style={{ lineHeight: 1.7 }}>
            ChristianConnect uses a <strong>two-layer moderation system</strong>:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
            <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)' }}>
              <p style={{ fontWeight: 700, marginBottom: '6px' }}>⚡ Automated Moderation</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Automatic scanning systems check all text and images. Content violating our guidelines is flagged or removed immediately.</p>
            </div>
            <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)' }}>
              <p style={{ fontWeight: 700, marginBottom: '6px' }}>👥 Human Review</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Flagged content and all user reports are reviewed by a human moderator, typically within 24 hours.</p>
            </div>
          </div>
        </Section>

        {/* Contact */}
        <Section id="contact" icon="✉️" title="Contact Us">
          <p style={{ lineHeight: 1.7 }}>
            If you have a safety concern that is not addressed by the in-app reporting tools, please
            email our safety team at{' '}
            <a href="mailto:safety@christianconnect.app" style={{ color: 'var(--brand-primary)' }}>
              safety@christianconnect.app
            </a>.
          </p>
        </Section>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <Link href="/dashboard" className="btn btn-outline">← Back to Dashboard</Link>
      </div>
    </div>
  );
}

function Section({ id, icon, title, children }: {
  id: string; icon: string; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{title}</h2>
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        {children}
      </div>
    </section>
  );
}

const CRISIS_RESOURCES = [
  { name: '988 Lifeline', contact: 'Call or text 988', url: 'https://988lifeline.org', icon: '🆘' },
  { name: 'Crisis Text Line', contact: 'Text HOME to 741741', url: 'https://crisistextline.org', icon: '💬' },
  { name: 'RAINN', contact: '1-800-656-4673', url: 'https://rainn.org', icon: '🫂' },
  { name: 'DV Hotline', contact: '1-800-799-7233', url: 'https://thehotline.org', icon: '🏠' },
];
