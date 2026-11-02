'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import ReportButton from './ReportButton';

export interface FriendUser {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl: string;
  accountType: string;
  denomination: string;
  city: string;
  region: string;
  isMentor?: boolean;
  sharedGroups: string[];
  mutualFriendsCount: number;
}

export default function FriendsList() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (search) params.set('q', search);

      const res = await apiRequest<{ friends: FriendUser[] }>(`/api/friends/list?${params}`, {
        token: token ?? undefined,
      });
      setFriends(res.friends || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [getToken, search]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleRemove = async (friendId: string) => {
    setActionLoading((prev) => ({ ...prev, [friendId]: true }));
    try {
      const token = await getToken();
      await apiRequest('/api/friends/remove', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ friendId }),
      });
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch {
      // Ignore
    } finally {
      setActionLoading((prev) => ({ ...prev, [friendId]: false }));
    }
  };

  const handleBlock = async (friendId: string) => {
    setActionLoading((prev) => ({ ...prev, [friendId]: true }));
    try {
      const token = await getToken();
      await apiRequest('/api/friends/block', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ targetUserId: friendId }),
      });
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch {
      // Ignore
    } finally {
      setActionLoading((prev) => ({ ...prev, [friendId]: false }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search friends by name or handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px 10px 36px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            outline: 'none',
            backgroundColor: '#ffffff',
          }}
        />
        <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8', fontSize: '14px' }}>
          🔍
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading friends list...
        </div>
      ) : friends.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(46, 125, 50, 0.15)',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>👥</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>No friends added yet</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Connect with believers on the People Discovery tab to build your community.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {friends.map((friend) => (
            <div
              key={friend.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid rgba(46, 125, 50, 0.15)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={friend.avatarUrl}
                    alt={friend.displayName}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2e7d32' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                      {friend.displayName}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{friend.handle}</span>
                  </div>
                </div>

                <ReportButton targetType="user" targetId={friend.id} />
              </div>

              {/* Shared Groups & Mutual Stats */}
              <div style={{ fontSize: '12px', color: '#475569', backgroundColor: '#fafaf7', padding: '6px 10px', borderRadius: '8px' }}>
                🤝 {friend.sharedGroups.length > 0 ? `In ${friend.sharedGroups[0]}` : `${friend.mutualFriendsCount} Mutual Friends`}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => router.push(`/chat`)}
                  style={{
                    flex: 1,
                    backgroundColor: '#2e7d32',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span>💬 Message</span>
                </button>
                <button
                  onClick={() => handleRemove(friend.id)}
                  disabled={actionLoading[friend.id]}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Unfriend
                </button>
                <button
                  onClick={() => handleBlock(friend.id)}
                  disabled={actionLoading[friend.id]}
                  style={{
                    backgroundColor: '#fff1f2',
                    color: '#e11d48',
                    border: '1px solid #fecdd3',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Block
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
