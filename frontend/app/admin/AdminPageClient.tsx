'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

type Tab = 'messages' | 'reports';

interface FlaggedMessage {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  moderationStatus: string;
  moderationReason: string | null;
  createdAt: string;
  sender: { id: string; displayName: string; email: string; accountType: string } | null;
  group: { id: string; name: string } | null;
}

interface PendingReport {
  id: string;
  reason: string;
  additionalContext: string | null;
  targetType: string;
  targetId: string;
  createdAt: string;
  reporter: { id: string; displayName: string; email: string } | null;
  targetMessage: { id: string; content: string | null; moderationStatus: string } | null;
  targetUser: { id: string; displayName: string; email: string; accountType: string } | null;
  targetGroup: { id: string; name: string; type: string } | null;
}

interface QueueData {
  flaggedMessages: FlaggedMessage[];
  pendingReports: PendingReport[];
  counts: { flaggedMessages: number; pendingReports: number };
}

export default function AdminPageClient() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<Tab>('messages');
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await apiRequest<QueueData>('/api/admin/queue', { token: token ?? undefined });
      setQueue(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleMessageAction(id: string, action: 'approve' | 'reject') {
    setActionLoading(id);
    try {
      const token = await getToken();
      await apiRequest(`/api/admin/messages/${id}`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ action }),
      });
      showToast(`Message ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
      fetchQueue();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBanUser(userId: string) {
    setActionLoading(`ban-${userId}`);
    try {
      const token = await getToken();
      await apiRequest(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ notes: 'Banned via admin queue' }),
      });
      showToast('User banned successfully', 'success');
      fetchQueue();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ban failed', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReportAction(id: string, action: 'resolve' | 'dismiss') {
    setActionLoading(`report-${id}`);
    try {
      const token = await getToken();
      await apiRequest(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ action }),
      });
      showToast(`Report ${action === 'resolve' ? 'resolved' : 'dismissed'}`, 'success');
      fetchQueue();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '32px' }}>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>🛡</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Moderation Queue</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Review flagged content and user reports. All actions are logged in the audit trail.
        </p>
      </div>

      {/* Stats */}
      {queue && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
          <StatCard
            label="Flagged Messages"
            value={queue.counts.flaggedMessages}
            color="var(--color-danger)"
          />
          <StatCard
            label="Pending Reports"
            value={queue.counts.pendingReports}
            color="var(--color-warning)"
          />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0' }}>
        {(['messages', 'reports'] as Tab[]).map((t) => (
          <button
            key={t}
            id={`admin-tab-${t}`}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', borderRadius: '8px 8px 0 0',
              border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              transition: 'all 0.2s ease',
              background: tab === t ? 'var(--bg-elevated)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--brand-primary)' : '2px solid transparent',
            }}
          >
            {t === 'messages' ? '💬 Flagged Messages' : '📋 User Reports'}
            {queue && (
              <span style={{
                marginLeft: '8px', padding: '1px 7px', borderRadius: '99px',
                background: 'var(--bg-overlay)', fontSize: '12px',
              }}>
                {t === 'messages' ? queue.counts.flaggedMessages : queue.counts.pendingReports}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Loading queue...
        </div>
      )}
      {error && (
        <div style={{
          padding: '16px', borderRadius: 'var(--radius-md)',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5', fontSize: '14px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Flagged Messages Tab */}
      {!loading && !error && tab === 'messages' && queue && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {queue.flaggedMessages.length === 0 ? (
            <EmptyState icon="✅" text="No flagged messages. Queue is clear!" />
          ) : (
            queue.flaggedMessages.map((msg) => (
              <div key={msg.id} className="card animate-fade-in" style={{ borderLeft: '3px solid var(--color-danger)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>
                        {msg.sender?.displayName ?? 'Unknown'}
                      </span>
                      <span className={`badge ${msg.moderationStatus === 'auto_rejected' ? 'badge-auto-rejected' : 'badge-flagged'}`}>
                        {msg.moderationStatus === 'auto_rejected' ? '🚫 Auto-Rejected' : '⚠️ Flagged'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {msg.sender?.email} · {msg.group ? `Group: ${msg.group.name}` : 'Direct Message'}
                      {' · '}{new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Content */}
                {msg.content && (
                  <p style={{
                    fontSize: '15px', padding: '12px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-overlay)', marginBottom: '10px',
                    color: 'var(--text-secondary)', lineHeight: 1.5,
                  }}>
                    "{msg.content}"
                  </p>
                )}

                {/* Reason */}
                {msg.moderationReason && (
                  <p style={{
                    fontSize: '13px', color: '#fca5a5',
                    padding: '8px 12px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(239,68,68,0.08)', marginBottom: '14px',
                  }}>
                    🔍 Reason: {msg.moderationReason}
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    id={`approve-msg-${msg.id}`}
                    type="button"
                    className="btn btn-sm"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}
                    onClick={() => handleMessageAction(msg.id, 'approve')}
                    disabled={actionLoading === msg.id}
                  >
                    ✓ Approve
                  </button>
                  <button
                    id={`reject-msg-${msg.id}`}
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleMessageAction(msg.id, 'reject')}
                    disabled={actionLoading === msg.id}
                  >
                    ✕ Remove
                  </button>
                  {msg.sender && (
                    <button
                      id={`ban-user-${msg.sender.id}`}
                      type="button"
                      className="btn btn-sm btn-outline"
                      style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }}
                      onClick={() => handleBanUser(msg.sender!.id)}
                      disabled={actionLoading === `ban-${msg.sender.id}`}
                    >
                      🚫 Ban User
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reports Tab */}
      {!loading && !error && tab === 'reports' && queue && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {queue.pendingReports.length === 0 ? (
            <EmptyState icon="📋" text="No pending reports. All clear!" />
          ) : (
            queue.pendingReports.map((report) => (
              <div key={report.id} className="card animate-fade-in" style={{ borderLeft: '3px solid var(--color-warning)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>
                        {report.targetType.charAt(0).toUpperCase() + report.targetType.slice(1)} Reported
                      </span>
                      <span className="badge badge-pending">⏳ Pending</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      By {report.reporter?.displayName ?? 'Unknown'} ({report.reporter?.email})
                      {' · '}{new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{
                  padding: '12px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-overlay)', marginBottom: '10px',
                }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Reason:</p>
                  <p style={{ fontSize: '14px' }}>{report.reason}</p>
                  {report.additionalContext && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      "{report.additionalContext}"
                    </p>
                  )}
                </div>

                {/* Target info */}
                {report.targetUser && (
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.06)', marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    👤 Reported User: <strong style={{ color: 'var(--text-primary)' }}>{report.targetUser.displayName}</strong> ({report.targetUser.email})
                  </div>
                )}
                {report.targetMessage && (
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.06)', marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    💬 Reported Message: "{report.targetMessage.content?.slice(0, 100)}..."
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    id={`resolve-report-${report.id}`}
                    type="button"
                    className="btn btn-sm"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}
                    onClick={() => handleReportAction(report.id, 'resolve')}
                    disabled={actionLoading === `report-${report.id}`}
                  >
                    ✓ Mark Resolved
                  </button>
                  <button
                    id={`dismiss-report-${report.id}`}
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleReportAction(report.id, 'dismiss')}
                    disabled={actionLoading === `report-${report.id}`}
                  >
                    Dismiss
                  </button>
                  {report.targetUser && (
                    <button
                      id={`ban-reported-user-${report.targetUser.id}`}
                      type="button"
                      className="btn btn-sm"
                      style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)', border: '1px solid' }}
                      onClick={() => handleBanUser(report.targetUser!.id)}
                      disabled={actionLoading === `ban-${report.targetUser.id}`}
                    >
                      🚫 Ban User
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ flex: '0 0 auto', minWidth: '160px' }}>
      <p style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</p>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '64px 24px',
      color: 'var(--text-muted)', fontSize: '15px',
    }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</div>
      {text}
    </div>
  );
}
