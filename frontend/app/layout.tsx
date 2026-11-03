import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ChristianConnect — Faith Community & Chat',
    template: '%s | ChristianConnect',
  },
  description:
    'A faith-based community platform combining real-time chat, Bible study, prayer partners, accountability groups, and Christian community — built on shared belief and mutual care.',
  keywords: ['Christian community', 'Bible study', 'prayer partners', 'faith chat', 'Christian app'],
  authors: [{ name: 'ChristianConnect' }],
  icons: {
    icon: '/favicon.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ChristianConnect',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 800,
        alt: 'ChristianConnect Official Logo',
      },
    ],
  },
};

import { AccessibilityProvider } from '@/components/AccessibilityProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_aGFyZHktdHJvdXQtMjAuY2xlcmsuYWNjb3VudHMuZGV2JA';

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body suppressHydrationWarning>
          <AccessibilityProvider>
            {children}
          </AccessibilityProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
