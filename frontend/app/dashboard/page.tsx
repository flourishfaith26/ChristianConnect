import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your ChristianConnect community hub.',
};

export default async function DashboardPage() {
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const token = await getToken();
  if (!token) {
    redirect('/sign-in');
  }

  // Fetch user profile from our backend
  let user: any = null;
  let isUnauthorized = false;
  let isNotFound = false;

  const apiUrl = (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://christianconnect.onrender.com'
  ).replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`${apiUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (res.status === 401) {
      isUnauthorized = true;
    } else if (res.status === 404) {
      isNotFound = true;
    } else if (res.ok) {
      user = await res.json();
    }
  } catch (err) {
    console.warn('[DashboardPage] Account backend fetch notice:', err);
    // Never crash the Server Component render due to cold starts or network timeouts
  }

  if (isUnauthorized) {
    redirect('/sign-in');
  }

  // If the backend specifically reported 404, send the user to complete onboarding
  if (isNotFound) {
    redirect('/onboarding');
  }

  // Resilient fallback: If the backend is cold-booting, offline, or timed out,
  // hydrate user identity from Clerk session so the dashboard renders safely.
  if (!user) {
    const clerkUser = await currentUser();
    const displayName =
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
      clerkUser?.username ||
      'Believer';
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@christianconnect.app`;
    const avatarUrl = clerkUser?.imageUrl || null;

    user = {
      id: userId,
      displayName,
      email,
      avatarUrl,
      accountType: 'adult_unverified',
      statementOfFaithAccepted: true,
      parentConsentGiven: true,
    };
  } else if (!user.statementOfFaithAccepted) {
    redirect('/onboarding');
  }

  return <DashboardClient user={user} />;
}
