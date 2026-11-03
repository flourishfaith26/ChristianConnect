'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import Logo from '@/components/Logo';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';

interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  accountType: 'adult_verified' | 'adult_unverified' | 'minor_content_only';
  city?: string | null;
  region?: string | null;
}

interface NavGroup {
  id: string;
  title: string;
  defaultExpanded: boolean;
  items: { icon: string; label: string; href: string; id: string; minorAllowed?: boolean }[];
}

interface SidebarNavProps {
  user: User | null;
  isOpen?: boolean;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export default function SidebarNav({
  user,
  isOpen = true,
  onClose,
  isMobileDrawer = false,
}: SidebarNavProps) {
  const pathname = usePathname();
  const isMinor = user?.accountType === 'minor_content_only';
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const NAV_GROUPS: NavGroup[] = [
    {
      id: 'group-connect',
      title: 'Connect',
      defaultExpanded: true,
      items: [
        { icon: '💬', label: 'Messages', href: '/chat', id: 'nav-chat', minorAllowed: false },
        { icon: '👥', label: 'People & Friends', href: '/people', id: 'nav-people', minorAllowed: false },
        { icon: '🤝', label: 'Friendship Groups', href: '/friendship', id: 'nav-friendship', minorAllowed: false },
        { icon: '❤️', label: 'Christian Dating', href: '/dating', id: 'nav-dating', minorAllowed: false },
        { icon: '👨‍👩‍👧', label: 'Family & Marriage', href: '/family-devotionals', id: 'nav-family', minorAllowed: true },
        { icon: '🛡️', label: 'Accountability', href: '/accountability', id: 'nav-accountability', minorAllowed: false },
        { icon: '🙏', label: 'Prayer Partners', href: '/prayer', id: 'nav-prayer', minorAllowed: false },
        { icon: '🌱', label: 'Mentorship', href: '/mentorship', id: 'nav-mentorship', minorAllowed: false },
      ],
    },
    {
      id: 'group-grow',
      title: 'Grow in Faith',
      defaultExpanded: true,
      items: [
        { icon: '📖', label: 'Bible Study', href: '/bible-study', id: 'nav-bible-study', minorAllowed: true },
        { icon: '📚', label: 'Scripture Explorer', href: '/scripture', id: 'nav-scripture', minorAllowed: true },
        { icon: '💡', label: 'Scripture Q&A', href: '/faith-chat', id: 'nav-faith-chat', minorAllowed: true },
        { icon: '📅', label: 'Reading Plans', href: '/reading-plans', id: 'nav-reading-plans', minorAllowed: true },
        { icon: '☀️', label: 'Devotionals', href: '/devotionals', id: 'nav-devotionals', minorAllowed: true },
        { icon: '🎓', label: 'Discipleship Courses', href: '/courses', id: 'nav-courses', minorAllowed: true },
        { icon: '⚔️', label: 'Apologetics', href: '/apologetics', id: 'nav-apologetics', minorAllowed: true },
        { icon: '🧠', label: 'Verse Challenge', href: '/verse-challenge', id: 'nav-verse-challenge', minorAllowed: true },
      ],
    },
    {
      id: 'group-content',
      title: 'Content & Media',
      defaultExpanded: false,
      items: [
        { icon: '📔', label: 'Faith Journal', href: '/journal', id: 'nav-journal', minorAllowed: true },
        { icon: '📸', label: 'Stories', href: '/stories', id: 'nav-stories', minorAllowed: false },
        { icon: '🕊️', label: 'Testimonies', href: '/testimonies', id: 'nav-testimonies', minorAllowed: true },
        { icon: '🎥', label: 'Live Sermons', href: '/livestreams', id: 'nav-livestreams', minorAllowed: true },
        { icon: '🎙️', label: 'Audio Rooms', href: '/audio-rooms', id: 'nav-audio-rooms', minorAllowed: false },
        { icon: '🗓️', label: 'Events Calendar', href: '/events', id: 'nav-events', minorAllowed: true },
      ],
    },
    {
      id: 'group-community',
      title: 'Community',
      defaultExpanded: false,
      items: [
        { icon: '⛪', label: 'Church Partner', href: '/partner/dashboard', id: 'nav-partner', minorAllowed: true },
        { icon: '🌍', label: 'Missionary Spotlight', href: '/missionaries', id: 'nav-missionaries', minorAllowed: true },
        { icon: '💳', label: 'Giving & Subscriptions', href: '/giving', id: 'nav-giving', minorAllowed: false },
      ],
    },
    {
      id: 'group-account',
      title: 'Account & Safety',
      defaultExpanded: false,
      items: [
        { icon: '👤', label: 'My Faith Profile', href: '/profile', id: 'nav-profile', minorAllowed: true },
        { icon: '⚙️', label: 'Preferences & A11y', href: '/settings/preferences', id: 'nav-preferences', minorAllowed: true },
        { icon: '🛡️', label: 'Safety Center', href: '/safety', id: 'nav-safety', minorAllowed: true },
      ],
    },
  ];

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'group-connect': true,
    'group-grow': true,
    'group-content': false,
    'group-community': false,
    'group-account': false,
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleHandle = user?.displayName
    ? `@${user.displayName.toLowerCase().replace(/\s+/g, '_')}`
    : '@believer';

  const sidebarContent = (
    <aside
      className="custom-scrollbar"
      style={{
        width: '280px',
        flexShrink: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid rgba(46, 125, 50, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        height: isMobileDrawer ? '100%' : '100vh',
        position: isMobileDrawer ? 'relative' : 'sticky',
        top: 0,
        overflowY: 'auto',
        padding: '16px 14px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Brand Logo & Mobile Close Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(46, 125, 50, 0.1)',
        }}
      >
        <Logo size="sm" withLink href="/dashboard" />
        {isMobileDrawer && onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              border: 'none',
              fontSize: '16px',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            aria-label="Close navigation drawer"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Real Social Profile Summary Card ── */}
      <Link
        href="/profile"
        onClick={() => {
          if (isMobileDrawer && onClose) onClose();
        }}
        style={{
          textDecoration: 'none',
          display: 'block',
          backgroundColor: '#fafaf7',
          border: '1px solid rgba(46, 125, 50, 0.18)',
          borderRadius: '14px',
          padding: '14px',
          marginBottom: '16px',
          transition: 'all 0.15s ease',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
          e.currentTarget.style.borderColor = '#2e7d32';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 125, 50, 0.1)';
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
          e.currentTarget.style.borderColor = 'rgba(46, 125, 50, 0.18)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#2e7d32',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '18px',
              border: '2px solid #d4af37',
              boxShadow: '0 2px 6px rgba(46, 125, 50, 0.2)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : user?.displayName ? (
              user.displayName[0].toUpperCase()
            ) : (
              'C'
            )}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  margin: 0,
                }}
              >
                {user?.displayName || 'Faith Believer'}
              </h4>
              <span style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>Edit ✏️</span>
            </div>
            <p
              style={{
                fontSize: '12px',
                color: '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: '2px 0 0 0',
              }}
            >
              {handleHandle}
            </p>
          </div>
        </div>

        {isMinor && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#d97706',
              backgroundColor: '#fef3c7',
              padding: '3px 8px',
              borderRadius: '6px',
              marginBottom: '10px',
              display: 'inline-block',
            }}
          >
            📘 Content-Only Account
          </div>
        )}

        {/* Stat Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '4px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '8px 4px',
            border: '1px solid rgba(46, 125, 50, 0.1)',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#2e7d32' }}>4</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Groups</div>
          </div>
          <div style={{ borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#d4af37' }}>18</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Prayers</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#e11d48' }}>7🔥</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Streak</div>
          </div>
        </div>
      </Link>

      {/* ── Category Accordion Groups ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => !isMinor || item.minorAllowed);
          if (visibleItems.length === 0) return null;

          const isExpanded = expandedGroups[group.id];

          return (
            <div key={group.id} style={{ marginBottom: '2px' }}>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                <span>{group.title}</span>
                <span style={{ fontSize: '10px', transition: 'transform 0.2s' }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.id}
                        id={item.id}
                        href={item.href}
                        onClick={() => {
                          if (isMobileDrawer && onClose) onClose();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#2e7d32' : '#334155',
                          backgroundColor: isActive ? '#e8f5e9' : 'transparent',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer User Info & Prominent Log Out Button ── */}
      <div
        style={{
          borderTop: '1px solid rgba(46, 125, 50, 0.15)',
          paddingTop: '14px',
          marginTop: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserButton />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#1e293b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0,
              }}
            >
              {user?.displayName || 'User'}
            </p>
            <p
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: '2px 0 0 0',
              }}
            >
              {user?.email}
            </p>
          </div>
        </div>

        {/* Dedicated Prominent Log Out Button */}
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fca5a5',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#dc2626';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
            e.currentTarget.style.color = '#b91c1c';
            e.currentTarget.style.borderColor = '#fca5a5';
          }}
        >
          <span style={{ fontSize: '15px' }}>🚪</span>
          <span>Log Out</span>
        </button>

        {/* Confirmation Modal */}
        <LogoutConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
        />
      </div>
    </aside>
  );

  if (isMobileDrawer) {
    return (
      <div
        className="dashboard-mobile-drawer"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          pointerEvents: isOpen ? 'auto' : 'none',
          visibility: isOpen ? 'visible' : 'hidden',
        }}
      >
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.25s ease-out',
          }}
        />

        {/* Drawer panel */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '280px',
            maxWidth: '85vw',
            backgroundColor: '#ffffff',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.25)',
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 10,
          }}
        >
          {sidebarContent}
        </div>
      </div>
    );
  }

  return sidebarContent;
}
