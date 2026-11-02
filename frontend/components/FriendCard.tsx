'use client';

import { useState } from 'react';
import FriendRequestButton from './FriendRequestButton';
import ReportButton from './ReportButton';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

export interface DiscoveryUser {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl: string;
  accountType: string;
  denomination: string;
  city: string;
  region: string;
  isMentor?: boolean;
  sharedContext?: string;
  friendshipStatus?: string;
  friendshipId?: string | null;
}

interface FriendCardProps {
  user: DiscoveryUser;
  onBlock?: (userId: string) => void;
}

export default function FriendCard({ user, onBlock }: FriendCardProps) {
  const { getToken } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [blocked, setBlocked] = useState(user.friendshipStatus === 'blocked');

  const handleBlockUser = async () => {
    try {
      const token = await getToken();
      await apiRequest('/api/friends/block', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ targetUserId: user.id }),
      });
      setBlocked(true);
      if (onBlock) onBlock(user.id);
    } catch {
      // Ignore
    } finally {
      setShowMenu(false);
    }
  };

  if (blocked) {
    return null; // Safety Rule: Hidden after block
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid rgba(46, 125, 50, 0.15)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        position: 'relative',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Top Bar: Avatar, Info & Menu */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #2e7d32',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                {user.displayName}
              </h3>

              {/* Verified Badges */}
              {user.accountType === 'adult_verified' && (
                <span
                  title="Identity & Age Verified"
                  style={{
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '10px',
                  }}
                >
                  ✓ Verified Adult
                </span>
              )}

              {user.isMentor && (
                <span
                  title="New Convert Mentor"
                  style={{
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '10px',
                  }}
                >
                  🌱 Mentor
                </span>
              )}
            </div>

            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '2px' }}>
              {user.handle}
            </span>
          </div>
        </div>

        {/* Overflow Menu Button ⋮ */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            ⋮
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '24px',
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid rgba(46, 125, 50, 0.2)',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                zIndex: 100,
                padding: '6px',
                minWidth: '120px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <ReportButton targetType="user" targetId={user.id} />
              <button
                onClick={handleBlockUser}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#e11d48',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '6px 8px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                🚫 Block User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Shared Context Line */}
      {user.sharedContext && (
        <div
          style={{
            fontSize: '12px',
            color: '#334155',
            backgroundColor: '#fafaf7',
            padding: '6px 10px',
            borderRadius: '8px',
            borderLeft: '3px solid #2e7d32',
          }}
        >
          🤝 {user.sharedContext}
        </div>
      )}

      {/* Card Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          📍 {user.city}, {user.region}
        </span>

        <FriendRequestButton
          targetUserId={user.id}
          initialStatus={user.friendshipStatus || 'none'}
          size="sm"
        />
      </div>
    </div>
  );
}
