'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface UserGroup {
  id: string;
  name: string;
}

export default function CreateStoryPage() {
  const { getToken } = useAuth();
  const router = useRouter();

  // Upload mode: 'device' (default) or 'url'
  const [uploadMode, setUploadMode] = useState<'device' | 'url'>('device');

  // Selected file from device
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isDragging, setIsDragging] = useState(false);

  // Manual URL fallback
  const [mediaUrl, setMediaUrl] = useState('');

  // Story details
  const [textOverlay, setTextOverlay] = useState('');
  const [verseRef, setVerseRef] = useState('');
  const [visibility, setVisibility] = useState<'everyone' | 'group_only'>('everyone');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState<UserGroup[]>([]);

  // State
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [loadingPassage, setLoadingPassage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load user's joined groups for group-scoped visibility
  const loadGroups = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiRequest<UserGroup[]>('/api/groups', { token: token ?? undefined });
      setGroups(res);
    } catch {
      // non-critical
    }
  }, [getToken]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle local file selection
  const handleFileSelected = (file: File) => {
    setError(null);

    // Validate type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Please choose a valid image (JPG, PNG, WEBP, GIF) or video (MP4, WEBM, MOV) file.');
      return;
    }

    // Check size limit: 50MB for video, 15MB for image
    const maxSizeBytes = isVideo ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max size is ${isVideo ? '50MB for video' : '15MB for images'}.`);
      return;
    }

    setSelectedFile(file);
    setMediaType(isVideo ? 'video' : 'image');

    // Create instant local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Convert File to Base64 Data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Auto-fill Verse of the Day from active reading plan
  const fetchTodayVerse = async () => {
    setLoadingPassage(true);
    try {
      const token = await getToken();
      const res = await apiRequest<{ day?: { passageLabel: string } }>('/api/reading-plans/me', {
        token: token ?? undefined,
      });
      if (res.day?.passageLabel) {
        setVerseRef(res.day.passageLabel);
      } else {
        setVerseRef('John 3:16');
      }
    } catch {
      setVerseRef('John 3:16');
    } finally {
      setLoadingPassage(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Require either a device file or a URL
    if (uploadMode === 'device' && !selectedFile) {
      setError('Please select an image or video from your device to upload.');
      return;
    }

    if (uploadMode === 'url' && !mediaUrl.trim()) {
      setError('Please provide a media URL or switch to "Upload from Device".');
      return;
    }

    setSubmitting(true);
    setUploadStatus('Preparing media...');

    try {
      const token = await getToken();
      let finalMediaUrl = '';

      if (uploadMode === 'device' && selectedFile) {
        setUploadStatus('Uploading media from your device...');

        // 1. Fetch signed upload params (or dev stub)
        const uploadParams = await apiRequest<{
          uploadUrl: string;
          isDevStub: boolean;
          signature?: string;
          timestamp?: number;
          apiKey?: string;
          cloudName?: string;
          folder?: string;
        }>('/api/stories/upload-url', {
          method: 'POST',
          token: token ?? undefined,
        });

        if (uploadParams.isDevStub) {
          // In development mode without Cloudinary, convert to base64 Data URL for instant rendering
          const base64Data = await fileToBase64(selectedFile);
          const devRes = await apiRequest<{ secure_url: string }>('/api/stories/dev-upload', {
            method: 'POST',
            token: token ?? undefined,
            body: JSON.stringify({ mediaUrl: base64Data }),
          });
          finalMediaUrl = devRes.secure_url || base64Data;
        } else {
          // Direct Cloudinary multipart upload
          const formData = new FormData();
          formData.append('file', selectedFile);
          if (uploadParams.apiKey) formData.append('api_key', uploadParams.apiKey);
          if (uploadParams.timestamp) formData.append('timestamp', String(uploadParams.timestamp));
          if (uploadParams.signature) formData.append('signature', uploadParams.signature);
          if (uploadParams.folder) formData.append('folder', uploadParams.folder);

          const cloudRes = await fetch(uploadParams.uploadUrl, {
            method: 'POST',
            body: formData,
          });

          if (!cloudRes.ok) {
            throw new Error('Cloud media upload failed. Please try again.');
          }

          const cloudData = await cloudRes.json();
          finalMediaUrl = cloudData.secure_url;
        }
      } else {
        finalMediaUrl = mediaUrl.trim();
      }

      setUploadStatus('Moderating and publishing story...');

      // 2. Publish story record with moderation
      await apiRequest('/api/stories', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          mediaUrl: finalMediaUrl,
          mediaType,
          textOverlay: textOverlay.trim() || undefined,
          verseRef: verseRef.trim() || undefined,
          visibility,
          groupId: visibility === 'group_only' ? groupId : undefined,
        }),
      });

      setUploadStatus('Story published successfully!');
      router.push('/stories');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish story.');
    } finally {
      setSubmitting(false);
      setUploadStatus('');
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>

        <Link href="/stories" style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px', fontWeight: 500 }}>
          ← Back to Stories
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '32px', alignItems: 'start' }}>

          {/* Form Column */}
          <div className="card animate-fade-in" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'rgba(46, 125, 50, 0.12)', color: 'var(--brand-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px'
              }}>
                📸
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>
                  Create a Story
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Expires in 24 hours. Reviewed by moderation before publishing.
                </p>
              </div>
            </div>

            {error && (
              <div className="form-error" style={{ margin: '20px 0', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(211, 47, 47, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(211, 47, 47, 0.3)', fontSize: '14px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px', marginTop: '16px' }}>

              {/* Mode Selector Tabs */}
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Media Source</label>
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  background: 'var(--bg-elevated)',
                  padding: '4px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <button
                    type="button"
                    onClick={() => setUploadMode('device')}
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: uploadMode === 'device' ? 'var(--bg-surface)' : 'transparent',
                      color: uploadMode === 'device' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      boxShadow: uploadMode === 'device' ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    📱 Upload from Device
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: uploadMode === 'url' ? 'var(--bg-surface)' : 'transparent',
                      color: uploadMode === 'url' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      boxShadow: uploadMode === 'url' ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    🔗 Media Web URL
                  </button>
                </div>
              </div>

              {/* Device Upload Zone */}
              {uploadMode === 'device' && (
                <div>
                  {/* Hidden File Inputs */}
                  <input
                    id="device-media-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelected(e.target.files[0]);
                      }
                    }}
                  />
                  <input
                    id="device-camera-capture"
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelected(e.target.files[0]);
                      }
                    }}
                  />

                  {!selectedFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${isDragging ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                        borderRadius: 'var(--radius-lg)',
                        background: isDragging ? 'rgba(46, 125, 50, 0.05)' : 'var(--bg-elevated)',
                        padding: '36px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        background: 'rgba(46, 125, 50, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '26px', color: 'var(--brand-primary)'
                      }}>
                        ☁️
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                          Drag & drop your photo or video here
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          or click to browse your device
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }} onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          📁 Choose File
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => cameraInputRef.current?.click()}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          📸 Camera
                        </button>
                      </div>

                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Supports JPG, PNG, WEBP, GIF, MP4, WEBM (Max 50MB)
                      </span>
                    </div>
                  ) : (
                    /* Selected File Banner */
                    <div style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(46, 125, 50, 0.06)',
                      border: '1px solid rgba(46, 125, 50, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '8px',
                          background: 'var(--brand-primary)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '20px', flexShrink: 0
                        }}>
                          {mediaType === 'video' ? '🎬' : '🖼️'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {selectedFile.name}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {mediaType === 'video' ? 'Video' : 'Image'} • {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-danger)',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: 600
                          }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Web URL Mode */}
              {uploadMode === 'url' && (
                <div className="form-group">
                  <label htmlFor="media-url-input" className="form-label" style={{ fontWeight: 600 }}>Image or Video URL</label>
                  <input
                    id="media-url-input"
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/photo.jpg"
                    value={mediaUrl}
                    onChange={e => {
                      setMediaUrl(e.target.value);
                      const isVid = e.target.value.match(/\.(mp4|webm|mov)(\?.*)?$/i);
                      setMediaType(isVid ? 'video' : 'image');
                    }}
                  />
                  <span className="form-hint">Paste a direct image or video web URL.</span>
                </div>
              )}

              {/* Text Overlay */}
              <div className="form-group">
                <label htmlFor="text-overlay-input" className="form-label" style={{ fontWeight: 600 }}>Text Overlay (optional)</label>
                <textarea
                  id="text-overlay-input"
                  className="form-input"
                  rows={2}
                  placeholder="Add a prayer request, praise note, or thought..."
                  value={textOverlay}
                  onChange={e => setTextOverlay(e.target.value.slice(0, 200))}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <span className="form-hint">{textOverlay.length}/200 characters</span>
                </div>
              </div>

              {/* Verse of the Day Option */}
              <div className="form-group">
                <label htmlFor="verse-ref-input" className="form-label" style={{ fontWeight: 600 }}>Scripture Reference (optional)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    id="verse-ref-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Philippians 4:13"
                    value={verseRef}
                    onChange={e => setVerseRef(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ flexShrink: 0, padding: '0 14px' }}
                    onClick={fetchTodayVerse}
                    disabled={loadingPassage}
                  >
                    {loadingPassage ? 'Loading...' : '📖 Today\'s Verse'}
                  </button>
                </div>
              </div>

              {/* Visibility Selector */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Audience Visibility</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="radio"
                      name="visibility"
                      value="everyone"
                      checked={visibility === 'everyone'}
                      onChange={() => setVisibility('everyone')}
                      style={{ accentColor: 'var(--brand-primary)' }}
                    />
                    🌐 Everyone
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="radio"
                      name="visibility"
                      value="group_only"
                      checked={visibility === 'group_only'}
                      onChange={() => setVisibility('group_only')}
                      style={{ accentColor: 'var(--brand-primary)' }}
                    />
                    👥 Group Members Only
                  </label>
                </div>
              </div>

              {/* Group Selector if group-scoped */}
              {visibility === 'group_only' && (
                <div className="form-group animate-fade-in">
                  <label htmlFor="group-id-select" className="form-label" style={{ fontWeight: 600 }}>Select Community Group *</label>
                  <select
                    id="group-id-select"
                    className="form-input"
                    value={groupId}
                    onChange={e => setGroupId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose a group --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit Button */}
              <div style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={submitting}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">⏳</span> {uploadStatus || 'Publishing Story...'}
                    </>
                  ) : (
                    '✝ Publish Story'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Story Preview Column */}
          <div style={{ position: 'sticky', top: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Live Story Preview
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(46, 125, 50, 0.1)', color: 'var(--brand-primary)', fontWeight: 600 }}>
                ⏳ 24h Expiry
              </span>
            </div>

            {/* 9:16 Mockup Card */}
            <div
              style={{
                width: '100%',
                aspectRatio: '9/16',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                position: 'relative',
                background: '#1a1a1a',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Media Background */}
              {previewUrl || (uploadMode === 'url' && mediaUrl.trim()) ? (
                mediaType === 'video' ? (
                  <video
                    src={previewUrl || mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src={previewUrl || mediaUrl}
                    alt="Story Preview"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(180deg, #243B55 0%, #141E30 100%)',
                  color: 'rgba(255, 255, 255, 0.6)', padding: '24px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>🖼️</div>
                  <p style={{ fontSize: '13px', fontWeight: 500 }}>Upload a photo or video to see the live preview</p>
                </div>
              )}

              {/* Top Bar Overlay */}
              <div style={{
                position: 'relative', zIndex: 2, padding: '16px 14px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--brand-primary)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 700, border: '2px solid #fff'
                  }}>
                    ✝
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                      Your Story
                    </p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                      Just now • {visibility === 'everyone' ? '🌐 Everyone' : '👥 Group'}
                    </p>
                  </div>
                </div>

                {verseRef && (
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px',
                    background: 'rgba(212, 175, 55, 0.9)', color: '#1a1a1a',
                    fontSize: '11px', fontWeight: 700, backdropFilter: 'blur(4px)'
                  }}>
                    📖 {verseRef}
                  </span>
                )}
              </div>

              {/* Bottom Text Overlay */}
              {textOverlay && (
                <div style={{
                  position: 'relative', zIndex: 2, padding: '24px 16px',
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                  color: '#ffffff'
                }}>
                  <p style={{ fontSize: '14px', lineHeight: 1.4, fontWeight: 500, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                    {textOverlay}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
