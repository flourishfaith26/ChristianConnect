'use client';

import { useAccessibility } from '@/components/AccessibilityProvider';
import LanguageSelector from '@/components/LanguageSelector';
import WorshipMusicPlayer from '@/components/WorshipMusicPlayer';

export default function PreferencesPage() {
  const { textSize, setTextSize, highContrast, setHighContrast } = useAccessibility();

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '6px' }}>
            ⚙️ App Preferences & Accessibility
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Customize text sizes, high-contrast mode, language settings, offline caching, and worship player.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Accessibility Settings */}
          <div className="card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              ♿ Accessibility & Visual Controls
            </h2>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Adjustable Text Size</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className={`btn ${textSize === 'normal' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTextSize('normal')}
                  style={{ flex: 1 }}
                >
                  Normal (100%)
                </button>
                <button
                  type="button"
                  className={`btn ${textSize === 'large' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTextSize('large')}
                  style={{ flex: 1 }}
                >
                  Large (115%)
                </button>
                <button
                  type="button"
                  className={`btn ${textSize === 'xlarge' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTextSize('xlarge')}
                  style={{ flex: 1 }}
                >
                  Extra Large (130%)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>High Contrast Mode</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Enhances text & element contrast for improved readability.</p>
              </div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={e => setHighContrast(e.target.checked)}
                style={{ accentColor: 'var(--brand-primary)', width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Language Settings */}
          <div className="card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              🌐 Language & Localization
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Select your preferred language for UI strings, devotionals, and Faith Chat.
            </p>

            <LanguageSelector />
          </div>

          {/* Worship Music Integration */}
          <div>
            <WorshipMusicPlayer title="Featured Worship Playlist" />
          </div>

        </div>
      </div>
    </div>
  );
}
