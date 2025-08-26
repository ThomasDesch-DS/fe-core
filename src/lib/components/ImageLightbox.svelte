<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  export let images: string[] = [];
  export let currentIndex = 0;
  export let isOpen = false;
  export let alt = '';

  const dispatch = createEventDispatcher();

  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;
  let isLoading = true;

  $: currentImage = images[currentIndex];

  function closeModal() {
    isOpen = false;
    dispatch('close');
  }

  function nextImage() {
    if (!images?.length) return;
    currentIndex = (currentIndex + 1) % images.length;
    isLoading = true;
  }

  function prevImage() {
    if (!images?.length) return;
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    isLoading = true;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'ArrowRight') nextImage();
    if (event.key === 'ArrowLeft') prevImage();
  }

  function handleTouchStart(event: TouchEvent) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    isDragging = true;
  }

  function handleTouchMove(event: TouchEvent) {
    if (!isDragging) return;
    event.preventDefault();
  }

  function handleTouchEnd(event: TouchEvent) {
    if (!isDragging) return;
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const deltaX = touchStartX - touchEndX;
    const deltaY = Math.abs(touchStartY - touchEndY);
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 50) {
      deltaX > 0 ? nextImage() : prevImage();
    }
    isDragging = false;
  }

  function handleImageLoad() {
    isLoading = false;
  }

  function preventScroll(event: Event) {
    if (isOpen) event.preventDefault();
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('wheel', preventScroll);
    document.removeEventListener('touchmove', preventScroll);
  });

  $: if (currentImage) isLoading = true;
</script>

{#if isOpen}
  <div
          class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          on:click|self={closeModal}
          on:touchstart={handleTouchStart}
          on:touchmove={handleTouchMove}
          on:touchend={handleTouchEnd}
  >
    <!-- Close Button -->
    <button
            type="button"
            on:click|stopPropagation={closeModal}
            class="absolute top-4 right-4 text-white/90 hover:text-white transition-colors p-3 rounded-full bg-black/40 hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/70 min-w-[44px] min-h-[44px] z-[1010]"
            aria-label="Cerrar galería"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>

    <div
            class="relative w-full h-full max-w-[95vw] max-h-[95vh] p-2 sm:p-4 flex items-center justify-center"
            on:click|stopPropagation
    >
      <div class="relative flex items-center justify-center w-full h-full">
        {#if isLoading}
          <div class="absolute inset-0 flex items-center justify-center z-[1005]">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        {/if}

        <img
                src={currentImage}
                {alt}
                class="max-w-full max-h-[90vh] object-contain select-none transition-opacity duration-300 {isLoading ? 'opacity-0' : 'opacity-100'}"
                on:load={handleImageLoad}
                on:click|stopPropagation={() => images.length > 1 && nextImage()}
                draggable="false"
        />

        <!-- Left Paddle -->
        {#if images.length > 1}
          <button
                  type="button"
                  on:click|stopPropagation={prevImage}
                  class="hidden sm:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 z-[1010] text-white group focus:outline-none focus:ring-2 focus:ring-white/70"
                  aria-label="Anterior"
          >
            <span class="rounded-full bg-black/35 group-hover:bg-black/55 p-3 min-w-[48px] min-h-[48px] flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </span>
          </button>

          <!-- Right Paddle -->
          <button
                  type="button"
                  on:click|stopPropagation={nextImage}
                  class="hidden sm:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 z-[1010] text-white group focus:outline-none focus:ring-2 focus:ring-white/70"
                  aria-label="Siguiente"
          >
            <span class="rounded-full bg-black/35 group-hover:bg-black/55 p-3 min-w-[48px] min-h-[48px] flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </span>
          </button>
        {/if}

        <!-- Mobile Tap Zones -->
        {#if images.length > 1}
          <button
                  type="button"
                  on:click|stopPropagation={prevImage}
                  class="absolute inset-y-0 left-0 w-[15%] sm:hidden"
                  aria-label="Anterior táctil"
          />
          <button
                  type="button"
                  on:click|stopPropagation={nextImage}
                  class="absolute inset-y-0 right-0 w-[15%] sm:hidden"
                  aria-label="Siguiente táctil"
          />
        {/if}

        <!-- Counter + Hint -->
        {#if images.length > 1}
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center pointer-events-none z-[1005]">
            <div class="bg-black/50 px-3 py-1 rounded-full text-sm mb-2 inline-block">
              {currentIndex + 1} / {images.length}
            </div>
            {#if currentIndex === 0}
              <div class="text-xs opacity-70 md:hidden">Desliza o toca los lados</div>
            {/if}
          </div>
        {/if}

        <!-- Dots (mobile only ≤10) -->
        {#if images.length > 1 && images.length <= 10}
          <div class="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 sm:hidden z-[1005]">
            {#each images as _, index}
              <button
                      type="button"
                      on:click|stopPropagation={() => { currentIndex = index; isLoading = true; }}
                      class="w-3 h-3 rounded-full transition-all {index === currentIndex ? 'bg-white' : 'bg-white/40'}
                 p-2 min-w-[20px] min-h-[20px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/70"
                      aria-label="Ir a imagen {index + 1}"
              >
                <span class="w-2 h-2 rounded-full {index === currentIndex ? 'bg-white' : 'bg-white/40'}"></span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  img {
    -webkit-user-select: none;
    user-select: none;
    -webkit-user-drag: none;
    user-drag: none;
  }
</style>
