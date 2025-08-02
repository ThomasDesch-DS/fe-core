<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { ageStore } from '../store/ageStore';

  const dispatch = createEventDispatcher();
  
  let currentStep = 0;
  let audioElement: HTMLAudioElement;
  const en_phrases = [
    "We don't tell",
    "We don't judge",
    "It's a secret"
  ];

  const phrases = [
    "No contamos,",
    "No juzgamos",
    "Es un secreto"
  ];




  onMount(() => {
    audioElement = new Audio(import.meta.env.VITE_MEDIA_CDN +"/public/audio/intro_es_ar.mp3");
    audioElement.play();
    
    // Preload the main content
    import('../../routes/+page.svelte');
    
    // Advance through the animation steps
    const timer = setInterval(() => {
      if (currentStep < phrases.length - 1) {
        currentStep++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          ageStore.completeAnimation();
        }, 1500); // Give time for the last phrase to be seen
      }
    }, 1500);
    
    return () => {
      clearInterval(timer);
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  });
</script>

<div class="fixed inset-0 bg-black z-40 flex items-center justify-center">
  <div class="text-center">
    {#if currentStep === 0}
      <p class="text-5xl font-light text-white" in:fade={{ duration: 500 }}>
        {phrases[0]}
      </p>
    {:else if currentStep === 1}
      <p class="text-5xl font-light text-white" in:fade={{ duration: 200 }}>
        {phrases[1]}
      </p>
    {:else if currentStep === 2}
      <p class="text-5xl font-light text-white" in:fade={{ duration: 400 }}>
        {phrases[2]}
      </p>
    {/if}
  </div>
</div>
