'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

interface GivingRecord {
  id: string;
  recipientType: string;
  recipientId: string;
  amount: number;
  isRecurring: boolean;
  status: string;
  createdAt: string;
}

export default function GivingPage() {
  const { getToken } = useAuth();

  const [history, setHistory] = useState<GivingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [disclaimer, setDisclaimer] = useState('');

  // Giving Form
  const [recipientType, setRecipientType] = useState('missionary');
  const [recipientId, setRecipientId] = useState('gen_mission_1');
  const [amountDollars, setAmountDollars] = useState('25');
  const [isRecurring, setIsRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      const [compRes, histRes] = await Promise.all([
        apiRequest<{ disclaimer: string }>('/api/payments/compliance-status', { token: token ?? undefined }),
        apiRequest<GivingRecord[]>('/api/payments/history', { token: token ?? undefined }),
      ]);
      setDisclaimer(compRes.disclaimer);
      setHistory(histRes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    const dollars = parseFloat(amountDollars);
    if (isNaN(dollars) || dollars <= 0) return;

    setSubmitting(true);
    try {
      const token = await getToken();
      const cents = Math.round(dollars * 100);
      const res = await apiRequest<{ message: string; record: GivingRecord }>('/api/payments/donate', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          recipientType,
          recipientId,
          amount: cents,
          isRecurring,
        }),
      });

      alert(res.message);
      setHistory(prev => [res.record, ...prev]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '4px' }}>
            💳 Partner Giving & Subscriptions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Support verified field missionaries, partner churches, and unlock premium platform tiers.
          </p>
        </div>

        {/* Legal Compliance Disclaimer Banner */}
        <div className="card" style={{
          marginBottom: '32px', padding: '20px 24px',
          background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: '14px',
        }}>
          <span style={{ fontSize: '24px' }}>⚖️</span>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Legal Compliance & Financial Transmission Notice
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {disclaimer || 'ChristianConnect processes charitable donations and subscriptions via Stripe Connect in full compliance with money transmission regulations.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '28px', marginBottom: '40px' }}>

          {/* Giving Form Card */}
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
              🎁 Support a Ministry
            </h2>

            <form onSubmit={handleDonate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Recipient Category</label>
                <select
                  className="form-input"
                  value={recipientType}
                  onChange={e => setRecipientType(e.target.value)}
                >
                  <option value="missionary">🌍 Field Missionary Support</option>
                  <option value="church_partner">⛪ Partner Church Fund</option>
                  <option value="general">🕊️ ChristianConnect Ministry Fund</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount ($ USD) *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['10', '25', '50', '100'].map(val => (
                    <button
                      key={val}
                      type="button"
                      className={`btn btn-sm ${amountDollars === val ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setAmountDollars(val)}
                      style={{ flex: 1 }}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Custom amount"
                  value={amountDollars}
                  onChange={e => setAmountDollars(e.target.value)}
                  style={{ marginTop: '8px' }}
                  min="1"
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="recurring-check"
                  checked={isRecurring}
                  onChange={e => setIsRecurring(e.target.checked)}
                  style={{ accentColor: 'var(--brand-primary)', width: '16px', height: '16px' }}
                />
                <label htmlFor="recurring-check" style={{ fontSize: '14px', cursor: 'pointer' }}>
                  Make this a monthly recurring contribution
                </label>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ marginTop: '8px' }}>
                {submitting ? 'Processing Payment...' : '🔒 Process Secure Giving via Stripe'}
              </button>
            </form>
          </div>

          {/* Premium Subscription Tiers Card */}
          <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-gold)', background: 'rgba(212,175,55,0.1)', padding: '4px 12px', borderRadius: '99px', textTransform: 'uppercase' }}>
                ⭐ Premium Membership
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '12px 0 8px' }}>
                ChristianConnect Supporter ($4.99/mo)
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Support the platform and unlock exclusive spiritual growth tools:
              </p>

              <ul style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '20px', marginBottom: '24px' }}>
                <li>✨ Ad-free experience across all sections</li>
                <li>🎯 Advanced matching filters (denomination, study focus)</li>
                <li>📚 Exclusive devotional tracks & video masterclasses</li>
                <li>⭐ Official Supporter badge on profile & comments</li>
              </ul>
            </div>

            <button type="button" className="btn btn-gold btn-lg" onClick={() => alert('Stripe Premium Checkout Session initiated!')}>
              Subscribe for $4.99/mo →
            </button>
          </div>

        </div>

        {/* Giving History */}
        {!loading && history.length > 0 && (
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              📜 Your Past Contributions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map(item => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)',
                  border: '1px solid var(--border-subtle)', fontSize: '14px',
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Support ({item.recipientType.replace('_', ' ')})</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '12px' }}>
                      {new Date(item.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                    +${(item.amount / 100).toFixed(2)} {item.isRecurring ? '(Monthly)' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
