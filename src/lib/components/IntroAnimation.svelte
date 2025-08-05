<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { ageStore } from '../store/ageStore';

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

    const phraseInterval = setInterval(() => {
      if (currentPhrase < phrases.length - 1) {
        currentPhrase++;
      } else {
        clearInterval(phraseInterval);
        setTimeout(() => {
          ageStore.completeAnimation();
        }, 1500);
      }
    }, 1500);

    return () => {
      clearInterval(phraseInterval);
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  });
</script>

<div class="fixed inset-0 bg-black z-40 flex items-center justify-center">
  <div class="text-center">
    <div class="w-full h-20 flex items-center justify-center relative">
      {#key currentPhrase}
        <p class="absolute text-3xl sm:text-4xl md:text-5xl font-light text-white" in:fade={{ duration: 500 }} out:fade={{ duration: 500 }}>
          {phrases[currentPhrase]}
        </p>
      {/key}
    </div>
  </div>
</div>
