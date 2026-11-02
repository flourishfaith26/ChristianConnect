'use client';

import { useState } from 'react';
import ReportButton from '@/components/ReportButton';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';

export interface FeedItem {
  id: string;
  type: 'devotional' | 'testimony' | 'prayer' | 'group_activity' | 'sermon_clip' | 'apologetics';
  category: string;
  title: string;
  content: string;
  scriptureRef?: string | null;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  groupName?: string;
  groupHref?: string;
  isUrgent?: boolean;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    badge?: string;
  };
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
  amenCount: number;
  commentCount: number;
  reshareCount?: number;
  isReshared?: boolean;
  isSaved?: boolean;
  hasReacted?: boolean;
  comments?: { id: string; authorName: string; content: string; createdAt: string }[];
}

export default function FeedCard({ item }: { item: FeedItem }) {
  const { getToken } = useAuth();
  const [likesCount, setLikesCount] = useState(item.likesCount ?? item.amenCount ?? 12);
  const [isLiked, setIsLiked] = useState(Boolean(item.isLiked));
  const [amenCount, setAmenCount] = useState(item.amenCount || 0);
  const [hasReacted, setHasReacted] = useState(Boolean(item.hasReacted));
  const [reshareCount, setReshareCount] = useState(item.reshareCount ?? 0);
  const [isReshared, setIsReshared] = useState(Boolean(item.isReshared));
  const [isSaved, setIsSaved] = useState(Boolean(item.isSaved));
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(item.comments || []);
  const [commentInput, setCommentInput] = useState('');
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Trigger floating heart animation and like on double tap
  function handleMediaDoubleTap() {
    setShowDoubleTapHeart(true);
    setTimeout(() => setShowDoubleTapHeart(false), 900);
    if (!isLiked) {
      handleToggleLike();
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }

  // ── Instagram Love / Like Handler ──
  async function handleToggleLike() {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const token = await getToken();
      await apiRequest(`/api/feed/${item.id}/like`, {
        method: 'POST',
        token: token ?? undefined,
      });
    } catch {
      // Revert if API fails
    }
  }

  // ── Amen Blessing Handler ──
  async function handleToggleAmen() {
    const nextReacted = !hasReacted;
    setHasReacted(nextReacted);
    setAmenCount((prev) => (nextReacted ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const token = await getToken();
      await apiRequest(`/api/feed/${item.id}/react`, {
        method: 'POST',
        token: token ?? undefined,
      });
    } catch {
      // Revert if API fails
    }
  }

  // ── Reshare / Repost Handler ──
  async function handleToggleReshare() {
    const nextReshared = !isReshared;
    setIsReshared(nextReshared);
    setReshareCount((prev) => (nextReshared ? prev + 1 : Math.max(0, prev - 1)));
    showToast(nextReshared ? '🔁 Reposted to your community feed!' : 'Repost removed');

    try {
      const token = await getToken();
      await apiRequest(`/api/feed/${item.id}/reshare`, {
        method: 'POST',
        token: token ?? undefined,
      });
    } catch {
      // Revert if API fails
    }
  }

  // ── Bookmark / Save Handler ──
  async function handleToggleSave() {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    showToast(nextSaved ? '🔖 Saved to your collection!' : 'Removed from saved items');

    try {
      const token = await getToken();
      await apiRequest(`/api/feed/${item.id}/save`, {
        method: 'POST',
        token: token ?? undefined,
      });
    } catch {
      // Revert if API fails
    }
  }

  // ── Direct Share / Paper Plane Handler ──
  async function handleShare() {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: item.title || 'ChristianConnect Post',
      text: item.content.slice(0, 100) + '...',
      url: shareUrl,
    };

    if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('✈️ Shared successfully!');
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showToast('✈️ Post link copied to clipboard!');
    }
  }

  // ── Add Comment Handler ──
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment = {
      id: `c_${Date.now()}`,
      authorName: 'You',
      content: commentInput.trim(),
      createdAt: 'Just now',
    };

    setComments((prev) => [...prev, newComment]);
    setCommentInput('');

    try {
      const token = await getToken();
      await apiRequest(`/api/feed/${item.id}/comment`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ content: newComment.content }),
      });
    } catch {
      // Error handling
    }
  }

  const BADGE_COLORS: Record<string, string> = {
    devotional: '#2e7d32',
    testimony: '#d4af37',
    prayer: '#e11d48',
    group_activity: '#0284c7',
    sermon_clip: '#7c3aed',
    apologetics: '#059669',
  };

  const TYPE_ICONS: Record<string, string> = {
    devotional: '📜',
    testimony: '🕊️',
    prayer: '🙏',
    group_activity: '👥',
    sermon_clip: '🎥',
    apologetics: '⚔️',
  };

  const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl) || (item.mediaUrl && item.mediaUrl.endsWith('.mp4'));
  const isImage = !isVideo && Boolean(item.mediaUrl) && !imageError;

  return (
    <article
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '14px 16px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        transition: 'box-shadow 0.2s ease',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            zIndex: 20,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ── Card Header (Author, Category Badge & Report Action) ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
        
        {/* Left Side: Avatar + Author Info & Metadata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#2e7d32',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '16px',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
            }}
          >
            {item.author?.avatarUrl ? (
              <img src={item.author.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              item.author?.displayName?.[0]?.toUpperCase() || 'C'
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Author Name + Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.2,
                }}
              >
                {item.author?.displayName || 'Community Member'}
              </span>
              {item.author?.badge && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  ✓ {item.author.badge}
                </span>
              )}
            </div>

            {/* Time + Category Subtitle Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px', color: '#64748b' }}>
              <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span
                style={{
                  fontWeight: 700,
                  color: BADGE_COLORS[item.type] || '#2e7d32',
                  backgroundColor: `${BADGE_COLORS[item.type] || '#2e7d32'}15`,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                {TYPE_ICONS[item.type] || '📌'} {item.category}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Options/Report Button */}
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          <ReportButton targetType="group" targetId={item.id} />
        </div>
      </div>

      {/* ── Post Title & Message Body ── */}
      <div style={{ width: '100%' }}>
        {item.title && (
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '6px',
              lineHeight: 1.35,
              wordBreak: 'break-word',
            }}
          >
            {item.title}
          </h3>
        )}
        <p
          style={{
            fontSize: '13px',
            color: '#334155',
            lineHeight: 1.6,
            margin: 0,
            whiteSpace: 'pre-line',
            wordBreak: 'break-word',
          }}
        >
          {item.content}
        </p>

        {item.scriptureRef && (
          <div
            style={{
              marginTop: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#b45309',
              backgroundColor: '#fef3c7',
              padding: '3px 8px',
              borderRadius: '6px',
              maxWidth: '100%',
            }}
          >
            <span>📖</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.scriptureRef}
            </span>
          </div>
        )}
      </div>

      {/* ── Visual Media Container (Photos / Videos with Instagram Double-Tap to Like) ── */}
      {(isImage || isVideo) && (
        <div
          onDoubleClick={handleMediaDoubleTap}
          style={{
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            marginTop: '2px',
            cursor: isImage ? 'pointer' : 'default',
            userSelect: 'none',
            width: '100%',
          }}
        >
          {/* Double Tap Floating Animated Heart */}
          {showDoubleTapHeart && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="1.5"
                style={{
                  filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.8))',
                  animation: 'popHeart 0.8s ease forwards',
                }}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          )}

          {isImage && item.mediaUrl && (
            <img
              src={item.mediaUrl}
              alt={item.title || 'Feed image'}
              onError={() => setImageError(true)}
              style={{
                width: '100%',
                maxHeight: '440px',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.3s ease',
              }}
            />
          )}

          {isVideo && (
            <video
              controls
              poster={item.thumbnailUrl || undefined}
              src={item.videoUrl || item.mediaUrl || undefined}
              style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' }}
            >
              <source src={item.videoUrl || item.mediaUrl || undefined} type="video/mp4" />
              Your browser does not support video playback.
            </video>
          )}
        </div>
      )}

      {/* ── Action Row (Like, Comment, Reshare, Share, Amen, Bookmark) ── */}
      <div
        style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '4px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {/* 1. Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            aria-label="Like post"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isLiked ? '#ef4444' : 'none'}
              stroke={isLiked ? '#ef4444' : '#475569'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: isLiked ? '#ef4444' : '#475569' }}>
              {likesCount}
            </span>
          </button>

          {/* 2. Comment Bubble Button */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            aria-label="Comment on post"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#475569"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
              {comments.length}
            </span>
          </button>

          {/* 3. Reshare / Repost Button */}
          <button
            type="button"
            onClick={handleToggleReshare}
            aria-label="Reshare post"
            title="Repost to community feed"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: isReshared ? '#f0fdf4' : 'transparent',
              border: isReshared ? '1px solid #bbf7d0' : 'none',
              cursor: 'pointer',
              padding: '3px 6px',
              borderRadius: '6px',
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isReshared ? '#16a34a' : '#475569'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: isReshared ? '#16a34a' : '#475569' }}>
              {reshareCount}
            </span>
          </button>

          {/* 4. Direct Share Plane Button */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share post"
            title="Share via link"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#475569"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>

          {/* 5. Christian Amen Reaction Pill */}
          <button
            type="button"
            onClick={handleToggleAmen}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: hasReacted ? '#e8f5e9' : '#f8fafc',
              color: hasReacted ? '#2e7d32' : '#64748b',
              border: hasReacted ? '1px solid #86efac' : '1px solid #e2e8f0',
              padding: '3px 9px',
              borderRadius: '14px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🙏</span>
            <span>{hasReacted ? 'Amen!' : 'Amen'}</span>
            <span style={{ opacity: 0.85 }}>({amenCount})</span>
          </button>
        </div>

        {/* 6. Bookmark / Save Button */}
        <button
          type="button"
          onClick={handleToggleSave}
          aria-label="Save post"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            flexShrink: 0,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={isSaved ? '#16a34a' : 'none'}
            stroke={isSaved ? '#16a34a' : '#475569'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      {/* ── Expandable Interactive Comments Drawer ── */}
      {showComments && (
        <div
          style={{
            marginTop: '4px',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
          }}
        >
          {/* Comment Submission Form */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '6px', width: '100%' }}>
            <input
              type="text"
              placeholder="Write an encouraging comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '7px 12px',
                borderRadius: '16px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              style={{
                backgroundColor: commentInput.trim() ? '#2e7d32' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: commentInput.trim() ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Post
            </button>
          </form>

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
            {comments.length === 0 ? (
              <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: '4px 0' }}>
                No comments yet. Be the first to leave encouragement!
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <strong style={{ color: '#1e293b' }}>{c.authorName}</strong>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{c.createdAt}</span>
                  </div>
                  <p style={{ color: '#334155', margin: 0, lineHeight: 1.4 }}>{c.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
}
