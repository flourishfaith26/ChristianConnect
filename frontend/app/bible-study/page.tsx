'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import GroupCard from '@/components/GroupCard';
import BackButton from '@/components/BackButton';

interface Group {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  bibleTranslation: string | null;
  denominationTag: string | null;
  studyFocus: string | null;
  _count: { members: number };
  createdBy: { id: string; displayName: string } | null;
}

const TRANSLATIONS = ['NIV', 'ESV', 'KJV', 'NKJV', 'NLT', 'CSB', 'NASB'];
const DENOMINATIONS = [
  { value: '', label: 'Any denomination' },
  { value: 'non_denominational', label: 'Non-denominational' },
  { value: 'baptist', label: 'Baptist' },
  { value: 'catholic', label: 'Catholic' },
  { value: 'pentecostal', label: 'Pentecostal' },
  { value: 'orthodox', label: 'Orthodox' },
  { value: 'reformed', label: 'Reformed' },
];

export default function BibleStudyPage() {
  const { getToken } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTranslation, setFilterTranslation] = useState('');
  const [filterDenomination, setFilterDenomination] = useState('');
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '', description: '', studyFocus: '',
    bibleTranslation: 'NIV', denominationTag: '', maxMembers: '',
  });

  const loadGroups = useCallback(async () => {
    const token = await getToken();
    const params = new URLSearchParams({ type: 'bible_study' });
    if (filterTranslation) params.set('translation', filterTranslation);
    if (filterDenomination) params.set('denomination', filterDenomination);
    const data = await apiRequest<Group[]>(`/api/groups?${params}`, { token: token ?? undefined });
    setGroups(data);
    setLoading(false);
  }, [getToken, filterTranslation, filterDenomination]);

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
          type: 'bible_study', bibleTranslation: newGroup.bibleTranslation,
          denominationTag: newGroup.denominationTag || null,
          studyFocus: newGroup.studyFocus || null,
          maxMembers: newGroup.maxMembers ? parseInt(newGroup.maxMembers) : null,
        }),
      });
      setShowCreate(false);
      setNewGroup({ name: '', description: '', studyFocus: '', bibleTranslation: 'NIV', denominationTag: '', maxMembers: '' });
      loadGroups();
    } finally { setCreating(false); }
  }

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.description?.toLowerCase().includes(search.toLowerCase()) ||
    g.studyFocus?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <BackButton />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, marginBottom: '6px' }}>📖 Bible Study Buddies</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Join or create Bible study groups organized by book, topic, translation, or denomination.
          </p>
        </div>
        <button id="create-study-btn" type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create Study Group
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          id="study-search" type="text" className="form-input"
          placeholder="Search by name, topic..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', minWidth: '180px' }}
        />
        <select id="filter-translation" className="form-input" value={filterTranslation}
          onChange={(e) => setFilterTranslation(e.target.value)} style={{ width: '130px' }}>
          <option value="">Any Bible</option>
          {TRANSLATIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select id="filter-denomination" className="form-input" value={filterDenomination}
          onChange={(e) => setFilterDenomination(e.target.value)} style={{ width: '200px' }}>
          {DENOMINATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>Loading groups...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
          No study groups found. Be the first to create one!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map((group) => (
            <GroupCard key={group.id} group={group}
              joined={joinedIds.has(group.id)} onJoin={() => joinGroup(group.id)} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <form onSubmit={createGroup} className="glass-strong animate-fade-in"
            style={{ width: '100%', maxWidth: '500px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Create Bible Study Group</h2>

            <div className="form-group">
              <label htmlFor="study-name" className="form-label">Group Name *</label>
              <input id="study-name" type="text" className="form-input" required
                placeholder="e.g., Romans Deep Dive — ESV"
                value={newGroup.name} onChange={(e) => setNewGroup((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label htmlFor="study-focus" className="form-label">Study Focus</label>
              <input id="study-focus" type="text" className="form-input"
                placeholder="e.g., Book of Romans, Prophecy, Character Studies"
                value={newGroup.studyFocus} onChange={(e) => setNewGroup((p) => ({ ...p, studyFocus: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label htmlFor="study-translation" className="form-label">Bible Translation</label>
                <select id="study-translation" className="form-input"
                  value={newGroup.bibleTranslation} onChange={(e) => setNewGroup((p) => ({ ...p, bibleTranslation: e.target.value }))}>
                  {TRANSLATIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="study-denomination" className="form-label">Denomination</label>
                <select id="study-denomination" className="form-input"
                  value={newGroup.denominationTag} onChange={(e) => setNewGroup((p) => ({ ...p, denominationTag: e.target.value }))}>
                  {DENOMINATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="study-desc" className="form-label">Description</label>
              <textarea id="study-desc" className="form-input" rows={3}
                placeholder="What will your group study? When do you meet?"
                value={newGroup.description} onChange={(e) => setNewGroup((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button id="create-study-submit" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={creating}>
                {creating ? 'Creating...' : 'Create Study Group 📖'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
