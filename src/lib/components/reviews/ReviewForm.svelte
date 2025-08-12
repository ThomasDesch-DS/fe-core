<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
  import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
  import type { CreateMotelReviewDto } from '$lib/types/motel';

  export let motelId: string;
  export let parentId: string | null = null;
  export let isReply = false;
  export let loading = false;

  $: isAuthenticated = $dSuserAuthStore.isAuthenticated || $escortAuthStore.isAuthenticated;

  const dispatch = createEventDispatcher<{
    submit: CreateMotelReviewDto;
    cancel?: void;
  }>();

  let content = '';
  let rating: number | null = null;
  let contentError = '';
  let ratingError = '';

  function validateForm(): boolean {
    contentError = '';
    ratingError = '';
    
    if (!content.trim()) {
      contentError = 'El contenido es requerido';
      return false;
    }
    
    if (!isReply && (rating === null || rating < 1 || rating > 5)) {
      ratingError = 'La calificación debe ser entre 1 y 5 estrellas';
      return false;
    }
    
    return true;
  }

  function handleSubmit() {
    if (!validateForm()) return;
    
    const reviewData: CreateMotelReviewDto = {
      content: content.trim(),
      rating: isReply ? null : rating,
      parentId
    };
    
    dispatch('submit', reviewData);
    
    content = '';
    rating = null;
  }

  function handleCancel() {
    content = '';
    rating = null;
    contentError = '';
    ratingError = '';
    dispatch('cancel');
  }

  function handleLoginRedirect() {
    goto('/users/login');
  }
</script>

<div class="bg-neutral-900 p-4 rounded-lg shadow">
  {#if !isAuthenticated}
    <!-- Login Required Message -->
    <div class="text-center py-6">
      <div class="text-3xl mb-3">🔒</div>
      <h3 class="text-lg font-semibold text-neutral-100 mb-2">
        Inicia sesión para {isReply ? 'responder' : 'escribir una reseña'}
      </h3>
      <p class="text-neutral-400 mb-4">
        Necesitas una cuenta para compartir tu experiencia
      </p>
      <button
        on:click={handleLoginRedirect}
        class="px-6 py-2 bg-neutral-100 text-black rounded-lg hover:bg-neutral-200 transition-colors font-semibold"
      >
        Iniciar sesión
      </button>
    </div>
  {:else}
    <!-- Authenticated User Form -->
    <h3 class="text-lg font-semibold text-neutral-100 mb-4">
      {isReply ? 'Responder' : 'Escribir reseña'}
    </h3>
    
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    {#if !isReply}
      <div>
        <label class="block text-sm font-medium text-neutral-300 mb-2">
          Calificación *
        </label>
        <div class="flex gap-1 mb-2">
          {#each Array(5) as _, i}
            <button
              type="button"
              class="text-2xl {rating && rating > i ? 'text-yellow-400' : 'text-neutral-600'} hover:text-yellow-300 transition-colors"
              on:click={() => rating = i + 1}
            >
              ★
            </button>
          {/each}
        </div>
        {#if ratingError}
          <p class="text-red-400 text-sm">{ratingError}</p>
        {/if}
      </div>
    {/if}
    
    <div>
      <label for="content" class="block text-sm font-medium text-neutral-300 mb-2">
        {isReply ? 'Respuesta' : 'Comentario'} *
      </label>
      <textarea
        id="content"
        bind:value={content}
        placeholder={isReply ? 'Escribe tu respuesta...' : 'Comparte tu experiencia en este alojamiento...'}
        class="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none resize-none"
        rows="4"
        disabled={loading}
      ></textarea>
      {#if contentError}
        <p class="text-red-400 text-sm mt-1">{contentError}</p>
      {/if}
    </div>
    
    <div class="flex gap-3 justify-end">
      {#if isReply}
        <button
          type="button"
          on:click={handleCancel}
          class="px-4 py-2 text-neutral-400 hover:text-neutral-300 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
      {/if}
      <button
        type="submit"
        disabled={loading || !content.trim()}
        class="px-6 py-2 bg-neutral-100 text-black rounded-lg hover:bg-neutral-200 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Enviando...' : (isReply ? 'Responder' : 'Publicar reseña')}
      </button>
    </div>
  </form>
  {/if}
</div>