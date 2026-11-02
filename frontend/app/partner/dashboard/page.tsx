'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

interface Metrics {
  totalStreams: number;
  totalEvents: number;
  totalRsvps: number;
  totalGroupMembers: number;
  courseCompletions: number;
}

interface PartnerData {
  isPartner: boolean;
  metrics: Metrics;
  events: any[];
  streams: any[];
  groups: any[];
}

export default function ChurchPartnerDashboard() {
  const { getToken } = useAuth();
  const [data, setData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);

  // Upgrade form
  const [churchName, setChurchName] = useState('');
  const [website, setWebsite] = useState('');
  const [denomination, setDenomination] = useState('');
  const [requesting, setRequesting] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<PartnerData>('/api/partner/dashboard', {
        token: token ?? undefined,
      });
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleRequestPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchName.trim()) return;

    setRequesting(true);
    try {
      const token = await getToken();
      await apiRequest('/api/partner/request', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ churchName, website, denomination }),
      });
      alert('Your account is now upgraded to a Verified Church Partner!');
      loadDashboard();
    } catch {
      alert('Request failed');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading Church Partner Dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, margin: 0 }}>
                ⛪ Church & Ministry Partner Dashboard
              </h1>
              {data?.isPartner && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', background: 'var(--brand-primary)', padding: '3px 10px', borderRadius: '99px' }}>
                  ✓ VERIFIED PARTNER
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Administrative dashboard for church services, live streams, event RSVPs, and engagement metrics.
            </p>
          </div>
        </div>

        {/* Partner Upgrade Request Banner (If not yet verified) */}
        {!data?.isPartner && (
          <div className="card" style={{ marginBottom: '32px', padding: '32px', border: '1px solid var(--brand-gold)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              🤝 Register as a Verified Church Partner
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              Verified ministry partners receive official organization badges, live sermon streaming rights, event RSVP management, and analytics.
            </p>

            <form onSubmit={handleRequestPartner} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
              <div className="form-group">
                <label className="form-label">Church / Organization Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Grace Community Church"
                  value={churchName}
                  onChange={e => setChurchName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="url"
                  className="form-input"
                  placeholder="Website URL (optional)"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Denomination (optional)"
                  value={denomination}
                  onChange={e => setDenomination(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={requesting}>
                {requesting ? 'Verifying...' : 'Register Church Partner Account →'}
              </button>
            </form>
          </div>
        )}

        {/* Analytics Overview Cards */}
        {data?.metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Event RSVPs</p>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brand-primary)', margin: '8px 0 0' }}>{data.metrics.totalRsvps}</h2>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Group Members</p>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brand-gold)', margin: '8px 0 0' }}>{data.metrics.totalGroupMembers}</h2>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Live Streams</p>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ef4444', margin: '8px 0 0' }}>{data.metrics.totalStreams}</h2>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Discipleship Completions</p>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brand-primary)', margin: '8px 0 0' }}>{data.metrics.courseCompletions}</h2>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
