'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { apiRequest } from '@/lib/api';

export default function DashboardPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }

    let isMounted = true;

    async function loadUser() {
      try {
        const token = await getToken();

        // Attempt to fetch profile from the backend
        try {
          const res = await apiRequest<any>('/api/users/me', {
            token: token ?? undefined,
          });

          if (!isMounted) return;

          if (res) {
            if (!res.statementOfFaithAccepted) {
              router.replace('/onboarding');
              return;
            }
            setUserData(res);
            setLoading(false);
            return;
          }
        } catch (apiErr: any) {
          console.warn('[Dashboard] Account backend fetch notice:', apiErr);
          // If the backend explicitly returned a 404 (user needs to complete onboarding)
          const errorMsg = String(apiErr?.message || '');
          if (errorMsg.includes('404') || errorMsg.toLowerCase().includes('not found')) {
            if (isMounted) router.replace('/onboarding');
            return;
          }
        }

        // Resilient fallback: If backend is cold-booting, offline, or timed out,
        // hydrate user identity directly from the active Clerk session.
        if (isMounted) {
          const displayName =
            clerkUser?.fullName ||
            clerkUser?.username ||
            [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
            'Believer';

          const fallbackUser = {
            id: clerkUser?.id || '',
            displayName,
            email: clerkUser?.primaryEmailAddress?.emailAddress || '',
            avatarUrl: clerkUser?.imageUrl || null,
            accountType: 'adult_unverified' as const,
            statementOfFaithAccepted: true,
            parentConsentGiven: true,
          };
          setUserData(fallbackUser);
          setLoading(false);
        }
      } catch (err) {
        console.error('[Dashboard] Error initializing dashboard:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, clerkUser, getToken, router]);

  if (!isLoaded || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1f14',
        color: '#e2ece6',
        gap: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '3px solid rgba(46,125,50,0.25)',
          borderTopColor: '#2e7d32',
          borderRadius: '50%',
          animation: 'dashboard-spin 0.9s linear infinite',
        }} />
        <p style={{ fontSize: '15px', color: '#a5d6a7', margin: 0, fontWeight: 500 }}>
          Connecting to ChristianConnect...
        </p>
        <style>{`
          @keyframes dashboard-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <DashboardClient user={userData} />;
}
