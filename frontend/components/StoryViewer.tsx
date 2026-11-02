'use client';

import { useState, useEffect, useCallback } from 'react';
import ReportButton from './ReportButton';

export interface StorySegment {
  id: string;
  mediaUrl: string;
  mediaType: string;
  textOverlay: string | null;
  verseRef: string | null;
  createdAt: string;
  isViewed: boolean;
}

export interface StoryAuthorGroup {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  stories: StorySegment[];
  hasUnseen?: boolean;
}

interface Props {
  groups: StoryAuthorGroup[];
  initialGroupIndex?: number;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
}

export default function StoryViewer({ groups, initialGroupIndex = 0, onClose, onStoryViewed }: Props) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && onStoryViewed && !currentStory.isViewed) {
      onStoryViewed(currentStory.id);
    }
  }, [currentStory, onStoryViewed]);

  const goNext = useCallback(() => {
    if (!currentGroup) return;
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(s => s + 1);
      setProgress(0);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(g => g + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentGroup, storyIndex, groupIndex, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(s => s - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      setGroupIndex(g => g - 1);
      const prevGroup = groups[groupIndex - 1];
      setStoryIndex(prevGroup ? prevGroup.stories.length - 1 : 0);
      setProgress(0);
    }
  }, [storyIndex, groupIndex, groups]);

  // Progress timer for story auto-advance (5s total per slide, updated every 50ms)
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 1; // 100 steps * 50ms = 5000ms = 5s
      });
    }, 50);

    return () => clearInterval(interval);
  }, [groupIndex, storyIndex]);

  // When progress reaches 100%, trigger next slide cleanly outside state updater
  useEffect(() => {
    if (progress >= 100) {
      goNext();
    }
  }, [progress, goNext]);

  if (!currentGroup || !currentStory) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Outer frame */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '420px', height: '100%', maxHeight: '740px',
        background: '#111', borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Top Progress Bars */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px', right: '12px', zIndex: 10,
          display: 'flex', gap: '4px',
        }}>
          {currentGroup.stories.map((s, idx) => (
            <div key={s.id} style={{
              flex: 1, height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', background: 'white',
                width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%',
                transition: idx === storyIndex ? 'width 0.1s linear' : 'none',
              }} />
            </div>
          ))}
        </div>

        {/* User Header */}
        <div style={{
          position: 'absolute', top: '24px', left: '16px', right: '16px', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px',
              overflow: 'hidden',
            }}>
              {currentGroup.user.avatarUrl ? (
                <img src={currentGroup.user.avatarUrl} alt={currentGroup.user.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentGroup.user.displayName[0].toUpperCase()
              )}
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0 }}>
                {currentGroup.user.displayName}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', margin: 0 }}>
                {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ReportButton targetType="user" targetId={currentGroup.user.id} />
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
                fontSize: '20px', cursor: 'pointer', width: '32px', height: '32px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Media content */}
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {currentStory.mediaType === 'video' ? (
            <video src={currentStory.mediaUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <img src={currentStory.mediaUrl} alt="Story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}

          {/* Verse Badge */}
          {currentStory.verseRef && (
            <div style={{
              position: 'absolute', top: '80px', left: '16px',
              background: 'rgba(46,125,50,0.85)', backdropFilter: 'blur(8px)',
              padding: '6px 14px', borderRadius: '99px', color: 'white',
              fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              📖 {currentStory.verseRef}
            </div>
          )}

          {/* Text Overlay */}
          {currentStory.textOverlay && (
            <div style={{
              position: 'absolute', bottom: '60px', left: '20px', right: '20px',
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)',
              padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)',
              color: 'white', fontSize: '15px', lineHeight: 1.5, textAlign: 'center', fontWeight: 500,
            }}>
              {currentStory.textOverlay}
            </div>
          )}

          {/* Tap Areas */}
          <div
            onClick={goPrev}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '40%', cursor: 'pointer', zIndex: 5 }}
          />
          <div
            onClick={goNext}
            style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '60%', cursor: 'pointer', zIndex: 5 }}
          />
        </div>
      </div>
    </div>
  );
}
