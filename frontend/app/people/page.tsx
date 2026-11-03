'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import BackButton from '@/components/BackButton';
import FriendCard, { DiscoveryUser } from '@/components/FriendCard';
import FriendRequestsInbox from '@/components/FriendRequestsInbox';
import FriendsList from '@/components/FriendsList';

export default function PeoplePage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'discover' | 'requests' | 'friends'>('discover');

  // Discovery state
  const [users, setUsers] = useState<DiscoveryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDenomination, setFilterDenomination] = useState('all');
  const [filterCity, setFilterCity] = useState('all');

  // Inbox count state
  const [requestCount, setRequestCount] = useState<number>(0);

  const loadDiscovery = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (filterDenomination !== 'all') params.set('denomination', filterDenomination);
      if (filterCity !== 'all') params.set('city', filterCity);

      const res = await apiRequest<{ users: DiscoveryUser[] }>(`/api/friends/discovery?${params}`, {
        token: token ?? undefined,
      });
      setUsers(res.users || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [getToken, search, filterDenomination, filterCity]);

  const loadInboxCount = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<{ count: number }>('/api/friends/inbox', {
        token: token ?? undefined,
      });
      setRequestCount(res.count || 0);
    } catch {
      // Fallback
    }
  }, [getToken]);

  useEffect(() => {
    if (activeTab === 'discover') {
      loadDiscovery();
    }
    loadInboxCount();
  }, [activeTab, loadDiscovery, loadInboxCount]);

  const DENOMINATIONS = [
    { value: 'all', label: 'All Denominations' },
    { value: 'non_denominational', label: 'Non-denominational' },
    { value: 'baptist', label: 'Baptist' },
    { value: 'pentecostal', label: 'Pentecostal' },
    { value: 'reformed', label: 'Reformed' },
    { value: 'catholic', label: 'Catholic' },
  ];

  const CITIES = [
    { value: 'all', label: 'All Locations' },
    { value: 'dallas', label: 'Dallas, TX' },
    { value: 'houston', label: 'Houston, TX' },
    { value: 'austin', label: 'Austin, TX' },
  ];

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
        {/* Top Navigation Back Button */}
        <BackButton />

        {/* Page Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif, serif)', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
            🤝 People & Christian Friendship
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Discover believers, connect with shared group members, and manage your Christian community.
          </p>
        </div>

        {/* Tab Navigation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid rgba(46, 125, 50, 0.15)',
            marginBottom: '28px',
            paddingBottom: '2px',
          }}
        >
          <button
            onClick={() => setActiveTab('discover')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              color: activeTab === 'discover' ? '#2e7d32' : '#64748b',
              borderBottom: activeTab === 'discover' ? '3px solid #2e7d32' : '3px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            🔍 Discover People
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              color: activeTab === 'requests' ? '#2e7d32' : '#64748b',
              borderBottom: activeTab === 'requests' ? '3px solid #2e7d32' : '3px solid transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📩 Friend Requests</span>
            {requestCount > 0 && (
              <span
                style={{
                  backgroundColor: '#e11d48',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '10px',
                }}
              >
                {requestCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              color: activeTab === 'friends' ? '#2e7d32' : '#64748b',
              borderBottom: activeTab === 'friends' ? '3px solid #2e7d32' : '3px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            👥 My Friends
          </button>
        </div>

        {/* Tab 1: Discover People */}
        {activeTab === 'discover' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Filter Bar */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid rgba(46, 125, 50, 0.15)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              {/* Search Bar */}
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search by name or @handle..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '8px', color: '#94a3b8', fontSize: '14px' }}>
                  🔍
                </span>
              </div>

              {/* Denomination Filter */}
              <select
                value={filterDenomination}
                onChange={(e) => setFilterDenomination(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                }}
              >
                {DENOMINATIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              {/* City/Region Filter */}
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                }}
              >
                {CITIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* People Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                Loading discovery profiles...
              </div>
            ) : users.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid rgba(46, 125, 50, 0.15)',
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔎</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>No matching profiles found</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Try adjusting your search criteria or clearing filters.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {users.map((user) => (
                  <FriendCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Friend Requests Inbox */}
        {activeTab === 'requests' && (
          <FriendRequestsInbox
            onRequestHandled={() => {
              loadInboxCount();
              loadDiscovery();
            }}
          />
        )}

        {/* Tab 3: My Friends List */}
        {activeTab === 'friends' && <FriendsList />}
      </div>
    </div>
  );
}
