<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { ageStore } from '../store/ageStore';
  import { browser } from '$app/environment';

  let currentPhrase = 0;
  let audioElement: HTMLAudioElement;
  let phraseInterval: number | undefined;
  let prefersReducedMotion = false;

  const phrases = ["No contamos", "No juzgamos", "Es un secreto"];

  function cleanup() {
    if (phraseInterval) window.clearInterval(phraseInterval);
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  }

  function complete() {
    cleanup();
    ageStore.completeAnimation();
    if (browser && 'posthog' in window) {
      // @ts-ignore
      window.posthog?.capture('intro_skipped_or_completed', { reason: 'complete' });
    }
  }

  // 🔥 SKIP HANDLER — used by button + Esc
  function skipIntro() {
    cleanup();
    ageStore.completeAnimation();
    if (browser && 'posthog' in window) {
      // @ts-ignore
      window.posthog?.capture('intro_skipped_or_completed', { reason: 'skip' });
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      skipIntro();
    }
  }

  onMount(() => {
    // Respect reduced motion: skip right away
    prefersReducedMotion = browser
            ? window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
            : false;

    if (prefersReducedMotion) {
      skipIntro();
      return;
    }

    audioElement = new Audio(import.meta.env.VITE_MEDIA_CDN + "/public/audio/intro_es_ar.mp3");
    audioElement.play().catch(e => console.error("Audio play failed:", e));

    // Preload main page in background to make transition instant
    import('../../routes/+page.svelte');

    // Phrase rotator
    const STEP_MS = 1500;
    phraseInterval = window.setInterval(() => {
      if (currentPhrase < phrases.length - 1) {
        currentPhrase += 1;
      } else {
        window.clearInterval(phraseInterval);
        // brief dwell, then finish
        window.setTimeout(complete, 1200);
      }
    }, STEP_MS);

    window.addEventListener('keydown', onKeydown);
  });

  onDestroy(() => {
    cleanup();
    window.removeEventListener('keydown', onKeydown);
  });
</script>

<!-- OVERLAY -->
<div class="fixed inset-0 bg-black z-40 flex items-center justify-center">
  <div class="text-center">
    <!-- Live region so screen readers hear the changing phrase -->
    <div class="w-full h-20 flex items-center justify-center relative" aria-live="polite">
      {#key currentPhrase}
        <p
                class="absolute text-3xl sm:text-4xl md:text-5xl font-light text-white"
                in:fade={{ duration: 500 }}
                out:fade={{ duration: 500 }}
        >
          {phrases[currentPhrase]}
        </p>
      {/key}
    </div>

    <!-- Progress dots (purely decorative) -->
    <div class="mt-6 flex items-center justify-center gap-2" aria-hidden="true">
      {#each phrases as _, i}
        <span class="inline-block w-2 h-2 rounded-full"
              class:opacity-100={i === currentPhrase}
              class:opacity-40={i !== currentPhrase}
              style="background:#fff"></span>
      {/each}
    </div>

    <!-- Skip control -->
    <div class="mt-10">
      <button
              type="button"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-neutral-700 text-white hover:bg-white/10 focus:outline-none focus-visible:ring focus-visible:ring-white/40"
              on:click={skipIntro}
              aria-label="Saltar la animación de introducción"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M7 6l7 6-7 6V6zm9 0h2v12h-2V6z" fill="currentColor"/>
        </svg>
        Saltar
        <span class="text-neutral-400 text-xs">(Esc)</span>
      </button>
    </div>
  </div>

  <!-- Top-right quick action for mouse users -->
  <button
          type="button"
          class="absolute top-4 right-4 text-xs px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white hover:bg-white/20 focus:outline-none focus-visible:ring focus-visible:ring-white/40"
          on:click={skipIntro}
          aria-label="Saltar intro"
  >
    Saltar
  </button>
</div>

<style>
  /* no extra styles needed, but keeping dots crisp on low DPI */
  span { transform: translateZ(0); }
</style>
