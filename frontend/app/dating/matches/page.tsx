'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import VerificationGate from '@/components/VerificationGate';

interface Partner {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Match {
  id: string;
  partner: Partner;
  conversationId: string | null;
  matchedAt: string;
  daysSinceMatch: number;
  resourcesUnlocked: boolean;
  resourcesUnlockedAt: string | null;
  daysUntilResources: number;
}

interface Resource {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  topics: string[];
  scripture: string;
}

function MatchesList() {
  const { getToken } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [resourceUnlockDays, setResourceUnlockDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [loadingResources, setLoadingResources] = useState(false);

  const loadMatches = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await apiRequest<{ matches: Match[]; resourceUnlockDays: number }>(
        '/api/dating/matches',
        { token: token ?? undefined }
      );
      setMatches(data.matches);
      setResourceUnlockDays(data.resourceUnlockDays);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  async function loadResources(matchId: string) {
    if (loadingResources) return;
    setLoadingResources(true);
    try {
      const token = await getToken();
      const data = await apiRequest<{ resources: Resource[] }>(
        `/api/dating/matches/${matchId}/resources`,
        { token: token ?? undefined }
      );
      setResources(data.resources);
      setExpandedMatchId(matchId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Resources not yet available.');
    } finally {
      setLoadingResources(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>❤️</div>
        <p>Loading your matches...</p>
      </div>
    );
  }

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <a href="/dating" style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            ← Back to Browse
          </a>
          <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '6px' }}>
            👥 Your Matches
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            These are people who mutually expressed interest in you. Be kind, be Christ-like. 🙏
          </p>
        </div>

        {/* Empty state */}
        {matches.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '64px 40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤝</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>No matches yet</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
              Matches appear here when two people mutually express interest. Keep browsing!
            </p>
            <a href="/dating" className="btn btn-primary">Browse Profiles →</a>
          </div>
        )}

        {/* Match cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {matches.map(match => (
            <div key={match.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Match header */}
              <div style={{
                padding: '24px 28px',
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                borderBottom: expandedMatchId === match.id ? '1px solid var(--border-subtle)' : 'none',
              }}>
                {/* Avatar */}
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 700, color: 'white', flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {match.partner.avatarUrl ? (
                    <img src={match.partner.avatarUrl} alt={match.partner.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    match.partner.displayName.slice(0, 2).toUpperCase()
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                    {match.partner.displayName}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Matched {match.daysSinceMatch === 0 ? 'today' : `${match.daysSinceMatch} day${match.daysSinceMatch === 1 ? '' : 's'} ago`}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                  {match.conversationId && (
                    <a
                      href={`/chat?conversationId=${match.conversationId}`}
                      className="btn btn-primary btn-sm"
                    >
                      💬 Open Chat
                    </a>
                  )}
                </div>
              </div>

              {/* Resource unlock section */}
              <div style={{
                padding: '16px 28px',
                background: 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>📖</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: match.resourcesUnlocked ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
                      Pre-Marriage Resources
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {match.resourcesUnlocked
                        ? 'Communication, faith alignment, finances & more'
                        : `Unlocks after ${match.daysUntilResources} more day${match.daysUntilResources === 1 ? '' : 's'} of chatting`}
                    </p>
                  </div>
                </div>

                {match.resourcesUnlocked ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => expandedMatchId === match.id ? setExpandedMatchId(null) : loadResources(match.id)}
                    disabled={loadingResources}
                  >
                    {expandedMatchId === match.id ? 'Hide Resources ↑' : 'View Resources 📖'}
                  </button>
                ) : (
                  <div style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-full)',
                    background: 'rgba(46,125,50,0.08)', border: '1px solid var(--border-default)',
                    fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)',
                  }}>
                    🔒 {resourceUnlockDays} days to unlock
                  </div>
                )}
              </div>

              {/* Resource library (expanded) */}
              {expandedMatchId === match.id && resources && (
                <div style={{ padding: '24px 28px', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                    Pre-Marriage Resource Library
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {resources.map(resource => (
                      <div key={resource.id} style={{
                        padding: '20px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '24px' }}>{resource.icon}</span>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{resource.title}</h4>
                            <span style={{
                              fontSize: '11px', fontWeight: 600, color: 'var(--brand-gold)',
                              background: 'rgba(212,175,55,0.1)', padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                            }}>
                              {resource.category}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
                          {resource.description}
                        </p>
                        <div style={{ marginBottom: '10px' }}>
                          {resource.topics.map(topic => (
                            <div key={topic} style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '3px 0', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <span style={{ color: 'var(--brand-primary)', flexShrink: 0 }}>•</span>
                              {topic}
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--brand-gold)', fontStyle: 'italic', fontWeight: 600 }}>
                          📖 {resource.scripture}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DatingMatchesPage() {
  return (
    <VerificationGate>
      <MatchesList />
    </VerificationGate>
  );
}
