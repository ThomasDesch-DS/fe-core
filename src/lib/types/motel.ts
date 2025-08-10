import type { MediaWithOrder } from "$lib/escort/api/profileApi";

export interface MotelLocation {
  country: string;
  state: string;
  city: string;
  hood: string | null;
  zipCode: string;
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

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

/** Raw overnight info from the backend (already matches your payload) */
export interface GeneralOvernightInfo {
  days: DayOfWeek[];
  checkInTime: string;
  checkOutTime: string;
  price: number;                 // <-- NOT surcharge. Backend sends `price`
  breakfastIncluded: boolean;
}

/** What the FE is rendering in "Tarifas por Turno" */
export interface MotelStaySlot {
  roomId?: string;               // optional: some APIs use general slots
  days: DayOfWeek[];
  durationHours: number;
  price: number;
}

/** Room detail (price is present and should be shown) */
export interface Room {
  id: string;
  name: string;
  images: MediaWithOrder[];
  description: string;
  features: string[];
  price: number;
}

/**
 * Main DTO. Includes:
 * - raw fields from backend: generalStaySlots, generalOvernightInfos
 * - normalized fields used by FE: motelStaySlots, overnightInfo
 */
export interface MotelDetailDto {
  id: string;
  name: string;
  address: string;
  images: MediaWithOrder[];
  location: MotelLocation;
  coordinates: MotelCoordinates;
  description: string;
  rating: number;
  contactMethods: string[];
  tags: string[];
  services: string[];

  // Raw API fields
  generalStaySlots: MotelStaySlot[];              // treat as same shape as FE slots
  generalOvernightInfos: GeneralOvernightInfo[];

  roomOverrides: any[];
  rooms: Room[];

  // Normalized/derived fields used by the UI (filled at runtime after fetch)
  motelStaySlots?: MotelStaySlot[];
  overnightInfo?: GeneralOvernightInfo[];
}

/** Reviews */
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
