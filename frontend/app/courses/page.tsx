'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface Lesson {
  id: string;
  weekNumber: number;
  title: string;
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

export default function DiscipleshipCoursesPage() {
  const { getToken } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<Course[]>('/api/courses', {
        token: token ?? undefined,
      });
      setCourses(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '6px' }}>
            🌱 Structured Discipleship Courses
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Multi-week guided curricula, lesson videos, and discussion questions for spiritual growth.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Loading discipleship courses...
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '24px' }}>
          {courses.map(course => {
            const completedCount = course.progress[0]?.completedWeeks?.length || 0;
            const progressPercent = Math.round((completedCount / course.durationWeeks) * 100);

            return (
              <div key={course.id} className="card animate-fade-in" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '3px 10px', borderRadius: '99px',
                    }}>
                      {course.focus.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--brand-gold)', fontWeight: 600 }}>
                      🗓️ {course.durationWeeks} Weeks
                    </span>
                  </div>

                  <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    {course.title}
                  </h3>

                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {course.description}
                  </p>

                  {/* Progress bar */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <span>Progress</span>
                      <span>{completedCount} / {course.durationWeeks} Weeks ({progressPercent}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-overlay)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--brand-primary)', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                </div>

                <Link href={`/courses/${course.id}`} className="btn btn-primary btn-lg" style={{ textAlign: 'center', width: '100%' }}>
                  {completedCount === 0 ? '🚀 Start Course →' : '📖 Continue Discipleship →'}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
