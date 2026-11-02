'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

interface JournalEntry {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
}

export default function JournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const router = useRouter();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEntry = useCallback(async () => {
    try {
      const token = await getToken();
      const entries = await apiRequest<JournalEntry[]>('/api/journal', { token: token ?? undefined });
      const found = entries.find(e => e.id === id);
      if (found) {
        setEntry(found);
        setTitle(found.title);
        setBody(found.body);
        setTagInput(found.tags.join(', '));
      } else {
        router.replace('/journal');
      }
    } catch {
      router.replace('/journal');
    } finally {
      setLoading(false);
    }
  }, [id, getToken, router]);

  useEffect(() => { loadEntry(); }, [loadEntry]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const tags = tagInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const updated = await apiRequest<JournalEntry>(`/api/journal/${id}`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ title: title.trim(), body: body.trim(), tags }),
      });
      setEntry(updated);
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      const token = await getToken();
      await apiRequest(`/api/journal/${id}`, {
        method: 'DELETE',
        token: token ?? undefined,
      });
      router.push('/journal');
    } catch {
      alert('Delete failed');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading entry...</div>
      </div>
    );
  }

  if (!entry) return null;

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <a href="/journal" style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          ← Back to Journal
        </a>

        {!isEditing ? (
          <div className="card animate-fade-in" style={{ padding: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '6px' }}>
                  {entry.title}
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {new Date(entry.createdAt).toLocaleDateString([], { dateStyle: 'full', timeStyle: 'short' })}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setIsEditing(true)} className="btn btn-outline btn-sm">
                  ✏️ Edit
                </button>
                <button type="button" onClick={handleDelete} className="btn btn-danger btn-sm">
                  🗑️ Delete
                </button>
              </div>
            </div>

            {entry.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {entry.tags.map(t => (
                  <span key={t} style={{
                    fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)',
                    background: 'rgba(46,125,50,0.08)', padding: '3px 10px', borderRadius: '99px',
                  }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div style={{
              fontSize: '16px', lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap',
            }}>
              {entry.body}
            </div>
          </div>
        ) : (
          <div className="card animate-fade-in" style={{ padding: '36px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
              Edit Journal Entry
            </h2>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Body</label>
                <textarea
                  className="form-input"
                  rows={10}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
