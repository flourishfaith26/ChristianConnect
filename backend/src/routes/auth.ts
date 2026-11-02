import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import { User } from '../models/User';

const router = Router();

/**
 * POST /api/clerk-webhook
 *
 * Handles Clerk webhook events. Currently processes:
 * - user.created: creates a corresponding User record in our DB
 *
 * Verified using svix webhook signature.
 * This route receives raw body (mounted before express.json in index.ts).
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Auth] CLERK_WEBHOOK_SECRET not set');
    res.status(500).json({ error: 'Webhook secret not configured' });
    return;
  }

  // Verify webhook signature
  const svixId = req.headers['svix-id'] as string;
  const svixTimestamp = req.headers['svix-timestamp'] as string;
  const svixSignature = req.headers['svix-signature'] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: 'Missing svix headers' });
    return;
  }

  let event: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(req.body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof event;
  } catch (err) {
    console.error('[Auth] Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Invalid webhook signature' });
    return;
  }

  // Handle user.created event
  if (event.type === 'user.created') {
    const data = event.data as {
      id: string;
      email_addresses: Array<{ email_address: string; verification: { status: string } }>;
      first_name?: string;
      last_name?: string;
    };

    const primaryEmail = data.email_addresses?.find(
      (e) => e.verification?.status === 'verified'
    )?.email_address ?? data.email_addresses?.[0]?.email_address;

    if (!primaryEmail) {
      console.error('[Auth] No email found in user.created event');
      res.status(400).json({ error: 'No email in event' });
      return;
    }

    // Check if user already exists (idempotent)
    const existing = await User.findOne({ clerkId: data.id }).lean();
    if (existing) {
      res.json({ status: 'already_exists' });
      return;
    }

    // Create a minimal user record — onboarding flow will complete the rest
    // account_type defaults to adult_unverified and is updated via onboarding API
    await User.create({
        clerkId: data.id,
        email: primaryEmail,
        displayName: [data.first_name, data.last_name].filter(Boolean).join(' ') || 'New Member',
        // dateOfBirth and gender will be set during onboarding
        // Using a placeholder — onboarding MUST complete before full access
        dateOfBirth: new Date('2000-01-01'),
        gender: 'prefer_not_to_say',
        accountType: 'adult_unverified',
        statementOfFaithAccepted: false,
    });

    console.log(`[Auth] Created user record for Clerk ID: ${data.id}`);
    res.json({ status: 'created' });
    return;
  }

  // Acknowledge other event types without processing
  res.json({ status: 'ignored', type: event.type });
});

export default router;
