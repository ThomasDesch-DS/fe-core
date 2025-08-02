import type {MediaWithOrder} from "$lib/escort/api/profileApi";

export interface MotelLocation {
  country: string;
  state: string;
  city: string;
  hood: string | null;
}

export interface MotelPreviewDto {
  name: string;
  imageUrl: string;
  location: MotelLocation;
  description: string;
}

export interface MotelPreviewCacheEntry {
  motels: MotelPreviewDto[];
  timestamp: number;
}

export interface MotelCoordinates {
  latitude: number;
  longitude: number;
}

export interface MotelDetailDto {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  images: MediaWithOrder[];
  location: MotelLocation;
  coordinates: MotelCoordinates;
  description: string;
  rating: number;
}

export interface MotelReview {
  id: string;
  motelId: string;
  userId: string;
  content: string;
  username: string;
  rating: number | null;
  parentId: string | null;
  createdAt: number;
  replies: number;
}

export interface CreateMotelReviewDto {
  content: string;
  rating: number | null;
  parentId: string | null;
}

export interface MotelReviewCacheEntry {
  reviews: MotelReview[];
  timestamp: number;
}

export interface MotelReviewRepliesCacheEntry {
  replies: MotelReview[];
  timestamp: number;
}