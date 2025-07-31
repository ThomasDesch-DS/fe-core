import type { MotelReview, CreateMotelReviewDto } from '$lib/types/motel';

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchMotelReviews(motelId: string): Promise<MotelReview[]> {
  const response = await fetch(`${API_URL}/motels/${motelId}/reviews`);
  if (!response.ok) {
    throw new Error(`Failed to fetch reviews: ${response.status}`);
  }
  return response.json();
}

export async function fetchReviewReplies(reviewId: string): Promise<MotelReview[]> {
  const response = await fetch(`${API_URL}/motels/review/${reviewId}/replies`);
  if (!response.ok) {
    throw new Error(`Failed to fetch replies: ${response.status}`);
  }
  return response.json();
}

export async function createMotelReview(motelId: string, reviewData: CreateMotelReviewDto): Promise<{ reviewId: string }> {
  const response = await fetch(`${API_URL}/motels/${motelId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(reviewData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create review: ${response.status}`);
  }
  
  return response.json();
}