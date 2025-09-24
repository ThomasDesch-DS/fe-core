<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { getMediaUrl } from '../../util/MediaUtils';

    export let escort: {
        id: string;
        slug: string;
        displayName: string;
        age?: number;
        location?: string;
        media: string;   // key/filename
        onlyVirtual?: boolean;
    };
    export let rootClass: string = '';

    const dispatch = createEventDispatcher();

    let imgSrc = '';
    $: imgSrc = getMediaUrl(escort.id, escort.media, 'profile');

    function onImgError() {
        imgSrc =
            'data:image/svg+xml;utf8,' +
            encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600"><rect width="1200" height="1600" fill="#0a0a0a"/></svg>');
    }
    function handleClick(_: MouseEvent) { dispatch('click', { slug: escort.slug }); }
</script>

<div class={`relative z-0 w-full overflow-visible ${rootClass}`}>
    <!-- super subtle aura -->
    <div
            aria-hidden="true"
            class="pointer-events-none absolute -inset-8 md:-inset-10 z-0 rounded-[28px]
           blur-[36px] opacity-25"
            style="
      background:
        radial-gradient(70% 60% at 15% 10%, #22d3ee33 0%, transparent 60%),
        radial-gradient(70% 60% at 85% 15%, #a78bfa33 0%, transparent 60%),
        radial-gradient(70% 60% at 20% 90%, #34d39933 0%, transparent 60%);
    "
    ></div>

    <a
            href={`/escort/${encodeURIComponent(escort.slug)}`}
            class="group relative z-10 block w-full overflow-hidden rounded-2xl
           bg-zinc-950/70 backdrop-blur-sm transition-transform duration-300 ease-out
           hover:scale-[1.005] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            aria-label={`Ver perfil de ${escort.displayName}`}
            on:click|stopPropagation={handleClick}
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e as any)}
            tabindex="0"
    >
        <!-- thin ring -->
        <div class="absolute inset-0 rounded-2xl p-[1px]">
            <div class="absolute inset-0 rounded-2xl bg-black/70"></div>
            <div class="absolute inset-0 rounded-2xl ring-1 ring-white/10"></div>
        </div>

        <!-- badge top-left -->
        <div class="absolute top-4 left-4 z-[3]">
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold
                   text-white/95 bg-zinc-900/70 ring-1 ring-white/15 backdrop-blur-sm">
        💸 CHEAP
      </span>
        </div>

        <div class="relative overflow-hidden rounded-2xl">
            <!-- soft vignette -->
            <div class="absolute inset-0 rounded-2xl pointer-events-none"
                 style="box-shadow: inset 0 0 100px rgba(0,0,0,0.35);"></div>

            <img
                    src={imgSrc}
                    alt={`Foto de ${escort.displayName}`}
                    class="relative z-[1] w-full h-[28rem] object-cover transition-transform duration-400 ease-out group-hover:scale-[1.005]"
                    loading="lazy" decoding="async" on:error={onImgError}
                    sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            />

            <!-- bottom scrim -->
            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-36
                  bg-gradient-to-t from-black/86 via-black/55 to-transparent z-[2]"></div>

            {#if escort.onlyVirtual}
        <span class="absolute top-3 left-1/2 -translate-x-1/2 z-[3] inline-block px-2 py-1 text-xs font-semibold bg-white text-black rounded shadow">
          Solo virtual
        </span>
            {/if}
        </div>

        <!-- caption -->
        <div class="relative -mt-14 z-[4] px-4 pb-5">
            <div class="mx-auto w-fit rounded-full px-4 py-2
                  bg-black/45 backdrop-blur-md ring-1 ring-white/10 shadow text-center">
                <h2 class="text-white text-[1.02rem] font-semibold leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                    {escort.displayName}{escort.age ? `, ${escort.age}` : ''}
                </h2>
                {#if escort.location}
                    <p class="mt-0.5 text-[0.85rem] text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,1)]">
                        {escort.location}
                    </p>
                {/if}
            </div>

            <div class="mt-3 flex items-center justify-center gap-3">
        <span class="px-3 py-1.5 text-sm rounded-full bg-white text-black font-medium shadow hover:opacity-90 transition-opacity">
          Ver perfil
        </span>
                <span class="px-3 py-1.5 text-sm rounded-full bg-zinc-900/70 text-white/95 font-medium border border-white/10 backdrop-blur-sm shadow">
          ⭐ Recomendado
        </span>
            </div>
        </div>
    </a>
</div>
    