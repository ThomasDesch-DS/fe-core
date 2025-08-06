<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  export let images: string[] = [];
  export let currentIndex: number = 0;
  export let isOpen: boolean = false;
  export let alt: string = '';

  const dispatch = createEventDispatcher();

  let lightboxElement: HTMLDivElement;
  let imageElement: HTMLImageElement;
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
    if (currentIndex < images.length - 1) {
      currentIndex++;
      isLoading = true;
    }
  }

  function prevImage() {
    if (currentIndex > 0) {
      currentIndex--;
      isLoading = true;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;
    
    switch (event.key) {
      case 'Escape':
        closeModal();
        break;
      case 'ArrowRight':
        nextImage();
        break;
      case 'ArrowLeft':
        prevImage();
        break;
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === lightboxElement) {
      closeModal();
    }
  }

  // Touch/swipe handlers
  function handleTouchStart(event: TouchEvent) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    isDragging = true;
  }

  function handleTouchMove(event: TouchEvent) {
    if (!isDragging) return;
    event.preventDefault(); // Prevent scrolling
  }

  function handleTouchEnd(event: TouchEvent) {
    if (!isDragging) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const deltaX = touchStartX - touchEndX;
    const deltaY = Math.abs(touchStartY - touchEndY);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        nextImage(); // Swipe left -> next image
      } else {
        prevImage(); // Swipe right -> previous image
      }
    }
    
    isDragging = false;
  }

  function handleImageLoad() {
    isLoading = false;
  }

  function preventScroll(event: Event) {
    if (isOpen) {
      event.preventDefault();
    }
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', handleKeydown);
      // Prevent scrolling when lightbox is open
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    }
  });

  // Reset loading state when image changes
  $: if (currentImage) {
    isLoading = true;
  }
</script>

{#if isOpen}
  <div 
    bind:this={lightboxElement}
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-sm"
    on:click={handleBackdropClick}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
  >
    <!-- Close button -->
    <button
      on:click={closeModal}
      class="absolute top-4 right-4 z-60 text-white hover:text-gray-300 transition-colors p-2"
      aria-label="Cerrar galería"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>

    <!-- Navigation arrows - Desktop only -->
    {#if images.length > 1}
      <button
        on:click={prevImage}
        disabled={currentIndex === 0}
        class="absolute left-4 top-1/2 -translate-y-1/2 z-60 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all p-3 hidden md:block"
        aria-label="Imagen anterior"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>

      <button
        on:click={nextImage}
        disabled={currentIndex === images.length - 1}
        class="absolute right-4 top-1/2 -translate-y-1/2 z-60 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all p-3 hidden md:block"
        aria-label="Siguiente imagen"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
        </svg>
      </button>
    {/if}

    <!-- Loading spinner -->
    {#if isLoading}
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    {/if}

    <!-- Main image -->
    <div class="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center p-4">
      <img
        bind:this={imageElement}
        src={currentImage}
        {alt}
        class="max-w-full max-h-full object-contain select-none"
        class:opacity-0={isLoading}
        class:opacity-100={!isLoading}
        on:load={handleImageLoad}
        draggable="false"
      />
    </div>

    <!-- Image counter and mobile swipe hint -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-60 text-white text-center">
      {#if images.length > 1}
        <div class="bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm mb-2">
          {currentIndex + 1} / {images.length}
        </div>
        <!-- Mobile swipe hint - show only on first image -->
        {#if currentIndex === 0}
          <div class="text-xs opacity-70 md:hidden">
            Desliza para ver más fotos
          </div>
        {/if}
      {/if}
    </div>

    <!-- Mobile navigation dots -->
    {#if images.length > 1 && images.length <= 10}
      <div class="absolute bottom-16 left-1/2 -translate-x-1/2 z-60 flex gap-2 md:hidden">
        {#each images as _, index}
          <button
            on:click={() => { currentIndex = index; isLoading = true; }}
            class="w-2 h-2 rounded-full transition-all {index === currentIndex ? 'bg-white' : 'bg-white/40'}"
            aria-label="Ir a imagen {index + 1}"
          />
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Ensure smooth transitions */
  img {
    transition: opacity 0.3s ease;
  }
  
  /* Prevent image selection and dragging */
  img {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    user-drag: none;
  }
</style>