import { prisma } from '../lib/prisma';
import { VerificationStatus } from '@prisma/client';

const PERSONA_API_KEY = process.env.PERSONA_API_KEY ?? '';
const PERSONA_TEMPLATE_ID = process.env.PERSONA_TEMPLATE_ID ?? '';
const PERSONA_API_URL = 'https://withpersona.com/api/v1';
const IS_DEV_STUB = !PERSONA_API_KEY || process.env.NODE_ENV === 'development' && !PERSONA_TEMPLATE_ID;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface VerificationStartResult {
  inquiryId: string;
  hostedUrl: string;
  isDevStub: boolean;
}

// ─── Create a Persona Inquiry ──────────────────────────────────────────────────

/**
 * Creates a Persona hosted-flow inquiry for identity verification.
 *
 * In development (no PERSONA_API_KEY), returns a dev-stub that auto-approves
 * the user after calling approveDevStub().
 */
export async function createPersonaInquiry(userId: string): Promise<VerificationStartResult> {
  // ── Dev stub (no Persona API key configured) ─────────────────────────────
  if (IS_DEV_STUB) {
    console.warn('[Verification] No PERSONA_API_KEY — using dev stub mode');

    const record = await prisma.verificationRecord.upsert({
      where: { userId },
      create: {
        userId,
        provider: 'dev_stub',
        inquiryId: `dev_stub_${userId}`,
        status: 'pending',
      },
      update: {
        status: 'pending',
        inquiryId: `dev_stub_${userId}`,
      },
    });

    return {
      inquiryId: record.inquiryId!,
      // In dev, the "hosted URL" points to our own dev-approve endpoint
      hostedUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dating/verify/dev-approve`,
      isDevStub: true,
    };
  }

  // ── Real Persona API ─────────────────────────────────────────────────────
  try {
    const response = await fetch(`${PERSONA_API_URL}/inquiries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERSONA_API_KEY}`,
        'Persona-Version': '2023-01-05',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            'inquiry-template-id': PERSONA_TEMPLATE_ID,
            'reference-id': userId,
          },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Persona API error ${response.status}: ${JSON.stringify(body)}`);
    }

    const data = await response.json() as {
      data: {
        id: string;
        attributes: { status: string; 'session-token': string };
      };
    };

    const inquiryId = data.data.id;
    const sessionToken = data.data.attributes['session-token'];
    const hostedUrl = `https://withpersona.com/verify?inquiry-id=${inquiryId}&session-token=${sessionToken}`;

    // Upsert VerificationRecord
    await prisma.verificationRecord.upsert({
      where: { userId },
      create: {
        userId,
        provider: 'persona',
        inquiryId,
        status: 'pending',
      },
      update: {
        inquiryId,
        status: 'pending',
        completedAt: null,
        rejectionReason: null,
      },
    });

    return { inquiryId, hostedUrl, isDevStub: false };
  } catch (err) {
    console.error('[Verification] Persona inquiry creation error:', err);
    throw new Error('Failed to create identity verification session.');
  }
}

// ─── Handle Persona Webhook ────────────────────────────────────────────────────

/**
 * Processes an incoming Persona webhook event.
 * Updates the VerificationRecord status based on the event type.
 *
 * Persona sends events like:
 *   inquiry.completed  → approved
 *   inquiry.failed     → rejected
 *   inquiry.expired    → requires_retry
 */
export async function handlePersonaWebhook(payload: {
  data: {
    type: string;
    id: string;
    attributes: {
      status: string;
      'reference-id'?: string;
    };
  };
}): Promise<void> {
  const { type, id: inquiryId, attributes } = payload.data;
  const referenceId = attributes['reference-id'];

  if (!referenceId) {
    console.warn('[Verification] Webhook missing reference-id — skipping');
    return;
  }

  let newStatus: VerificationStatus;
  switch (type) {
    case 'inquiry.completed':
    case 'inquiry.approved':
      newStatus = 'approved';
      break;
    case 'inquiry.failed':
    case 'inquiry.declined':
      newStatus = 'rejected';
      break;
    case 'inquiry.expired':
      newStatus = 'requires_retry';
      break;
    default:
      console.log(`[Verification] Ignoring Persona event: ${type}`);
      return;
  }

  await prisma.verificationRecord.upsert({
    where: { userId: referenceId },
    create: {
      userId: referenceId,
      provider: 'persona',
      inquiryId,
      status: newStatus,
      completedAt: newStatus === 'approved' ? new Date() : undefined,
    },
    update: {
      status: newStatus,
      completedAt: newStatus === 'approved' ? new Date() : undefined,
    },
  });

  console.log(`[Verification] Updated user ${referenceId} → ${newStatus}`);
}

// ─── Dev Stub Auto-Approve ─────────────────────────────────────────────────────

/**
 * In development, immediately marks a user as approved.
 * Only callable when PERSONA_API_KEY is not set.
 */
export async function approveDevStub(userId: string): Promise<void> {
  if (!IS_DEV_STUB) {
    throw new Error('Dev stub approve is only available in development mode without a Persona API key.');
  }

  await prisma.verificationRecord.upsert({
    where: { userId },
    create: {
      userId,
      provider: 'dev_stub',
      inquiryId: `dev_stub_${userId}`,
      status: 'approved',
      completedAt: new Date(),
    },
    update: {
      status: 'approved',
      completedAt: new Date(),
    },
  });

  console.log(`[Verification] Dev stub: approved user ${userId}`);
}

// ─── Status Check ──────────────────────────────────────────────────────────────

export async function getVerificationStatus(userId: string): Promise<{
  status: VerificationStatus | 'not_started';
  record: { provider: string; completedAt: Date | null; rejectionReason: string | null } | null;
}> {
  const record = await prisma.verificationRecord.findUnique({
    where: { userId },
    select: { status: true, provider: true, completedAt: true, rejectionReason: true },
  });

  if (!record) return { status: 'not_started', record: null };

  return { status: record.status, record };
}
