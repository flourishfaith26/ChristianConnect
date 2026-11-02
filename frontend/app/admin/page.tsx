import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AdminPageClient from './AdminPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — Moderation Queue',
  description: 'Internal admin moderation queue for ChristianConnect.',
  robots: 'noindex,nofollow',
};

const ADMIN_CLERK_IDS = (process.env.ADMIN_CLERK_IDS ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Admin check — same logic as backend middleware
  if (!ADMIN_CLERK_IDS.includes(userId)) {
    redirect('/dashboard');
  }

  return <AdminPageClient />;
}
