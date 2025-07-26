import type { MotelReview, MotelReviewCacheEntry, MotelReviewRepliesCacheEntry } from '$lib/types/motel';

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

export function getCachedReviews(motelId: string): MotelReview[] | null {
  try {
    const cached = localStorage.getItem(`reviews:${motelId}`);
    if (!cached) return null;
    
    const cacheEntry: MotelReviewCacheEntry = JSON.parse(cached);
    if (!isCacheValid(cacheEntry.timestamp)) {
      localStorage.removeItem(`reviews:${motelId}`);
      return null;
    }
    
    return cacheEntry.reviews;
  } catch {
    localStorage.removeItem(`reviews:${motelId}`);
    return null;
  }
}

export function setCachedReviews(motelId: string, reviews: MotelReview[]): void {
  try {
    const cacheEntry: MotelReviewCacheEntry = {
      reviews,
      timestamp: Date.now()
    };
    localStorage.setItem(`reviews:${motelId}`, JSON.stringify(cacheEntry));
  } catch {
    // Ignore localStorage errors
  }
}

export function getCachedReplies(reviewId: string): MotelReview[] | null {
  try {
    const cached = localStorage.getItem(`replies:${reviewId}`);
    if (!cached) return null;
    
    const cacheEntry: MotelReviewRepliesCacheEntry = JSON.parse(cached);
    if (!isCacheValid(cacheEntry.timestamp)) {
      localStorage.removeItem(`replies:${reviewId}`);
      return null;
    }
    
    return cacheEntry.replies;
  } catch {
    localStorage.removeItem(`replies:${reviewId}`);
    return null;
  }
}

export function setCachedReplies(reviewId: string, replies: MotelReview[]): void {
  try {
    const cacheEntry: MotelReviewRepliesCacheEntry = {
      replies,
      timestamp: Date.now()
    };
    localStorage.setItem(`replies:${reviewId}`, JSON.stringify(cacheEntry));
  } catch {
    // Ignore localStorage errors
  }
}

export function addOptimisticReview(motelId: string, review: MotelReview): void {
  const cached = getCachedReviews(motelId) || [];
  setCachedReviews(motelId, [review, ...cached]);
}

export function removeOptimisticReview(motelId: string, reviewId: string): void {
  const cached = getCachedReviews(motelId);
  if (cached) {
    const filtered = cached.filter(r => r.id !== reviewId);
    setCachedReviews(motelId, filtered);
  }
}

export function addOptimisticReply(reviewId: string, reply: MotelReview): void {
  const cached = getCachedReplies(reviewId) || [];
  setCachedReplies(reviewId, [reply, ...cached]);
}

export function removeOptimisticReply(reviewId: string, replyId: string): void {
  const cached = getCachedReplies(reviewId);
  if (cached) {
    const filtered = cached.filter(r => r.id !== replyId);
    setCachedReplies(reviewId, filtered);
  }
}