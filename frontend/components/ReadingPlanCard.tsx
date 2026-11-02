'use client';

interface ActivePlan {
  id: string;
  name: string;
  currentDay: number;
  lengthDays: number;
  streak: number;
  longestStreak: number;
  isActive: boolean;
  focus: string;
}

interface Props {
  plan: ActivePlan;
  progressPercent: number;
}

export default function ReadingPlanCard({ plan, progressPercent }: Props) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--brand-primary)', background: 'rgba(99,102,241,0.1)',
            padding: '2px 8px', borderRadius: '99px', display: 'inline-block', marginBottom: '6px'
          }}>
            Active Reading Plan
          </span>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Day {plan.currentDay} of {plan.lengthDays}
          </p>
        </div>

        {/* Streak details */}
        <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-overlay)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-gold)', lineHeight: 1.1 }}>🔥 {plan.streak}</p>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Streak</p>
          </div>
          <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-secondary)', lineHeight: 1.1 }}>{plan.longestStreak}</p>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Best</p>
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Completion Progress</span>
          <span style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 700 }}>{progressPercent}%</span>
        </div>
        <div style={{ height: '8px', background: 'var(--bg-overlay)', borderRadius: '99px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          <div style={{
            height: '100%', width: `${progressPercent}%`, borderRadius: '99px',
            background: 'var(--gradient-brand)', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
      </div>
    </div>
  );
}
