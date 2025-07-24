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
  images: string[];
  location: MotelLocation;
  coordinates: MotelCoordinates;
  description: string;
  rating: number;
}