'use client';

import Link from 'next/link';
import { useState } from 'react';
import FriendRequestButton from '@/components/FriendRequestButton';

interface RightRailProps {
  user: any;
  hubUsers?: any[];
  isOpen?: boolean;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export default function RightRail({
  user,
  hubUsers = [],
  isOpen = true,
  onClose,
  isMobileDrawer = false,
}: RightRailProps) {
  const [prayedIds, setPrayedIds] = useState<Record<string, boolean>>({});

  const UPCOMING_EVENTS = [
    { id: 'ev1', title: 'Global Prayer & Fasting Night', date: 'Tomorrow, 7:00 PM', location: 'Online Audio Room' },
    { id: 'ev2', title: 'Youth & Young Adult Worship', date: 'Fri, Aug 12 • 6:30 PM', location: 'Grace Community Center' },
  ];

  const URGENT_PRAYERS = [
    { id: 'p1', title: 'Healing for Sister Mary (Pneumonia)', author: 'Caleb V.', count: 48 },
    { id: 'p2', title: 'Peace & Protection in Mission Trip', author: 'Brother David', count: 32 },
  ];

  function togglePrayed(id: string) {
    setPrayedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const railContent = (
    <aside
      className="custom-scrollbar"
      style={{
        width: '300px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: isMobileDrawer ? 'relative' : 'sticky',
        top: 0,
        height: isMobileDrawer ? '100%' : '100vh',
        overflowY: 'auto',
        padding: isMobileDrawer ? '16px 16px 32px' : '16px 12px 16px 0',
        backgroundColor: isMobileDrawer ? '#ffffff' : 'transparent',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Mobile Drawer Header ── */}
      {isMobileDrawer && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(46, 125, 50, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>✨</span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Community Hub</h3>
          </div>
          {onClose && (
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
              aria-label="Close community drawer"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ── Upcoming Events ── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid rgba(46, 125, 50, 0.15)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>🗓️</span>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Upcoming Events</h3>
          </div>
          <Link
            href="/events"
            onClick={() => {
              if (isMobileDrawer && onClose) onClose();
            }}
            style={{ fontSize: '11px', fontWeight: 600, color: '#2e7d32', textDecoration: 'none' }}
          >
            See All →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {UPCOMING_EVENTS.map((ev) => (
            <div
              key={ev.id}
              style={{
                backgroundColor: '#fafaf7',
                borderRadius: '10px',
                padding: '10px',
                border: '1px solid rgba(46, 125, 50, 0.1)',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '3px' }}>{ev.title}</h4>
              <p style={{ fontSize: '11px', color: '#d4af37', fontWeight: 600, margin: '0 0 2px 0' }}>{ev.date}</p>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>📍 {ev.location}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Urgent Prayer Needs ── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid rgba(225, 29, 72, 0.2)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>🚨</span>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#9f1239', margin: 0 }}>Urgent Prayer Needs</h3>
          </div>
          <Link
            href="/prayer"
            onClick={() => {
              if (isMobileDrawer && onClose) onClose();
            }}
            style={{ fontSize: '11px', fontWeight: 600, color: '#e11d48', textDecoration: 'none' }}
          >
            Wall →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {URGENT_PRAYERS.map((pr) => {
            const isPrayed = prayedIds[pr.id];
            return (
              <div
                key={pr.id}
                style={{
                  backgroundColor: '#fff1f2',
                  borderRadius: '10px',
                  padding: '10px',
                  border: '1px solid #fecdd3',
                }}
              >
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#881337', marginBottom: '4px' }}>
                  {pr.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: '#9f1239' }}>By {pr.author}</span>
                  <button
                    onClick={() => togglePrayed(pr.id)}
                    style={{
                      backgroundColor: isPrayed ? '#e11d48' : '#ffffff',
                      color: isPrayed ? '#ffffff' : '#e11d48',
                      border: '1px solid #e11d48',
                      borderRadius: '12px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isPrayed ? '✓ Prayed 🙏' : 'Pray 🙏'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Suggested for You / Local Hub Believers ── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid rgba(46, 125, 50, 0.15)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>👥</span>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Suggested Connections</h3>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {user?.city ? `Near ${user.city}` : 'Believers'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {hubUsers.length > 0
            ? hubUsers.slice(0, 3).map((h) => (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    backgroundColor: '#fafaf7',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#2e7d32',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {h.displayName ? h.displayName[0].toUpperCase() : 'C'}
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{h.displayName}</p>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{h.profile?.denomination || 'Believer'}</span>
                    </div>
                  </div>
                  <FriendRequestButton targetUserId={h.id} size="sm" />
                </div>
              ))
            : [
                { id: 'user_grace_believer', name: 'Grace Believer', sub: 'Romans Study Group' },
                { id: 'user_david_k', name: 'David K.', sub: 'Worship Leader' },
                { id: 'user_sarah_m', name: 'Sarah M.', sub: 'Prayer Partner' },
              ].map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    backgroundColor: '#fafaf7',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: '#2e7d32',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {s.name[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{s.name}</p>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{s.sub}</span>
                    </div>
                  </div>
                  <FriendRequestButton targetUserId={s.id} size="sm" />
                </div>
              ))}
        </div>
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
            right: 0,
            bottom: 0,
            width: '320px',
            maxWidth: '85vw',
            backgroundColor: '#ffffff',
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.25)',
            transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 10,
          }}
        >
          {railContent}
        </div>
      </div>
    );
  }

  return railContent;
}
