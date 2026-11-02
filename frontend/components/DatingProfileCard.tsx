'use client';

import Link from 'next/link';
import ReportButton from './ReportButton';

interface PromptAnswer {
  question: string;
  answer: string;
}

export interface DatingCandidate {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  age: number;
  city: string | null;
  region: string | null;
  profile: {
    denomination: string | null;
    faithBackground: string | null;
    joinReasons: string[];
  } | null;
  datingProfile: {
    id: string;
    ageRangeMin: number;
    ageRangeMax: number;
    relationshipGoal: string;
    courtshipView: string;
    marriageRoleView: string;
    openToLongDistance: boolean;
    bio: string | null;
    promptAnswers: PromptAnswer[];
  } | null;
}

interface Props {
  candidate: DatingCandidate;
  onInterested: (userId: string) => void;
  onPass: (userId: string) => void;
  onBlock: (userId: string) => void;
  isLiking?: boolean;
}

const GOAL_LABELS: Record<string, string> = {
  marriage_minded: '💍 Marriage-Minded',
  getting_to_know: '🤝 Getting to Know',
  open_to_long_distance: '🌍 Open to Long-Distance',
};

const COURTSHIP_LABELS: Record<string, string> = {
  traditional_courtship: '🏛️ Traditional Courtship',
  modern_dating: '💬 Modern Christian Dating',
  open_to_discussion: '🕊️ Open to Discussion',
};

const MARRIAGE_LABELS: Record<string, string> = {
  complementarian: '⚖️ Complementarian',
  egalitarian: '🤝 Egalitarian',
  open_to_discussion: '🕊️ Open to Discussion',
};

const DENOMINATION_LABELS: Record<string, string> = {
  catholic: 'Catholic',
  baptist: 'Baptist',
  pentecostal: 'Pentecostal',
  non_denominational: 'Non-Denominational',
  orthodox: 'Orthodox',
  reformed: 'Reformed',
  prefer_not_to_say: 'Christian',
};

export default function DatingProfileCard({ candidate, onInterested, onPass, onBlock, isLiking }: Props) {
  const { datingProfile: dp, profile } = candidate;
  const initials = candidate.displayName.slice(0, 2).toUpperCase();

  return (
    <div className="card animate-fade-in" style={{
      maxWidth: '480px', width: '100%',
      display: 'flex', flexDirection: 'column', gap: '0',
      overflow: 'hidden', padding: '0',
      border: '1px solid var(--border-subtle)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.3s ease, transform 0.3s ease',
    }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%)',
        padding: '28px 28px 20px',
        position: 'relative',
      }}>
        {/* Report/Block top-right */}
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <ReportButton targetType="user" targetId={candidate.id} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Avatar */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 700, color: 'white', flexShrink: 0,
            overflow: 'hidden',
          }}>
            {candidate.avatarUrl ? (
              <img src={candidate.avatarUrl} alt={candidate.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
              {candidate.displayName}, {candidate.age}
            </h2>
            {(candidate.city || candidate.region) && (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                📍 {[candidate.city, candidate.region].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Faith tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
          {profile?.denomination && (
            <span style={{
              padding: '4px 12px', borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.15)', color: 'white',
              fontSize: '12px', fontWeight: 600,
            }}>
              ✝ {DENOMINATION_LABELS[profile.denomination] ?? profile.denomination}
            </span>
          )}
          {dp?.relationshipGoal && (
            <span style={{
              padding: '4px 12px', borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.15)', color: 'white',
              fontSize: '12px', fontWeight: 600,
            }}>
              {GOAL_LABELS[dp.relationshipGoal] ?? dp.relationshipGoal}
            </span>
          )}
          {dp?.openToLongDistance && (
            <span style={{
              padding: '4px 12px', borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.15)', color: 'white',
              fontSize: '12px', fontWeight: 600,
            }}>
              🌍 Long-Distance OK
            </span>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

        {/* Bio */}
        {dp?.bio && (
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
              "{dp.bio}"
            </p>
          </div>
        )}

        {/* Faith compatibility values */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
        }}>
          {dp?.courtshipView && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
            }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Courtship</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {COURTSHIP_LABELS[dp.courtshipView] ?? dp.courtshipView}
              </p>
            </div>
          )}
          {dp?.marriageRoleView && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
            }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Marriage View</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {MARRIAGE_LABELS[dp.marriageRoleView] ?? dp.marriageRoleView}
              </p>
            </div>
          )}
        </div>

        {/* Age range preference */}
        {dp && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>Age preference: </span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              {dp.ageRangeMin}–{dp.ageRangeMax}
            </span>
          </div>
        )}

        {/* Q&A Prompts */}
        {dp?.promptAnswers && dp.promptAnswers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              In Their Own Words
            </p>
            {(dp.promptAnswers as PromptAnswer[]).map((prompt, i) => (
              <div key={i} style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}>
                <p style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 700, marginBottom: '6px' }}>
                  {prompt.question}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {prompt.answer}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Action Bar ───────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 28px 24px',
        display: 'flex', gap: '12px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-elevated)',
      }}>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ flex: '0 0 auto', padding: '12px 20px', fontSize: '18px' }}
          onClick={() => onPass(candidate.id)}
          title="Pass"
        >
          ✕
        </button>
        <button
          type="button"
          id={`interested-${candidate.id}`}
          className="btn btn-primary"
          style={{ flex: 1, padding: '12px' }}
          onClick={() => onInterested(candidate.id)}
          disabled={isLiking}
        >
          {isLiking ? 'Sending...' : '❤️ Interested'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ flex: '0 0 auto', padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}
          onClick={() => onBlock(candidate.id)}
          title="Block this user"
        >
          🚫
        </button>
      </div>
    </div>
  );
}
