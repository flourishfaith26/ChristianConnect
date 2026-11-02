'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import GroupCard from '@/components/GroupCard';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

interface Group {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  _count: { members: number };
  createdBy: { id: string; displayName: string } | null;
}

export default function FriendshipPage() {
  const { getToken } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', isPrivate: false, requiresApproval: false, maxMembers: '' });
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  const loadGroups = useCallback(async () => {
    const token = await getToken();
    const data = await apiRequest<Group[]>('/api/groups?type=friendship', { token: token ?? undefined });
    setGroups(data);
    setLoading(false);
  }, [getToken]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  async function joinGroup(groupId: string) {
    const token = await getToken();
    await apiRequest(`/api/groups/${groupId}/join`, { method: 'POST', token: token ?? undefined });
    setJoinedIds((prev) => new Set(prev).add(groupId));
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroup.name.trim()) return;
    setCreating(true);
    try {
      const token = await getToken();
      await apiRequest('/api/groups', {
        method: 'POST', token: token ?? undefined,
        body: JSON.stringify({
          name: newGroup.name, description: newGroup.description,
          type: 'friendship', isPrivate: newGroup.isPrivate,
          requiresApproval: newGroup.requiresApproval,
          maxMembers: newGroup.maxMembers ? parseInt(newGroup.maxMembers) : null,
        }),
      });
      setShowCreate(false);
      setNewGroup({ name: '', description: '', isPrivate: false, requiresApproval: false, maxMembers: '' });
      loadGroups();
    } finally {
      setCreating(false);
    }
  }

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <BackButton />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, marginBottom: '6px' }}>
            🤝 Friendship Groups
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Open communities for Christian believers to connect, share, and grow together.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/people" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            🔍 Find & Add Friends
          </Link>
          <button id="create-group-btn" type="button" className="btn btn-primary"
            onClick={() => setShowCreate(true)}>+ Create Group</button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <input
          id="friendship-search" type="text" className="form-input"
          placeholder="Search groups..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {/* Group Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>Loading groups...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          No groups found. Be the first to create one!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              joined={joinedIds.has(group.id)}
              onJoin={() => joinGroup(group.id)}
            />
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '24px',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <form onSubmit={createGroup} className="glass-strong animate-fade-in"
            style={{ width: '100%', maxWidth: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Create Friendship Group</h2>

            <div className="form-group">
              <label htmlFor="new-group-name" className="form-label">Group Name *</label>
              <input id="new-group-name" type="text" className="form-input"
                placeholder="e.g., Lagos Christians 2025" required
                value={newGroup.name} onChange={(e) => setNewGroup((p) => ({ ...p, name: e.target.value }))} />
            </div>

            <div className="form-group">
              <label htmlFor="new-group-desc" className="form-label">Description</label>
              <textarea id="new-group-desc" className="form-input" rows={3}
                placeholder="What is this group about?"
                value={newGroup.description}
                onChange={(e) => setNewGroup((p) => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="form-group">
              <label htmlFor="new-group-max" className="form-label">Max Members (optional)</label>
              <input id="new-group-max" type="number" className="form-input"
                placeholder="Leave blank for unlimited" min={2}
                value={newGroup.maxMembers}
                onChange={(e) => setNewGroup((p) => ({ ...p, maxMembers: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { key: 'isPrivate', label: 'Private group' },
                { key: 'requiresApproval', label: 'Require approval to join' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox"
                    checked={(newGroup as any)[key]}
                    onChange={(e) => setNewGroup((p) => ({ ...p, [key]: e.target.checked }))}
                    style={{ accentColor: 'var(--brand-primary)' }} />
                  {label}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button id="create-group-submit" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={creating}>
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
