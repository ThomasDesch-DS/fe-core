<script lang="ts">
  import DaisysChoiceCard, { type Escort as EscortType } from './DaisysChoiceCard.svelte';
  import SecretChoiceCard from './SecretChoiceCard.svelte';
  import SugarChoiceCard from './SugarChoiceCard.svelte';
  import CheapChoiceCard from './CheapChoiceCard.svelte';
  import { getMediaUrl } from '../../util/MediaUtils';

  // ✅ Enum alternative: const object + string union
  export const TIER = {
    FREE: 'FREE',
    CHEAP: 'CHEAP',
    SUGAR: 'SUGAR',
    SECRET: 'SECRET',
    DAISYS_CHOICE: 'DAISYS_CHOICE',
  } as const;
  export type Tier = typeof TIER[keyof typeof TIER];

  // Extend Escort to use the union type
  interface Escort extends EscortType {
    onlyVirtual?: boolean;
    tierId?: Tier;
  }

  export let escorts: ReadonlyArray<Escort> = [];
  export let prefetchDetail: (slug: string) => void;
  export let trackEscortSearchResultClick: (d: { query: string; clickedResult: string }) => void;
  export let searchQuery = '';

  function visible(node: HTMLElement, slug: string) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        prefetchDetail(slug);
        io.disconnect();
      }
    }, { rootMargin: '200px' });
    io.observe(node);
    return { destroy: () => io.disconnect() };
  }

  const getTier = (e: Escort): Tier => e.tierId ?? TIER.FREE;
</script>

<div class="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch justify-items-stretch">
  {#each escorts as escort (escort.id)}
    <div class="w-full h-full" use:visible={escort.slug} on:mouseenter={() => prefetchDetail(escort.slug)}>
      {#if getTier(escort) === TIER.DAISYS_CHOICE}
        <DaisysChoiceCard
                {escort}
                rootClass="h-full"
                on:click={() => trackEscortSearchResultClick({ query: searchQuery.trim(), clickedResult: escort.slug })}
        />
      {:else if getTier(escort) === TIER.SECRET}
        <SecretChoiceCard
                {escort}
                rootClass="h-full"
                on:click={() => trackEscortSearchResultClick({ query: searchQuery.trim(), clickedResult: escort.slug })}
        />
      {:else if getTier(escort) === TIER.SUGAR}
        <SugarChoiceCard
                {escort}
                rootClass="h-full"
                on:click={() => trackEscortSearchResultClick({ query: searchQuery.trim(), clickedResult: escort.slug })}
        />
      {:else if getTier(escort) === TIER.CHEAP}
        <CheapChoiceCard
                {escort}
                rootClass="h-full"
                on:click={() => trackEscortSearchResultClick({ query: searchQuery.trim(), clickedResult: escort.slug })}
        />
      {:else}
        <!-- FREE card -->
        <a
                href={`/escort/${encodeURIComponent(escort.slug)}`}
                on:click={() => trackEscortSearchResultClick({ query: searchQuery.trim(), clickedResult: escort.slug })}
                class="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-lg flex flex-col hover:opacity-90 transition-opacity"
                aria-label={`Ver perfil de ${escort.displayName}`}
        >
          {#if escort.onlyVirtual}
            <span class="absolute top-3 left-1/2 -translate-x-1/2 inline-block px-2 py-1 text-xs font-semibold bg-white text-black rounded">
              Solo virtual
            </span>
          {/if}

          <div class="relative">
            <img
                    src={getMediaUrl(escort.id, escort.media, 'profile')}
                    alt={`Foto de ${escort.displayName}`}
                    class="w-full h-[28rem] object-cover transition-transform duration-300 ease-in-out hover:scale-105 active:scale-105"
                    loading="lazy"
                    decoding="async"
            />
            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/60 to-transparent"></div>
          </div>

          <div class="relative z-[1] -mt-16 p-6 text-white text-center">
            <h2 class="text-xl font-semibold drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
              {escort.displayName}{escort.age ? `, ${escort.age}` : ''}
            </h2>
            <p class="text-sm text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,1)]">
              {escort.location}
            </p>
          </div>
        </a>
      {/if}
    </div>
  {/each}
</div>
