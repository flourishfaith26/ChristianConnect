type CacheEntry = {
  value: string;
  expiresAt: number;
};

const entries = new Map<string, CacheEntry>();

function removeExpired(key: string): void {
  const entry = entries.get(key);
  if (entry && entry.expiresAt <= Date.now()) {
    entries.delete(key);
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  removeExpired(key);
  return entries.get(key)?.value ?? null;
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDelete(key: string): Promise<void> {
  entries.delete(key);
}

export async function cacheGetMany(keys: string[]): Promise<Array<string | null>> {
  return Promise.all(keys.map(cacheGet));
}
