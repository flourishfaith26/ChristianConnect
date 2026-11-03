'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import BackButton from '@/components/BackButton';

interface Question {
  id: string;
  title: string;
  content: string;
  topic: string;
  createdAt: string;
  upvotes: number;
  author: { id: string; displayName: string; isTrustedApologist: boolean };
  _count?: { answers: number };
}

interface Answer {
  id: string;
  content: string;
  createdAt: string;
  upvotes: number;
  author: { id: string; displayName: string; isTrustedApologist: boolean };
}

const TOPICS = [
  { value: 'existence_of_god', label: 'Existence of God' },
  { value: 'problem_of_evil', label: 'Problem of Evil' },
  { value: 'resurrection_evidence', label: 'Resurrection Evidence' },
  { value: 'science_and_faith', label: 'Science & Faith' },
  { value: 'textual_reliability', label: 'Textual Reliability' },
  { value: 'comparative_religion', label: 'Comparative Religion' },
];

export default function ApologeticsPage() {
  const { getToken } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [draftAnswer, setDraftAnswer] = useState('');

  // Ask question form
  const [showAsk, setShowAsk] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('existence_of_god');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const url = selectedTopic ? `/api/apologetics/questions?topic=${selectedTopic}` : '/api/apologetics/questions';
      const data = await apiRequest<Question[]>(url, { token: token ?? undefined });
      setQuestions(data);
    } finally {
      setLoading(false);
    }
  }, [getToken, selectedTopic]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const loadQuestionDetail = async (id: string) => {
    const token = await getToken();
    const q = await apiRequest<Question & { answers: Answer[] }>(`/api/apologetics/questions/${id}`, { token: token ?? undefined });
    setActiveQuestion(q);
    setAnswers(q.answers);
  };

  async function postQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmittingQuestion(true);
    try {
      const token = await getToken();
      await apiRequest('/api/apologetics/questions', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ title, content, topic }),
      });
      setShowAsk(false);
      setTitle('');
      setContent('');
      loadQuestions();
    } finally {
      setSubmittingQuestion(false);
    }
  }

  async function postAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!draftAnswer.trim() || !activeQuestion) return;
    setSubmittingAnswer(true);
    try {
      const token = await getToken();
      await apiRequest(`/api/apologetics/questions/${activeQuestion.id}/answers`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ content: draftAnswer }),
      });
      setDraftAnswer('');
      await loadQuestionDetail(activeQuestion.id);
    } finally {
      setSubmittingAnswer(false);
    }
  }

  async function voteAnswer(answerId: string, value: 1 | -1) {
    try {
      const token = await getToken();
      await apiRequest(`/api/apologetics/answers/${answerId}/vote`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ value }),
      });
      if (activeQuestion) {
        await loadQuestionDetail(activeQuestion.id);
      }
    } catch (err) {
      alert('You can only vote once per answer.');
    }
  }

  return (
    <div className="page-container">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <BackButton />
      </div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', maxWidth: '1000px', margin: '0 auto 28px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, marginBottom: '6px' }}>⚔️ Apologetics Forums</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Respectful theological discussion, Q&A, and answers from vetted trusted apologists.
          </p>
        </div>
        <button id="ask-apologetics-btn" type="button" className="btn btn-primary" onClick={() => setShowAsk(true)}>
          Ask a Question
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Left Side: Topic list */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: '6px' }}>
            Filter by Topic
          </p>
          <button
            type="button"
            onClick={() => setSelectedTopic('')}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
              background: selectedTopic === '' ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: selectedTopic === '' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: 'none', fontWeight: selectedTopic === '' ? 600 : 400,
            }}
          >
            🌐 All Topics
          </button>
          {TOPICS.map((t) => (
            <button
              key={t.value} type="button"
              onClick={() => setSelectedTopic(t.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                background: selectedTopic === t.value ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: selectedTopic === t.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none', fontWeight: selectedTopic === t.value ? 600 : 400,
              }}
            >
              • {t.label}
            </button>
          ))}
        </aside>

        {/* Right Side: Questions listing or detail */}
        <main>
          {activeQuestion ? (
            /* Thread detail view */
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <button type="button" className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}
                onClick={() => { setActiveQuestion(null); loadQuestions(); }}>
                ← Back to List
              </button>

              <article className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--brand-gold)', fontWeight: 600 }}>
                    {TOPICS.find((t) => t.value === activeQuestion.topic)?.label}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Posted by {activeQuestion.author.displayName}
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>{activeQuestion.title}</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{activeQuestion.content}</p>
              </article>

              {/* Answers block */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Answers ({answers.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {answers.map((ans) => (
                    <div key={ans.id} className="card" style={{ display: 'flex', gap: '16px' }}>
                      {/* Vote panel */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <button type="button" onClick={() => voteAnswer(ans.id, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>▲</button>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{ans.upvotes}</span>
                        <button type="button" onClick={() => voteAnswer(ans.id, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>▼</button>
                      </div>

                      {/* Content panel */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>{ans.author.displayName}</span>
                          {ans.author.isTrustedApologist && (
                            <span style={{
                              fontSize: '10px', fontWeight: 700, background: 'rgba(245,158,11,0.1)', color: '#fcd34d',
                              padding: '2px 8px', borderRadius: '99px', border: '1px solid rgba(245,158,11,0.2)',
                            }}>Vetted Apologist</span>
                          )}
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ans.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Form to submit answer */}
                <form onSubmit={postAnswer} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '14px' }}>Your Answer</h4>
                  <textarea
                    className="form-input" rows={4} required placeholder="Provide a thoughtful, respectful theological answer citing scriptures if possible..."
                    value={draftAnswer} onChange={(e) => setDraftAnswer(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} disabled={submittingAnswer}>
                    {submittingAnswer ? 'Posting...' : 'Post Answer'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Questions feed */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loading && <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading questions...</div>}
              {!loading && questions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No questions found in this topic. Be the first to ask!
                </div>
              )}
              {questions.map((q) => (
                <div key={q.id} className="card card-interactive" onClick={() => loadQuestionDetail(q.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--brand-gold)', fontWeight: 700 }}>
                      {TOPICS.find((t) => t.value === q.topic)?.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Posted by {q.author.displayName}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{q.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {q.content}
                  </p>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    💬 {q._count?.answers ?? 0} answer{(q._count?.answers !== 1) ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Ask Question Modal */}
      {showAsk && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowAsk(false); }}>
          <form onSubmit={postQuestion} className="glass-strong animate-fade-in"
            style={{ width: '100%', maxWidth: '520px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Ask an Apologetics Question</h2>

            <div className="form-group">
              <label htmlFor="question-topic" className="form-label">Topic Area</label>
              <select id="question-topic" className="form-input" value={topic} onChange={(e) => setTopic(e.target.value)}>
                {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="question-title" className="form-label">Question Title *</label>
              <input id="question-title" type="text" className="form-input" required placeholder="e.g. How can we reconcile science and the Genesis creation account?"
                value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="question-content" className="form-label">Question Details *</label>
              <textarea id="question-content" className="form-input" rows={6} required placeholder="State your question details. Maintain a respectful, seeking tone."
                value={content} onChange={(e) => setContent(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowAsk(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingQuestion}>
                {submittingQuestion ? 'Posting...' : 'Ask Question'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
