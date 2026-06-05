'use client';

interface UserResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    email_verified: boolean;
    role: string;
  };
}

let cachedUserPromise: Promise<UserResponse> | null = null;
let lastFetchTime = 0;
const CACHE_EXPIRY_MS = 5000; // Deduplicate calls within 5 seconds

/**
 * Fetches current user session info.
 * Deduplicates multiple simultaneous/rapid calls on the client.
 */
export async function getCurrentUser(): Promise<UserResponse> {
  const now = Date.now();
  
  if (cachedUserPromise && (now - lastFetchTime < CACHE_EXPIRY_MS)) {
    return cachedUserPromise;
  }

  lastFetchTime = now;
  cachedUserPromise = fetch('/api/users/me', {
    credentials: 'include',
    cache: 'no-store'
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch user session');
      }
      return res.json() as Promise<UserResponse>;
    })
    .catch((err) => {
      // Clear cache on error
      cachedUserPromise = null;
      lastFetchTime = 0;
      throw err;
    });

  return cachedUserPromise;
}

/**
 * Invalidates the cached user promise to force a fresh fetch on the next call.
 */
export function invalidateUserCache() {
  cachedUserPromise = null;
  lastFetchTime = 0;
}
