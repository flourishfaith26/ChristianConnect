'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface Recommendation {
  id: string;
  title: string;
  url: string | null;
  type: string;
  category: string;
  tags: string[];
  summary: string | null;
  relevanceScore: number;
}

export default function RecommendationsPage() {
  const { getToken } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<{ recommendations: Recommendation[] }>('/api/recommendations', {
        token: token ?? undefined,
      });
      setRecommendations(res.recommendations);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadRecommendations(); }, [loadRecommendations]);

  const handleInteraction = async (tag: string) => {
    try {
      const token = await getToken();
      await apiRequest('/api/recommendations/activity', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ tag }),
      });
    } catch {
      // non-critical
    }
  };

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '6px' }}>
            💡 Recommended For You
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Personalized faith content based on your active groups, study topics, and community involvement.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Curating recommendations for you...
          </div>
        )}

        {/* Recommendations Grid */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
            {recommendations.map(rec => (
              <div key={rec.id} className="card card-interactive animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '3px 10px', borderRadius: '99px',
                    }}>
                      {rec.category}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Match score: {rec.relevanceScore}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    {rec.title}
                  </h3>

                  {rec.summary && (
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                      {rec.summary}
                    </p>
                  )}

                  {rec.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      {rec.tags.map(t => (
                        <span key={t} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {rec.url && (
                  <Link
                    href={rec.url}
                    className="btn btn-outline btn-sm"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => rec.tags[0] && handleInteraction(rec.tags[0])}
                  >
                    Explore Section →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
