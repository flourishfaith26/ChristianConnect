'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import Logo from '@/components/Logo';

const SECTIONS = [
  { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
  { icon: '🤝', label: 'Friendship', href: '/friendship' },
  { icon: '📖', label: 'Bible Study', href: '/bible-study' },
  { icon: '🙏', label: 'Prayer Wall', href: '/prayer' },
  { icon: '💬', label: 'Messages & Chat', href: '/chat' },
  { icon: '🛡️', label: 'Accountability', href: '/accountability' },
  { icon: '🌱', label: 'Mentorship', href: '/mentorship' },
  { icon: '⚔️', label: 'Apologetics', href: '/apologetics' },
  { icon: '🕊️', label: 'Testimonies', href: '/testimonies' },
  { icon: '📖', label: 'Scripture Q&A', href: '/faith-chat' },
  { icon: '📅', label: 'Reading Plans', href: '/reading-plans' },
  { icon: '☀️', label: 'Devotionals', href: '/devotionals' },
  { icon: '📚', label: 'Scripture Explorer', href: '/scripture' },
  { icon: '❤️', label: 'Christian Dating', href: '/dating' },
  { icon: '📸', label: 'Faith Stories', href: '/stories' },
  { icon: '🧠', label: 'Verse Challenge', href: '/verse-challenge' },
  { icon: '📔', label: 'Faith Journal', href: '/journal' },
  { icon: '🗓️', label: 'Events Calendar', href: '/events' },
  { icon: '🎥', label: 'Live Sermons', href: '/livestreams' },
  { icon: '🎙️', label: 'Audio Rooms', href: '/audio-rooms' },
  { icon: '🌱', label: 'Discipleship Courses', href: '/courses' },
  { icon: '👨‍👩‍👧', label: 'Family & Marriage', href: '/family-devotionals' },
  { icon: '⛪', label: 'Church Partner', href: '/partner/dashboard' },
  { icon: '💳', label: 'Giving & Subscriptions', href: '/giving' },
  { icon: '🌍', label: 'Missionary Spotlight', href: '/missionaries' },
  { icon: '⚙️', label: 'Settings & A11y', href: '/settings/preferences' },
  { icon: '🛡️', label: 'Safety Center', href: '/safety' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Hide navigation on sign-in, sign-up, or onboarding landing pages if preferred
  const isAuthPage = ['/sign-in', '/sign-up', '/onboarding'].includes(pathname);
  const isLandingPage = pathname === '/';
  const isDashboard = pathname === '/dashboard';

  if (isAuthPage) return null;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid rgba(46, 125, 50, 0.15)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        padding: '0 1rem',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Left Section: Back to Dashboard & Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isDashboard && !isLandingPage && (
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                border: '1px solid rgba(46, 125, 50, 0.3)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2e7d32';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e8f5e9';
                e.currentTarget.style.color = '#2e7d32';
              }}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>←</span>
              <span>Dashboard</span>
            </button>
          )}

          <Logo size="sm" withLink href={isSignedIn ? '/dashboard' : '/'} />
        </div>

        {/* Middle Section: Quick Section Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <span>Explore Sections</span>
            <span style={{ fontSize: '0.75rem' }}>▼</span>
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                onClick={() => setDropdownOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 110,
                }}
              />

              {/* Dropdown Menu */}
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '280px',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(46, 125, 50, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  zIndex: 120,
                  padding: '0.5rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#64748b',
                    padding: '0.4rem 0.6rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  All Platform Sessions
                </div>

                {SECTIONS.map((sec) => {
                  const isActive = pathname === sec.href;
                  return (
                    <Link
                      key={sec.href}
                      href={sec.href}
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.5rem 0.6rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        color: isActive ? '#2e7d32' : '#1e293b',
                        backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                        fontWeight: isActive ? 600 : 400,
                        transition: 'background 0.15s',
                      }}
                    >
                      <span>{sec.icon}</span>
                      <span>{sec.label}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right Section: User Profile & Quick Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/safety"
            style={{
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>🛡️</span>
            <span style={{ display: 'none' }}>Safety</span>
          </Link>

          {isSignedIn ? (
            <UserButton />
          ) : (
            <Link
              href="/sign-in"
              style={{
                backgroundColor: '#2e7d32',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
