'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import VerificationGate from '@/components/VerificationGate';
import DatingProfileCard, { DatingCandidate } from '@/components/DatingProfileCard';
import BackButton from '@/components/BackButton';

interface MatchNotification {
  partner: { id: string; displayName: string };
  conversationId: string;
}

function DatingBrowse() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<DatingCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set());
  const [matchNotif, setMatchNotif] = useState<MatchNotification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const loadCandidates = useCallback(async (nextCursor?: string | null) => {
    try {
      const token = await getToken();
      const params = new URLSearchParams({ limit: '6' });
      if (nextCursor) params.set('cursor', nextCursor);

      const data = await apiRequest<{
        candidates: DatingCandidate[];
        hasMore: boolean;
        nextCursor: string | null;
      }>(`/api/dating/candidates?${params}`, { token: token ?? undefined });

      setCandidates(prev => nextCursor ? [...prev, ...data.candidates] : data.candidates);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('verified') || msg.includes('verification')) {
        // Let VerificationGate handle this
      } else if (msg.includes('gender')) {
        setError('The Dating section is only available to users with a declared gender (Male or Female). You selected "Prefer not to say" during onboarding.');
      } else {
        setError(msg || 'Could not load candidates. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const checkProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const profile = await apiRequest('/api/dating/profile/me', { token: token ?? undefined });
      setHasProfile(!!profile);
    } catch {
      setHasProfile(false);
    }
  }, [getToken]);

  useEffect(() => {
    checkProfile().then(() => loadCandidates());
  }, [checkProfile, loadCandidates]);

  // Poll for match notifications via Socket.io room events
  // (Simple polling alternative — full Socket.io integration uses the existing socket hook)
  const startMatchPolling = useCallback((userId: string) => {
    // Socket.io match notification is handled server-side via io.emit(`dating:match:${userId}`)
    // Frontend can connect via existing socket infrastructure or poll matches endpoint
  }, []);

  async function handleInterested(userId: string) {
    setLikingId(userId);
    try {
      const token = await getToken();
      const res = await apiRequest<{
        matched: boolean; isNew?: boolean;
        conversationId?: string; partner?: { id: string; displayName: string };
      }>(`/api/dating/like/${userId}`, {
        method: 'POST',
        token: token ?? undefined,
      });

      // Remove from visible list
      setCandidates(prev => prev.filter(c => c.id !== userId));

      if (res.matched && res.isNew) {
        setMatchNotif({ partner: res.partner!, conversationId: res.conversationId! });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send interest. Please try again.');
    } finally {
      setLikingId(null);
    }
  }

  function handlePass(userId: string) {
    setPassedIds(prev => new Set([...prev, userId]));
    setCandidates(prev => prev.filter(c => c.id !== userId));
  }

  async function handleBlock(userId: string) {
    if (!confirm('Block this user? They will no longer appear in your browse feed and you will not appear in theirs.')) return;
    try {
      const token = await getToken();
      await apiRequest('/api/safety/block', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ targetUserId: userId }),
      });
      setCandidates(prev => prev.filter(c => c.id !== userId));
    } catch {
      // Fail silently — user is removed from view
    }
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    await loadCandidates(cursor);
    setLoadingMore(false);
  }

  const visibleCandidates = candidates.filter(c => !passedIds.has(c.id));

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <BackButton />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '6px' }}>
              ❤️ Christian Dating
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Opposite-gender, faith-first, identity-verified matches. No photo-swiping — know people through their words.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/dating/matches" className="btn btn-outline btn-sm">👥 My Matches</a>
            <a href="/dating/profile" className="btn btn-ghost btn-sm">✏️ Edit Profile</a>
          </div>
        </div>

        {/* No profile yet prompt */}
        {hasProfile === false && !loading && (
          <div className="glass animate-fade-in" style={{ padding: '40px', textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✝️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>Complete Your Dating Profile First</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.7 }}>
              Before browsing, set up your dating profile so others can discover you too.
            </p>
            <a href="/dating/profile" className="btn btn-primary btn-lg">
              Set Up My Profile →
            </a>
          </div>
        )}

        {error && (
          <div style={{
            padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: '14px', color: '#fca5a5',
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>❤️</div>
            <p>Finding matches for you...</p>
          </div>
        )}

        {/* Candidates grid */}
        {!loading && visibleCandidates.length === 0 && !error && (
          <div className="card" style={{ textAlign: 'center', padding: '64px 40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🙏</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>
              No new candidates right now
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
              You&apos;ve reviewed all available matches in your area and age range.
              Check back as more members join and complete verification!
            </p>
            <a href="/dating/matches" className="btn btn-outline">
              View Your Existing Matches →
            </a>
          </div>
        )}

        {!loading && visibleCandidates.length > 0 && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
              gap: '24px',
              marginBottom: '32px',
            }}>
              {visibleCandidates.map(candidate => (
                <DatingProfileCard
                  key={candidate.id}
                  candidate={candidate}
                  onInterested={handleInterested}
                  onPass={handlePass}
                  onBlock={handleBlock}
                  isLiking={likingId === candidate.id}
                />
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More Profiles'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Match notification modal ──────────────────────────────────── */}
      {matchNotif && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div className="card animate-fade-in" style={{
            maxWidth: '440px', width: '100%', textAlign: 'center', padding: '48px 40px',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'float 2s ease-in-out infinite' }}>
              ❤️
            </div>
            <h2 style={{ fontSize: '26px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '10px' }}>
              It&apos;s a Match! 🎉
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '28px' }}>
              You and <strong>{matchNotif.partner.displayName}</strong> are mutually interested.
              A private conversation has been opened.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => router.push(`/chat?conversationId=${matchNotif.conversationId}`)}
              >
                💬 Open Conversation
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setMatchNotif(null)}
              >
                Continue Browsing
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px', lineHeight: 1.6 }}>
              Remember: treat everyone with the love of Christ. Every conversation is an opportunity to reflect His grace. 🙏
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DatingPage() {
  return (
    <VerificationGate>
      <DatingBrowse />
    </VerificationGate>
  );
}
