'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import BackButton from '@/components/BackButton';

interface Challenge {
  id: string;
  verseRef: string;
  verseText: string;
  verseReference: string;
}

interface Attempt {
  id: string;
  score: number;
  isCorrect: boolean;
  attemptedAt: string;
}

interface Streak {
  currentStreak: number;
  longestStreak: number;
}

export default function VerseChallengePage() {
  const { getToken } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [userAttempt, setUserAttempt] = useState<Attempt | null>(null);
  const [streak, setStreak] = useState<Streak>({ currentStreak: 0, longestStreak: 0 });
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [submittedText, setSubmittedText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; isCorrect: boolean; message: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<{
        challenge: Challenge;
        userAttempt: Attempt | null;
        streak: Streak;
      }>('/api/verse-challenge/current', { token: token ?? undefined });

      setChallenge(res.challenge);
      setUserAttempt(res.userAttempt);
      setStreak(res.streak);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmitAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge || !submittedText.trim()) return;

    setSubmitting(true);
    setQuizResult(null);

    try {
      const token = await getToken();
      const res = await apiRequest<{
        attempt: Attempt;
        score: number;
        isCorrect: boolean;
        streak: Streak;
        message: string;
      }>('/api/verse-challenge/attempt', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          challengeId: challenge.id,
          submittedText: submittedText.trim(),
        }),
      });

      setQuizResult({ score: res.score, isCorrect: res.isCorrect, message: res.message });
      setStreak(res.streak);
      setUserAttempt(res.attempt);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not submit attempt');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📖</div>
          <p>Loading Weekly Verse Challenge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <BackButton />

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '6px' }}>
            🧠 Weekly Memory Verse Challenge
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Hide God&apos;s word in your heart. Practice personal verse recall every week.
          </p>
        </div>

        {/* Personal Streak Banner (No competitive public rankings) */}
        <div className="card" style={{
          marginBottom: '28px', padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(46,125,50,0.1), rgba(212,175,55,0.1))',
          border: '1px solid var(--border-default)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>🔥</span>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Your Personal Memory Streak
              </p>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-primary)', margin: 0 }}>
                {streak.currentStreak} {streak.currentStreak === 1 ? 'Week' : 'Weeks'} Active
              </h3>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Longest Streak</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-gold)' }}>
              🏆 {streak.longestStreak} {streak.longestStreak === 1 ? 'Week' : 'Weeks'}
            </p>
          </div>
        </div>

        {/* Challenge Card */}
        {challenge && (
          <div className="card animate-fade-in" style={{ padding: '32px', marginBottom: '28px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '4px 12px', borderRadius: '99px',
            }}>
              This Week&apos;s Verse
            </span>

            <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-serif)', fontWeight: 700, margin: '16px 0 8px' }}>
              {challenge.verseRef}
            </h2>

            {/* Verse Text Card */}
            <div style={{
              padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)',
              border: '1px solid var(--border-subtle)', fontStyle: 'italic', fontSize: '16px',
              lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: '24px',
            }}>
              &quot;{challenge.verseText}&quot;
              <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--brand-gold)', fontStyle: 'normal' }}>
                — {challenge.verseReference}
              </div>
            </div>

            {/* Recall Practice Form */}
            <form onSubmit={handleSubmitAttempt} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="recall-input" className="form-label">Type the verse from memory *</label>
                <textarea
                  id="recall-input"
                  className="form-input"
                  rows={4}
                  placeholder="Type the verse here to test your memory recall..."
                  value={submittedText}
                  onChange={e => setSubmittedText(e.target.value)}
                  required
                />
                <span className="form-hint">Don&apos;t worry about exact punctuation or capitalization — focus on getting the words right!</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting || !submittedText.trim()}
              >
                {submitting ? 'Checking Recall...' : '✝ Submit Memory Recall'}
              </button>
            </form>

            {/* Quiz Result Display */}
            {quizResult && (
              <div style={{
                marginTop: '24px', padding: '20px', borderRadius: 'var(--radius-md)',
                background: quizResult.isCorrect ? 'rgba(46,125,50,0.1)' : 'rgba(245,158,11,0.1)',
                border: `1px solid ${quizResult.isCorrect ? 'var(--border-default)' : 'rgba(245,158,11,0.3)'}`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {quizResult.isCorrect ? '🎉' : '💪'}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                  Accuracy Score: {quizResult.score}%
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {quizResult.message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
