'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import Logo from '@/components/Logo';
import AuthGateModal, { AuthGateTarget } from '@/components/AuthGateModal';
import { getDailySpotlight } from '@/lib/dailySpotlight';

interface FeatureItem {
  icon: string;
  title: string;
  category: 'fellowship' | 'study' | 'prayer' | 'ministry';
  desc: string;
  badge?: string;
  route: string;
}

const ALL_FEATURES: FeatureItem[] = [
  { icon: '🤝', title: 'Friendship Groups', category: 'fellowship', desc: 'Find believers by location, age group, or ministry focus for genuine Christ-centered fellowship.', route: '/friendship' },
  { icon: '📖', title: 'Bible Study Buddies', category: 'study', desc: 'Deep-dive into Scripture together with paired study partners and chapter discussion threads.', route: '/bible-study' },
  { icon: '🙏', title: 'Global Prayer Wall', category: 'prayer', desc: 'Share urgent prayer requests, pray for others anonymously, and send "I Prayed for You" notifications.', route: '/prayer' },
  { icon: '💬', title: 'Safe Messaging & Chat', category: 'fellowship', desc: 'Encouraging real-time direct and group chat with scripture sharing and full text moderation.', route: '/chat' },
  { icon: '🛡️', title: 'Accountability Circles', category: 'prayer', desc: 'Small, trusted circles to support one another in purity, spiritual habits, and daily prayer goals.', route: '/accountability' },
  { icon: '🌱', title: 'New Convert Mentorship', category: 'prayer', desc: 'Pairs new believers with vetted mature mentors for a 12-week foundational discipleship roadmap.', route: '/mentorship' },
  { icon: '⚔️', title: 'Apologetics & Theology', category: 'study', desc: 'Defend and understand the faith with scholarly articles, historical evidence, and moderated debates.', route: '/apologetics' },
  { icon: '🕊️', title: 'Praise & Testimonies', category: 'prayer', desc: 'Celebrate God’s faithfulness by reading and sharing answered prayers and miraculous stories.', route: '/testimonies' },
  { icon: '💡', title: 'AI Scripture Q&A', category: 'study', desc: 'Explore difficult verses with historical context, Greek/Hebrew word roots, and cross-references.', route: '/faith-chat' },
  { icon: '📅', title: 'Reading Plans', category: 'study', desc: '1-Year, 90-Day, and topical Bible reading schedules with daily progress tracking and calendar sync.', route: '/reading-plans' },
  { icon: '☀️', title: 'Daily Devotionals', category: 'study', desc: 'Morning and evening devotionals with Scripture reflections, worship songs, and prayer prompts.', route: '/devotionals' },
  { icon: '📚', title: 'Scripture Explorer', category: 'study', desc: 'Multi-translation Bible search (KJV, WEB, NIV) with inline commentaries and cross-reference maps.', route: '/scripture' },
  { icon: '❤️', title: 'Christian Dating', category: 'fellowship', desc: 'Christ-centered dating for marriage-minded adult believers with mandatory identity verification.', badge: 'Verified Adults', route: '/dating' },
  { icon: '📸', title: 'Faith Stories', category: 'fellowship', desc: '24-hour expiring photo and video moments with verse overlays and SafeSearch moderation.', badge: 'Adults Only', route: '/stories' },
  { icon: '🧠', title: 'Memory Verse Challenge', category: 'study', desc: 'Weekly Scripture memorization quizzes and streak tracking to hide God’s Word in your heart.', route: '/verse-challenge' },
  { icon: '📔', title: 'Private Faith Journal', category: 'study', desc: 'Encrypted personal notebook for prayers, sermon insights, and gratitude logs with Markdown export.', route: '/journal' },
  { icon: '🗓️', title: 'Church Events Calendar', category: 'ministry', desc: 'Discover local worship nights, regional retreats, conferences, and small group gatherings.', route: '/events' },
  { icon: '🎥', title: 'Live Sermons & Streams', category: 'ministry', desc: 'Watch Sunday services with a real-time moderated live chat and interactive sermon notes.', route: '/livestreams' },
  { icon: '🎙️', title: 'Live Audio Prayer Rooms', category: 'ministry', desc: 'Join hosted voice stages for live prayer nights, worship sessions, and Ask-a-Pastor Q&A.', route: '/audio-rooms' },
  { icon: '🌱', title: 'Discipleship Courses', category: 'ministry', desc: 'Guided video curricula and lessons to build rock-solid doctrinal foundations and ministry skills.', route: '/courses' },
  { icon: '👨‍👩‍👧', title: 'Family Devotionals', category: 'fellowship', desc: 'Interactive Bible lessons, bedtime stories, and prayer discussion guides tailored for Christian families.', route: '/family-devotionals' },
  { icon: '⛪', title: 'Church Partner Hub', category: 'ministry', desc: 'Tools for pastors and ministry leaders to manage small groups, announcements, and giving.', route: '/partner/dashboard' },
  { icon: '💳', title: 'Giving & Subscriptions', category: 'ministry', desc: 'Direct, secure Stripe Connect support for verified partner churches and global field missionaries.', route: '/giving' },
  { icon: '🌍', title: 'Missionary Spotlight', category: 'ministry', desc: 'Follow verified global missionaries, view urgent field prayer requests, and partner financially.', route: '/missionaries' },
  { icon: '🛡️', title: 'Safety & Moderation Center', category: 'fellowship', desc: 'Comprehensive tools, parental controls, block/report workflows, and community safety guidelines.', route: '/safety' },
  { icon: '⚙️', title: 'Accessibility & Settings', category: 'study', desc: 'Customizable text scaling, high-contrast mode, and spiritual goal preferences for every user.', route: '/settings/preferences' },
];

const TESTIMONIALS = [
  {
    quote: "ChristianConnect gave our church small group a safe home online. Being able to share prayer requests and get notified when someone is praying is priceless.",
    name: "Pastor David M.",
    role: "Lead Pastor · Grace Fellowship",
    avatar: "✝️",
    badge: "Church Leader",
  },
  {
    quote: "I moved to a new city and felt isolated. Through the Friendship Groups, I met two amazing Christian sisters who are now my weekly Bible study partners!",
    name: "Sarah K.",
    role: "Young Adults Leader · Dallas, TX",
    avatar: "🕊️",
    badge: "Community Member",
  },
  {
    quote: "As a new believer, the Discipleship Mentorship program paired me with a seasoned brother who walked me through foundational Scripture every single week.",
    name: "Marcus T.",
    role: "Mentee · Chicago, IL",
    avatar: "🌱",
    badge: "New Believer",
  },
];

const FAQS = [
  {
    q: "Is ChristianConnect completely free to use?",
    a: "Yes! ChristianConnect is 100% free for all core community features including Prayer Walls, Bible Study Buddies, Friendship Groups, Devotionals, and Scripture Q&A. Optional supporter subscriptions and verified church donations are available for those who wish to give.",
  },
  {
    q: "How does ChristianConnect protect minors and families?",
    a: "Safety is our highest founding pillar. Minors are restricted to content-only and supervised family areas. Mature features like Christian Dating and 24-Hour Stories require verified adult age gates. All public content is actively moderated with AI text and image SafeSearch filtering.",
  },
  {
    q: "What Bible translations and denominations are supported?",
    a: "We welcome all Christians who confess Jesus Christ as Lord and Savior and affirm the historic Apostles' Creed. Our Scripture tools integrate multiple respected translations including the King James Version (KJV), World English Bible (WEB), and New International Version (NIV).",
  },
  {
    q: "How does the 'I Prayed for You' feature work?",
    a: "When you post a prayer request on the Prayer Wall, fellow believers around the world can tap 'I Prayed for You'. You receive a real-time uplifting notification knowing brothers and sisters in Christ are actively interceding for your needs.",
  },
  {
    q: "Can our local church partner with ChristianConnect?",
    a: "Absolutely! Pastors and ministry directors can register their church via the Church Partner Hub to create private small group directories, host live sermon streams with moderated chat, and receive member tithes/offerings seamlessly via Stripe Connect.",
  },
];

export default function HomePage() {
  const { isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'fellowship' | 'study' | 'prayer' | 'ministry'>('all');
  const dailySpotlight = getDailySpotlight();
  
  // Auth Gate Modal state for unauthenticated link clicks
  const [authGateOpen, setAuthGateOpen] = useState<boolean>(false);
  const [gateTarget, setGateTarget] = useState<AuthGateTarget | null>(null);

  const handleProtectedNavigation = (e: React.MouseEvent, target: AuthGateTarget) => {
    if (!isSignedIn) {
      e.preventDefault();
      setGateTarget(target);
      setAuthGateOpen(true);
    }
  };
  
  // Interactive Live Demo states
  const [prayedCount, setPrayedCount] = useState<number>(47);
  const [hasPrayed, setHasPrayed] = useState<boolean>(false);
  const [verseAnswer, setVerseAnswer] = useState<string>('');
  const [verseFeedback, setVerseFeedback] = useState<string | null>(null);
  const [activeAiQuestion, setActiveAiQuestion] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredFeatures = activeTab === 'all' 
    ? ALL_FEATURES 
    : ALL_FEATURES.filter(f => f.category === activeTab);

  const handlePrayerClick = () => {
    if (!hasPrayed) {
      setPrayedCount(prev => prev + 1);
      setHasPrayed(true);
    } else {
      setPrayedCount(prev => prev - 1);
      setHasPrayed(false);
    }
  };

  const handleVerseCheck = (choice: string) => {
    setVerseAnswer(choice);
    if (choice === 'Christ') {
      setVerseFeedback('✨ Correct! "I can do all things through Christ who strengthens me." — Philippians 4:13');
    } else {
      setVerseFeedback('❌ Not quite! The Scripture says "through Christ who strengthens me." Try again!');
    }
  };

  const aiQuestions = [
    {
      question: "What is the biblical meaning of 'Iron sharpens iron' in Proverbs 27:17?",
      answer: "In ancient Hebrew culture, iron blades were rubbed against harder iron stones to grind away rust and restore razor-sharp efficacy. Biblically, this metaphor teaches that honest, loving fellowship between believers produces spiritual resilience, doctrinal clarity, and moral strength.",
      scripture: "Proverbs 27:17 · Hebrews 10:24-25",
      hebrewRoot: "Hebrew: יַחַד (yáchad) — to be united / sharpen together",
    },
    {
      question: "How does Romans 8:28 bring comfort during deep trials?",
      answer: "'And we know that in all things God works for the good of those who love him...' This passage does not say all events are good, but that God sovereignly weaves even painful trials into eternal redemption and Christ-like maturity.",
      scripture: "Romans 8:28-29 · Genesis 50:20",
      hebrewRoot: "Greek: συνεργεῖ (synergei) — God synergizes all things together",
    },
    {
      question: "What does the Bible teach about praying for one another?",
      answer: "James 5:16 commands believers to 'pray for one another, that you may be healed.' Intercession is an act of spiritual love and warfare, bearing each other's burdens as commanded in Galatians 6:2.",
      scripture: "James 5:16 · Galatians 6:2 · Ephesians 6:18",
      hebrewRoot: "Greek: εὔχεσθε (euchesthe) — earnest heartfelt intercession",
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* Top Accent Divine Ribbon */}
      <div style={{ height: '5px', background: 'var(--gradient-brand)', width: '100%' }} />

      {/* Modern Sticky Navigation */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(255, 255, 255, 0.92)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div
          className="landing-header-container"
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          {/* Logo (Official ChristianConnect Logo) */}
          <div className="landing-logo-wrapper">
            <Logo size="md" withLink href="/" />
          </div>

          {/* Nav Links (Desktop Only - hidden on mobile) */}
          <nav className="landing-desktop-nav">
            <a href="#features" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
              Features
            </a>
            <a href="#demo" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
              Interactive Demo
            </a>
            <a href="#pillars" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
              Our Pillars
            </a>
            <a href="#testimonies" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
              Stories
            </a>
            <Link href="/about" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
              About
            </Link>
            <a href="#faq" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
              FAQ
            </a>
          </nav>

          {/* Auth Actions (Desktop Only - hidden on mobile) */}
          <div className="landing-desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isSignedIn ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm glow">
                <span>Enter Dashboard</span>
                <span>→</span>
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="btn btn-ghost btn-sm" style={{ fontWeight: 600 }}>
                  Log In
                </Link>
                <Link href="/sign-up" className="btn btn-primary btn-sm glow">
                  <span>Join Free</span>
                  <span>✨</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        background: 'var(--gradient-hero)',
        padding: '80px 24px 70px',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {/* Subtle Ambient Glow Background Orbs */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(46,125,50,0.14) 0%, rgba(212,175,55,0.06) 50%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          
          {/* Top Pill Announcement */}
          <div className="animate-fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)', marginBottom: '24px' }}>
            <span style={{ fontSize: '16px' }}>🕊️</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)' }}>
              A Safe Digital Sanctuary for Believers Worldwide
            </span>
            <span style={{ background: 'var(--brand-primary)', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase' }}>
              Free
            </span>
          </div>

          {/* Inspiring Headline */}
          <h1 className="animate-fade-in" style={{
            fontSize: 'clamp(2.8rem, 6.5vw, 5.2rem)',
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            lineHeight: 1.08,
            maxWidth: '960px',
            margin: '0 auto 24px',
            letterSpacing: '-0.02em',
          }}>
            Connect in Faith.{' '}
            <br />
            Grow in Scripture.{' '}
            <span className="gradient-text">Believe Together.</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in" style={{
            fontSize: 'clamp(1.1rem, 2.2vw, 1.35rem)',
            color: 'var(--text-secondary)',
            maxWidth: '740px',
            margin: '0 auto 36px',
            lineHeight: 1.7,
          }}>
            Escape secular social media noise. Discover genuine prayer partners, dive deep into Bible study circles, walk in godly accountability, and join a loving Christian community — grounded in Scripture and love.
          </p>

          {/* Call to Actions */}
          <div className="animate-fade-in" style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '48px',
          }}>
            <Link href="/sign-up" className="btn btn-primary btn-xl glow" style={{ fontSize: '17px', padding: '16px 36px', borderRadius: '12px' }}>
              <span>Get Started Free</span>
              <span style={{ fontSize: '20px' }}>→</span>
            </Link>
            <a
              href="#demo"
              className="btn btn-xl"
              style={{
                fontSize: '17px',
                padding: '16px 32px',
                borderRadius: '12px',
                background: '#ffffff',
                color: 'var(--brand-primary, #1b5e20)',
                border: '1.5px solid rgba(46, 125, 50, 0.35)',
                boxShadow: 'var(--shadow-sm)',
                textDecoration: 'none',
                fontWeight: 700,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = 'var(--brand-primary, #2e7d32)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'rgba(46, 125, 50, 0.35)';
              }}
            >
              <span>Try Live Demo</span>
              <span>⚡</span>
            </a>
            <Link href="/about" className="btn btn-ghost btn-xl" style={{ fontSize: '16px', padding: '16px 24px' }}>
              <span>Explore All 26+ Features</span>
            </Link>
          </div>

          {/* Trust Metrics Strip */}
          <div className="animate-fade-in" style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
            width: '100%',
            maxWidth: '960px',
            margin: '0 auto',
            padding: '24px 32px',
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ flex: '1 1 180px', textAlign: 'center', minWidth: '160px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-serif)' }}>50,000+</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Believers Connected</div>
            </div>
            <div style={{ flex: '1 1 180px', textAlign: 'center', minWidth: '160px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brand-gold)', fontFamily: 'var(--font-serif)' }}>1,200,000+</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prayers Lifted Up</div>
            </div>
            <div style={{ flex: '1 1 180px', textAlign: 'center', minWidth: '160px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-serif)' }}>240+</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partner Churches</div>
            </div>
            <div style={{ flex: '1 1 180px', textAlign: 'center', minWidth: '160px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-serif)' }}>100%</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Safe & Faith-Moderated</div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Hero Floating App Showcase (Interactive Preview) ───────────────────── */}
      <section style={{ padding: '0 24px 60px', marginTop: '-30px', position: 'relative', zIndex: 10 }}>
        <div style={{
          maxWidth: '1180px',
          margin: '0 auto',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
          padding: '28px',
          overflow: 'hidden',
        }}>
          {/* Header Bar of App Preview */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '18px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '12px', fontWeight: 600 }}>
                ChristianConnect Live Community Hub · Snapshot
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 700 }}>2,841 Believers Active Now</span>
            </div>
          </div>

          {/* 3 Grid Preview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Card 1: Verse of the Day */}
            <div style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f7faf7 100%)',
              border: '1px solid rgba(46,125,50,0.18)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '3px 10px', borderRadius: '99px', textTransform: 'uppercase' }}>
                    ☀️ Verse of the Day
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dailySpotlight.verse.reference}</span>
                </div>
                <blockquote style={{ fontSize: '17px', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                  "{dailySpotlight.verse.text}"
                </blockquote>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {dailySpotlight.devotional.teaser}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 600 }}>🔥 14-Day Word Streak</span>
                <Link
                  href="/scripture"
                  onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Scripture Explorer', icon: '📚', route: '/scripture' })}
                  style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textDecoration: 'none' }}
                >
                  Study Verse →
                </Link>
              </div>
            </div>

            {/* Card 2: Live Prayer Intercession */}
            <div style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #fffcf5 100%)',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-gold)', background: 'rgba(212,175,55,0.12)', padding: '3px 10px', borderRadius: '99px', textTransform: 'uppercase' }}>
                    🙏 Urgent Prayer Request
                  </span>
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>● Active</span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Healing & Strength for Mother’s Surgery</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  "Brothers and sisters, please join me in prayer for my mom undergoing heart surgery tomorrow morning. Praying for peace and skilled surgeons."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Posted by Rachel M. · Texas, USA</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                  🙏 84 Prayers Lifted
                </span>
                <Link
                  href="/prayer"
                  onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Global Prayer Wall', icon: '🙏', route: '/prayer' })}
                  className="btn btn-sm btn-gold"
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                >
                  Intercede Now
                </Link>
              </div>
            </div>

            {/* Card 3: Active Small Groups & Bible Study Circles */}
            <div style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f7faf7 100%)',
              border: '1px solid rgba(46,125,50,0.18)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '3px 10px', borderRadius: '99px', textTransform: 'uppercase' }}>
                    📖 Live Fellowship Study
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gospel of John</span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>John Chapter 3 Study Circle</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0' }}>
                  <div style={{ fontSize: '12px', background: 'rgba(0,0,0,0.03)', padding: '8px 12px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                    💬 <strong>Bro. Nathan:</strong> "Verse 16 reveals God’s love in action, but verse 17 reminds us Jesus came to save, not condemn!"
                  </div>
                  <div style={{ fontSize: '12px', background: 'rgba(0,0,0,0.03)', padding: '8px 12px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                    💬 <strong>Sister Grace:</strong> "Amen! The Greek word 'kosmos' shows God's universal invitation."
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>12 Members in Study</span>
                <Link
                  href="/bible-study"
                  onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Bible Study Buddies', icon: '📖', route: '/bible-study' })}
                  style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textDecoration: 'none' }}
                >
                  Join Discussion →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Four Pillars Section ────────────────────────────────────────────────── */}
      <section id="pillars" style={{ padding: '80px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 60px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '6px 16px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ✝️ Foundations of Faith
            </span>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontFamily: 'var(--font-serif)', fontWeight: 700, margin: '16px 0 12px' }}>
              Why Believers Love ChristianConnect
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.7 }}>
              Built from the ground up for authentic discipleship, deep scripture study, and sincere Christian fellowship without the toxicity of worldly algorithms.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            
            {/* Pillar 1 */}
            <div className="card card-interactive" style={{ padding: '32px 24px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(46,125,50,0.12)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                📖
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>Grounded in the Word</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Parallel Bible readers, 1-year reading plans, weekly memory verse recall tests, and AI Greek/Hebrew root commentary to help you grow deep roots in Scripture.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="card card-interactive" style={{ padding: '32px 24px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(212,175,55,0.15)', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                🙏
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>Intercessory Prayer</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Never walk through life alone. Post confidential or global prayer requests, receive "I Prayed for You" notifications, and find dedicated 1-on-1 prayer partners.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="card card-interactive" style={{ padding: '32px 24px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(46,125,50,0.12)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                🤝
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>Christ-Centered Community</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Join local church interest hubs, find study groups, participate in live audio prayer nights, and connect through marriage-minded Christian dating for verified adults.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="card card-interactive" style={{ padding: '32px 24px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16,185,129,0.12)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                🛡️
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>100% Moderated & Safe</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Strict zero-tolerance policy for harassment or worldly spam. Built-in minor protections, COPPA compliance, and AI SafeSearch image filtering on all shared content.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Interactive Live Demo Section ───────────────────────────────────────── */}
      <section id="demo" style={{ padding: '80px 24px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 48px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-gold)', background: 'rgba(212,175,55,0.12)', padding: '6px 16px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ⚡ Interactive Showcase
            </span>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontFamily: 'var(--font-serif)', fontWeight: 700, margin: '16px 0 12px' }}>
              Experience the Platform Live
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6 }}>
              Try real tools from ChristianConnect right here on this page.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Interactive Demo 1: Prayer Counter */}
            <div className="card" style={{ padding: '28px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '4px 10px', borderRadius: '99px' }}>
                    1. Live Prayer Intercession
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Interactive Demo</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>"Praying for our church outreach next Sunday"</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                  Click the button below to simulate lifting this request in prayer and see the live community intercession counter in action.
                </p>
              </div>

              <div style={{
                background: 'var(--bg-elevated)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                    🙏 {prayedCount} Believers
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>have prayed for this request</div>
                </div>

                <button
                  type="button"
                  onClick={handlePrayerClick}
                  className={`btn ${hasPrayed ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}
                >
                  <span>{hasPrayed ? '✓ You Prayed' : '🙏 I Prayed for You'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Demo 2: Memory Verse Quiz */}
            <div className="card" style={{ padding: '28px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-gold)', background: 'rgba(212,175,55,0.12)', padding: '4px 10px', borderRadius: '99px' }}>
                    2. Verse Recall Challenge
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Philippians 4:13</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Fill in the Blank:</h3>
                <blockquote style={{ fontSize: '16px', fontStyle: 'italic', background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '8px', margin: '0 0 16px 0', borderLeft: '4px solid var(--brand-gold)' }}>
                  "I can do all things through _______ who strengthens me."
                </blockquote>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {['wealth', 'Christ', 'strength', 'effort'].map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => handleVerseCheck(choice)}
                      className={`btn btn-sm ${verseAnswer === choice ? 'btn-gold' : 'btn-ghost'}`}
                      style={{ border: '1px solid var(--border-default)' }}
                    >
                      {choice}
                    </button>
                  ))}
                </div>

                {verseFeedback && (
                  <div style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '6px', background: verseAnswer === 'Christ' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: verseAnswer === 'Christ' ? '#065f46' : '#991b1b', fontWeight: 600 }}>
                    {verseFeedback}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <Link
                  href="/verse-challenge"
                  onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Memory Verse Challenge', icon: '🧠', route: '/verse-challenge' })}
                  style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textDecoration: 'none' }}
                >
                  Try full Memory Verse Challenge →
                </Link>
              </div>
            </div>

            {/* Interactive Demo 3: AI Theological Explorer */}
            <div className="card" style={{ padding: '28px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '4px 10px', borderRadius: '99px' }}>
                    3. AI Scripture Commentary
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Theological Q&A</span>
                </div>

                {/* Dropdown Selector */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    SELECT A THEOLOGICAL QUESTION:
                  </label>
                  <select
                    value={activeAiQuestion}
                    onChange={(e) => setActiveAiQuestion(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    {aiQuestions.map((q, idx) => (
                      <option key={idx} value={idx}>{q.question}</option>
                    ))}
                  </select>
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px 0' }}>
                    {aiQuestions[activeAiQuestion].answer}
                  </p>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-gold)' }}>
                    {aiQuestions[activeAiQuestion].hebrewRoot}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <Link
                  href="/faith-chat"
                  onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'AI Scripture Q&A', icon: '💡', route: '/faith-chat' })}
                  style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textDecoration: 'none' }}
                >
                  Ask AI Faith Chat a Custom Question →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Comprehensive 26+ Features Grid ─────────────────────────────────────── */}
      <section id="features" style={{ padding: '80px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 40px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '6px 16px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ✨ Complete Platform Directory
            </span>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontFamily: 'var(--font-serif)', fontWeight: 700, margin: '16px 0 12px' }}>
              26+ Tools for Every Area of Christian Life
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.7 }}>
              From personal prayer journals to live church sermons and verified Christian dating, ChristianConnect provides a complete digital ecosystem for believers.
            </p>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '28px' }}>
              {[
                { key: 'all', label: 'All 26 Features' },
                { key: 'fellowship', label: '🤝 Fellowship & Groups' },
                { key: 'study', label: '📖 Scripture & Study' },
                { key: 'prayer', label: '🙏 Prayer & Intercession' },
                { key: 'ministry', label: '⛪ Church & Ministry' },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: '99px', padding: '8px 18px', border: activeTab === tab.key ? 'none' : '1px solid var(--border-default)' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filteredFeatures.map((feat) => (
              <Link
                key={feat.title}
                href={feat.route}
                onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: feat.title, icon: feat.icon, route: feat.route, desc: feat.desc })}
                className="card card-interactive"
                style={{
                  padding: '24px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(46,125,50,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      {feat.icon}
                    </div>
                    {feat.badge && (
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--brand-gold)', background: 'rgba(212,175,55,0.15)', padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase' }}>
                        {feat.badge}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    {feat.title}
                  </h3>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {feat.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '16px' }}>
                  <span>Open Tool</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ─── The Noise vs. The Sanctuary (Comparison Table) ─────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-gold)', background: 'rgba(212,175,55,0.12)', padding: '6px 16px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              🛡️ The Difference
            </span>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontFamily: 'var(--font-serif)', fontWeight: 700, margin: '16px 0 12px' }}>
              Secular Feeds vs. ChristianConnect
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6 }}>
              Why believers are choosing a platform designed exclusively to nourish the spirit.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Worldly Social Media */}
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-xl)', padding: '32px', border: '1px solid rgba(239,68,68,0.2)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '24px' }}>📱</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#b91c1c' }}>Secular Social Platforms</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Distraction & Outrage</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span>
                  <span>Addictive dopamine algorithms designed to keep you scrolling aimlessly</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span>
                  <span>Unfiltered worldly content, hostility, toxicity, and secular ads</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span>
                  <span>Shallow vanity metrics (likes, follower counters, public popularity)</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span>
                  <span>High safety risks for children and minors with minimal oversight</span>
                </li>
              </ul>
            </div>

            {/* ChristianConnect */}
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-xl)', padding: '32px', border: '2px solid var(--brand-primary)', boxShadow: 'var(--shadow-glow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '24px' }}>✝️</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-primary)' }}>ChristianConnect</h3>
                  <span style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 600 }}>Faith, Fellowship & Peace</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--color-success)', fontWeight: 800 }}>✓</span>
                  <span>Scripture-first design with daily devotionals and prayer partners</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--color-success)', fontWeight: 800 }}>✓</span>
                  <span>100% active AI SafeSearch moderation & zero tolerance for abuse</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--color-success)', fontWeight: 800 }}>✓</span>
                  <span>Heart growth over vanity — private streaks, mutual edification</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--color-success)', fontWeight: 800 }}>✓</span>
                  <span>Child safety by design, parental consent gates, verified adult dating</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Testimonials Section ────────────────────────────────────────────────── */}
      <section id="testimonies" style={{ padding: '80px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 50px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '6px 16px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              🕊️ Community Testimonies
            </span>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontFamily: 'var(--font-serif)', fontWeight: 700, margin: '16px 0 12px' }}>
              Lives Changed. Faith Strengthened.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.7 }}>
              Read how brothers and sisters around the globe are experiencing true biblical fellowship.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {TESTIMONIALS.map((test, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  padding: '32px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-xl)',
                }}
              >
                <div>
                  <div style={{ fontSize: '32px', color: 'var(--brand-gold)', lineHeight: 1, marginBottom: '12px', fontFamily: 'serif' }}>
                    “
                  </div>
                  <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '24px' }}>
                    {test.quote}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(46,125,50,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {test.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {test.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {test.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── Frequently Asked Questions (Accordion) ─────────────────────────────── */}
      <section id="faq" style={{ padding: '80px 24px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-gold)', background: 'rgba(212,175,55,0.12)', padding: '6px 16px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ❓ Questions & Answers
            </span>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontFamily: 'var(--font-serif)', fontWeight: 700, margin: '16px 0 12px' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6 }}>
              Everything you need to know about our faith standards, safety, and community tools.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '18px', color: 'var(--brand-primary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 24px 20px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── Final High-Impact CTA Banner ────────────────────────────────────────── */}
      <section style={{
        padding: '90px 24px',
        background: 'radial-gradient(circle at 50% 50%, #1b5e20 0%, #0d3b10 100%)',
        color: '#ffffff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            filter: 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.35))',
          }}>
            <Image
              src="/logo.png"
              alt="ChristianConnect Official Shield Logo"
              width={160}
              height={160}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <h2 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontFamily: 'var(--font-serif)', fontWeight: 700, lineHeight: 1.15, marginBottom: '16px', color: '#ffffff' }}>
            Your Faith Community is Waiting.
          </h2>

          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, maxWidth: '620px', margin: '0 auto 36px' }}>
            Join over 50,000 believers walking together in prayer, discipleship, and genuine Christian fellowship. Set up your free profile in under 60 seconds.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sign-up" className="btn btn-gold btn-xl" style={{ fontSize: '18px', padding: '18px 40px', borderRadius: '12px' }}>
              <span>Create Free Account</span>
              <span>→</span>
            </Link>
            <Link href="/sign-in" className="btn btn-outline-white btn-xl" style={{ fontSize: '18px', padding: '18px 36px', borderRadius: '12px' }}>
              <span>Sign In</span>
            </Link>
          </div>

          <div style={{ marginTop: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            No credit card required · 100% Free Core Access · Verified Safe
          </div>

        </div>
      </section>

      {/* ─── Comprehensive Footer ────────────────────────────────────────────────── */}
      <footer style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '60px 24px 32px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '36px', marginBottom: '48px' }}>
            
            {/* Column 1: Brand */}
            <div>
              <div style={{ marginBottom: '14px' }}>
                <Logo size="sm" withLink href="/" />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                A faith-first digital community platform combining real-time fellowship, prayer walls, Bible study circles, and safe Christian discipleship.
              </p>
              <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--brand-primary)', fontWeight: 600 }}>
                "Iron sharpens iron" — Proverbs 27:17
              </div>
            </div>

            {/* Column 2: Community */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '14px' }}>
                Community
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <li><Link href="/friendship" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Friendship Groups', icon: '🤝', route: '/friendship' })} style={{ textDecoration: 'none', color: 'inherit' }}>Friendship Groups</Link></li>
                <li><Link href="/prayer" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Global Prayer Wall', icon: '🙏', route: '/prayer' })} style={{ textDecoration: 'none', color: 'inherit' }}>Global Prayer Wall</Link></li>
                <li><Link href="/chat" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Community Chat', icon: '💬', route: '/chat' })} style={{ textDecoration: 'none', color: 'inherit' }}>Community Chat</Link></li>
                <li><Link href="/dating" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Christian Dating (18+)', icon: '❤️', route: '/dating' })} style={{ textDecoration: 'none', color: 'inherit' }}>Christian Dating (18+)</Link></li>
                <li><Link href="/testimonies" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Praise & Testimonies', icon: '🕊️', route: '/testimonies' })} style={{ textDecoration: 'none', color: 'inherit' }}>Praise & Testimonies</Link></li>
              </ul>
            </div>

            {/* Column 3: Scripture & Growth */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '14px' }}>
                Scripture & Growth
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <li><Link href="/bible-study" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Bible Study Buddies', icon: '📖', route: '/bible-study' })} style={{ textDecoration: 'none', color: 'inherit' }}>Bible Study Buddies</Link></li>
                <li><Link href="/reading-plans" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Bible Reading Plans', icon: '📅', route: '/reading-plans' })} style={{ textDecoration: 'none', color: 'inherit' }}>Bible Reading Plans</Link></li>
                <li><Link href="/faith-chat" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'AI Scripture Q&A', icon: '💡', route: '/faith-chat' })} style={{ textDecoration: 'none', color: 'inherit' }}>AI Scripture Q&A</Link></li>
                <li><Link href="/devotionals" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Daily Devotionals', icon: '☀️', route: '/devotionals' })} style={{ textDecoration: 'none', color: 'inherit' }}>Daily Devotionals</Link></li>
                <li><Link href="/verse-challenge" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Memory Verse Challenge', icon: '🧠', route: '/verse-challenge' })} style={{ textDecoration: 'none', color: 'inherit' }}>Memory Verse Challenge</Link></li>
                <li><Link href="/journal" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Private Faith Journal', icon: '📔', route: '/journal' })} style={{ textDecoration: 'none', color: 'inherit' }}>Private Faith Journal</Link></li>
              </ul>
            </div>

            {/* Column 4: Ministry & Safety */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '14px' }}>
                Ministry & Safety
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <li><Link href="/partner/dashboard" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Church Partner Hub', icon: '⛪', route: '/partner/dashboard' })} style={{ textDecoration: 'none', color: 'inherit' }}>Church Partner Hub</Link></li>
                <li><Link href="/missionaries" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Missionary Spotlight', icon: '🌍', route: '/missionaries' })} style={{ textDecoration: 'none', color: 'inherit' }}>Missionary Spotlight</Link></li>
                <li><Link href="/livestreams" onClick={(e: React.MouseEvent) => handleProtectedNavigation(e, { title: 'Live Sermon Streams', icon: '🎥', route: '/livestreams' })} style={{ textDecoration: 'none', color: 'inherit' }}>Live Sermon Streams</Link></li>
                <li><Link href="/safety" style={{ textDecoration: 'none', color: 'inherit' }}>Safety & Child Protection</Link></li>
                <li><Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>About Platform</Link></li>
              </ul>
            </div>

          </div>

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '24px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <div>
              © {new Date().getFullYear()} ChristianConnect Inc. Built on Faith. Grounded in Scripture.
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Link href="/safety" style={{ textDecoration: 'none', color: 'inherit' }}>Safety Guidelines</Link>
              <Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>Statement of Faith</Link>
              <Link href="/settings/preferences" style={{ textDecoration: 'none', color: 'inherit' }}>Accessibility</Link>
            </div>
          </div>

        </div>
      </footer>

      {/* Auth Gate Pop-up Modal for Non-Signed-In Visitors */}
      <AuthGateModal
        isOpen={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        target={gateTarget}
      />

    </div>
  );
}
