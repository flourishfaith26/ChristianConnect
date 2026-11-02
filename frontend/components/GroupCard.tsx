interface Group {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  denominationTag?: string | null;
  bibleTranslation?: string | null;
  _count: { members: number };
  createdBy: { id: string; displayName: string } | null;
}

interface Props {
  group: Group;
  joined?: boolean;
  onJoin?: () => void;
  onClick?: () => void;
}

const GROUP_ICONS: Record<string, string> = {
  friendship: '🤝', bible_study: '📖', prayer_partner: '🙏',
  accountability: '🛡️', dating: '❤️', mentorship: '🌱',
  apologetics: '⚔️', general: '💬',
};

export default function GroupCard({ group, joined = false, onJoin, onClick }: Props) {
  return (
    <div
      id={`group-card-${group.id}`}
      className="card card-interactive animate-fade-in"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', flexShrink: 0,
          }}>
            {GROUP_ICONS[group.type] ?? '💬'}
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2px', lineHeight: 1.2 }}>
              {group.name}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {group._count.members} member{group._count.members !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {group.isPrivate && (
            <span style={{
              padding: '2px 7px', borderRadius: '99px', fontSize: '10px', fontWeight: 700,
              background: 'var(--bg-overlay)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
            }}>🔒 Private</span>
          )}
          {group.requiresApproval && (
            <span style={{
              padding: '2px 7px', borderRadius: '99px', fontSize: '10px', fontWeight: 700,
              background: 'rgba(245,158,11,0.08)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)',
            }}>Approval</span>
          )}
        </div>
      </div>

      {/* Description */}
      {group.description && (
        <p style={{
          fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px',
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {group.description}
        </p>
      )}

      {/* Tags */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {group.denominationTag && (
          <span style={{
            padding: '2px 8px', borderRadius: '99px', fontSize: '11px',
            background: 'rgba(99,102,241,0.1)', color: 'var(--brand-primary)', fontWeight: 600,
          }}>
            {group.denominationTag.replace(/_/g, ' ')}
          </span>
        )}
        {group.bibleTranslation && (
          <span style={{
            padding: '2px 8px', borderRadius: '99px', fontSize: '11px',
            background: 'rgba(245,158,11,0.08)', color: 'var(--brand-gold)', fontWeight: 600,
          }}>
            {group.bibleTranslation}
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {group.createdBy && (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            by {group.createdBy.displayName}
          </p>
        )}
        {onJoin && (
          <button
            id={`join-group-${group.id}`}
            type="button"
            onClick={(e) => { e.stopPropagation(); onJoin(); }}
            className={joined ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm'}
            style={{ marginLeft: 'auto' }}
            disabled={joined}
          >
            {joined ? '✓ Joined' : group.requiresApproval ? 'Request to Join' : 'Join'}
          </button>
        )}
      </div>
    </div>
  );
}
