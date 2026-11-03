'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: (post: any) => void;
  initialCategory?: string;
  user?: any;
}

const PRESET_PHOTOS = [
  { label: '🌅 Sunrise Hope', url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80' },
  { label: '📖 Open Bible', url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80' },
  { label: '🙌 Worship Light', url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=1200&q=80' },
  { label: '✝️ Mountain Cross', url: 'https://images.unsplash.com/photo-1510936150000-409ba3fe203f?auto=format&fit=crop&w=1200&q=80' },
];

export default function CreatePostModal({
  onClose,
  onPostCreated,
  initialCategory = 'All',
  user,
}: CreatePostModalProps) {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const categoryToTypeMap: Record<string, 'testimony' | 'prayer' | 'devotional' | 'sermon' | 'apologetics'> = {
    Devotional: 'devotional',
    Testimonies: 'testimony',
    Community: 'prayer',
    Sermons: 'sermon',
    Apologetics: 'apologetics',
  };

  const defaultType =
    initialCategory && categoryToTypeMap[initialCategory]
      ? categoryToTypeMap[initialCategory]
      : 'testimony';

  const [type, setType] = useState<'testimony' | 'prayer' | 'devotional' | 'sermon' | 'apologetics'>(defaultType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scriptureRef, setScriptureRef] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ALL_CATEGORIES = [
    { id: 'testimony', label: '🕊️ Testimony', categoryName: 'Testimonies' },
    { id: 'prayer', label: '🙏 Prayer Request', categoryName: 'Community' },
    { id: 'devotional', label: '📜 Devotional Note', categoryName: 'Devotional' },
    { id: 'sermon', label: '🎬 Sermon Note', categoryName: 'Sermons' },
    { id: 'apologetics', label: '⚔️ Apologetics Q&A', categoryName: 'Apologetics' },
  ];

  const availableCategories =
    initialCategory && initialCategory !== 'All'
      ? ALL_CATEGORIES.filter((c) => c.categoryName.toLowerCase() === initialCategory.toLowerCase())
      : ALL_CATEGORIES;

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('Image file is too large. Please select a file under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaUrl(event.target?.result as string);
      setMediaType('image');
      setShowUrlInput(false);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function handleVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError('Video file is too large. Please select a video under 50MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaUrl(event.target?.result as string);
      setMediaType('video');
      setShowUrlInput(false);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function handleAttachUrl() {
    if (!customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    const isVideo = url.endsWith('.mp4') || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('video');
    setMediaUrl(url);
    setMediaType(isVideo ? 'video' : 'image');
    setCustomUrlInput('');
    setShowUrlInput(false);
  }

  function handleRemoveMedia() {
    setMediaUrl(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 5) {
      setError('Please write at least 5 characters in your message.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      const typeToCategoryMap = {
        testimony: 'Testimonies',
        prayer: 'Community',
        devotional: 'Devotional',
        sermon: 'Sermons',
        apologetics: 'Apologetics',
      };

      const defaultTitles = {
        testimony: 'Faith Testimony',
        prayer: 'Prayer Request',
        devotional: 'Devotional Reflection',
        sermon: 'Sermon Reflection',
        apologetics: 'Apologetics Question',
      };

      const res = await apiRequest<{ success: boolean; post: any }>('/api/feed/post', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          title: title.trim() || defaultTitles[type],
          content: content.trim(),
          type,
          category: typeToCategoryMap[type],
          scriptureRef: scriptureRef.trim() || null,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          videoUrl: mediaType === 'video' ? mediaUrl : undefined,
          authorDisplayName: user?.displayName,
          authorAvatarUrl: user?.avatarUrl,
        }),
      });

      if (res.post) {
        onPostCreated(res.post);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Could not post to feed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          maxWidth: '580px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '26px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Modal Header with User Profile Picture */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#2e7d32',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '15px',
                overflow: 'hidden',
                flexShrink: 0,
                border: '2px solid #d4af37',
              }}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : user?.displayName ? (
                user.displayName[0].toUpperCase()
              ) : (
                'F'
              )}
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {user?.displayName || 'Flourish Faith'}
              </h2>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Posting to Community Feed ✝️</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              backgroundColor: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontSize: '15px',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#e11d48',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Post Category Selector */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Select Category
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {availableCategories.map((cat) => {
                const isSelected = type === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setType(cat.id as any)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: isSelected ? '2px solid #2e7d32' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                      color: isSelected ? '#166534' : '#64748b',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 6px rgba(46,125,50,0.15)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              Title / Headline (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. God Restored My Peace in Tough Times"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f8fafc',
              }}
            />
          </div>

          {/* Scripture Reference Input */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              Scripture Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Philippians 4:6-7, Romans 8:28"
              value={scriptureRef}
              onChange={(e) => setScriptureRef(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f8fafc',
              }}
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              Your Message / Story / Prayer
            </label>
            <textarea
              rows={4}
              placeholder="Share what God is doing in your life, post a devotional insight, or ask the community to pray with you..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.5,
                backgroundColor: '#f8fafc',
              }}
            />
          </div>

          {/* ── Media Attachment Bar (Pictures & Videos) ── */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Attach Media (Pictures & Videos)
            </label>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageFileChange}
            />
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleVideoFileChange}
            />

            {/* Media Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <span>📷</span>
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <span>🎥</span>
                <span>Upload Video</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                <span>🔗</span>
                <span>Paste Link</span>
              </button>
            </div>

            {/* URL Input Box */}
            {showUrlInput && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="url"
                  placeholder="Paste direct image or video URL (e.g. https://...)"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAttachUrl}
                  style={{
                    backgroundColor: '#2e7d32',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Attach
                </button>
              </div>
            )}

            {/* Quick-Pick Preset Images */}
            {!mediaUrl && (
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Or select inspirational preset background:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_PHOTOS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        setMediaUrl(preset.url);
                        setMediaType('image');
                      }}
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Media Preview Box */}
            {mediaUrl && (
              <div
                style={{
                  position: 'relative',
                  marginTop: '10px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#0f172a',
                  border: '2px solid #2e7d32',
                  maxHeight: '260px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {mediaType === 'video' ? (
                  <video
                    controls
                    src={mediaUrl}
                    style={{ width: '100%', maxHeight: '250px', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Attached preview"
                    style={{ width: '100%', maxHeight: '250px', objectFit: 'cover' }}
                  />
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Remove media"
                >
                  ✕
                </button>

                {/* Badge Indicator */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {mediaType === 'video' ? '🎬 Video Attached' : '🖼️ Photo Attached'}
                </span>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                backgroundColor: '#2e7d32',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.25)',
              }}
            >
              <span>🚀</span>
              <span>{submitting ? 'Publishing...' : 'Publish to Feed'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
