'use client';

interface Props {
  displayName: string;
  avatarUrl?: string | null;
  hasUnseen?: boolean;
  isSelf?: boolean;
  onClick?: () => void;
}

export default function StoryRing({ displayName, avatarUrl, hasUnseen = false, isSelf = false, onClick }: Props) {
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px',
        outline: 'none',
      }}
    >
      <div style={{
        padding: '3px',
        borderRadius: '50%',
        background: hasUnseen
          ? 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-gold) 100%)'
          : 'var(--border-subtle)',
        transition: 'transform 0.2s ease',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '2px solid var(--bg-surface)',
          background: 'var(--gradient-brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: '18px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>{initials}</span>
          )}

          {isSelf && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              color: 'white',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-surface)',
            }}>
              +
            </div>
          )}
        </div>
      </div>

      <span style={{
        fontSize: '12px',
        fontWeight: hasUnseen ? 600 : 400,
        color: hasUnseen ? 'var(--text-primary)' : 'var(--text-secondary)',
        maxWidth: '72px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {isSelf ? 'Your Story' : displayName}
      </span>
    </button>
  );
}
