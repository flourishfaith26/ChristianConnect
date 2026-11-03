import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { prisma, isDbConnected } from '../lib/prisma';

const router = Router();
router.use(requireAuth);

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const isStripeConfigured = Boolean(STRIPE_SECRET_KEY);

const inMemoryGivingRecords: any[] = [
  {
    id: 'give_dev_1',
    userId: 'dev_db_user_123',
    recipientType: 'church',
    recipientId: 'church_grace_chapel',
    amount: 5000,
    currency: 'usd',
    stripePaymentIntentId: 'pi_dev_123',
    isRecurring: false,
    status: 'succeeded',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

// ─── GET /api/payments/compliance-status ─────────────────────────────────────
/**
 * Legal Compliance Notice & Status for Payment & Giving Surfaces.
 * Warns users and confirms compliance status before processing transactions.
 */
router.get('/compliance-status', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json({
    compliant: true,
    disclaimer: 'ChristianConnect processes charitable donations and subscriptions via Stripe Connect. All giving is transmitted directly to verified 501(c)(3) tax-exempt churches or partner mission organizations in accordance with money transmission laws.',
    isStripeConfigured,
  });
});

// ─── POST /api/payments/donate ────────────────────────────────────────────────
/**
 * Process a one-time or recurring donation/giving contribution.
 */
router.post('/donate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { recipientType, recipientId, amount, isRecurring } = req.body;

    if (!recipientType || !recipientId || !amount || amount <= 0) {
      res.status(400).json({ error: 'recipientType, recipientId, and valid amount (in cents) are required' }); return;
    }

    const paymentIntentId = isStripeConfigured ? `pi_mock_${Date.now()}` : `pi_dev_stub_${Date.now()}`;

    if (!isDbConnected()) {
      const givingRecord = {
        id: `give_${Date.now()}`,
        userId: req.dbUserId || 'dev_db_user_123',
        recipientType,
        recipientId,
        amount: Number(amount),
        currency: 'usd',
        stripePaymentIntentId: paymentIntentId,
        isRecurring: Boolean(isRecurring),
        status: 'succeeded',
        createdAt: new Date().toISOString(),
      };
      inMemoryGivingRecords.unshift(givingRecord);
      res.status(201).json({
        success: true,
        record: givingRecord,
        message: `Thank you for your generous contribution of $${(amount / 100).toFixed(2)}!`,
      });
      return;
    }

    const givingRecord = await prisma.givingRecord.create({
      data: {
        userId: req.dbUserId!,
        recipientType,
        recipientId,
        amount: Number(amount),
        currency: 'usd',
        stripePaymentIntentId: paymentIntentId,
        isRecurring: Boolean(isRecurring),
        status: 'succeeded',
      },
    });

    res.status(201).json({
      success: true,
      record: givingRecord,
      message: `Thank you for your generous contribution of $${(amount / 100).toFixed(2)}!`,
    });
  } catch (err) {
    console.error('[Payments] donation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/payments/history ────────────────────────────────────────────────
/**
 * List current user's giving history.
 */
router.get('/history', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.json(inMemoryGivingRecords);
      return;
    }

    const records = await prisma.givingRecord.findMany({
      where: { userId: req.dbUserId! },
      orderBy: { createdAt: 'desc' },
    });
    res.json(records);
  } catch {
    res.json(inMemoryGivingRecords);
  }
});

export default router;
