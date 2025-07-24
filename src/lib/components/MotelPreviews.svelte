<script lang="ts">
  import { onMount } from 'svelte';
  import type { MotelPreviewDto } from '$lib/types/motel';
  import { fetchMotelPreviews } from '$lib/api/motelApi';
  import { trackMotelPreviewsView } from '$lib/analytics/analytics';
  import MotelPreviewCard from './MotelPreviewCard.svelte';

  let motels: MotelPreviewDto[] = [];
  let loading = true;
  let error = false;

  onMount(async () => {
    try {
      motels = await fetchMotelPreviews();
      
      // Track motel previews view
      if (motels.length > 0) {
        trackMotelPreviewsView({
          motelCount: motels.length,
          section: 'homepage'
        });
      }
    } catch (err) {
      console.error('Failed to load motel previews:', err);
      error = true;
    } finally {
      loading = false;
    }
  });
</script>

{#if !error && (loading || motels.length > 0)}
  <section class="max-w-7xl mx-auto mb-12 px-4">
    <!-- Section Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-white text-2xl font-semibold flex items-center">
        <span class="mr-2">🏨</span>
        Telos destacados
      </h2>
      <a
        href="/motels"
        class="text-zinc-400 hover:text-white text-sm transition-colors duration-200 flex items-center space-x-2 group"
      >
        <span>Ver todos</span>
        <svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </a>
    </div>

    {#if loading}
      <!-- Loading Shimmer -->
      <div class="flex overflow-hidden">
        <div class="flex gap-6 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
          {#each Array(4) as _}
            <div class="flex-shrink-0 w-80 md:w-auto animate-pulse">
              <div class="bg-zinc-800/50 rounded-xl overflow-hidden">
                <div class="w-full h-48 bg-zinc-700/50"></div>
                <div class="p-4 space-y-3">
                  <div class="h-5 bg-zinc-700/50 rounded w-3/4"></div>
                  <div class="h-4 bg-zinc-700/30 rounded w-1/2"></div>
                  <div class="space-y-2">
                    <div class="h-3 bg-zinc-700/30 rounded"></div>
                    <div class="h-3 bg-zinc-700/30 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Motel Cards -->
      <div class="flex overflow-x-auto pb-4 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 scrollbar-hide">
        {#each motels as motel (motel.name)}
          <MotelPreviewCard {motel} />
        {/each}
      </div>
    {/if}
  </section>
{/if}

<style>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>