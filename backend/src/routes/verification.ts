import { Router, Response } from 'express';
import { createPersonaInquiry, approveDevStub, getVerificationStatus, handlePersonaWebhook } from '../services/verificationService';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdult } from '../middleware/requireAdult';
import crypto from 'crypto';

const router = Router();

// ─── GET /api/verification/status ────────────────────────────────────────────
/**
 * Returns the current verification status for the authenticated user.
 */
router.get('/status', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await getVerificationStatus(req.dbUserId!);
    res.json(result);
  } catch (err) {
    console.error('[Verification] status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/verification/start ────────────────────────────────────────────
/**
 * Creates a Persona hosted-flow inquiry.
 * Returns a redirect URL for the client to open.
 * Only available to adult (non-minor) accounts.
 */
router.post('/start', requireAuth, requireAdult, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await createPersonaInquiry(req.dbUserId!);
    res.json(result);
  } catch (err) {
    console.error('[Verification] start error:', err);
    res.status(500).json({ error: 'Failed to start verification session.' });
  }
});

// ─── POST /api/verification/dev-approve ──────────────────────────────────────
/**
 * Development-only endpoint. Instantly marks the current user as verified.
 * Only works when PERSONA_API_KEY is not set (dev stub mode).
 * Returns 403 in production.
 */
router.post('/dev-approve', requireAuth, requireAdult, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (process.env.PERSONA_API_KEY) {
      res.status(403).json({ error: 'Dev stub not available in production' });
      return;
    }
    await approveDevStub(req.dbUserId!);
    res.json({ success: true, message: 'Dev stub: verification approved.' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
});

// ─── POST /api/verification/webhook ──────────────────────────────────────────
/**
 * Persona webhook receiver.
 * This route must be mounted BEFORE express.json() in index.ts
 * so it receives the raw body for signature verification.
 */
router.post('/webhook', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const personaWebhookSecret = process.env.PERSONA_WEBHOOK_SECRET;

    // Verify Persona webhook signature if secret is configured
    if (personaWebhookSecret) {
      const signature = req.headers['persona-signature'] as string;
      if (!signature) {
        res.status(400).json({ error: 'Missing Persona-Signature header' });
        return;
      }

      // Persona uses HMAC-SHA256
      const rawBody = req.body as Buffer;
      const expectedSig = crypto
        .createHmac('sha256', personaWebhookSecret)
        .update(rawBody)
        .digest('hex');

      const sigValue = signature.split(',')
        .find(part => part.startsWith('v1='))
        ?.replace('v1=', '');

      if (!sigValue || !crypto.timingSafeEqual(
        Buffer.from(sigValue, 'hex'),
        Buffer.from(expectedSig, 'hex'),
      )) {
        res.status(400).json({ error: 'Invalid webhook signature' });
        return;
      }
    }

    // Parse and process the webhook payload
    const body = typeof req.body === 'string' || Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString())
      : req.body;

    await handlePersonaWebhook(body);
    res.json({ received: true });
  } catch (err) {
    console.error('[Verification] Webhook processing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
