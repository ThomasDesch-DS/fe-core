import type { MotelPreviewDto, MotelPreviewCacheEntry, MotelDetailDto } from '$lib/types/motel';

const CACHE_KEY = 'motelPreviewsCache';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCache(): MotelPreviewCacheEntry | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const entry: MotelPreviewCacheEntry = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return entry;
  } catch {
    return null;
  }
}

function setCache(motels: MotelPreviewDto[]): void {
  try {
    const entry: MotelPreviewCacheEntry = {
      motels,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore cache write errors
  }
}

export async function fetchMotelPreviews(): Promise<MotelPreviewDto[]> {
  // Try cache first
  const cached = getCache();
  if (cached) {
    return cached.motels;
  }

  // Fetch from API
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/motels/previews`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const motels: MotelPreviewDto[] = await response.json();
    
    // Cache the result
    setCache(motels);
    
    return motels;
  } catch (error) {
    console.error('Failed to fetch motel previews:', error);
    return [];
  }
}

export async function fetchMotelDetail(slug: string): Promise<MotelDetailDto> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/motels/slug/${slug}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const motel: MotelDetailDto = await response.json();
    return motel;
  } catch (error) {
    console.error(`Failed to fetch motel detail for slug ${slug}:`, error);
    throw error; // Re-throw to be handled by the calling component
  }
}
