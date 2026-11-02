'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import Logo from '@/components/Logo';

interface SectionDetail {
  id: string;
  title: string;
  icon: string;
  shortDesc: string;
  overview: string;
  keyFeatures: string[];
  safetyRules: string[];
  route: string;
  badge?: string;
}

const SECTIONS: SectionDetail[] = [
  {
    id: 'friendship',
    title: 'Friendship Groups',
    icon: '🤝',
    shortDesc: 'Find like-minded believers to walk through life with — in faith and in friendship.',
    overview: 'ChristianConnect Friendship Groups allow believers to form genuine, Christ-centered friendships based on shared life stages, local interests, and ministry passions. Whether you are looking for local Christian friends or global believers to fellowship with, this section provides structured groups and real-time chat rooms.',
    keyFeatures: [
      'Interest & location-based group discovery',
      'Real-time group chat powered by Socket.io',
      'Encouragement feeds and fellowship discussions',
      'Public & invite-only private group controls'
    ],
    safetyRules: [
      'Strict zero-tolerance policy for harassment or non-Christian soliciting',
      'Minors are restricted to content-only spaces and cannot participate in direct group messaging'
    ],
    route: '/friendship',
  },
  {
    id: 'bible-study',
    title: 'Bible Study Buddies',
    icon: '📖',
    shortDesc: 'Deep-dive into Scripture together with study partners who sharpen your understanding.',
    overview: 'Connect with dedicated study partners or small study circles to dive deep into God’s Word. Read chapters in parallel, discuss theological questions, and keep each other accountable in daily scripture reading.',
    keyFeatures: [
      'Parallel Bible reading partner matching',
      'Chapter-by-chapter discussion threads',
      'API.Bible integration with multiple translations (KJV, WEB, NIV)',
      'Shared study bookmarks and highlight notes'
    ],
    safetyRules: [
      'All comments and discussion threads are checked by text moderation AI',
      'Respectful, constructive theological dialog enforced by community guidelines'
    ],
    route: '/bible-study',
  },
  {
    id: 'prayer',
    title: 'Prayer Partners & Wall',
    icon: '🙏',
    shortDesc: 'Share prayer requests and intercede for one another in a private, safe space.',
    overview: 'The Prayer section combines a global Prayer Wall with confidential 1-on-1 Prayer Partnerships. Request prayer for health, family, spiritual growth, or guidance, and receive notification when brothers and sisters in Christ pray for you.',
    keyFeatures: [
      'Interactive "I Prayed for You" notification counter',
      'Anonymous prayer request options for sensitive topics',
      'Confidential 1-on-1 prayer partner matching',
      'Categorized prayer requests (Health, Salvation, Family, Ministry)'
    ],
    safetyRules: [
      'Strict privacy settings — sensitive requests can be locked to 1-on-1 partners only',
      'No harassment, debt solicitation, or spam allowed on prayer walls'
    ],
    route: '/prayer',
  },
  {
    id: 'faith-chat',
    title: 'Scripture & AI Faith Chat',
    icon: '💡',
    shortDesc: 'Ask theological questions and study scripture with AI commentary and cross-references.',
    overview: 'Powered by Anthropic Claude API, our AI Faith Chat answers scripture questions, provides historical context, offers original language commentary (Greek/Hebrew word roots), and suggests cross-references for deep study.',
    keyFeatures: [
      'Instant theological Q&A grounded in biblical doctrine',
      'Greek and Hebrew word study breakdowns',
      'Parallel verse cross-referencing',
      'Safe, non-denominational pastoral guidance safeguards'
    ],
    safetyRules: [
      'AI system prompts enforce biblical accuracy and pastoral gentleness',
      'Available to all users, including minor content-only accounts'
    ],
    route: '/faith-chat',
  },
  {
    id: 'dating',
    title: 'Christian Dating (Adults Only)',
    icon: '❤️',
    shortDesc: 'Meet believers seeking Christ-centered relationships. Opposite-gender matching only.',
    badge: 'Verified Adults Only',
    overview: 'A Christ-honoring dating space for single adult believers seeking marriage-minded relationships. Built on explicit biblical values, Persona identity verification, and structured courtship Q&A prompts.',
    keyFeatures: [
      'Opposite-gender matching enforced strictly at database level',
      'Yoti / Persona mandatory adult identity & age verification gate',
      'Faith-centered profile prompts (Church involvement, Testimony, Values)',
      'Pre-marriage counseling resource unlock'
    ],
    safetyRules: [
      'STRICT AGE GATE: Absolutely forbidden for minors under 18',
      'Verified adult identity required before creating a dating profile',
      'Direct reporting and immediate moderation for inappropriate behavior'
    ],
    route: '/dating',
  },
  {
    id: 'mentorship',
    title: 'New Convert Mentorship',
    icon: '🌱',
    shortDesc: 'Just starting your faith journey? Connect with a mature believer to guide you.',
    overview: 'Pairs new believers and young Christians with mature, vetted mentors for 1-on-1 discipleship, guidance through basic Christian doctrines, daily prayer habits, and church integration.',
    keyFeatures: [
      'Structured 12-week discipleship milestone roadmap',
      'Direct 1-on-1 mentor guidance chat',
      'Recommended foundational reading & sermon guides',
      'Progress check-ins and reflection logs'
    ],
    safetyRules: [
      'Mentors undergo profile review and community reputation checks',
      'All mentorship interactions follow safety and boundary guidelines'
    ],
    route: '/mentorship',
  },
  {
    id: 'apologetics',
    title: 'Apologetics Hub',
    icon: '🛡️',
    shortDesc: 'Discuss and defend the faith with thoughtful, respectful theological study.',
    overview: 'A dedicated forum for intellectual rigor, Christian apologetics, science & faith harmonization, historical reliability of the Bible, and thoughtful answers to tough spiritual questions.',
    keyFeatures: [
      'Categorized apologetics articles, debates, and Q&A entries',
      'Evidence for the Resurrection, Creation, and Bible Manuscripts',
      'Structured respectful debate guidelines',
      'Resource library linking top theological scholars'
    ],
    safetyRules: [
      'Trolling, ad hominem attacks, and hostility are strictly prohibited',
      'All topics are moderated to preserve constructive, loving dialogue'
    ],
    route: '/apologetics',
  },
  {
    id: 'reading-plans',
    title: 'Bible Reading Plans',
    icon: '📅',
    shortDesc: 'Stay consistent in Scripture with structured plans and community accountability.',
    overview: 'Choose from 30-day, 90-day, or 1-year Bible reading plans. Track your daily passage progress, set morning reminders, and share daily reflections with your reading group.',
    keyFeatures: [
      'Curated topical and canonical reading plans',
      'Automated daily passage checklists',
      'Google / Apple Calendar reminder sync (.ics export)',
      'Group reading progress tracking'
    ],
    safetyRules: [
      'Personal reading stats are private or visible only to your study group'
    ],
    route: '/reading-plans',
  },
  {
    id: 'stories',
    title: '24-Hour Expiring Stories',
    icon: '📸',
    shortDesc: 'Instagram-style 24-hour expiring posts with verse overlays and group visibility.',
    badge: 'Verified Adults Only',
    overview: 'Share quick photo or video updates of daily encouragement, verse-of-the-day cards, or praise reports that automatically expire after 24 hours.',
    keyFeatures: [
      'Pre-publishing Google Cloud Vision SafeSearch image moderation',
      'Verse-of-the-day auto-generated story builder',
      'Group-scoped privacy (Public, Friends Only, or Accountability Group only)',
      'Tap-through story viewer tray'
    ],
    safetyRules: [
      'Mandatory pre-publishing image moderation — inappropriate images are blocked BEFORE upload',
      'Adult accounts only'
    ],
    route: '/stories',
  },
  {
    id: 'verse-challenge',
    title: 'Memory Verse Challenges',
    icon: '🧠',
    shortDesc: 'Weekly verse recall quizzes with personal streak tracking.',
    overview: 'Build a lifetime habit of hiding God’s Word in your heart through weekly Scripture memory challenges, fill-in-the-blank recall quizzes, and streak tracking.',
    keyFeatures: [
      'Weekly featured memory verse card',
      'Interactive fill-in-the-blank recall test',
      'Personal streak counter (Days & Weeks)',
      'STRICTLY NO public leaderboards — focused on heart growth, not competition'
    ],
    safetyRules: [
      'Private personal streaks — no competitive ranking or public shaming'
    ],
    route: '/verse-challenge',
  },
  {
    id: 'journal',
    title: 'Private Faith Journal',
    icon: '📔',
    shortDesc: 'Private, encrypted prayer and reflection notebook with Markdown export.',
    overview: 'A confidential space to record your personal prayers, answered prayer logs, sermon takeaways, and spiritual reflections. Exportable at any time as Markdown files.',
    keyFeatures: [
      'Rich text & Markdown journal entry editor',
      'Tagging system (Prayer, Gratitude, Scripture Note)',
      'One-click Markdown (.md) export download',
      'Search and date filtering'
    ],
    safetyRules: [
      '100% private to your user account — never shared on public feeds or readable by other users'
    ],
    route: '/journal',
  },
  {
    id: 'sermon-notes',
    title: 'Timestamped Sermon Notes',
    icon: '🎙️',
    shortDesc: 'Take structured, timestamped notes tied to church sermons.',
    overview: 'Record key insights, Bible references, and preacher quotes during church services or live streams, neatly organized by date and church speaker.',
    keyFeatures: [
      'Timestamped bullet points and quote markers',
      'Preacher name & church date tagging',
      'Scripture verse auto-linking',
      'Searchable sermon archive'
    ],
    safetyRules: [
      'Private note storage per user'
    ],
    route: '/sermon-notes',
  },
  {
    id: 'livestreams',
    title: 'Live Sermons & Broadcasts',
    icon: '🎥',
    shortDesc: 'Watch live church services with real-time community chat sidebar.',
    overview: 'Stream live Sunday worship services, ministry conferences, and sermon broadcasts with a moderated side-by-side chat room.',
    keyFeatures: [
      'High-definition video stream player (Mux / Cloudflare Stream)',
      'Real-time Socket.io live chat sidebar',
      'Preacher & organization profiles',
      'Upcoming broadcast schedules'
    ],
    safetyRules: [
      'Live chat text moderation AI active during broadcasts'
    ],
    route: '/livestreams',
  },
  {
    id: 'audio-rooms',
    title: 'Live Audio Rooms',
    icon: '🎙️',
    shortDesc: 'Interactive voice stage for Prayer Nights and "Ask a Pastor" Q&A.',
    overview: 'Join live interactive voice rooms hosted by pastors and group leaders for live prayer nights, worship sessions, and Q&A.',
    keyFeatures: [
      'Daily.co / Agora live multi-user voice stage',
      'Host stage controls (Mute/unmute, promote speaker stage)',
      'Listener "Raise Hand ✋" feature',
      'Audio-only low-bandwidth mode'
    ],
    safetyRules: [
      'Hosts hold full mute and removal permissions for inappropriate participants'
    ],
    route: '/audio-rooms',
  },
  {
    id: 'events',
    title: 'Events & Church Calendar',
    icon: '🗓️',
    shortDesc: 'Discover local church services, retreats, and small groups.',
    overview: 'Find and RSVP to church services, regional retreats, Christian conferences, and local fellowship gatherings in your city.',
    keyFeatures: [
      'City & region search filters',
      'RSVP management (Going, Maybe, Declined)',
      'Google & Apple Calendar sync (.ics export)',
      'Venue mapping and address details'
    ],
    safetyRules: [
      'Event hosts verified before public listing'
    ],
    route: '/events',
  },
  {
    id: 'courses',
    title: 'Discipleship Courses',
    icon: '🌱',
    shortDesc: 'Multi-week guided curricula, video lectures, and group discussions.',
    overview: 'Structured video & text discipleship courses such as "Foundations of Faith" designed to build strong theological roots.',
    keyFeatures: [
      'Multi-week video and reading lessons',
      'Group discussion prompts & reflection questions',
      'Progress tracking and completion badges',
      'New convert foundation tracks'
    ],
    safetyRules: [
      'Curriculum vetted by pastoral advisory council'
    ],
    route: '/courses',
  },
  {
    id: 'giving',
    title: 'Giving & Subscriptions',
    icon: '💳',
    shortDesc: 'Support partner churches, missionaries, and unlock premium platform features.',
    overview: 'Transparent, secure financial giving to verified 501(c)(3) partner churches and field missionaries via Stripe Connect, backed by a legal compliance disclaimer gate.',
    keyFeatures: [
      'Stripe Connect secure payments',
      'One-time or monthly recurring missionary giving',
      'Supporter Premium subscription ($4.99/mo) for ad-free experience',
      'Giving transaction history receipt log'
    ],
    safetyRules: [
      'Strict legal money-transmission compliance gate and verified organization badges'
    ],
    route: '/giving',
  },
  {
    id: 'missionaries',
    title: 'Missionary Spotlight Feed',
    icon: '🌍',
    shortDesc: 'Follow field missionaries, intercede in prayer, and partner financially.',
    overview: 'Dedicated feed highlighting verified global missionaries, field updates, urgent prayer requests, and direct support opportunities.',
    keyFeatures: [
      'Verified missionary field profiles',
      'Real-time prayer request updates',
      'Direct partner giving integration',
      'Global impact progress reports'
    ],
    safetyRules: [
      'All missionary profiles undergo administrative verification before listing'
    ],
    route: '/missionaries',
  },
];

export default function AboutPage() {
  const { isSignedIn } = useAuth();
  const [selectedSection, setSelectedSection] = useState<SectionDetail | null>(null);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* Page top border */}
      <div style={{ height: '4px', background: 'var(--brand-primary)' }} />

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 48px', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Logo size="sm" withLink href="/" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
            ← Home
          </Link>
          {isSignedIn ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
          ) : (
            <>
              <Link href="/sign-in" className="btn btn-ghost btn-sm">Log In</Link>
              <Link href="/sign-up" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Header & Introduction Section */}
      <section style={{ padding: '60px 24px 40px', textAlign: 'center', maxWidth: '840px', margin: '0 auto' }}>
        <span style={{
          fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)',
          padding: '6px 16px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          ✝️ About ChristianConnect
        </span>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontFamily: 'var(--font-serif)', fontWeight: 700, margin: '20px 0 16px', lineHeight: 1.2 }}>
          A Safe, Faith-First Digital Community Built for Believers
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '17px', lineHeight: 1.8, marginBottom: '36px' }}>
          ChristianConnect was created to replace shallow social media noise with deep, Christ-centered community. Inspired by Proverbs 27:17 — <em>"As iron sharpens iron, so one person sharpens another"</em> — our platform provides a safe space for prayer, Bible study, local church connections, and godly fellowship.
        </p>

        {/* How It Functions Step-by-Step */}
        <div style={{ textAlign: 'left', marginBottom: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ⚡ Step-by-Step
            </span>
            <h2 style={{ fontSize: '26px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginTop: '4px' }}>
              How ChristianConnect Functions
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: '12px' }}>1</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Create Your Account</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Sign up free in seconds. Set your statement of faith, local city/hub, and spiritual growth goals.
              </p>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: '12px' }}>2</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Connect & Fellowship</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Join local interest groups, find 1-on-1 prayer partners, and meet believers in your region.
              </p>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: '12px' }}>3</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Walk Daily in the Word</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Track Bible reading plans, participate in weekly memory verse challenges, and journal prayers.
              </p>
            </div>

            <div style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: '12px' }}>4</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Live Ministry & Safety</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Enjoy live audio prayer rooms, verified Christian dating, and strict 100% moderated content safety.
              </p>
            </div>
          </div>
        </div>

        {/* Member Access Notice Banner */}
        <div style={{
          padding: '20px 24px', background: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.25)',
          borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '16px', textOverflow: 'ellipsis', textAlign: 'left',
        }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-primary)', margin: '0 0 4px 0' }}>
              🔒 Account Required for Full Access
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              To keep our community safe and Christ-centered, all app features require creating a free member account.
            </p>
          </div>
          <Link href="/sign-up" className="btn btn-primary">
            Sign Up Free to Unlock Access →
          </Link>
        </div>

        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '40px auto', width: '100%' }} />

        <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '12px' }}>
          Explore Every Platform Section
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>
          Click on any section card below to view its full capabilities, safety rules, and tools.
        </p>
      </section>

      {/* Feature Grid */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px',
        }}>
          {SECTIONS.map((sec) => (
            <div
              key={sec.id}
              className="card card-interactive animate-fade-in"
              onClick={() => setSelectedSection(sec)}
              style={{
                padding: '24px', cursor: 'pointer', background: 'var(--bg-surface)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                border: '1px solid var(--border-subtle)', position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(46,125,50,0.1)', border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px',
                  }}>
                    {sec.icon}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-overlay)', padding: '2px 8px', borderRadius: '99px' }}>
                    🔒 Members Only
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  {sec.title}
                </h3>

                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                  {sec.shortDesc}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                <span>View Details & Capabilities</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{
        background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)',
        padding: '60px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '12px' }}>
            Ready to Join the Community?
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '28px' }}>
            Sign up today to start connecting with prayer partners, Bible study groups, and believers in your area.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sign-up" className="btn btn-primary btn-xl">
              Create Free Account
            </Link>
            <Link href="/sign-in" className="btn btn-outline btn-xl">
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Detail Modal */}
      {selectedSection && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="card animate-fade-in" style={{
            maxWidth: '680px', width: '100%', padding: '36px', maxHeight: '85vh', overflowY: 'auto',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', position: 'relative',
          }}>
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedSection(null)}
              style={{
                position: 'absolute', top: '20px', right: '20px', background: 'var(--bg-overlay)',
                border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                fontSize: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Close detail modal"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(46,125,50,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', flexShrink: 0,
              }}>
                {selectedSection.icon}
              </div>
              <div>
                <h2 style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', fontWeight: 700, margin: 0 }}>
                  {selectedSection.title}
                </h2>
                {selectedSection.badge && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-gold)', background: 'rgba(212,175,55,0.1)', padding: '2px 8px', borderRadius: '99px', marginTop: '4px', display: 'inline-block' }}>
                    {selectedSection.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Overview */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                📖 Purpose & Overview
              </h4>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                {selectedSection.overview}
              </p>
            </div>

            {/* Key Features */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                ✨ Key Capabilities & Tools
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedSection.keyFeatures.map((feat, idx) => (
                  <li key={idx} style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* Safety & Access Rules */}
            <div style={{ marginBottom: '28px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                🛡️ Safety, Privacy & Access Rules
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedSection.safetyRules.map((rule, idx) => (
                  <li key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedSection(null)}>
                Close
              </button>
              <Link href={isSignedIn ? selectedSection.route : '/sign-up'} className="btn btn-primary btn-lg">
                {isSignedIn ? `Open ${selectedSection.title} →` : 'Sign Up to Unlock Feature →'}
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '32px', borderTop: '1px solid var(--border-subtle)',
        fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-surface)',
      }}>
        <p>© {new Date().getFullYear()} ChristianConnect · Built on Faith · <em>"Iron sharpens iron" — Proverbs 27:17</em></p>
      </footer>

    </main>
  );
}
