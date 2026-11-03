import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';

let app: App | null = null;

function ensureInitialized(): boolean {
  if (getApps().length > 0) { app = getApps()[0]!; return true; }

  let serviceAccount: any = null;

  // 1. Check direct file credentials (e.g. firebase-credentials.json)
  const credPath = process.env.FIREBASE_APPLICATION_CREDENTIALS || path.join(process.cwd(), 'firebase-credentials.json');
  if (fs.existsSync(credPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    } catch (err) {
      console.warn(`[NotificationService] Error reading credentials from ${credPath}:`, err);
    }
  }

  // 2. Check JSON string from environment variable
  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (err) {
      console.error('[NotificationService] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err);
    }
  }

  if (!serviceAccount) {
    console.warn('[NotificationService] Firebase credentials not found — push notifications disabled');
    return false;
  }

  try {
    app = initializeApp({ credential: cert(serviceAccount) });
    console.log('[NotificationService] Firebase Admin initialized ✓');
    return true;
  } catch (err) {
    console.error('[NotificationService] Failed to initialize Firebase:', err);
    return false;
  }
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * Send a push notification to one or more FCM tokens.
 */
export async function sendPushNotification(
  tokens: string[],
  payload: PushPayload
): Promise<{ success: number; failure: number }> {
  if (!ensureInitialized() || !app) {
    return { success: 0, failure: tokens.length };
  }
  if (tokens.length === 0) return { success: 0, failure: 0 };

  try {
    const message: MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data ?? {},
      webpush: {
        fcmOptions: { link: payload.data?.url ?? '/' },
        notification: { icon: '/icons/icon-192.png' },
      },
    };

    const messaging = getMessaging(app);
    const response = await messaging.sendEachForMulticast(message);
    return { success: response.successCount, failure: response.failureCount };
  } catch (err) {
    console.error('[NotificationService] Push notification error:', err);
    return { success: 0, failure: tokens.length };
  }
}

export async function sendReadingPlanReminder(
  tokens: string[],
  planName: string,
  passageLabel: string,
  dayNumber: number
): Promise<void> {
  await sendPushNotification(tokens, {
    title: '📖 Time for your daily reading!',
    body: `Day ${dayNumber}: ${passageLabel} — ${planName}`,
    data: { url: '/reading-plans', type: 'reading_plan_reminder' },
  });
}

export async function sendMessageNotification(
  tokens: string[],
  senderName: string,
  messagePreview: string
): Promise<void> {
  await sendPushNotification(tokens, {
    title: `New message from ${senderName}`,
    body: messagePreview.slice(0, 100),
    data: { url: '/chat', type: 'direct_message' },
  });
}
