import { auth } from '@clerk/nextjs/server';
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
  let user = null;
  let isUnauthorized = false;
  const apiUrl = (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000'
  ).replace(/\/+$/, '');

  try {
    const res = await fetch(`${apiUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.status === 401) {
      isUnauthorized = true;
    } else if (!res.ok) {
      throw new Error(`Could not load your account from the backend (${res.status}).`);
    } else {
      user = await res.json();
    }
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Could not reach the account backend.');
  }

  if (isUnauthorized) {
    redirect('/sign-in');
  }

  // If user profile is missing or user has not completed statement of faith
  if (!user || !user.statementOfFaithAccepted) {
    redirect('/onboarding');
  }

  return <DashboardClient user={user} />;
}
