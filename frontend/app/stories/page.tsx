'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import BackButton from '@/components/BackButton';
import StoryRing from '@/components/StoryRing';
import StoryViewer, { StoryAuthorGroup } from '@/components/StoryViewer';

export default function StoriesPage() {
  const { getToken } = useAuth();
  const [feed, setFeed] = useState<StoryAuthorGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<{ feed: StoryAuthorGroup[] }>('/api/stories/feed', {
        token: token ?? undefined,
      });
      setFeed(res.feed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load stories';
      if (msg.includes('restricted') || msg.includes('minor')) {
        setError('Stories are not available for content-only minor accounts.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const markStoryViewed = async (storyId: string) => {
    try {
      const token = await getToken();
      await apiRequest(`/api/stories/${storyId}/view`, {
        method: 'POST',
        token: token ?? undefined,
      });
    } catch {
      // non-critical
    }
  };

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <BackButton />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '4px' }}>
              📸 Christian Stories
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Share 24-hour expiring moments, scripture notes, and prayer requests with your community.
            </p>
          </div>
          <Link href="/stories/create" className="btn btn-primary">
            + Create Story
          </Link>
        </div>

        {error && (
          <div style={{
            padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '14px', marginBottom: '24px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Loading stories...
          </div>
        )}

        {/* Stories Tray */}
        {!loading && !error && (
          <div className="card" style={{ marginBottom: '32px', padding: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Active Stories
            </p>

            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
              {/* Always show Add Story button first */}
              <Link href="/stories/create" style={{ textDecoration: 'none' }}>
                <StoryRing displayName="Add Story" isSelf={true} />
              </Link>

              {feed.map((group, idx) => (
                <StoryRing
                  key={group.user.id}
                  displayName={group.user.displayName}
                  avatarUrl={group.user.avatarUrl}
                  hasUnseen={group.hasUnseen}
                  onClick={() => setActiveGroupIndex(idx)}
                />
              ))}
            </div>

            {feed.length === 0 && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                No active stories right now. Be the first to share one today!
              </p>
            )}
          </div>
        )}

        {/* Full screen Story Viewer Modal */}
        {activeGroupIndex !== null && (
          <StoryViewer
            groups={feed}
            initialGroupIndex={activeGroupIndex}
            onClose={() => setActiveGroupIndex(null)}
            onStoryViewed={markStoryViewed}
          />
        )}
      </div>
    </div>
  );
}
