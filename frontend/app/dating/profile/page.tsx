'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import VerificationGate from '@/components/VerificationGate';

type RelationshipGoal = 'marriage_minded' | 'getting_to_know' | 'open_to_long_distance';
type CourtshipView = 'traditional_courtship' | 'modern_dating' | 'open_to_discussion';
type MarriageRoleView = 'complementarian' | 'egalitarian' | 'open_to_discussion';

interface PromptAnswer { question: string; answer: string; }

interface FormState {
  relationshipGoal: RelationshipGoal | '';
  courtshipView: CourtshipView | '';
  marriageRoleView: MarriageRoleView | '';
  openToLongDistance: boolean;
  ageRangeMin: number;
  ageRangeMax: number;
  bio: string;
  promptAnswers: PromptAnswer[];
  isVisible: boolean;
}

const PROMPTS = [
  'How does your faith shape your daily life?',
  'What does a God-centered relationship look like to you?',
  'What is your church community like?',
  'How do you handle conflict in a relationship?',
  'What are you most looking forward to in marriage?',
  'Describe your relationship with God right now.',
  'What is your favourite Bible verse and why?',
  'How important is denomination alignment to you?',
];

function DatingProfileForm() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    relationshipGoal: '', courtshipView: '', marriageRoleView: '',
    openToLongDistance: false, ageRangeMin: 21, ageRangeMax: 40,
    bio: '', promptAnswers: [{ question: PROMPTS[0], answer: '' }, { question: PROMPTS[1], answer: '' }],
    isVisible: true,
  });
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moderationStatus, setModerationStatus] = useState<string | null>(null);

  // Pre-load existing profile
  const loadProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const profile = await apiRequest<{
        relationshipGoal?: string; courtshipView?: string; marriageRoleView?: string;
        openToLongDistance?: boolean; ageRangeMin?: number; ageRangeMax?: number;
        bio?: string; promptAnswers?: PromptAnswer[]; isVisible?: boolean; moderationStatus?: string;
      } | null>('/api/dating/profile/me', { token: token ?? undefined });

      if (profile) {
        setForm(prev => ({
          ...prev,
          relationshipGoal: (profile.relationshipGoal as RelationshipGoal) ?? '',
          courtshipView: (profile.courtshipView as CourtshipView) ?? '',
          marriageRoleView: (profile.marriageRoleView as MarriageRoleView) ?? '',
          openToLongDistance: profile.openToLongDistance ?? false,
          ageRangeMin: profile.ageRangeMin ?? 21,
          ageRangeMax: profile.ageRangeMax ?? 40,
          bio: profile.bio ?? '',
          promptAnswers: profile.promptAnswers?.length ? profile.promptAnswers : prev.promptAnswers,
          isVisible: profile.isVisible ?? true,
        }));
        setModerationStatus(profile.moderationStatus ?? null);
      }
    } catch { /* no profile yet */ }
  }, [getToken]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  async function handleSave() {
    if (!form.relationshipGoal || !form.courtshipView || !form.marriageRoleView) {
      setError('Please complete all required fields.'); return;
    }
    if (form.ageRangeMin > form.ageRangeMax) {
      setError('Minimum age cannot be greater than maximum age.'); return;
    }
    if (form.ageRangeMin < 18) {
      setError('Minimum age must be 18 or older.'); return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest('/api/dating/profile', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          ...form,
          promptAnswers: form.promptAnswers.filter(p => p.question && p.answer.trim()),
        }),
      });
      router.push('/dating');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  const update = (patch: Partial<FormState>) => setForm(prev => ({ ...prev, ...patch }));

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <a href="/dating" style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            ← Back to Dating
          </a>
          <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '8px' }}>
            ❤️ Your Dating Profile
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Fill in your preferences and prompts. Others see your answers — not just a photo.
          </p>
        </div>

        {/* Moderation banner */}
        {moderationStatus && moderationStatus !== 'approved' && (
          <div style={{
            padding: '14px 16px', borderRadius: 'var(--radius-md)', marginBottom: '24px',
            background: moderationStatus === 'pending' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${moderationStatus === 'pending' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontSize: '13px',
            color: moderationStatus === 'pending' ? '#fcd34d' : '#fca5a5',
          }}>
            {moderationStatus === 'pending' ? '⏳ Your profile is being reviewed and will appear in the browse feed shortly.' :
             moderationStatus === 'flagged' ? '⚠️ Your profile was flagged for review. An admin will assess it shortly.' :
             '❌ Your profile was rejected by our moderation system. Please edit and resubmit.'}
          </div>
        )}

        {error && <div className="form-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}

        {/* Step tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {[1, 2, 3].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: step === s ? 'var(--brand-primary)' : 'transparent',
                color: step === s ? 'white' : 'var(--text-muted)',
                fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              {s === 1 ? '1. Goals & Views' : s === 2 ? '2. Age & Bio' : '3. Prompts'}
            </button>
          ))}
        </div>

        {/* ── Step 1: Relationship goals and faith views ───────────────── */}
        {step === 1 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Relationship Goals & Faith Views</h3>

            {/* Relationship goal */}
            <div className="form-group">
              <label className="form-label">Relationship Goal *</label>
              {[
                { value: 'marriage_minded', label: '💍 Marriage-Minded', desc: 'Seriously pursuing a spouse' },
                { value: 'getting_to_know', label: '🤝 Getting to Know People', desc: 'Open to where God leads, not rushing' },
                { value: 'open_to_long_distance', label: '🌍 Open to Long-Distance', desc: 'Geography is not a barrier' },
              ].map(opt => (
                <label key={opt.value} htmlFor={`goal-${opt.value}`} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: form.relationshipGoal === opt.value ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                  background: form.relationshipGoal === opt.value ? 'rgba(46,125,50,0.06)' : 'var(--bg-overlay)',
                  transition: 'all 0.2s', marginTop: '8px',
                }}>
                  <input
                    id={`goal-${opt.value}`} type="radio" name="goal"
                    checked={form.relationshipGoal === opt.value}
                    onChange={() => update({ relationshipGoal: opt.value as RelationshipGoal })}
                    style={{ marginTop: '2px', accentColor: 'var(--brand-primary)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{opt.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Courtship view */}
            <div className="form-group">
              <label className="form-label">View on Courtship *</label>
              {[
                { value: 'traditional_courtship', label: '🏛️ Traditional Courtship', desc: 'Family-involved, slower progression' },
                { value: 'modern_dating', label: '💬 Modern Christian Dating', desc: 'Standard modern approach with faith values' },
                { value: 'open_to_discussion', label: '🕊️ Open to Discussion', desc: 'Flexible, will discuss with the right person' },
              ].map(opt => (
                <label key={opt.value} htmlFor={`courtship-${opt.value}`} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: form.courtshipView === opt.value ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                  background: form.courtshipView === opt.value ? 'rgba(46,125,50,0.06)' : 'var(--bg-overlay)',
                  transition: 'all 0.2s', marginTop: '8px',
                }}>
                  <input
                    id={`courtship-${opt.value}`} type="radio" name="courtship"
                    checked={form.courtshipView === opt.value}
                    onChange={() => update({ courtshipView: opt.value as CourtshipView })}
                    style={{ marginTop: '2px', accentColor: 'var(--brand-primary)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{opt.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Marriage role view */}
            <div className="form-group">
              <label className="form-label">View on Marriage Roles *</label>
              {[
                { value: 'complementarian', label: '⚖️ Complementarian', desc: 'Distinct, complementary gender roles' },
                { value: 'egalitarian', label: '🤝 Egalitarian', desc: 'Shared leadership and mutual submission' },
                { value: 'open_to_discussion', label: '🕊️ Open to Discussion', desc: 'Happy to explore this together' },
              ].map(opt => (
                <label key={opt.value} htmlFor={`marriage-${opt.value}`} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: form.marriageRoleView === opt.value ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                  background: form.marriageRoleView === opt.value ? 'rgba(46,125,50,0.06)' : 'var(--bg-overlay)',
                  transition: 'all 0.2s', marginTop: '8px',
                }}>
                  <input
                    id={`marriage-${opt.value}`} type="radio" name="marriage"
                    checked={form.marriageRoleView === opt.value}
                    onChange={() => update({ marriageRoleView: opt.value as MarriageRoleView })}
                    style={{ marginTop: '2px', accentColor: 'var(--brand-primary)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{opt.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Long distance */}
            <label htmlFor="long-distance-toggle" style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
              <input
                id="long-distance-toggle" type="checkbox"
                checked={form.openToLongDistance}
                onChange={e => update({ openToLongDistance: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>🌍 Open to Long-Distance</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Geography is not a barrier for the right match</div>
              </div>
            </label>

            <button type="button" className="btn btn-primary" onClick={() => setStep(2)} disabled={!form.relationshipGoal || !form.courtshipView || !form.marriageRoleView}>
              Next: Age & Bio →
            </button>
          </div>
        )}

        {/* ── Step 2: Age range + bio ──────────────────────────────────── */}
        {step === 2 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Age Preference & Bio</h3>

            <div className="form-group">
              <label className="form-label">Preferred Age Range</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="age-min" style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Minimum</label>
                  <input
                    id="age-min" type="number" className="form-input"
                    min={18} max={80} value={form.ageRangeMin}
                    onChange={e => update({ ageRangeMin: parseInt(e.target.value) || 18 })}
                  />
                </div>
                <span style={{ color: 'var(--text-muted)', paddingTop: '20px' }}>–</span>
                <div style={{ flex: 1 }}>
                  <label htmlFor="age-max" style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Maximum</label>
                  <input
                    id="age-max" type="number" className="form-input"
                    min={18} max={80} value={form.ageRangeMax}
                    onChange={e => update({ ageRangeMax: parseInt(e.target.value) || 45 })}
                  />
                </div>
              </div>
              <span className="form-hint">Both must be 18–80. This filters candidates you&apos;ll see.</span>
            </div>

            <div className="form-group">
              <label htmlFor="bio-input" className="form-label">Short Bio (optional)</label>
              <textarea
                id="bio-input" className="form-input" rows={4}
                placeholder="A brief, honest description of who you are and what you're looking for..."
                value={form.bio}
                onChange={e => update({ bio: e.target.value.slice(0, 500) })}
              />
              <span className="form-hint">{form.bio.length}/500 characters. This goes through content moderation.</span>
            </div>

            {/* Visibility */}
            <label htmlFor="visible-toggle" style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
              <input
                id="visible-toggle" type="checkbox"
                checked={form.isVisible}
                onChange={e => update({ isVisible: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Visible in Browse Feed</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Uncheck to pause your profile temporarily</div>
              </div>
            </label>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>
                Next: Prompts →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Q&A Prompts ──────────────────────────────────────── */}
        {step === 3 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Your Prompts (up to 3)</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                These replace photo-swiping. Your words introduce you to potential matches.
              </p>
            </div>

            {form.promptAnswers.map((pa, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label htmlFor={`prompt-q-${i}`} className="form-label">Prompt {i + 1}</label>
                  <select
                    id={`prompt-q-${i}`}
                    className="form-input"
                    value={pa.question}
                    onChange={e => {
                      const newAnswers = [...form.promptAnswers];
                      newAnswers[i] = { ...newAnswers[i], question: e.target.value };
                      update({ promptAnswers: newAnswers });
                    }}
                  >
                    {PROMPTS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <textarea
                  id={`prompt-a-${i}`}
                  className="form-input" rows={3}
                  placeholder="Your answer..."
                  value={pa.answer}
                  onChange={e => {
                    const newAnswers = [...form.promptAnswers];
                    newAnswers[i] = { ...newAnswers[i], answer: e.target.value.slice(0, 400) };
                    update({ promptAnswers: newAnswers });
                  }}
                />
                <span className="form-hint">{pa.answer.length}/400 characters</span>
              </div>
            ))}

            {form.promptAnswers.length < 3 && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => update({ promptAnswers: [...form.promptAnswers, { question: PROMPTS[form.promptAnswers.length] ?? PROMPTS[0], answer: '' }] })}
              >
                + Add Another Prompt
              </button>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
              <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving Profile...' : '✝ Save & Browse Matches'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DatingProfilePage() {
  return (
    <VerificationGate>
      <DatingProfileForm />
    </VerificationGate>
  );
}
