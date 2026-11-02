import OpenAI from 'openai';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { prisma } from '../lib/prisma';
import { ModerationStatus } from '@prisma/client';

// ─── OpenAI Client ────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Google Cloud Vision Client ───────────────────────────────────────────────
let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient(): ImageAnnotatorClient {
  if (!visionClient) {
    // Supports both GOOGLE_APPLICATION_CREDENTIALS (file path) and
    // individual env vars (GOOGLE_CLOUD_PROJECT etc.)
    if (process.env.GOOGLE_CLOUD_CLIENT_EMAIL && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      visionClient = new ImageAnnotatorClient({
        credentials: {
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
      });
    } else {
      // Falls back to GOOGLE_APPLICATION_CREDENTIALS file path
      visionClient = new ImageAnnotatorClient();
    }
  }
  return visionClient;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextModerationResult {
  status: ModerationStatus;
  flagged: boolean;
  categories: string[];
  reason?: string;
}

export interface ImageModerationResult {
  status: ModerationStatus;
  flagged: boolean;
  reason?: string;
}

// ─── Text Moderation (OpenAI) ─────────────────────────────────────────────────

/**
 * Runs OpenAI's moderation API on a text string.
 * Returns approved/flagged status with category details.
 */
export async function moderateText(text: string): Promise<TextModerationResult> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[Moderation] OPENAI_API_KEY not set — skipping text moderation');
    return { status: 'approved', flagged: false, categories: [] };
  }

  try {
    const response = await openai.moderations.create({ input: text });
    const result = response.results[0];

    if (!result.flagged) {
      return { status: 'approved', flagged: false, categories: [] };
    }

    // Collect triggered categories
    const triggeredCategories = Object.entries(result.categories)
      .filter(([, v]) => v === true)
      .map(([k]) => k);

    // Auto-reject the most severe categories immediately
    const autoRejectCategories = [
      'sexual/minors',
      'violence/graphic',
      'hate/threatening',
      'self-harm/intent',
    ];
    const isAutoReject = triggeredCategories.some((cat) =>
      autoRejectCategories.includes(cat)
    );

    return {
      status: isAutoReject ? 'auto_rejected' : 'flagged',
      flagged: true,
      categories: triggeredCategories,
      reason: `Moderation flags: ${triggeredCategories.join(', ')}`,
    };
  } catch (err) {
    console.error('[Moderation] OpenAI text moderation error:', err);
    // Fail open with pending status — human review required
    return { status: 'pending', flagged: false, categories: [], reason: 'moderation_error' };
  }
}

// ─── Image Moderation (Google Cloud Vision SafeSearch) ────────────────────────

/**
 * Runs Google Cloud Vision SafeSearch on an image URL.
 * Returns approved/flagged status.
 */
export async function moderateImage(imageUrl: string): Promise<ImageModerationResult> {
  const googleCredsAvailable =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_CLOUD_CLIENT_EMAIL;

  if (!googleCredsAvailable) {
    console.warn('[Moderation] Google Cloud credentials not set — skipping image moderation');
    return { status: 'pending', flagged: false, reason: 'no_credentials' };
  }

  try {
    const client = getVisionClient();
    const [result] = await client.safeSearchDetection(imageUrl);
    const safeSearch = result.safeSearchAnnotation;

    if (!safeSearch) {
      return { status: 'approved', flagged: false };
    }

    // VERY_LIKELY or LIKELY triggers a flag
    const severeValues = ['VERY_LIKELY', 'LIKELY'];
    const flaggedFields: string[] = [];

    if (severeValues.includes(String(safeSearch.adult ?? ''))) flaggedFields.push('adult');
    if (severeValues.includes(String(safeSearch.violence ?? ''))) flaggedFields.push('violence');
    if (severeValues.includes(String(safeSearch.racy ?? ''))) flaggedFields.push('racy');
    if (severeValues.includes(String(safeSearch.medical ?? ''))) flaggedFields.push('medical');

    if (flaggedFields.length === 0) {
      return { status: 'approved', flagged: false };
    }

    // adult content is auto-rejected
    const isAutoReject = flaggedFields.includes('adult');

    return {
      status: isAutoReject ? 'auto_rejected' : 'flagged',
      flagged: true,
      reason: `SafeSearch flags: ${flaggedFields.join(', ')}`,
    };
  } catch (err) {
    console.error('[Moderation] Google Vision error:', err);
    return { status: 'pending', flagged: false, reason: 'moderation_error' };
  }
}

// ─── Process Message Moderation ───────────────────────────────────────────────

/**
 * Runs full moderation pipeline on a message:
 * 1. Text moderation (if content present)
 * 2. Image moderation (if mediaUrl present)
 * 3. Updates the Message record in DB with the result
 * 4. If flagged, sends alert to admin
 */
export async function processMessageModeration(messageId: string): Promise<void> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, content: true, mediaUrl: true, mediaType: true },
  });

  if (!message) {
    console.error(`[Moderation] Message ${messageId} not found`);
    return;
  }

  let finalStatus: ModerationStatus = 'approved';
  let finalReason: string | undefined;

  // Text moderation
  if (message.content) {
    const textResult = await moderateText(message.content);
    if (textResult.status === 'auto_rejected') {
      finalStatus = 'auto_rejected';
      finalReason = textResult.reason;
    } else if (textResult.status === 'flagged' && (finalStatus as string) !== 'auto_rejected') {
      finalStatus = 'flagged';
      finalReason = textResult.reason;
    }
  }

  // Image moderation (only if not already auto-rejected)
  if (message.mediaUrl && message.mediaType === 'image' && finalStatus !== 'auto_rejected') {
    const imageResult = await moderateImage(message.mediaUrl);
    if (imageResult.status === 'auto_rejected') {
      finalStatus = 'auto_rejected';
      finalReason = imageResult.reason;
    } else if (imageResult.status === 'flagged') {
      finalStatus = 'flagged';
      finalReason = imageResult.reason;
    }
  }

  // Update message status
  await prisma.message.update({
    where: { id: messageId },
    data: {
      moderationStatus: finalStatus,
      moderationReason: finalReason,
      moderatedAt: new Date(),
    },
  });

  if (finalStatus === 'flagged' || finalStatus === 'auto_rejected') {
    console.log(`[Moderation] Message ${messageId} flagged: ${finalReason}`);
    // Admin notification is handled by emailService — import lazily to avoid circular deps
    const { notifyAdminFlaggedContent } = await import('./emailService');
    await notifyAdminFlaggedContent('message', messageId, finalReason ?? 'Unknown reason');
  }
}

// ─── Process Dating Profile Moderation ────────────────────────────────────────

/**
 * Runs full moderation pipeline on a DatingProfile.
 * Moderates: bio text + all prompt answers.
 * Updates the DatingProfile.moderationStatus in DB.
 * Profile remains invisible to the browse feed until approved.
 */
export async function processDatingProfileModeration(datingProfileId: string): Promise<void> {
  const profile = await prisma.datingProfile.findUnique({
    where: { id: datingProfileId },
    select: { id: true, bio: true, promptAnswers: true },
  });

  if (!profile) {
    console.error(`[Moderation] DatingProfile ${datingProfileId} not found`);
    return;
  }

  let finalStatus: ModerationStatus = 'approved';
  let finalReason: string | undefined;

  // Moderate bio
  if (profile.bio) {
    const bioResult = await moderateText(profile.bio);
    if (bioResult.status === 'auto_rejected') {
      finalStatus = 'auto_rejected';
      finalReason = `Bio: ${bioResult.reason}`;
    } else if (bioResult.status === 'flagged') {
      finalStatus = 'flagged';
      finalReason = `Bio: ${bioResult.reason}`;
    }
  }

  // Moderate prompt answers
  if (finalStatus !== 'auto_rejected' && profile.promptAnswers) {
    const answers = profile.promptAnswers as Array<{ question: string; answer: string }>;
    for (const item of answers) {
      if (item.answer) {
        const result = await moderateText(`${item.question}: ${item.answer}`);
        if (result.status === 'auto_rejected') {
          finalStatus = 'auto_rejected';
          finalReason = `Prompt answer: ${result.reason}`;
          break;
        } else if (result.status === 'flagged' && (finalStatus as string) !== 'auto_rejected') {
          finalStatus = 'flagged';
          finalReason = `Prompt answer: ${result.reason}`;
        }
      }
    }
  }

  await prisma.datingProfile.update({
    where: { id: datingProfileId },
    data: {
      moderationStatus: finalStatus,
      moderationReason: finalReason,
    },
  });

  if (finalStatus === 'flagged' || finalStatus === 'auto_rejected') {
    console.log(`[Moderation] DatingProfile ${datingProfileId} flagged: ${finalReason}`);
    const { notifyAdminFlaggedContent } = await import('./emailService');
    await notifyAdminFlaggedContent('dating_profile', datingProfileId, finalReason ?? 'Unknown reason');
  }
}

// ─── Process Story Moderation ─────────────────────────────────────────────────

/**
 * Runs pre-publishing image/video & text overlay moderation on a Story.
 * MUST complete before a story becomes visible in the public/group feeds.
 * If auto_rejected, deletes the Cloudinary media asset immediately.
 */
export async function processStoryModeration(storyId: string): Promise<{ status: ModerationStatus; reason?: string }> {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { id: true, mediaUrl: true, mediaType: true, textOverlay: true },
  });

  if (!story) {
    console.error(`[Moderation] Story ${storyId} not found`);
    return { status: 'auto_rejected', reason: 'Story not found' };
  }

  let finalStatus: ModerationStatus = 'approved';
  let finalReason: string | undefined;

  // Text overlay moderation
  if (story.textOverlay) {
    const textResult = await moderateText(story.textOverlay);
    if (textResult.status === 'auto_rejected') {
      finalStatus = 'auto_rejected';
      finalReason = `Text overlay: ${textResult.reason}`;
    } else if (textResult.status === 'flagged') {
      finalStatus = 'flagged';
      finalReason = `Text overlay: ${textResult.reason}`;
    }
  }

  // Image SafeSearch moderation (only if image and not already auto-rejected)
  if (story.mediaUrl && story.mediaType === 'image' && finalStatus !== 'auto_rejected') {
    const imageResult = await moderateImage(story.mediaUrl);
    if (imageResult.status === 'auto_rejected') {
      finalStatus = 'auto_rejected';
      finalReason = imageResult.reason;
    } else if (imageResult.status === 'flagged') {
      finalStatus = 'flagged';
      finalReason = imageResult.reason;
    }
  }

  await prisma.story.update({
    where: { id: storyId },
    data: {
      moderationStatus: finalStatus,
      moderationReason: finalReason,
    },
  });

  if (finalStatus === 'auto_rejected') {
    console.log(`[Moderation] Story ${storyId} auto-rejected: ${finalReason}`);
    // Clean up Cloudinary asset
    const { deleteCloudinaryAsset } = await import('./cloudinaryService');
    const publicIdMatch = story.mediaUrl.match(/\/v\d+\/([^/.]+)/);
    if (publicIdMatch && publicIdMatch[1]) {
      await deleteCloudinaryAsset(publicIdMatch[1]);
    }
  }

  if (finalStatus === 'flagged' || finalStatus === 'auto_rejected') {
    const { notifyAdminFlaggedContent } = await import('./emailService');
    await notifyAdminFlaggedContent('story', storyId, finalReason ?? 'Unknown reason');
  }

  return { status: finalStatus, reason: finalReason };
}

