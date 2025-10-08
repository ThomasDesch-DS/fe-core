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
  import { onMount } from "svelte";
  import { trackPageOpen } from "$lib/analytics/analytics";

  const leftNav = [
    { id: 'escorts',   label: 'Escorts',     icon: 'users',    href: '/' },
    { id: 'telos',     label: 'Telos',       icon: 'building', href: '/motels' },
    { id: 'faceswap',  label: 'Face Swap',   icon: 'sparkles', href: '/faceswap' },
    { id: 'bdsm',      label: 'Test BDSM',   icon: 'kink',     href: '/bdsm-test', badge: 'Nuevo' },
    { id: 'perfil',    label: 'Mi Perfil',   icon: 'user',     href: '/users/profile' }
  ];

  const paths: Record<string, string> = {
    users: 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21c0-3.314 2.686-6 6-6s6 2.686 6 6H2Zm8 0c0-3.314 2.686-6 6-6s6 2.686 6 6H10Z',
    building: 'M4 3h16v18H4V3Zm4 3h4v4H8V6Zm0 6h4v4H8v-4Zm6-6h4v4h-4V6Zm0 6h4v4h-4v-4Z',
    sparkles: 'M5 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Zm10 2l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Zm2 8l1.5 3 3 1.5-3 1.5L17 21l-1.5-3-3-1.5 3-1.5 1.5-3Z',
    user: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM4 21a8 8 0 1 1 16 0H4Z'
  };

  if (browser) {
    beforeNavigate(() => posthog.capture('$pageleave'));
    afterNavigate(() => posthog.capture('$pageview'));
  }

  let ageStatus: string;
  let animationComplete: boolean;
  ageStore.subscribe(state => {
    ageStatus = state.status;
    animationComplete = state.isAnimationComplete;
  });

  if (browser) {
    const start = Date.now();
    onMount(() => {
      trackPageOpen();
      posthog.capture('page_view');
      window.addEventListener('beforeunload', () => {
        const duration = Date.now() - start;
        posthog.capture('page_leave', { duration_ms: duration });
      });
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

    <!-- FULL-BLEED WRAPPER -->
    <div class="flex-grow py-8">
      <div class="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-4">
        <!-- Sidebar (desktop) -->
        <aside class="hidden md:block pl-3 sm:pl-4 lg:pl-6">
          <nav class="sticky top-16 space-y-1">
            {#each leftNav as item}
              <a
                      href={item.href}
                      class="group flex items-center gap-3 px-3 h-11 rounded-md text-neutral-200 hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
                      aria-label={item.label}
              >
                <svg viewBox="0 0 24 24" class="size-5 stroke-neutral-300">
                  <path d={paths[item.icon]} stroke-width="1.5" fill="none" stroke-linecap="round"/>
                </svg>
                <span class="text-[15px]">{item.label}</span>

                {#if item.badge}
                  <span class="ml-auto text-[10px] leading-none px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-100 border border-neutral-700">
                    {item.badge}
                  </span>
                {/if}
              </a>
            {/each}
          </nav>
        </aside>

        <!-- Main -->
        <main id="main" class="min-w-0">
          <div class="container mx-auto px-4">
            <slot />
            <Toaster
                    position="top-right"
                    toastOptions={{
                duration: 4000,
                style: {
                  background: '#000', color: '#fff',
                  padding: '16px 24px', borderRadius: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,.5)',
                  fontFamily: `'Inter', sans-serif`, fontSize: '14px',
                },
                success: { iconTheme: { primary:'#fff', secondary:'#000' } },
                error: { iconTheme: { primary:'#fff', secondary:'#b00020' } },
              }}
            />
          </div>
        </main>
      </div>
    </div>

    <Footer/>
  </div>
{/if}

<style>
  .size-5{ width:1.25rem; height:1.25rem }
</style>
