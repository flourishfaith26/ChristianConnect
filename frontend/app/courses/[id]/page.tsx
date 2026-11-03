'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

interface Lesson {
  id: string;
  weekNumber: number;
  title: string;
  videoUrl: string | null;
  content: string;
  discussionQuestions: string[];
}

interface CourseProgress {
  completedWeeks: number[];
  isCompleted: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  focus: string;
  durationWeeks: number;
  lessons: Lesson[];
  progress: CourseProgress[];
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(1);
  const [saving, setSaving] = useState(false);

  const loadCourse = useCallback(async () => {
    try {
      const token = await getToken();
      const courses = await apiRequest<Course[]>('/api/courses', { token: token ?? undefined });
      const found = courses.find(c => c.id === id);
      if (found) {
        setCourse(found);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => { loadCourse(); }, [loadCourse]);

  const handleMarkWeekComplete = async (weekNum: number) => {
    setSaving(true);
    try {
      const token = await getToken();
      await apiRequest(`/api/courses/${id}/progress`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ weekNumber: weekNum }),
      });
      loadCourse();
    } catch {
      alert('Could not update progress');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading course content...</div>
      </div>
    );
  }

  if (!course) return null;

  const currentLesson = course.lessons.find(l => l.weekNumber === activeWeek) || course.lessons[0];
  const completedWeeks = course.progress[0]?.completedWeeks || [];
  const isWeekDone = completedWeeks.includes(activeWeek);

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        <a href="/courses" style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          ← Back to All Courses
        </a>

        {/* Course Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '6px' }}>
            🌱 {course.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {course.description}
          </p>
        </div>

        {/* Weeks Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px' }}>
          {course.lessons.map(lesson => {
            const isDone = completedWeeks.includes(lesson.weekNumber);
            const isActive = activeWeek === lesson.weekNumber;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setActiveWeek(lesson.weekNumber)}
                style={{
                  padding: '10px 16px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                  background: isActive ? 'var(--brand-primary)' : 'var(--bg-surface)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  fontSize: '13px', fontWeight: 600, flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {isDone ? '✅' : '📖'} Week {lesson.weekNumber}
              </button>
            );
          })}
        </div>

        {/* Lesson View */}
        {currentLesson && (
          <div className="card animate-fade-in" style={{ padding: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700 }}>
                {currentLesson.title}
              </h2>
              {isWeekDone && (
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '4px 12px', borderRadius: '99px' }}>
                  ✓ Week Completed
                </span>
              )}
            </div>

            {/* Video Lecture */}
            {currentLesson.videoUrl && (
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
                <video src={currentLesson.videoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            )}

            {/* Lesson Text */}
            <div style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text-primary)', marginBottom: '32px' }}>
              {currentLesson.content}
            </div>

            {/* Discussion Questions */}
            {currentLesson.discussionQuestions?.length > 0 && (
              <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', marginBottom: '28px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  💬 Group Discussion & Reflection Questions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentLesson.discussionQuestions.map((q, idx) => (
                    <p key={idx} style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                      • {q}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Mark Complete Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
              <button
                type="button"
                className={`btn ${isWeekDone ? 'btn-outline' : 'btn-primary'} btn-lg`}
                onClick={() => handleMarkWeekComplete(activeWeek)}
                disabled={saving}
              >
                {isWeekDone ? '✅ Mark Week Completed Again' : 'Mark Week Complete →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
