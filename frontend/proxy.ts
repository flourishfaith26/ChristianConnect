import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/parental-consent(.*)',
  '/coming-soon(.*)',
  '/bible-study(.*)',
  '/devotionals(.*)',
  '/api/(.*)',
]);

// Check if valid non-placeholder Clerk secret key is present
const isClerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY &&
  !process.env.CLERK_SECRET_KEY.includes('PLACEHOLDER') &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('PLACEHOLDER')
);

const defaultClerkMiddleware = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  try {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  } catch {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export default async function proxy(req: NextRequest, event: any) {
  // If Clerk is not fully configured with real keys, bypass clerkMiddleware to prevent 7s timeouts & 404 handshake loops
  if (!isClerkConfigured) {
    if (req.nextUrl.searchParams.has('__clerk_handshake')) {
      const cleanUrl = req.nextUrl.clone();
      cleanUrl.searchParams.delete('__clerk_handshake');
      cleanUrl.searchParams.delete('__clerk_db_jwt');
      return NextResponse.redirect(cleanUrl);
    }
    return NextResponse.next();
  }

  try {
    return await defaultClerkMiddleware(req, event);
  } catch (err) {
    console.warn('[proxy.ts] Clerk middleware bypass on error:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
