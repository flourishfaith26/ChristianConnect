'use client';

import { useState } from 'react';

interface TodaySpotlightProps {
  spotlightData: {
    verse?: { reference: string; text: string; translation: string };
    devotional?: { title: string; teaser: string; fullText: string; author: string; readTime: string };
    stories?: { id: string; authorName: string; avatarUrl: string; title: string }[];
  } | null;
}

export default function TodaySpotlight({ spotlightData }: TodaySpotlightProps) {
  const [expandedDevotional, setExpandedDevotional] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);

  const verse = spotlightData?.verse || {
    reference: 'Jeremiah 29:11',
    text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',
    translation: 'NIV',
  };

  const devotional = spotlightData?.devotional || {
    title: 'Trusting God in the Waiting Room of Life',
    teaser: 'Waiting on God is never wasted time. He is molding your character while preparing your breakthrough...',
    fullText:
      "Waiting on God is never wasted time. He is molding your character while preparing your breakthrough. In Psalm 27:14, David writes: \"Wait for the Lord; be strong and take heart and wait for the Lord.\" When we rush ahead of God's timing, we often create complications. But when we wait patiently in prayer, God produces endurance, spiritual authority, and peace in our hearts.",
    author: 'Pastor Emmanuel',
    readTime: '3 min read',
  };

  const stories = spotlightData?.stories || [
    { id: 's1', authorName: 'Grace B.', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', title: 'Morning Prayer' },
    { id: 's2', authorName: 'David K.', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', title: 'Verse of the Day' },
    { id: 's3', authorName: 'Sarah M.', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', title: 'Worship Night' },
    { id: 's4', authorName: 'Caleb V.', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', title: 'Bible Note' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: '#ffffff',
        border: '1px solid rgba(46, 125, 50, 0.15)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
      }}
    >
      {/* Top Banner Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>☀️</span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
            Today's Faith Spotlight
          </h2>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#d4af37' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* ── Stories Horizontal Scroll Strip ── */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Active Community Stories
        </p>
        <div
          style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'thin',
          }}
        >
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() =>
                setSelectedStory({
                  id: story.id,
                  mediaUrl: 'https://images.unsplash.com/photo-1510936150000-409ba3fe203f?auto=format&fit=crop&w=800&q=80',
                  caption: story.title,
                  author: { displayName: story.authorName, avatarUrl: story.avatarUrl },
                  createdAt: 'Today',
                  expiresAt: '24h',
                })
              }
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  padding: '2px',
                  background: 'linear-gradient(135deg, #2e7d32, #d4af37)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={story.avatarUrl}
                  alt={story.authorName}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #ffffff',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#334155', maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {story.authorName}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: 'rgba(46, 125, 50, 0.1)' }} />

      {/* ── Verse of the Day ── */}
      <div
        style={{
          backgroundColor: '#fafaf7',
          borderLeft: '4px solid #d4af37',
          borderRadius: '0 12px 12px 0',
          padding: '14px 16px',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', marginBottom: '6px' }}>
          📖 Verse of the Day ({verse.reference})
        </div>
        <blockquote
          style={{
            fontFamily: 'var(--font-serif, Cormorant Garamond, serif)',
            fontSize: '17px',
            lineHeight: 1.6,
            color: '#1e293b',
            fontStyle: 'italic',
            margin: 0,
          }}
        >
          "{verse.text}"
        </blockquote>
      </div>

      {/* ── Today's Devotional Callout ── */}
      <div
        style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid rgba(46, 125, 50, 0.2)',
          borderRadius: '12px',
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase' }}>
            📜 Today's Devotional • {devotional.readTime}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>By {devotional.author}</span>
        </div>

        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1b5e20', marginBottom: '6px' }}>
          {devotional.title}
        </h3>

        <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
          {expandedDevotional ? devotional.fullText : devotional.teaser}
        </p>

        <button
          onClick={() => setExpandedDevotional(!expandedDevotional)}
          style={{
            marginTop: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#2e7d32',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{expandedDevotional ? 'Show Less ▲' : 'Read Full Devotional Inline ▼'}</span>
        </button>
      </div>

      {/* Story Preview Modal */}
      {selectedStory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '380px',
              width: '100%',
              backgroundColor: '#1e293b',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '16px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src={selectedStory.author.avatarUrl}
                  alt=""
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #ffffff' }}
                />
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px' }}>
                  {selectedStory.author.displayName}
                </span>
              </div>
              <button
                onClick={() => setSelectedStory(null)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Media Image */}
            <img
              src={selectedStory.mediaUrl}
              alt=""
              style={{ width: '100%', height: '420px', objectFit: 'cover' }}
            />

            {/* Caption */}
            <div style={{ padding: '16px', backgroundColor: '#0f172a', color: '#ffffff' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{selectedStory.caption}</p>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                24h Expiring Community Story • {selectedStory.createdAt}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
