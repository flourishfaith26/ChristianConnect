'use client';

import { useState } from 'react';

interface Props {
  spotifyTrackId?: string;
  title?: string;
}

export default function WorshipMusicPlayer({ spotifyTrackId = '0VjIjW4GlUZAMYd2vXMi3b', title = 'Worship Music' }: Props) {
  const [provider, setProvider] = useState<'spotify' | 'apple'>('spotify');

  return (
    <div className="card" style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          🎵 {title}
        </h4>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={`btn btn-sm ${provider === 'spotify' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setProvider('spotify')}
            style={{ fontSize: '11px', padding: '2px 8px' }}
          >
            Spotify
          </button>
          <button
            type="button"
            className={`btn btn-sm ${provider === 'apple' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setProvider('apple')}
            style={{ fontSize: '11px', padding: '2px 8px' }}
          >
            Apple Music
          </button>
        </div>
      </div>

      {provider === 'spotify' ? (
        <iframe
          src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ borderRadius: '12px' }}
        />
      ) : (
        <iframe
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
          frameBorder="0"
          height="175"
          style={{ width: '100%', overflow: 'hidden', borderRadius: '12px' }}
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
          src="https://embed.music.apple.com/us/album/reckless-love/1325603730?i=1325603738"
        />
      )}
    </div>
  );
}
