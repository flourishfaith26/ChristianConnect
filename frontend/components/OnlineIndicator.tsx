interface Props {
  isOnline: boolean;
  size?: number;
}

export default function OnlineIndicator({ isOnline, size = 10 }: Props) {
  return (
    <span
      aria-label={isOnline ? 'Online' : 'Offline'}
      title={isOnline ? 'Online' : 'Offline'}
      style={{
        display: 'inline-block',
        width: `${size}px`, height: `${size}px`,
        borderRadius: '50%',
        background: isOnline ? '#22c55e' : '#6b7280',
        flexShrink: 0,
        position: 'absolute', bottom: 0, right: 0,
        border: '2px solid var(--bg-surface)',
        transition: 'background 0.3s',
        ...(isOnline && {
          boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.3)',
          animation: 'pulse 2s ease-in-out infinite',
        }),
      }}
    />
  );
}
