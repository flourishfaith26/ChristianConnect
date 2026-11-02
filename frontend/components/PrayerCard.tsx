import ReportButton from './ReportButton';

interface PrayerRequest {
  id: string;
  title: string | null;
  content: string;
  isAnonymous: boolean;
  isAnswered: boolean;
  createdAt: string;
  author: { id: string; displayName: string; avatarUrl: string | null } | null;
  reactions: { type: string; userId: string; comment: string | null; user: { displayName: string } }[];
  _count: { reactions: number };
}

interface Props {
  request: PrayerRequest;
  onPray: () => void;
  onAmen: () => void;
  onMarkAnswered: () => void;
  isOwn?: boolean;
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PrayerCard({ request, onPray, onAmen, onMarkAnswered, isOwn = false }: Props) {
  const prayingCount = request.reactions.filter((r) => r.type === 'praying').length;
  const amenCount = request.reactions.filter((r) => r.type === 'amen').length;
  const comments = request.reactions.filter((r) => r.type === 'comment');

  return (
    <article
      id={`prayer-${request.id}`}
      className="card animate-fade-in"
      style={{
        borderLeft: request.isAnswered ? '3px solid #22c55e' : '3px solid var(--brand-primary)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: request.isAnonymous ? 'var(--bg-overlay)' : 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, flexShrink: 0,
          }}>
            {request.isAnonymous ? '🕊️' : (request.author?.displayName?.[0] ?? '?')}
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600 }}>
              {request.isAnonymous ? 'Anonymous' : (request.author?.displayName ?? 'Unknown')}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {formatRelativeDate(request.createdAt)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {request.isAnswered && (
            <span style={{
              padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
              background: 'rgba(34,197,94,0.1)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)',
            }}>✅ Answered</span>
          )}
          {!request.isAnonymous && request.author && (
            <ReportButton targetType="user" targetId={request.author.id} label="" />
          )}
        </div>
      </div>

      {/* Title */}
      {request.title && (
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{request.title}</h3>
      )}

      {/* Content */}
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px' }}>
        {request.content}
      </p>

      {/* Reactions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          id={`pray-btn-${request.id}`}
          type="button"
          onClick={onPray}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '99px', cursor: 'pointer',
            background: 'rgba(99,102,241,0.1)', border: '1px solid var(--border-subtle)',
            fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}
        >
          🙏 Praying {prayingCount > 0 && <span style={{ color: 'var(--brand-primary)' }}>{prayingCount}</span>}
        </button>

        <button
          id={`amen-btn-${request.id}`}
          type="button"
          onClick={onAmen}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '99px', cursor: 'pointer',
            background: 'rgba(245,158,11,0.08)', border: '1px solid var(--border-subtle)',
            fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}
        >
          🕊️ Amen {amenCount > 0 && <span style={{ color: 'var(--brand-gold)' }}>{amenCount}</span>}
        </button>

        {isOwn && !request.isAnswered && (
          <button
            id={`answered-btn-${request.id}`}
            type="button"
            onClick={onMarkAnswered}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '99px', cursor: 'pointer',
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
              fontSize: '13px', fontWeight: 600, color: '#86efac', transition: 'all 0.15s',
            }}
          >
            ✅ Mark Answered
          </button>
        )}
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {comments.slice(0, 3).map((c, i) => (
            <div key={i} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)',
              fontSize: '13px', color: 'var(--text-secondary)',
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>{c.user.displayName}: </strong>
              {c.comment}
            </div>
          ))}
          {comments.length > 3 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>+{comments.length - 3} more comments</p>
          )}
        </div>
      )}
    </article>
  );
}
