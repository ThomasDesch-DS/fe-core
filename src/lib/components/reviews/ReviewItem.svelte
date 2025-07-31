<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
  import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
  import type { MotelReview } from '$lib/types/motel';
  import ReviewForm from './ReviewForm.svelte';

  export let review: MotelReview;
  export let motelId: string;
  export let replies: MotelReview[] = [];
  export let showReplies = false;
  export let repliesMap: Record<string, MotelReview[]> = {};
  export let loadingReplies: Record<string, boolean> = {};
  export let submittingReplies: Record<string, boolean> = {};
  export let canReply = true;

  $: isAuthenticated = $dSuserAuthStore.isAuthenticated || $escortAuthStore.isAuthenticated;

  const dispatch = createEventDispatcher<{
    loadReplies: string;
    submitReply: { reviewId: string; replyData: any };
  }>();

  let showReplyForm = false;

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 30) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      });
    }
  }


  function handleToggleReplies() {
    if (!showReplies && replies.length === 0 && !loadingReplies[review.id] && review.replies > 0) {
      dispatch('loadReplies', review.id);
    }
    showReplies = !showReplies;
  }

  function handleReplySubmit(event: CustomEvent) {
    dispatch('submitReply', {
      reviewId: review.id,
      replyData: event.detail
    });
    showReplyForm = false;
  }

  function handleReplyCancel() {
    showReplyForm = false;
  }
</script>

<div class="bg-neutral-900 p-4 rounded-lg shadow">
  <div class="flex justify-between items-start mb-2">
    <div class="flex items-center gap-2">
      <span class="text-neutral-100 font-medium">{review.username}</span>
      {#if review.rating !== null}
        <div class="flex text-yellow-400 text-sm">
          {#each Array(5) as _, i}
            <span class={review.rating > i ? 'text-yellow-400' : 'text-neutral-600'}>★</span>
          {/each}
        </div>
      {/if}
    </div>
    <span class="text-neutral-500 text-sm">{formatDate(review.createdAt)}</span>
  </div>
  
  <p class="text-neutral-300 text-sm mb-3">{review.content}</p>
  
  <div class="flex items-center gap-4 text-sm">
    {#if canReply && review.replies > 0}
      <button
        on:click={handleToggleReplies}
        class="text-neutral-400 hover:text-neutral-300 transition-colors flex items-center gap-1"
        disabled={loadingReplies[review.id]}
      >
        {#if loadingReplies[review.id]}
          <span class="inline-block w-3 h-3 border border-neutral-400 border-t-transparent rounded-full animate-spin"></span>
          Cargando...
        {:else}
          {showReplies ? '▼' : '▶'} 
          Respuestas ({review.replies})
        {/if}
      </button>
    {/if}
    
    {#if isAuthenticated && canReply}
      <button
        on:click={() => showReplyForm = !showReplyForm}
        class="text-neutral-400 hover:text-neutral-300 transition-colors"
      >
        Responder
      </button>
    {/if}
  </div>
  
  <!-- Reply Form -->
  {#if showReplyForm}
    <div class="mt-4 pl-4 border-l-2 border-neutral-700">
      <ReviewForm
        {motelId}
        parentId={review.id}
        isReply={true}
        loading={submittingReplies[review.id] || false}
        on:submit={handleReplySubmit}
        on:cancel={handleReplyCancel}
      />
    </div>
  {/if}
  
  <!-- Replies -->
  {#if showReplies && replies.length > 0}
    <div class="mt-4 pl-4 border-l-2 border-neutral-700 space-y-3">
      {#each replies as reply}
        <svelte:self
          review={reply}
          {motelId}
          {repliesMap}
          {loadingReplies}
          {submittingReplies}
          replies={repliesMap[reply.id] || []}
          showReplies={Boolean(repliesMap[reply.id])}
          canReply={true}
          on:loadReplies
          on:submitReply
        />
      {/each}
    </div>
  {/if}
</div>