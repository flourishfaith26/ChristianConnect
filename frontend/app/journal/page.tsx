'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import BackButton from '@/components/BackButton';

interface JournalEntry {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
}

export default function JournalPage() {
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedTag) params.set('tag', selectedTag);

      const res = await apiRequest<JournalEntry[]>(`/api/journal?${params}`, {
        token: token ?? undefined,
      });
      setEntries(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken, search, selectedTag]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSaving(true);
    try {
      const token = await getToken();
      const tags = tagInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const newEntry = await apiRequest<JournalEntry>('/api/journal', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ title: title.trim(), body: body.trim(), tags }),
      });

      setEntries(prev => [newEntry, ...prev]);
      setShowCreate(false);
      setTitle('');
      setBody('');
      setTagInput('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create journal entry');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:4000/api/journal/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `christianconnect-journal-${Date.now()}.md`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Could not export journal.');
    }
  };

  const allTags = Array.from(new Set(entries.flatMap(e => e.tags)));

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <BackButton />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '4px' }}>
              📔 Private Faith Journal
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Your private space for reflection, prayer notes, and spiritual growth. Only visible to you.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={handleExport} className="btn btn-outline btn-sm">
              📥 Export Journal
            </button>
            <button type="button" onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm">
              + New Entry
            </button>
          </div>
        </div>

        {/* Search & Tag Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search entries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />

          {allTags.length > 0 && (
            <select
              className="form-input"
              value={selectedTag}
              onChange={e => setSelectedTag(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="">All Tags</option>
              {allTags.map(t => (
                <option key={t} value={t}>#{t}</option>
              ))}
            </select>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Loading journal entries...
          </div>
        )}

        {/* Entries List */}
        {!loading && entries.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✍️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No journal entries yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Start writing your prayer thoughts, Bible insights, and reflections today.
            </p>
            <button type="button" onClick={() => setShowCreate(true)} className="btn btn-primary">
              Write Your First Entry →
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {entries.map(entry => (
            <Link
              key={entry.id}
              href={`/journal/${entry.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card card-interactive" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {entry.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {new Date(entry.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                  </span>
                </div>

                <p style={{
                  fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {entry.body}
                </p>

                {entry.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {entry.tags.map(t => (
                      <span key={t} style={{
                        fontSize: '11px', fontWeight: 600, color: 'var(--brand-primary)',
                        background: 'rgba(46,125,50,0.08)', padding: '2px 8px', borderRadius: '99px',
                      }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Create Entry Modal */}
        {showCreate && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}>
            <div className="card animate-fade-in" style={{ maxWidth: '600px', width: '100%', padding: '32px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>
                ✍️ New Journal Entry
              </h2>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="title-input" className="form-label">Title *</label>
                  <input
                    id="title-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Morning Prayer & Gratitude"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="body-input" className="form-label">Body *</label>
                  <textarea
                    id="body-input"
                    className="form-input"
                    rows={8}
                    placeholder="Write your prayers, reflections, and insights..."
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tags-input" className="form-label">Tags (comma-separated)</label>
                  <input
                    id="tags-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. prayer, psalms, gratitude"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
