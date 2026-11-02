'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

interface TimestampPoint {
  timestamp: string;
  text: string;
}

interface SermonNote {
  id: string;
  sermonTitle: string;
  speaker: string | null;
  sermonDate: string;
  notes: TimestampPoint[];
}

export default function SermonNotesPage() {
  const { getToken } = useAuth();
  const [sermonNotes, setSermonNotes] = useState<SermonNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for creating a sermon note
  const [showCreate, setShowCreate] = useState(false);
  const [sermonTitle, setSermonTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [sermonDate, setSermonDate] = useState(new Date().toISOString().split('T')[0]);
  const [points, setPoints] = useState<TimestampPoint[]>([{ timestamp: '00:00', text: '' }]);
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<SermonNote[]>('/api/sermon-notes', {
        token: token ?? undefined,
      });
      setSermonNotes(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleAddPoint = () => {
    const lastTimestamp = points[points.length - 1]?.timestamp || '00:00';
    setPoints(prev => [...prev, { timestamp: lastTimestamp, text: '' }]);
  };

  const handlePointChange = (index: number, field: 'timestamp' | 'text', value: string) => {
    setPoints(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemovePoint = (index: number) => {
    setPoints(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sermonTitle.trim()) return;

    setSaving(true);
    try {
      const token = await getToken();
      const newNote = await apiRequest<SermonNote>('/api/sermon-notes', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          sermonTitle: sermonTitle.trim(),
          speaker: speaker.trim() || undefined,
          sermonDate,
          notes: points.filter(p => p.text.trim()),
        }),
      });

      setSermonNotes(prev => [newNote, ...prev]);
      setShowCreate(false);
      setSermonTitle('');
      setSpeaker('');
      setPoints([{ timestamp: '00:00', text: '' }]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save sermon note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sermon note?')) return;
    try {
      const token = await getToken();
      await apiRequest(`/api/sermon-notes/${id}`, {
        method: 'DELETE',
        token: token ?? undefined,
      });
      setSermonNotes(prev => prev.filter(n => n.id !== id));
    } catch {
      alert('Delete failed');
    }
  };

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '4px' }}>
              🎙️ Timestamped Sermon Notes
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Take structured, timestamped notes during sermons or teachings to revisit anytime.
            </p>
          </div>

          <button type="button" onClick={() => setShowCreate(true)} className="btn btn-primary">
            + New Sermon Note
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Loading sermon notes...
          </div>
        )}

        {/* Empty state */}
        {!loading && sermonNotes.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📜</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No sermon notes yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Keep track of key points, scriptures, and timestamps during Sunday service or personal studies.
            </p>
            <button type="button" onClick={() => setShowCreate(true)} className="btn btn-primary">
              Create Your First Sermon Note →
            </button>
          </div>
        )}

        {/* List of Sermon Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sermonNotes.map(note => (
            <div key={note.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {note.sermonTitle}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 600 }}>
                    🗣️ {note.speaker || 'Unknown Speaker'} • 📅 {new Date(note.sermonDate).toLocaleDateString([], { dateStyle: 'medium' })}
                  </p>
                </div>

                <button type="button" onClick={() => handleDelete(note.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>
                  🗑️ Delete
                </button>
              </div>

              {/* Timestamped Points */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                {note.notes.map((point, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 700, color: 'var(--brand-gold)',
                      background: 'rgba(212,175,55,0.1)', padding: '2px 8px', borderRadius: '4px',
                      flexShrink: 0, marginTop: '2px',
                    }}>
                      ⏱️ {point.timestamp}
                    </span>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                      {point.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Create Sermon Note Modal */}
        {showCreate && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}>
            <div className="card animate-fade-in" style={{ maxWidth: '640px', width: '100%', padding: '32px', maxHeight: '90vh', overflow: 'auto' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>
                🎙️ New Sermon Note
              </h2>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="sermon-title-input" className="form-label">Sermon Title *</label>
                  <input
                    id="sermon-title-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Walking in Grace & Peace"
                    value={sermonTitle}
                    onChange={e => setSermonTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="speaker-input" className="form-label">Speaker / Pastor</label>
                    <input
                      id="speaker-input"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Pastor Timothy"
                      value={speaker}
                      onChange={e => setSpeaker(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="sermon-date-input" className="form-label">Date</label>
                    <input
                      id="sermon-date-input"
                      type="date"
                      className="form-input"
                      value={sermonDate}
                      onChange={e => setSermonDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Timestamped Key Points */}
                <div style={{ marginTop: '8px' }}>
                  <label className="form-label">Timestamped Key Points</label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    {points.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="14:20"
                          value={p.timestamp}
                          onChange={e => handlePointChange(idx, 'timestamp', e.target.value)}
                          style={{ width: '90px', flexShrink: 0 }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Key point / note..."
                          value={p.text}
                          onChange={e => handlePointChange(idx, 'text', e.target.value)}
                          style={{ flex: 1 }}
                        />
                        {points.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleRemovePoint(idx)}
                            style={{ color: 'var(--color-danger)', flexShrink: 0 }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleAddPoint}
                    style={{ marginTop: '12px' }}
                  >
                    + Add Timestamp Point
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Sermon Note'}
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
