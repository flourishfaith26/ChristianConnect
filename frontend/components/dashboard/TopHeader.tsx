'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';
import { getDailySpotlight } from '@/lib/dailySpotlight';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';

interface TopHeaderProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenCreatePost: () => void;
  user: any;
  spotlightData?: any;
  onToggleLeftDrawer?: () => void;
  onToggleRightDrawer?: () => void;
  leftDrawerOpen?: boolean;
  rightDrawerOpen?: boolean;
}

export default function TopHeader({
  activeCategory,
  onSelectCategory,
  onOpenCreatePost,
  user,
  spotlightData,
  onToggleLeftDrawer,
  onToggleRightDrawer,
  leftDrawerOpen = false,
  rightDrawerOpen = false,
}: TopHeaderProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDevotionalDetails, setShowDevotionalDetails] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const CATEGORIES = ['All', 'Devotional', 'Testimonies', 'Sermons', 'Apologetics', 'Community'];

  // Dynamic date-based spotlight (new verse and devotional every single day)
  const dailyFallback = getDailySpotlight();
  const verse = spotlightData?.verse || dailyFallback.verse;
  const devotional = spotlightData?.devotional || dailyFallback.devotional;

  const stories = spotlightData?.stories || [
    { id: 's1', authorName: 'Grace B.', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', title: 'Morning Prayer' },
    { id: 's2', authorName: 'David K.', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', title: 'Verse of the Day' },
    { id: 's3', authorName: 'Sarah M.', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', title: 'Worship Night' },
    { id: 's4', authorName: 'Caleb V.', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', title: 'Bible Note' },
  ];

  // Global search trigger
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const token = await getToken();
        const data = await apiRequest<any>(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
          token: token ?? undefined,
        });
        setSearchResults(data);
      } catch {
        setSearchResults(null);
      }
    }, 350);

    return () => clearTimeout(delay);
  }, [searchQuery, getToken]);

  const NOTIFICATIONS = [
    { id: 'n1', text: 'Grace Believer prayed for your prayer request 🙏', time: '10m ago' },
    { id: 'n2', text: 'New Devotional: "Trusting God in the Waiting Room"', time: '1h ago' },
    { id: 'n3', text: 'Sarah M. commented on your testimony', time: '3h ago' },
  ];

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid rgba(46, 125, 50, 0.15)',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Upper Row: Drawer Buttons, Search Bar, Create Post, Hub & Logout ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', width: '100%' }}>
        
        {/* Left Side: Drawer Toggle Button & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          {/* Left Drawer Toggle (Draws navigation menu) */}
          <button
            type="button"
            onClick={onToggleLeftDrawer}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              backgroundColor: leftDrawerOpen ? 'rgba(46, 125, 50, 0.15)' : '#f1f5f9',
              color: leftDrawerOpen ? '#2e7d32' : '#334155',
              border: '1px solid rgba(46, 125, 50, 0.2)',
              cursor: 'pointer',
              fontSize: '17px',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            ☰
          </button>

          {/* Search Bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: '80px', maxWidth: '380px' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 28px',
                borderRadius: '18px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ position: 'absolute', left: '8px', top: '7px', fontSize: '12px', color: '#94a3b8' }}>
              🔍
            </span>

            {/* Search Results Dropdown */}
            {searchResults && (
              <div
                style={{
                  position: 'absolute',
                  top: '38px',
                  left: 0,
                  width: '300px',
                  maxWidth: '85vw',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(46, 125, 50, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  padding: '12px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Groups ({searchResults.groups?.length || 0})
                </div>
                {searchResults.groups?.map((g: any) => (
                  <Link
                    key={g.id}
                    href={`/${g.type === 'bible_study' ? 'bible-study' : 'friendship'}`}
                    style={{ display: 'block', fontSize: '12px', padding: '3px 0', color: '#334155', textDecoration: 'none' }}
                  >
                    • {g.name}
                  </Link>
                ))}

                <div style={{ fontSize: '11px', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', marginTop: '8px', marginBottom: '4px' }}>
                  Apologetics ({searchResults.apologeticsQuestions?.length || 0})
                </div>
                {searchResults.apologeticsQuestions?.map((q: any) => (
                  <Link key={q.id} href="/apologetics" style={{ display: 'block', fontSize: '12px', padding: '3px 0', color: '#334155', textDecoration: 'none' }}>
                    • {q.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Create Post, Right Drawer Toggle, Notifications & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {/* Create Post Button */}
          <button
            type="button"
            onClick={onOpenCreatePost}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: '#2e7d32',
              color: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(46, 125, 50, 0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '13px' }}>+</span>
            <span style={{ display: 'inline' }}>Post</span>
          </button>

          {/* Right Drawer Toggle (Draws Community Hub / Events Rail) */}
          <button
            type="button"
            onClick={onToggleRightDrawer}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              height: '34px',
              padding: '0 8px',
              borderRadius: '9px',
              backgroundColor: rightDrawerOpen ? 'rgba(46, 125, 50, 0.15)' : '#f1f5f9',
              color: rightDrawerOpen ? '#2e7d32' : '#334155',
              border: '1px solid rgba(46, 125, 50, 0.2)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title="Toggle Community Hub & Events (Draw Right Rail)"
            aria-label="Toggle Community Hub & Events"
          >
            <span>👥</span>
            <span style={{ fontSize: '11px', display: 'none' }} className="hub-text">Hub</span>
          </button>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                backgroundColor: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                cursor: 'pointer',
                position: 'relative',
              }}
              aria-label="Notifications"
            >
              🔔
              <span
                style={{
                  position: 'absolute',
                  top: '1px',
                  right: '1px',
                  backgroundColor: '#e11d48',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 700,
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                3
              </span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  top: '40px',
                  right: 0,
                  width: '260px',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(46, 125, 50, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  padding: '10px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', marginBottom: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                  Notifications
                </div>
                {NOTIFICATIONS.map((n) => (
                  <div key={n.id} style={{ fontSize: '11px', padding: '5px 0', borderBottom: '1px solid #f8fafc' }}>
                    <p style={{ color: '#334155', margin: 0 }}>{n.text}</p>
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>{n.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Header Log Out Button */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              borderRadius: '9px',
              padding: '6px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            title="Log Out of ChristianConnect"
          >
            <span>🚪</span>
            <span style={{ display: 'none' }} className="logout-text">Log Out</span>
          </button>
        </div>

        {/* Header Logout Confirmation Modal */}
        <LogoutConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
        />
      </div>

      {/* ── Instagram-Style Stories Bar ── */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', width: '100%', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
          }}
        >
          {/* "+ Your Story" Bubble */}
          <Link
            href="/stories"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '2px dashed #2e7d32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f0fdf4',
              }}
            >
              <span style={{ fontSize: '16px', color: '#2e7d32', fontWeight: 700 }}>+</span>
              <div
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  backgroundColor: '#2e7d32',
                  color: '#ffffff',
                  fontSize: '8px',
                  fontWeight: 700,
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #ffffff',
                }}
              >
                +
              </div>
            </div>
            <span style={{ fontSize: '9px', fontWeight: 600, color: '#2e7d32' }}>Your Story</span>
          </Link>

          {/* Active Community Story Circles */}
          {stories.map((story: any) => (
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
                gap: '3px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  padding: '2px',
                  background: 'linear-gradient(135deg, #2e7d32 0%, #d4af37 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(46, 125, 50, 0.15)',
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
                    border: '1.5px solid #ffffff',
                  }}
                />
              </div>
              <span style={{ fontSize: '9px', fontWeight: 500, color: '#334155', maxWidth: '52px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {story.authorName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Daily Scripture & Devotional Spotlight Bar ── */}
      <div
        style={{
          backgroundColor: '#fafaf7',
          border: '1px solid rgba(46, 125, 50, 0.15)',
          borderRadius: '10px',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px' }}>☀️</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b' }}>
              Today's Faith Spotlight
            </span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>• {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>

          <button
            onClick={() => setShowDevotionalDetails(!showDevotionalDetails)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#2e7d32',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {showDevotionalDetails ? 'Collapse ▲' : 'Read Devotional ▼'}
          </button>
        </div>

        {/* Verse Snippet */}
        <div style={{ fontSize: '12px', color: '#334155', fontStyle: 'italic', fontFamily: 'var(--font-serif, Cormorant Garamond, serif)', wordBreak: 'break-word', lineHeight: 1.4 }}>
          <strong style={{ fontStyle: 'normal', color: '#d4af37' }}>📖 {verse.reference}: </strong>
          "{verse.text}"
        </div>

        {/* Devotional Card (Expanded) */}
        {showDevotionalDetails && (
          <div
            style={{
              marginTop: '4px',
              paddingTop: '6px',
              borderTop: '1px solid rgba(46, 125, 50, 0.1)',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '8px 10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#2e7d32', fontWeight: 700, marginBottom: '3px' }}>
              <span>📜 DEVOTIONAL • {devotional.readTime}</span>
              <span style={{ color: '#64748b' }}>By {devotional.author}</span>
            </div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1b5e20', margin: '0 0 4px 0' }}>
              {devotional.title}
            </h4>
            <p style={{ fontSize: '11px', color: '#334155', lineHeight: 1.5, margin: '0 0 8px 0' }}>
              {devotional.fullText}
            </p>
            {devotional.reflectionPrompt && (
              <div style={{ background: 'rgba(46, 125, 50, 0.05)', padding: '6px 8px', borderRadius: '6px', marginBottom: '6px', borderLeft: '3px solid #2e7d32' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#2e7d32' }}>💡 Reflection: </span>
                <span style={{ fontSize: '11px', color: '#1e293b' }}>{devotional.reflectionPrompt}</span>
              </div>
            )}
            {devotional.prayer && (
              <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#475569' }}>
                <strong style={{ fontStyle: 'normal', color: '#d4af37' }}>🙏 Prayer: </strong>
                "{devotional.prayer}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Category Filter Pills Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              style={{
                backgroundColor: isActive ? '#2e7d32' : '#f1f5f9',
                color: isActive ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '14px',
                padding: '4px 11px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Story Viewer Fullscreen Modal */}
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
