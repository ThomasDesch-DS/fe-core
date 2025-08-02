<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { ageStore } from '../store/ageStore';

  let showLogo = true;
  let showPhrases = false;
  let currentPhrase = 0;
  let audioElement: HTMLAudioElement;

  const phrases = [
    "No contamos,",
    "No juzgamos",
    "Es un secreto"
  ];

  onMount(() => {
    audioElement = new Audio(import.meta.env.VITE_MEDIA_CDN + "/public/audio/intro_es_ar.mp3");
    audioElement.play().catch(e => console.error("Audio play failed:", e));

    import('../../routes/+page.svelte');

    let phraseInterval: ReturnType<typeof setInterval>;

    const logoTimeout = setTimeout(() => {
      showLogo = false;
      setTimeout(() => {
        showPhrases = true;
        phraseInterval = setInterval(() => {
          if (currentPhrase < phrases.length - 1) {
            currentPhrase++;
          } else {
            clearInterval(phraseInterval);
            setTimeout(() => {
              ageStore.completeAnimation();
            }, 1500);
          }
        }, 1500);
      }, 500); // Delay before showing phrases
    }, 2000);

    return () => {
      clearTimeout(logoTimeout);
      if (phraseInterval) {
        clearInterval(phraseInterval);
      }
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  });
</script>

<div class="fixed inset-0 bg-black z-40 flex items-center justify-center">
  <div class="text-center">
    {#if showLogo}
      <div in:fade={{ duration: 500 }} out:fade={{ duration: 500 }}>
        <img src="/logo.png" alt="Logo" class="h-24 w-24 animate-pulse" />
      </div>
    {/if}

    {#if showPhrases}
      <div class="w-full h-20 flex items-center justify-center">
        {#key currentPhrase}
          <p class="text-5xl font-light text-white" in:fade={{ duration: 500 }} out:fade={{ duration: 500 }}>
            {phrases[currentPhrase]}
          </p>
        {/key}
      </div>
    {/if}
  </div>
</div>
