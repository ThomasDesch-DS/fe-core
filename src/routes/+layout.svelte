<script lang="ts">
  import '../app.css';
  import Header from "$lib/common/Header.svelte";
  import Footer from "$lib/common/Footer.svelte";
  import AgeGate from "$lib/components/AgeGate.svelte";
  import IntroAnimation from "$lib/components/IntroAnimation.svelte";
  import { ageStore } from "$lib/store/ageStore";
  import { Toaster } from 'svelte-sonner';
  import { browser } from '$app/environment';
  import { beforeNavigate, afterNavigate } from '$app/navigation';
  import posthog from 'posthog-js';
  import {onMount} from "svelte";
  import {trackPageOpen} from "$lib/analytics/analytics";

  if (browser) {
    beforeNavigate(() => posthog.capture('$pageleave'));
    afterNavigate(() => posthog.capture('$pageview'));
  }

  let ageStatus: string;
  let animationComplete: boolean;
  // Subscribe to the ageStore
  ageStore.subscribe(state => {
    ageStatus = state.status;
    animationComplete = state.isAnimationComplete;
  });

  if (browser) {
    onMount(() => {
      trackPageOpen();
    });
  }
</script>

{#if ageStatus === 'pending'}
  <AgeGate />
{:else if ageStatus === 'approved' && !animationComplete}
  <IntroAnimation />
{:else if ageStatus === 'approved' && animationComplete}
  <div class="min-h-screen bg-black text-white flex flex-col">
    <Header/>

    <main class="flex-grow container mx-auto px-4 py-8">
      <slot />
      <Toaster
              position="top-right"
              toastOptions={{
    // duración y estilo base
    duration: 4000,
    style: {
      background: '#000',             // negro total
      color: '#fff',                  // texto blanco
      padding: '16px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
      fontFamily: `'Inter', sans-serif`,
      fontSize: '14px',
    },
    // ícono de éxito: blanco sobre negro
    success: {
      iconTheme: {
        primary: '#fff',
        secondary: '#000',
      },
    },
    // ícono de error: blanco sobre rojo oscuro
    error: {
      iconTheme: {
        primary: '#fff',
        secondary: '#b00020',
      },
    },
  }}
      />
    </main>

    <Footer/>
  </div>
{/if}