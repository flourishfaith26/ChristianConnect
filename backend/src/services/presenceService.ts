import { cacheDelete, cacheGet, cacheGetMany, cacheSet } from '../lib/cache';

const ONLINE_TTL_SECONDS = 35; // Expire after 35s (client pings every 20s)
const ONLINE_KEY = (userId: string) => `presence:${userId}:online`;

/**
 * Mark a user as online. Call on Socket.io connection and presence:ping events.
 */
export async function setOnline(userId: string): Promise<void> {
  try {
    await cacheSet(ONLINE_KEY(userId), '1', ONLINE_TTL_SECONDS);
  } catch { /* Cache update is non-critical */ }
}

/**
 * Mark a user as offline immediately. Call on Socket.io disconnect.
 */
export async function setOffline(userId: string): Promise<void> {
  try {
    await cacheDelete(ONLINE_KEY(userId));
  } catch { /* Cache update is non-critical */ }
}

/**
 * Check if a user is currently online.
 */
export async function isOnline(userId: string): Promise<boolean> {
  try {
    const val = await cacheGet(ONLINE_KEY(userId));
    return val === '1';
  } catch {
    return false;
  }
}

/**
 * Get online status for a list of user IDs.
 */
export async function getOnlineStatuses(
  userIds: string[]
): Promise<Record<string, boolean>> {
  if (userIds.length === 0) return {};

  try {
    const results = await cacheGetMany(userIds.map(ONLINE_KEY));

    const statuses: Record<string, boolean> = {};
    userIds.forEach((id, i) => {
      statuses[id] = results[i] === '1';
    });
    return statuses;
  } catch {
    // Cache failures return all users as offline.
    return Object.fromEntries(userIds.map((id) => [id, false]));
  }
}
