'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import ReadingPlanCard from '@/components/ReadingPlanCard';
import BackButton from '@/components/BackButton';

interface ReadingPlanTemplate {
  id: string; name: string; days: number; focus: string; description: string;
}
interface ActivePlan {
  id: string; name: string; currentDay: number; lengthDays: number; streak: number;
  longestStreak: number; isActive: boolean; focus: string;
}
interface Passage {
  reference: string; content: string; translation: string;
}
interface TodayDay { passageLabel: string; passageRef: string; isCompleted: boolean; notes: string | null; }

export default function ReadingPlansPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<'today' | 'choose'>('today');
  const [plan, setPlan] = useState<ActivePlan | null>(null);
  const [today, setToday] = useState<TodayDay | null>(null);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [progress, setProgress] = useState(0);
  const [templates, setTemplates] = useState<ReadingPlanTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [startingPlan, setStartingPlan] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  async function loadPlan() {
    const token = await getToken();
    try {
      const data = await apiRequest<{ plan: ActivePlan | null; today: TodayDay; progressPercent: number }>(
        '/api/reading-plans/me', { token: token ?? undefined }
      );
      setPlan(data.plan);
      setToday(data.today ?? null);
      setProgress(data.progressPercent ?? 0);

      if (data.plan && data.today && !data.today.isCompleted) {
        try {
          const passageData = await apiRequest<{ passage: Passage }>('/api/reading-plans/me/passage', { token: token ?? undefined });
          setPassage(passageData.passage);
        } catch { /* API.Bible key may not be set */ }
      }
    } catch { /* no plan */ }
    setLoading(false);
  }

  useEffect(() => { loadPlan(); }, []);

  useEffect(() => {
    if (tab === 'choose') {
      (async () => {
        const token = await getToken();
        const data = await apiRequest<ReadingPlanTemplate[]>('/api/reading-plans/templates', { token: token ?? undefined });
        setTemplates(data);
      })();
    }
  }, [tab, getToken]);

  async function startPlan(templateId: string) {
    setStartingPlan(templateId);
    const token = await getToken();
    await apiRequest('/api/reading-plans', {
      method: 'POST', token: token ?? undefined,
      body: JSON.stringify({ templateId }),
    });
    setTab('today');
    await loadPlan();
    setStartingPlan(null);
  }

  async function markComplete() {
    setMarkingComplete(true);
    const token = await getToken();
    const result = await apiRequest<{ success: boolean; streak: number; isComplete: boolean }>(
      '/api/reading-plans/me/progress', { method: 'POST', token: token ?? undefined, body: '{}' }
    );
    setMarkingComplete(false);
    if (result.isComplete) { setJustCompleted(true); return; }
    await loadPlan();
  }

  return (
    <div className="page-container">
      <BackButton />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, marginBottom: '6px' }}>📅 Bible Reading Plans</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Follow Scripture daily. Build your streak.</p>
        </div>
        {plan && <button id="change-plan-btn" type="button" className="btn btn-outline btn-sm"
          onClick={() => setTab('choose')}>Change Plan</button>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '28px' }}>
        {(['today', 'choose'] as const).map((t) => (
          <button key={t} id={`plan-tab-${t}`} type="button" onClick={() => setTab(t)} style={{
            padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            background: 'transparent', border: 'none',
            color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: tab === t ? '2px solid var(--brand-primary)' : '2px solid transparent',
          }}>
            {t === 'today' ? "📖 Today's Reading" : '🗺️ Choose a Plan'}
          </button>
        ))}
      </div>

      {/* Today's Reading */}
      {tab === 'today' && (
        <div>
          {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>Loading...</div>}

          {justCompleted && (
            <div className="glass animate-fade-in" style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', fontWeight: 700, marginBottom: '8px' }}>Plan Complete!</h2>
              <p style={{ color: 'var(--text-secondary)' }}>You've finished your reading plan. Glory to God!</p>
              <button type="button" className="btn btn-primary" style={{ marginTop: '20px' }}
                onClick={() => { setJustCompleted(false); setTab('choose'); }}>
                Start a New Plan
              </button>
            </div>
          )}

          {!loading && !plan && !justCompleted && (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📖</div>
              <p style={{ marginBottom: '20px' }}>No active reading plan. Choose one to get started!</p>
              <button id="start-plan-btn" type="button" className="btn btn-primary" onClick={() => setTab('choose')}>
                Choose a Plan →
              </button>
            </div>
          )}

          {!loading && plan && today && !justCompleted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ReadingPlanCard plan={plan} progressPercent={progress} />

              {/* Today's passage */}
              <div className="glass" style={{ padding: '28px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Today — Day {plan.currentDay}
                </p>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>{today.passageLabel}</h2>

                {passage ? (
                  <div style={{
                    fontSize: '15px', lineHeight: 1.8, color: 'var(--text-secondary)',
                    maxHeight: '400px', overflow: 'auto',
                    padding: '16px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)',
                    marginBottom: '16px', fontFamily: 'var(--font-serif)',
                  }}
                    dangerouslySetInnerHTML={{ __html: passage.content }}
                  />
                ) : (
                  <div style={{
                    padding: '16px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)',
                    marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)',
                  }}>
                    📖 Configure <code>API_BIBLE_KEY</code> in your backend .env to load Scripture text here.
                    <br />Passage: <strong>{today.passageRef}</strong>
                  </div>
                )}

                {today.isCompleted ? (
                  <div style={{
                    padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    color: '#6ee7b7', fontSize: '14px', fontWeight: 600, textAlign: 'center',
                  }}>
                    ✅ Completed today! See you tomorrow.
                  </div>
                ) : (
                  <button
                    id="mark-complete-btn" type="button"
                    className="btn btn-primary" style={{ width: '100%', padding: '14px' }}
                    onClick={markComplete} disabled={markingComplete}
                  >
                    {markingComplete ? 'Marking...' : '✓ Mark Today Complete'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Choose a Plan */}
      {tab === 'choose' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--brand-gold)', background: 'rgba(245,158,11,0.1)',
                  padding: '2px 8px', borderRadius: '99px',
                }}>
                  {tmpl.days} days
                </span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{tmpl.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1, marginBottom: '16px' }}>{tmpl.description}</p>
              <button
                id={`start-plan-${tmpl.id}`} type="button"
                className="btn btn-primary" style={{ width: '100%' }}
                onClick={() => startPlan(tmpl.id)}
                disabled={startingPlan === tmpl.id}
              >
                {startingPlan === tmpl.id ? 'Starting...' : 'Start This Plan'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
