export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0' }}>
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center', padding: '8px 14px', borderRadius: '16px 16px 16px 4px', background: 'var(--bg-elevated)' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--text-muted)',
              animation: `typing-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
