'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface Missionary {
  id: string;
  name: string;
  organization: string;
  location: string;
  bio: string;
  photoUrl: string | null;
  prayerNeeds: string[];
  givingUrl: string | null;
}

export default function MissionariesPage() {
  const { getToken } = useAuth();
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMissionaries = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<Missionary[]>('/api/missionaries', {
        token: token ?? undefined,
      });
      setMissionaries(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadMissionaries(); }, [loadMissionaries]);

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '6px' }}>
            🌍 Missionary & Ministry Spotlight
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Support verified field missionaries, intercede for their prayer requests, and partner in the Great Commission.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Loading missionary spotlight feed...
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {missionaries.map(m => (
            <div key={m.id} className="card animate-fade-in" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                
                {/* Photo */}
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', background: 'var(--brand-primary)',
                  overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border-subtle)',
                }}>
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '24px' }}>
                      {m.name[0]}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
                        {m.name}
                      </h2>
                      <p style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 600, margin: '2px 0 0' }}>
                        📍 {m.location} • {m.organization}
                      </p>
                    </div>

                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', background: 'var(--brand-primary)', padding: '3px 10px', borderRadius: '99px' }}>
                      ✓ VERIFIED FIELD MISSION
                    </span>
                  </div>

                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '12px 0 20px' }}>
                    {m.bio}
                  </p>

                  {/* Prayer Needs */}
                  {m.prayerNeeds?.length > 0 && (
                    <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                        🙏 Current Prayer Requests
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {m.prayerNeeds.map((p, idx) => (
                          <p key={idx} style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                            • {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Support Link */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <Link href="/giving" className="btn btn-primary btn-sm">
                      ❤️ Partner & Support {m.name.split(' ')[0]} →
                    </Link>
                  </div>

                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
