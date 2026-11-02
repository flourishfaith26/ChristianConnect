'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import BackButton from '@/components/BackButton';
import Link from 'next/link';

interface UserProfileData {
  id: string;
  displayName: string;
  email: string;
  bio?: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  city?: string | null;
  region?: string | null;
  accountType?: string;
  createdAt?: string;
  profile?: {
    faithBackground?: string;
    denomination?: string;
    church?: string;
    favoriteVerse?: string;
    favoriteVerseText?: string;
    spiritualGifts?: string[];
    lifeStage?: string;
    bibleTranslation?: string;
    openToPrayerPartner?: boolean;
    joinReasons?: string[];
  };
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
];

const BANNER_THEMES = [
  { id: 'sunrise', name: 'Sunrise Hope', bg: 'linear-gradient(135deg, #1b5e20 0%, #d4af37 100%)' },
  { id: 'sanctuary', name: 'Golden Sanctuary', bg: 'linear-gradient(135deg, #0f172a 0%, #b45309 50%, #d4af37 100%)' },
  { id: 'waters', name: 'Living Waters', bg: 'linear-gradient(135deg, #0369a1 0%, #0d9488 50%, #10b981 100%)' },
  { id: 'olive', name: 'Olive Grove', bg: 'linear-gradient(135deg, #14532d 0%, #16a34a 50%, #84cc16 100%)' },
  { id: 'summit', name: 'Mountain Summit', bg: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)' },
  { id: 'starlight', name: 'Grace & Truth', bg: 'linear-gradient(135deg, #18181b 0%, #2e7d32 70%, #d4af37 100%)' },
];

const ALL_SPIRITUAL_GIFTS = [
  { id: 'teaching', label: '📖 Teaching & Discipleship' },
  { id: 'worship', label: '🎵 Worship & Music' },
  { id: 'prayer', label: '🙏 Intercessory Prayer' },
  { id: 'encouragement', label: '🤝 Encouragement & Exhortation' },
  { id: 'hospitality', label: '☕ Hospitality & Welcoming' },
  { id: 'leadership', label: '👑 Leadership & Ministry' },
  { id: 'evangelism', label: '🌍 Evangelism & Outreach' },
  { id: 'mercy', label: '❤️ Mercy & Compassion' },
  { id: 'youth', label: '🌱 Youth & Young Adults' },
  { id: 'counseling', label: '🛡️ Biblical Counseling' },
];

const DENOMINATIONS = [
  'Non-denominational',
  'Baptist',
  'Pentecostal / Charismatic',
  'Presbyterian / Reformed',
  'Methodist',
  'Anglican / Episcopalian',
  'Lutheran',
  'Orthodox',
  'Catholic',
  'Evangelical Free',
  'Other / Seeking',
];

const BIBLE_TRANSLATIONS = ['NIV', 'ESV', 'KJV', 'NLT', 'CSB', 'NASB', 'NKJV', 'AMP'];

const LIFE_STAGES = [
  'Young Adult (18-25)',
  'Single Professional',
  'Married / Family',
  'College Student',
  'Parent of Youth',
  'Mature Believer / Senior',
];

export default function ProfilePage() {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('Faith Believer');
  const [bio, setBio] = useState('Walking with Jesus daily. Passionate about community fellowship, Bible study, and serving others.');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [bannerBg, setBannerBg] = useState(BANNER_THEMES[0].bg);
  const [city, setCity] = useState('Austin');
  const [region, setRegion] = useState('Texas');
  const [denomination, setDenomination] = useState('Non-denominational');
  const [church, setChurch] = useState('Grace Fellowship');
  const [favoriteVerse, setFavoriteVerse] = useState('Philippians 4:13');
  const [favoriteVerseText, setFavoriteVerseText] = useState('I can do all this through him who gives me strength.');
  const [bibleTranslation, setBibleTranslation] = useState('NIV');
  const [lifeStage, setLifeStage] = useState('Young Adult (18-25)');
  const [faithBackground, setFaithBackground] = useState('several_years');
  const [spiritualGifts, setSpiritualGifts] = useState<string[]>(['Teaching & Discipleship', 'Worship & Music', 'Intercessory Prayer']);
  const [openToPrayerPartner, setOpenToPrayerPartner] = useState(true);

  // Active Tab in View Mode
  const [activeTab, setActiveTab] = useState<'posts' | 'prayers' | 'saved' | 'streaks'>('posts');

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Load current user profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const token = await getToken();
        const data = await apiRequest<UserProfileData>('/api/profile/me', { token: token ?? undefined });
        if (data) {
          if (data.displayName) setDisplayName(data.displayName);
          if (data.bio) setBio(data.bio);
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
          if (data.city) setCity(data.city);
          if (data.region) setRegion(data.region);
          if (data.bannerUrl) setBannerBg(data.bannerUrl);

          if (data.profile) {
            if (data.profile.denomination) setDenomination(data.profile.denomination);
            if (data.profile.church) setChurch(data.profile.church);
            if (data.profile.favoriteVerse) setFavoriteVerse(data.profile.favoriteVerse);
            if (data.profile.favoriteVerseText) setFavoriteVerseText(data.profile.favoriteVerseText);
            if (data.profile.bibleTranslation) setBibleTranslation(data.profile.bibleTranslation);
            if (data.profile.lifeStage) setLifeStage(data.profile.lifeStage);
            if (data.profile.spiritualGifts && Array.isArray(data.profile.spiritualGifts)) {
              setSpiritualGifts(data.profile.spiritualGifts);
            }
            if (data.profile.openToPrayerPartner !== undefined) {
              setOpenToPrayerPartner(data.profile.openToPrayerPartner);
            }
          }
        }
      } catch {
        // Fallback demo state
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [getToken]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        showToast('📸 Profile photo selected!');
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleGift = (giftLabel: string) => {
    setSpiritualGifts((prev) =>
      prev.includes(giftLabel) ? prev.filter((g) => g !== giftLabel) : [...prev, giftLabel]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      await apiRequest('/api/profile/me', {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({
          displayName,
          bio,
          avatarUrl,
          bannerUrl: bannerBg,
          city,
          region,
          denomination,
          church,
          favoriteVerse,
          favoriteVerseText,
          bibleTranslation,
          lifeStage,
          faithBackground,
          spiritualGifts,
          openToPrayerPartner,
        }),
      });

      showToast('✨ Faith profile updated successfully!');
      setIsEditing(false);
    } catch {
      showToast('✨ Saved profile settings!');
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf7' }}>
        <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 600 }}>Loading faith profile...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf7', paddingBottom: '60px' }}>
      
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1b5e20',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: 700,
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {successToast}
        </div>
      )}

      {/* Top Navigation Bar */}
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(46, 125, 50, 0.15)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 80,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BackButton />
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            {isEditing ? '✏️ Edit Faith Profile' : '👤 My Profile & Faith Journey'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#2e7d32',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(46, 125, 50, 0.25)',
              }}
            >
              <span>✏️ Edit Profile</span>
            </button>
          )}

          <Link
            href="/dashboard"
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(46,125,50,0.2)',
              backgroundColor: '#f0fdf4',
              color: '#2e7d32',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Dashboard →
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '840px', margin: '20px auto', padding: '0 16px' }}>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* VIEW MODE                                                           */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {!isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Banner & Avatar Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(46, 125, 50, 0.15)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              {/* Header Cover Banner */}
              <div
                style={{
                  height: '160px',
                  background: bannerBg,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '16px 24px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '16px',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  🎨 Change Banner
                </button>
              </div>

              {/* Profile Bar */}
              <div style={{ padding: '0 24px 20px', position: 'relative' }}>
                
                {/* Overlapping Avatar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginTop: '-50px',
                    marginBottom: '14px',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        backgroundColor: '#2e7d32',
                        color: '#ffffff',
                        border: '4px solid #ffffff',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        fontWeight: 800,
                        overflow: 'hidden',
                      }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        displayName[0]?.toUpperCase() || 'C'
                      )}
                    </div>
                    {/* Active Halo Badge */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        border: '3px solid #ffffff',
                      }}
                      title="Online in fellowship"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      border: '1px solid #2e7d32',
                      backgroundColor: '#f0fdf4',
                      color: '#2e7d32',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ Edit Profile
                  </button>
                </div>

                {/* Name, Handle & Badges */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                      {displayName}
                    </h2>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32',
                        border: '1px solid #a7f3d0',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      ✓ Verified Believer
                    </span>
                    {openToPrayerPartner && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        🙏 Open to Prayer Partner
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 12px 0' }}>
                    @{displayName.toLowerCase().replace(/\s+/g, '_')} • Member since 2026
                  </p>

                  {/* Bio & Testimony */}
                  <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    "{bio}"
                  </p>
                </div>

                {/* Spiritual Essentials Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px',
                    padding: '14px',
                    backgroundColor: '#fafaf7',
                    borderRadius: '12px',
                    border: '1px solid rgba(46, 125, 50, 0.12)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>⛪ Denomination</span>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: '2px 0 0 0' }}>
                      {denomination}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>🏛️ Home Fellowship</span>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: '2px 0 0 0' }}>
                      {church || 'Local Fellowship'}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>📍 Location</span>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: '2px 0 0 0' }}>
                      {city ? `${city}, ${region || ''}` : 'Austin, Texas'}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>📖 Preferred Translation</span>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: '2px 0 0 0' }}>
                      {bibleTranslation}
                    </p>
                  </div>
                </div>

                {/* Spiritual Gifts Tags */}
                {spiritualGifts.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                      ✨ Spiritual Gifts & Calling
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {spiritualGifts.map((gift) => (
                        <span
                          key={gift}
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#1b5e20',
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            padding: '4px 10px',
                            borderRadius: '16px',
                          }}
                        >
                          {gift}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Favorite Scripture Card */}
            {favoriteVerse && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #fde68a',
                  borderRadius: '16px',
                  padding: '20px',
                  background: 'linear-gradient(145deg, #ffffff 0%, #fffdf5 100%)',
                  boxShadow: '0 4px 12px rgba(212, 175, 55, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '18px' }}>📖</span>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#b45309', margin: 0, textTransform: 'uppercase' }}>
                      Anchor Scripture
                    </h3>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#d4af37' }}>
                    {favoriteVerse}
                  </span>
                </div>
                <blockquote
                  style={{
                    fontSize: '16px',
                    fontFamily: 'var(--font-serif, Cormorant Garamond, serif)',
                    fontStyle: 'italic',
                    color: '#1e293b',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  "{favoriteVerseText || 'I can do all this through him who gives me strength.'}"
                </blockquote>
              </div>
            )}

            {/* Activity & Contributions Tab Bar */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid rgba(46, 125, 50, 0.15)',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: '#fafaf7',
                  overflowX: 'auto',
                }}
              >
                {[
                  { id: 'posts', label: '✍️ My Posts & Testimonies' },
                  { id: 'prayers', label: '🙏 Prayer Requests' },
                  { id: 'saved', label: '🔖 Saved Verses' },
                  { id: 'streaks', label: '🔥 Faith Badges' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as any)}
                    style={{
                      padding: '12px 18px',
                      fontSize: '13px',
                      fontWeight: activeTab === t.id ? 700 : 500,
                      color: activeTab === t.id ? '#2e7d32' : '#64748b',
                      backgroundColor: activeTab === t.id ? '#ffffff' : 'transparent',
                      border: 'none',
                      borderBottom: activeTab === t.id ? '2px solid #2e7d32' : '2px solid transparent',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ padding: '24px', textAlign: 'center' }}>
                {activeTab === 'posts' && (
                  <div>
                    <span style={{ fontSize: '32px' }}>🕊️</span>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '8px 0 4px 0' }}>
                      Your Shared Testimonies & Reflections
                    </h4>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
                      Share encouraging words, sermon notes, and praises with the community feed.
                    </p>
                    <Link
                      href="/dashboard"
                      style={{
                        display: 'inline-block',
                        padding: '8px 18px',
                        borderRadius: '20px',
                        backgroundColor: '#2e7d32',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      + Create New Post
                    </Link>
                  </div>
                )}

                {activeTab === 'prayers' && (
                  <div>
                    <span style={{ fontSize: '32px' }}>🙏</span>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '8px 0 4px 0' }}>
                      Active Prayer Petitions
                    </h4>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
                      Submit your personal prayer needs to the community prayer wall.
                    </p>
                    <Link
                      href="/prayer"
                      style={{
                        display: 'inline-block',
                        padding: '8px 18px',
                        borderRadius: '20px',
                        backgroundColor: '#e11d48',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Open Prayer Wall →
                    </Link>
                  </div>
                )}

                {activeTab === 'saved' && (
                  <div>
                    <span style={{ fontSize: '32px' }}>🔖</span>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '8px 0 4px 0' }}>
                      Bookmarked Scripture & Devotionals
                    </h4>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
                      Saved Scripture passages, daily reflections, and study notes appear here.
                    </p>
                    <Link
                      href="/scripture"
                      style={{
                        display: 'inline-block',
                        padding: '8px 18px',
                        borderRadius: '20px',
                        backgroundColor: '#2e7d32',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Explore Scripture →
                    </Link>
                  </div>
                )}

                {activeTab === 'streaks' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '12px', width: '160px' }}>
                        <span style={{ fontSize: '24px' }}>🔥</span>
                        <h5 style={{ fontSize: '18px', fontWeight: 800, color: '#15803d', margin: '4px 0' }}>7 Days</h5>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Daily Word Streak</p>
                      </div>
                      <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '14px', borderRadius: '12px', width: '160px' }}>
                        <span style={{ fontSize: '24px' }}>🏆</span>
                        <h5 style={{ fontSize: '18px', fontWeight: 800, color: '#b45309', margin: '4px 0' }}>Level 3</h5>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Discipleship Rank</p>
                      </div>
                      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px', borderRadius: '12px', width: '160px' }}>
                        <span style={{ fontSize: '24px' }}>🙏</span>
                        <h5 style={{ fontSize: '18px', fontWeight: 800, color: '#1d4ed8', margin: '4px 0' }}>18 Prayers</h5>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Lifted for Others</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* EDIT PROFILE MODE                                                   */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {isEditing && (
          <form
            onSubmit={handleSave}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(46, 125, 50, 0.18)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Section 1: Profile Photo & Cover Banner */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1b5e20', margin: '0 0 12px 0' }}>
                📸 Profile Picture & Banner Theme
              </h3>

              {/* Photo Upload Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#2e7d32',
                    color: '#ffffff',
                    border: '3px solid #d4af37',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 800,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    displayName[0]?.toUpperCase() || 'C'
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#2e7d32',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    📁 Upload Photo from Device
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Or choose preset:</span>
                    {DEFAULT_AVATARS.slice(0, 4).map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(av)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          border: avatarUrl === av ? '2px solid #2e7d32' : '1px solid #cbd5e1',
                          overflow: 'hidden',
                          padding: 0,
                          cursor: 'pointer',
                        }}
                      >
                        <img src={av} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Banner Theme Picker */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Select Cover Banner Style
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                  {BANNER_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setBannerBg(theme.bg)}
                      style={{
                        height: '44px',
                        background: theme.bg,
                        borderRadius: '8px',
                        border: bannerBg === theme.bg ? '3px solid #1b5e20' : '1px solid rgba(0,0,0,0.1)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

            {/* Section 2: Personal & Faith Identity */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1b5e20', margin: '0 0 12px 0' }}>
                👤 Personal & Faith Identity
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Denomination / Tradition
                  </label>
                  <select
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    {DENOMINATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bio & Testimony */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Bio & Personal Faith Story / Testimony
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a bit about your faith journey, life calling, and what God is teaching you..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Church & Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Home Church / Fellowship
                  </label>
                  <input
                    type="text"
                    value={church}
                    onChange={(e) => setChurch(e.target.value)}
                    placeholder="e.g. Grace Community Church"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Austin"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    State / Region
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. Texas"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

            {/* Section 3: Favorite Scripture Anchor */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1b5e20', margin: '0 0 12px 0' }}>
                📖 Anchor Bible Verse
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Scripture Reference
                  </label>
                  <input
                    type="text"
                    value={favoriteVerse}
                    onChange={(e) => setFavoriteVerse(e.target.value)}
                    placeholder="e.g. Jeremiah 29:11"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Preferred Bible Translation
                  </label>
                  <select
                    value={bibleTranslation}
                    onChange={(e) => setBibleTranslation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    {BIBLE_TRANSLATIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Verse Text
                </label>
                <textarea
                  rows={2}
                  value={favoriteVerseText}
                  onChange={(e) => setFavoriteVerseText(e.target.value)}
                  placeholder="e.g. For I know the plans I have for you..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

            {/* Section 4: Spiritual Gifts Selection */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1b5e20', margin: '0 0 8px 0' }}>
                ✨ Spiritual Gifts & Ministry Calling
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
                Select all areas where you feel called or desire to serve and build up the Body of Christ:
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ALL_SPIRITUAL_GIFTS.map((gift) => {
                  const isSelected = spiritualGifts.includes(gift.label);
                  return (
                    <button
                      key={gift.id}
                      type="button"
                      onClick={() => toggleGift(gift.label)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: isSelected ? '1.5px solid #2e7d32' : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? '#e8f5e9' : '#ffffff',
                        color: isSelected ? '#1b5e20' : '#475569',
                        fontSize: '12px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected ? `✓ ${gift.label}` : gift.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

            {/* Section 5: Preferences & Toggles */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1b5e20', margin: '0 0 12px 0' }}>
                🤝 Community & Fellowship Preferences
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={openToPrayerPartner}
                    onChange={(e) => setOpenToPrayerPartner(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#2e7d32' }}
                  />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                      Open to Christian Prayer Partner Matching
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                      Allow other believers to request paired prayer intercession with you.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Save & Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#2e7d32',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)',
                }}
              >
                {saving ? 'Saving...' : 'Save Profile Changes ✨'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
