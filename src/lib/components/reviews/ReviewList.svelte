<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
  import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
  import type { MotelReview, CreateMotelReviewDto } from '$lib/types/motel';
  import { fetchMotelReviews, fetchReviewReplies, createMotelReview } from '$lib/api/reviews';
  import { 
    getCachedReviews, 
    setCachedReviews, 
    getCachedReplies, 
    setCachedReplies,
    addOptimisticReview,
    removeOptimisticReview,
    addOptimisticReply,
    removeOptimisticReply
  } from '$lib/utils/reviewCache';
  import { trackMotelReviewsView, trackMotelReviewSubmit } from '$lib/analytics/analytics';
  import ReviewItem from './ReviewItem.svelte';
  import ReviewForm from './ReviewForm.svelte';

  export let motelId: string;
  export let motelName: string = '';

  $: currentUser = $dSuserAuthStore.isAuthenticated 
    ? { type: 'user', id: $dSuserAuthStore.user?.username || 'Usuario', displayName: $dSuserAuthStore.user?.username || 'Usuario' }
    : $escortAuthStore.isAuthenticated 
    ? { type: 'escort', id: $escortAuthStore.user?.id || 'Escort', displayName: $escortAuthStore.user?.displayName || $escortAuthStore.user?.email || 'Escort' }
    : null;

  const dispatch = createEventDispatcher<{
    error: string;
  }>();

  let reviews: MotelReview[] = [];
  let repliesMap: Record<string, MotelReview[]> = {};
  let loading = true;
  let submitting = false;
  let loadingReplies: Record<string, boolean> = {};
  let submittingReplies: Record<string, boolean> = {};
  let error = '';
  let hasTrackedView = false;

  async function loadReviews() {
    try {
      loading = true;
      error = '';
      
      // Always fetch from API to get latest reviews
      const fetchedReviews = await fetchMotelReviews(motelId);
      reviews = fetchedReviews;
      setCachedReviews(motelId, fetchedReviews);
      trackViewIfNeeded();
    } catch (err) {
      console.error('Failed to load reviews:', err);
      error = 'No se pudieron cargar las reseñas';
      dispatch('error', error);
    } finally {
      loading = false;
    }
  }

  async function loadReplies(reviewId: string) {
    try {
      loadingReplies[reviewId] = true;
      
      // Try to load from cache first
      const cached = getCachedReplies(reviewId);
      if (cached) {
        repliesMap[reviewId] = cached;
        loadingReplies[reviewId] = false;
        return;
      }
      
      // Fetch from API
      const fetchedReplies = await fetchReviewReplies(reviewId);
      repliesMap[reviewId] = fetchedReplies;
      setCachedReplies(reviewId, fetchedReplies);
    } catch (err) {
      console.error('Failed to load replies:', err);
      repliesMap[reviewId] = [];
      dispatch('error', 'No se pudieron cargar las respuestas');
    } finally {
      loadingReplies[reviewId] = false;
    }
  }

  async function submitReview(reviewData: CreateMotelReviewDto) {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticReview: MotelReview = {
      id: tempId,
      motelId,
      userId: currentUser?.id || 'user-id',
      username: currentUser?.displayName || 'Usuario',
      content: reviewData.content,
      rating: reviewData.rating,
      parentId: reviewData.parentId,
      createdAt: Date.now(),
      replies: 0
    };

    try {
      submitting = true;
      
      // Optimistic update
      if (reviewData.parentId) {
        // It's a reply
        if (!repliesMap[reviewData.parentId]) {
          repliesMap[reviewData.parentId] = [];
        }
        repliesMap[reviewData.parentId] = [optimisticReview, ...repliesMap[reviewData.parentId]];
        addOptimisticReply(reviewData.parentId, optimisticReview);
        
        // Increment reply count on parent review/reply (search in both top-level reviews and all replies)
        const updateReplyCount = (reviewList: MotelReview[]): MotelReview[] => {
          return reviewList.map(r => 
            r.id === reviewData.parentId 
              ? { ...r, replies: r.replies + 1 }
              : r
          );
        };
        
        reviews = updateReplyCount(reviews);
        setCachedReviews(motelId, reviews);
        
        // Also update reply counts in nested replies
        Object.keys(repliesMap).forEach(parentId => {
          repliesMap[parentId] = updateReplyCount(repliesMap[parentId]);
          setCachedReplies(parentId, repliesMap[parentId]);
        });
      } else {
        // It's a top-level review
        reviews = [optimisticReview, ...reviews];
        addOptimisticReview(motelId, optimisticReview);
      }
      
      // Submit to API
      const response = await createMotelReview(motelId, reviewData);
      const actualReviewId = response.reviewId;
      
      // Update the optimistic review with the real ID
      if (reviewData.parentId) {
        // Update reply with real ID
        repliesMap[reviewData.parentId] = repliesMap[reviewData.parentId].map(r => 
          r.id === tempId ? { ...r, id: actualReviewId } : r
        );
        setCachedReplies(reviewData.parentId, repliesMap[reviewData.parentId]);
      } else {
        // Update top-level review with real ID
        reviews = reviews.map(r => 
          r.id === tempId ? { ...r, id: actualReviewId } : r
        );
        setCachedReviews(motelId, reviews);
      }
      
      // Track success
      trackMotelReviewSubmit({
        motelId,
        motelName,
        reviewId: actualReviewId,
        isReply: Boolean(reviewData.parentId),
        rating: reviewData.rating,
        contentLength: reviewData.content.length,
        success: true
      });
    } catch (err) {
      console.error('Failed to submit review:', err);
      
      // Rollback optimistic update
      if (reviewData.parentId) {
        repliesMap[reviewData.parentId] = repliesMap[reviewData.parentId].filter(r => r.id !== tempId);
        removeOptimisticReply(reviewData.parentId, tempId);
        
        // Decrement reply count on parent review/reply (search in both top-level reviews and all replies)
        const decrementReplyCount = (reviewList: MotelReview[]): MotelReview[] => {
          return reviewList.map(r => 
            r.id === reviewData.parentId 
              ? { ...r, replies: Math.max(0, r.replies - 1) }
              : r
          );
        };
        
        reviews = decrementReplyCount(reviews);
        setCachedReviews(motelId, reviews);
        
        // Also decrement reply counts in nested replies
        Object.keys(repliesMap).forEach(parentId => {
          repliesMap[parentId] = decrementReplyCount(repliesMap[parentId]);
          setCachedReplies(parentId, repliesMap[parentId]);
        });
      } else {
        reviews = reviews.filter(r => r.id !== tempId);
        removeOptimisticReview(motelId, tempId);
      }
      
      // Track failure
      trackMotelReviewSubmit({
        motelId,
        motelName,
        reviewId: tempId,
        isReply: Boolean(reviewData.parentId),
        rating: reviewData.rating,
        contentLength: reviewData.content.length,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      
      dispatch('error', 'No se pudo enviar la reseña. Inténtalo de nuevo.');
    } finally {
      submitting = false;
    }
  }

  function trackViewIfNeeded() {
    if (!hasTrackedView && reviews.length > 0) {
      trackMotelReviewsView({
        motelId,
        motelName,
        reviewCount: reviews.length
      });
      hasTrackedView = true;
    }
  }

  function handleLoadReplies(event: CustomEvent<string>) {
    loadReplies(event.detail);
  }

  function handleSubmitReply(event: CustomEvent<{ reviewId: string; replyData: CreateMotelReviewDto }>) {
    const { reviewId, replyData } = event.detail;
    submittingReplies[reviewId] = true;
    submitReview(replyData).finally(() => {
      submittingReplies[reviewId] = false;
    });
  }

  function handleSubmitReview(event: CustomEvent<CreateMotelReviewDto>) {
    submitReview(event.detail);
  }

  onMount(() => {
    loadReviews();
  });
</script>

<section class="mt-12 max-w-4xl mx-auto">
  <h2 class="text-2xl font-semibold text-neutral-100 mb-6">Reseñas</h2>
  
  <!-- Review Form -->
  <div class="mb-8">
    <ReviewForm
      {motelId}
      loading={submitting}
      on:submit={handleSubmitReview}
    />
  </div>
  
  <!-- Error Message -->
  {#if error}
    <div class="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
      {error}
    </div>
  {/if}
  
  <!-- Loading State -->
  {#if loading}
    <div class="space-y-4">
      {#each Array(3) as _}
        <div class="bg-neutral-900 p-4 rounded-lg animate-pulse">
          <div class="flex justify-between mb-2">
            <div class="h-4 bg-neutral-800 rounded w-24"></div>
            <div class="h-4 bg-neutral-800 rounded w-16"></div>
          </div>
          <div class="h-4 bg-neutral-800 rounded w-full mb-2"></div>
          <div class="h-4 bg-neutral-800 rounded w-3/4"></div>
        </div>
      {/each}
    </div>
  {:else if reviews.length === 0}
    <!-- Empty State -->
    <div class="text-center py-8">
      <div class="text-4xl mb-4">💬</div>
      <h3 class="text-lg font-semibold text-neutral-100 mb-2">
        Aún no hay reseñas
      </h3>
      <p class="text-neutral-400">
        Sé el primero en compartir tu experiencia en este alojamiento.
      </p>
    </div>
  {:else}
    <!-- Reviews List -->
    <div class="space-y-6">
      {#each reviews as review (review.id)}
        <ReviewItem
          {review}
          {motelId}
          {repliesMap}
          {loadingReplies}
          {submittingReplies}
          replies={repliesMap[review.id] || []}
          showReplies={Boolean(repliesMap[review.id])}
          on:loadReplies={handleLoadReplies}
          on:submitReply={handleSubmitReply}
        />
      {/each}
    </div>
  {/if}
</section>