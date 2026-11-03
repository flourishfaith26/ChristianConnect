'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

import SidebarNav from '@/components/dashboard/SidebarNav';
import TopHeader from '@/components/dashboard/TopHeader';
import FeedCard, { FeedItem } from '@/components/dashboard/FeedCard';
import RightRail from '@/components/dashboard/RightRail';
import CreatePostModal from '@/components/dashboard/CreatePostModal';

interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  accountType: 'adult_verified' | 'adult_unverified' | 'minor_content_only';
  statementOfFaithAccepted: boolean;
  parentConsentGiven?: boolean;
  city?: string | null;
  region?: string | null;
}

export default function DashboardClient({ user: initialUser }: { user: User | null }) {
  const { getToken } = useAuth();
  const [user, setUser] = useState<User | null>(initialUser);
  const isMinor = user?.accountType === 'minor_content_only';

  // Desktop sidebars visibility state (visible by default on >= 1100px)
  const [desktopLeftVisible, setDesktopLeftVisible] = useState<boolean>(true);
  const [desktopRightVisible, setDesktopRightVisible] = useState<boolean>(true);

  // Mobile off-canvas drawers state (DRAWN IN / HIDDEN by default on phone/tablet screens)
  const [mobileLeftOpen, setMobileLeftOpen] = useState<boolean>(false);
  const [mobileRightOpen, setMobileRightOpen] = useState<boolean>(false);

  // Responsive device detector
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Feed & Spotlight state
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [spotlightData, setSpotlightData] = useState<any | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(true);

  // Hub data state for suggested connections
  const [hubUsers, setHubUsers] = useState<any[]>([]);

  // Create Post Modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Handle window resizing & responsive breakpoint detection (< 1100px)
  useEffect(() => {
    const handleResize = () => {
      const isSmall = window.innerWidth < 1100;
      setIsMobile(isSmall);
      if (isSmall) {
        // On phone/tablet screen dimension: sidebars are drawn in (closed)
        setMobileLeftOpen(false);
        setMobileRightOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleLeftSidebar = () => {
    if (isMobile || (typeof window !== 'undefined' && window.innerWidth < 1100)) {
      setMobileLeftOpen((prev) => !prev);
    } else {
      setDesktopLeftVisible((prev) => !prev);
    }
  };

  const toggleRightRail = () => {
    if (isMobile || (typeof window !== 'undefined' && window.innerWidth < 1100)) {
      setMobileRightOpen((prev) => !prev);
    } else {
      setDesktopRightVisible((prev) => !prev);
    }
  };

  // ── Fetch Feed Data ──────────────────────────────────────────────────────────
  const loadFeed = useCallback(async (cat: string = 'All') => {
    setLoadingFeed(true);
    try {
      const token = await getToken();
      const res = await apiRequest<{ todaySpotlight: any; feed: FeedItem[] }>(
        `/api/feed?category=${encodeURIComponent(cat)}`,
        { token: token ?? undefined }
      );
      setSpotlightData(res.todaySpotlight);
      setFeedItems(res.feed);
    } catch {
      // Fallback initial feed items if backend is connecting
    } finally {
      setLoadingFeed(false);
    }
  }, [getToken]);

  // ── Fetch Hub Data ───────────────────────────────────────────────────────────
  const loadHub = useCallback(async () => {
    if (!user?.city && !user?.region) return;
    try {
      const token = await getToken();
      const res = await apiRequest<{ users: any[] }>('/api/hubs', { token: token ?? undefined });
      setHubUsers(res.users || []);
    } catch {
      // Ignore
    }
  }, [getToken, user?.city, user?.region]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const me = await apiRequest<User>('/api/profile/me', { token: token ?? undefined });
        if (me?.displayName) {
          setUser((prev) => ({
            ...prev,
            ...me,
            avatarUrl: me.avatarUrl || prev?.avatarUrl,
            displayName: me.displayName || prev?.displayName || 'Flourish Faith',
          }));
        }
      } catch {
        // Ignore fallback
      }
    })();
  }, [getToken]);

  useEffect(() => {
    loadFeed(activeCategory);
  }, [activeCategory, loadFeed]);

  useEffect(() => {
    loadHub();
  }, [loadHub]);

  const handlePostCreated = (newPost: FeedItem) => {
    setFeedItems((prev) => [newPost, ...prev]);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base, #FAFAF7)', position: 'relative', width: '100%', overflowX: 'hidden' }}>
      
      {/* ── 1. Desktop Left Sidebar (Only in desktop mode when >= 1100px) ── */}
      {!isMobile && desktopLeftVisible && (
        <div className="dashboard-desktop-sidebar" style={{ flexShrink: 0, width: '280px' }}>
          <SidebarNav user={user} isMobileDrawer={false} />
        </div>
      )}

      {/* ── 2. Mobile Left Drawer (Off-Canvas overlay, drawn in by default) ── */}
      <SidebarNav
        user={user}
        isOpen={mobileLeftOpen}
        onClose={() => setMobileLeftOpen(false)}
        isMobileDrawer={true}
      />

      {/* ── 3. Center Content Feed + Top Bar (Middle) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%', minHeight: '100vh', boxSizing: 'border-box' }}>
        {/* Top Header with Drawer Toggles, Search, Stories, Daily Spotlight, Hub Toggle & Category Tabs */}
        <TopHeader
          activeCategory={activeCategory}
          onSelectCategory={(cat) => setActiveCategory(cat)}
          onOpenCreatePost={() => setShowCreateModal(true)}
          user={user}
          spotlightData={spotlightData}
          onToggleLeftDrawer={toggleLeftSidebar}
          onToggleRightDrawer={toggleRightRail}
          leftDrawerOpen={isMobile ? mobileLeftOpen : desktopLeftVisible}
          rightDrawerOpen={isMobile ? mobileRightOpen : desktopRightVisible}
        />

        {/* Main Feed Container (Community Social Feed) */}
        <main
          style={{
            flex: 1,
            padding: isMobile ? '12px 10px' : '16px 20px',
            maxWidth: '760px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          {/* Minor Account Banner */}
          {isMinor && user && !user.parentConsentGiven && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
                fontSize: '13px',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⏳</span>
              <span>
                <strong>Content-Only Mode:</strong> Awaiting parental consent approval. Interactive chat and matching features remain safely disabled.
              </span>
            </div>
          )}

          {/* Feed Title Bar with Quick Draw Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                {activeCategory === 'All' ? '⚡ Community Social Feed' : `📂 ${activeCategory} Feed`}
              </h2>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              {feedItems.length} posts
            </span>
          </div>

          {/* ── Scrollable Mixed Social Content Feed ── */}
          {loadingFeed ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
              Loading faith feed...
            </div>
          ) : feedItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid rgba(46, 125, 50, 0.15)',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🕊️</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>No posts in this category yet</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Be the first to share a testimony or encouragement with the community!
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                style={{
                  backgroundColor: '#2e7d32',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Create Post
              </button>
            </div>
          ) : (
            feedItems.map((item) => <FeedCard key={item.id} item={item} />)
          )}
        </main>
      </div>

      {/* ── 4. Desktop Right Rail (Only in desktop mode when >= 1100px) ── */}
      {!isMobile && desktopRightVisible && (
        <div className="dashboard-desktop-rightrail" style={{ flexShrink: 0, width: '300px' }}>
          <RightRail user={user} hubUsers={hubUsers} isMobileDrawer={false} />
        </div>
      )}

      {/* ── 5. Mobile Right Drawer (Off-Canvas overlay, drawn in by default) ── */}
      <RightRail
        user={user}
        hubUsers={hubUsers}
        isOpen={mobileRightOpen}
        onClose={() => setMobileRightOpen(false)}
        isMobileDrawer={true}
      />

      {/* ── Create Post Modal ── */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
          initialCategory={activeCategory}
          user={user}
        />
      )}
    </div>
  );
}
