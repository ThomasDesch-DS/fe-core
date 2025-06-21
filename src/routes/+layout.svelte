<script lang="ts">
  import '../app.css';
  import Header from "$lib/common/Header.svelte";
  import Footer from "$lib/common/Footer.svelte";
  import AgeGate from "$lib/components/AgeGate.svelte";
  import IntroAnimation from "$lib/components/IntroAnimation.svelte";
  import { ageStore } from "$lib/store/ageStore";
  
  let ageStatus: string;
  let animationComplete: boolean;
  
  // Subscribe to the ageStore
  ageStore.subscribe(state => {
    ageStatus = state.status;
    animationComplete = state.isAnimationComplete;
  });
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
    </main>
    
    <Footer/>
  </div>
{/if}
