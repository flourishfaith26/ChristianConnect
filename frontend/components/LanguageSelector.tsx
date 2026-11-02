'use client';

import { useState, useEffect } from 'react';
import { LANGUAGES, LanguageCode } from '@/lib/i18n';

export default function LanguageSelector() {
  const [lang, setLang] = useState<LanguageCode>('en');

  useEffect(() => {
    const saved = localStorage.getItem('cc_lang') as LanguageCode;
    if (saved && LANGUAGES.some(l => l.code === saved)) {
      setLang(saved);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as LanguageCode;
    setLang(newLang);
    localStorage.setItem('cc_lang', newLang);
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <select
        value={lang}
        onChange={handleChange}
        style={{
          background: 'var(--bg-overlay)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 8px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
        aria-label="Select Application Language"
      >
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}
