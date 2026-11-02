'use client';

import { useState } from 'react';

const AFFIRMATIONS = [
  {
    id: 'q1',
    question: 'Do you believe Jesus Christ is God, fully divine and fully human?',
    scripture: 'John 1:1,14 — "The Word was God... and the Word became flesh."',
  },
  {
    id: 'q2',
    question: 'Do you believe Jesus died for the sins of humanity and rose again?',
    scripture: '1 Corinthians 15:3-4 — "Christ died for our sins... he was raised on the third day."',
  },
  {
    id: 'q3',
    question: 'Do you believe the Bible is the inspired Word of God?',
    scripture: '2 Timothy 3:16 — "All Scripture is God-breathed."',
  },
  {
    id: 'q4',
    question: 'Do you accept Jesus Christ as your Lord and Savior?',
    scripture: 'Romans 10:9 — "If you confess... Jesus is Lord and believe... you will be saved."',
  },
];

type Answer = 'yes' | 'no' | null;

interface Props {
  onAccepted: () => void;
  onBack: () => void;
}

export default function StatementOfFaithGate({ onAccepted, onBack }: Props) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [showRejectionMessage, setShowRejectionMessage] = useState(false);

  const allAnswered = AFFIRMATIONS.every((a) => answers[a.id] !== undefined);
  const allYes = AFFIRMATIONS.every((a) => answers[a.id] === 'yes');
  const anyNo = AFFIRMATIONS.some((a) => answers[a.id] === 'no');

  function handleAnswer(id: string, answer: Answer) {
    setAnswers((prev) => ({ ...prev, [id]: answer }));
    setShowRejectionMessage(false);
  }

  function handleContinue() {
    if (!allAnswered) return;
    if (allYes) {
      onAccepted();
    } else {
      setShowRejectionMessage(true);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          Statement of Faith
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          ChristianConnect is built for followers of Jesus Christ. Please affirm these foundational
          beliefs to join our community.
        </p>
      </div>

      {/* Affirmation Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {AFFIRMATIONS.map((affirmation, idx) => {
          const answer = answers[affirmation.id];
          return (
            <div
              key={affirmation.id}
              className={`faith-card ${
                answer === 'yes' ? 'faith-card-yes' : answer === 'no' ? 'faith-card-no' : ''
              } animate-fade-in`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', lineHeight: 1.4 }}>
                {affirmation.question}
              </p>
              <p style={{
                fontSize: '12px', color: 'var(--text-muted)',
                fontStyle: 'italic', marginBottom: '14px', lineHeight: 1.5,
              }}>
                {affirmation.scripture}
              </p>

              {/* Yes/No Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  id={`${affirmation.id}-yes`}
                  type="button"
                  onClick={() => handleAnswer(affirmation.id, 'yes')}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 'var(--radius-md)',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: answer === 'yes'
                      ? '2px solid var(--brand-primary)'
                      : '1px solid var(--border-default)',
                    background: answer === 'yes'
                      ? 'rgba(46, 125, 50, 0.1)'
                      : 'var(--bg-surface)',
                    color: answer === 'yes' ? 'var(--brand-primary-dark)' : 'var(--text-secondary)',
                  }}
                  aria-pressed={answer === 'yes'}
                >
                  ✓ Yes
                </button>
                <button
                  id={`${affirmation.id}-no`}
                  type="button"
                  onClick={() => handleAnswer(affirmation.id, 'no')}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 'var(--radius-md)',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: answer === 'no'
                      ? '2px solid var(--color-danger)'
                      : '1px solid var(--border-default)',
                    background: answer === 'no'
                      ? 'rgba(211, 47, 47, 0.1)'
                      : 'var(--bg-surface)',
                    color: answer === 'no' ? 'var(--color-danger)' : 'var(--text-secondary)',
                  }}
                  aria-pressed={answer === 'no'}
                >
                  ✕ No
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rejection Message — shown when any answer is "No" and user tries to continue */}
      {showRejectionMessage && anyNo && (
        <div className="animate-fade-in" style={{
          padding: '20px', borderRadius: 'var(--radius-lg)',
          background: 'rgba(211, 47, 47, 0.06)',
          border: '1px solid rgba(211, 47, 47, 0.25)',
        }}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-danger)', marginBottom: '10px' }}>
            ✝ We appreciate your honesty.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            ChristianConnect is a community built around these shared beliefs. We're not able to
            create a full account without affirming them — not to judge you, but to ensure
            the community remains a space of shared faith and accountability.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '10px' }}>
            If you have questions or doubts, we encourage you to explore and seek. God's door
            is always open. 🙏
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
        <button
          id="faith-back-btn"
          type="button"
          onClick={onBack}
          className="btn btn-outline"
          style={{ flex: '0 0 auto' }}
        >
          ← Back
        </button>
        <button
          id="faith-continue-btn"
          type="button"
          onClick={handleContinue}
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={!allAnswered}
        >
          {allAnswered && allYes ? 'Continue →' : allAnswered && anyNo ? 'Submit Answers' : 'Answer All Questions'}
        </button>
      </div>
    </div>
  );
}
