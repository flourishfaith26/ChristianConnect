import crypto from 'crypto';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

export interface SignedUploadParams {
  uploadUrl: string;
  signature?: string;
  timestamp?: number;
  apiKey?: string;
  cloudName?: string;
  folder: string;
  isDevStub: boolean;
}

/**
 * Generates a signed upload URL or parameters for direct frontend upload.
 * Uses Node.js crypto module to sign parameters (SHA-1 HMAC) without external SDK dependencies.
 * If Cloudinary environment variables are missing, returns a dev stub response.
 */
export function generateSignedUploadParams(userId: string, folder = 'christianconnect/stories'): SignedUploadParams {
  if (!isCloudinaryConfigured) {
    console.warn('[CloudinaryService] Missing Cloudinary keys — returning dev stub signed upload params');
    return {
      uploadUrl: `http://localhost:4000/api/stories/dev-upload`,
      folder,
      isDevStub: true,
    };
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const tags = `user_${userId}`;

  // Cloudinary signature formula: SHA-1 hash of sorted "param1=val1&param2=val2...<api_secret>"
  const stringToSign = `folder=${folder}&tags=${tags}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    isDevStub: false,
  };
}

/**
 * Delete a media asset from Cloudinary by public ID if configured.
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured) return;
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    console.error('[CloudinaryService] Delete asset error:', err);
  }
}
