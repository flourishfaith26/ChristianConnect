'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

interface MentorRelation {
  id: string;
  status: string;
  currentWeek: number;
  curriculumProgress: number[];
}

interface UserSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface CurriculumItem {
  week: number;
  title: string;
  goal: string;
}

export default function MentorshipPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mentor, setMentor] = useState<UserSummary | null>(null);
  const [mentees, setMentees] = useState<UserSummary[]>([]);
  const [relation, setRelation] = useState<MentorRelation | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);

  // Form states for mentor signup
  const [isWilling, setIsWilling] = useState(false);
  const [years, setYears] = useState('5');
  const [pastoral, setPastoral] = useState('');
  const [capacity, setCapacity] = useState('3');
  const [submittingMentor, setSubmittingMentor] = useState(false);

  const [requesting, setRequesting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<{
        activeMentor: UserSummary | null;
        activeMentees: UserSummary[];
        activeRelationship: MentorRelation | null;
        curriculum: CurriculumItem[];
        profile: { isWillingToMentor: boolean; yearsAsBeliever: number | null; pastoralBackground: string | null; maxMentees: number } | null;
      }>('/api/mentorship/status', { token: token ?? undefined });

      setMentor(res.activeMentor);
      setMentees(res.activeMentees);
      setRelation(res.activeRelationship);
      setCurriculum(res.curriculum);

      if (res.profile) {
        setIsWilling(res.profile.isWillingToMentor);
        setYears(String(res.profile.yearsAsBeliever ?? 5));
        setPastoral(res.profile.pastoralBackground ?? '');
        setCapacity(String(res.profile.maxMentees ?? 3));
      }
    } catch {
      setError('Could not load mentorship status.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  async function submitMentorSignup(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingMentor(true);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest('/api/mentorship/mentor-signup', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          willingToMentor: isWilling,
          yearsAsBeliever: parseInt(years),
          pastoralBackground: pastoral,
          maxMentees: parseInt(capacity),
        }),
      });
      await checkStatus();
      alert('Mentor profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mentor sign-up failed.');
    } finally {
      setSubmittingMentor(false);
    }
  }

  async function requestMentor() {
    setRequesting(true);
    setError(null);
    setStatusMsg(null);
    try {
      const token = await getToken();
      const res = await apiRequest<{ success: boolean; message?: string; mentor: UserSummary | null; relation: MentorRelation | null }>(
        '/api/mentorship/request',
        { method: 'POST', token: token ?? undefined }
      );
      if (res.success) {
        setMentor(res.mentor);
        setRelation(res.relation);
      } else {
        setStatusMsg(res.message ?? 'No mentors available right now.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setRequesting(false);
    }
  }

  async function advanceCurriculum() {
    if (!relation || advancing) return;
    setAdvancing(true);
    try {
      const token = await getToken();
      const res = await apiRequest<{ relation: MentorRelation; isCompleted: boolean }>(
        '/api/mentorship/advance',
        {
          method: 'POST',
          token: token ?? undefined,
          body: JSON.stringify({ relationId: relation.id }),
        }
      );
      setRelation(res.relation);
      if (res.isCompleted) {
        alert('🎉 Congratulations! You have completed the 4-week guided mentorship track.');
        await checkStatus();
      }
    } catch {
      setError('Could not advance curriculum.');
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>Loading mentorship module...</div>;
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, marginBottom: '6px' }}>🌱 New Convert Mentorship</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Connect new converts with experienced, verified mentors to study the 4-week guided curriculum.
        </p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}

      {/* active relationship curriculum track */}
      {relation ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
          {/* Active Relationship Info */}
          <div className="card">
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Your Active Mentorship</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700,
              }}>
                {(mentor?.displayName ?? mentees[0]?.displayName ?? 'U')[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700 }}>
                  {mentor ? `Mentor: ${mentor.displayName}` : `Mentees: ${mentees.map(m => m.displayName).join(', ')}`}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Guided Curriculum Week {relation.currentWeek} of 4
                </p>
              </div>
            </div>
          </div>

          {/* Curriculum tracker */}
          <div className="glass" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>4-Week Discipleship Curriculum</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {curriculum.map((step) => {
                const isPast = relation.currentWeek > step.week;
                const isCurrent = relation.currentWeek === step.week;
                return (
                  <div
                    key={step.week}
                    style={{
                      display: 'flex', gap: '14px', padding: '16px', borderRadius: 'var(--radius-md)',
                      border: isCurrent ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      background: isCurrent ? 'rgba(99,102,241,0.1)' : 'var(--bg-overlay)',
                      opacity: isPast ? 0.6 : 1,
                    }}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: isPast ? '#22c55e' : isCurrent ? 'var(--brand-primary)' : 'var(--bg-base)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                    }}>
                      {isPast ? '✓' : step.week}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '14px' }}>{step.title}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{step.goal}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {relation.status === 'active' && (
              <button
                id="advance-btn" type="button" className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                onClick={advanceCurriculum} disabled={advancing}
              >
                {advancing ? 'Advancing track...' : `✓ Complete Week ${relation.currentWeek} Goal`}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* If no relationship, convert requesting flow */
        <div className="card" style={{ padding: '32px', textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌱</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Request Discipleship Mentor</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px' }}>
            New to the faith? You can match with a verified leader or seasoned believer to guide you through basic Christian steps.
          </p>

          {statusMsg && (
            <div style={{
              padding: '12px', borderRadius: 'var(--radius-md)',
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              color: '#fcd34d', fontSize: '13px', marginBottom: '20px',
            }}>
              {statusMsg}
            </div>
          )}

          <button
            id="req-mentor-btn" type="button" className="btn btn-primary"
            onClick={requestMentor} disabled={requesting}
            style={{ width: '100%', maxWidth: '300px' }}
          >
            {requesting ? 'Matching you with a mentor...' : 'Request a Mentor'}
          </button>
        </div>
      )}

      {/* Mentor Onboarding / Configuration form */}
      <form onSubmit={submitMentorSignup} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Seasoned Believer? Sign Up to Mentor</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Offer guidance to newer converts. Mentor entries are vetted by church moderators.
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
          <input
            type="checkbox" checked={isWilling}
            onChange={(e) => setIsWilling(e.target.checked)}
            style={{ accentColor: 'var(--brand-primary)' }}
          />
          <strong>Willing to take active mentees</strong>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="years-as-believer" className="form-label">Years as a Believer</label>
            <input
              id="years-as-believer" type="number" className="form-input" min={1}
              value={years} onChange={(e) => setYears(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="max-mentees" className="form-label">Max Mentee Limit</label>
            <input
              id="max-mentees" type="number" className="form-input" min={1} max={5}
              value={capacity} onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="pastoral-bg" className="form-label">Pastoral/Leadership Experience (Optional)</label>
          <textarea
            id="pastoral-bg" className="form-input" rows={3}
            placeholder="Describe any church leadership, home group coordinates, or theology courses..."
            value={pastoral} onChange={(e) => setPastoral(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-outline" disabled={submittingMentor}>
          {submittingMentor ? 'Updating...' : 'Update Mentor Profile'}
        </button>
      </form>
    </div>
  );
}
