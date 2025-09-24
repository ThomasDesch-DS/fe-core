<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { getMediaUrl } from '../../util/MediaUtils';

    export let escort: {
        id: string; slug: string; displayName: string;
        age?: number; location?: string; media: string; onlyVirtual?: boolean;
    };
    export let rootClass = '';

    const dispatch = createEventDispatcher();
    let imgSrc = '';
    $: imgSrc = getMediaUrl(escort.id, escort.media, 'profile');

    function onImgError() {
        imgSrc = 'data:image/svg+xml;utf8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#ff9bd3"/><stop offset="1" stop-color="#9cc6ff"/></linearGradient></defs><rect width="1200" height="1600" fill="url(#g)"/></svg>'
        );
    }
    const click = (e: MouseEvent) => dispatch('click', { slug: escort.slug });
</script>

<div class={`relative z-0 w-full overflow-visible ${rootClass}`}>
    <!-- aura más discreta -->
    <div aria-hidden="true"
         class="pointer-events-none absolute -inset-9 md:-inset-12 z-0 rounded-[30px] blur-[44px] opacity-30"
         style="background:
         radial-gradient(85% 75% at 12% 8%,   #ff80b555 0%, transparent 60%),
         radial-gradient(90% 80% at 88% 12%,  #a78bfa55 0%, transparent 60%),
         radial-gradient(90% 80% at 12% 92%,  #60a5fa55 0%, transparent 60%),
         radial-gradient(85% 75% at 90% 90%,  #fbbf2455 0%, transparent 60%);">
    </div>

    <a href={`/escort/${encodeURIComponent(escort.slug)}`}
       class="group relative z-10 block w-full overflow-hidden rounded-2xl
            bg-black/70 backdrop-blur-sm transition-transform duration-300 ease-out
            hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
       aria-label={`Ver perfil de ${escort.displayName}`}
       on:click|stopPropagation={click}
       on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && click(e as any)}
       tabindex="0">

        <!-- ring pastel, más suave -->
        <div class="absolute inset-0 rounded-2xl p-[2px]">
            <div class="absolute inset-0 rounded-2xl"
                 style="background:
             radial-gradient(120% 120% at 0% 0%,    #60a5fa3a, transparent 60%),
             radial-gradient(120% 120% at 100% 0%,  #a78bfa3a, transparent 60%),
             radial-gradient(120% 120% at 0% 100%,  #f472b63a, transparent 60%),
             radial-gradient(120% 120% at 100% 100%,#fbbf243a, transparent 60%);
             filter: blur(12px);">
            </div>
            <div class="absolute inset-0 rounded-2xl ring-1 ring-white/12"></div>
            <div class="relative h-full w-full rounded-[14px] bg-black/70"></div>
        </div>

        <!-- badge top-left, más neutra -->
        <div class="absolute top-4 left-4 z-[3]">
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold
                   text-black bg-white/85 ring-1 ring-black/5 backdrop-blur-sm">
        🍬 Dulce
      </span>
        </div>

        <div class="relative overflow-hidden rounded-2xl">
            <!-- glow interno suavizado -->
            <div class="absolute -inset-2 rounded-2xl opacity-45 blur-[10px]"
                 style="background: linear-gradient(45deg,#ff9bd3,#b0c4ff,#ffd88a);"></div>

            <img
                    src={imgSrc}
                    alt={`Foto de ${escort.displayName}`}
                    class="relative z-[1] w-full h-[28rem] object-cover transition-transform duration-400 ease-out group-hover:scale-[1.01]"
                    loading="lazy" decoding="async" on:error={onImgError}
                    sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            />

            <!-- scrim para texto -->
            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-40
                  bg-gradient-to-t from-black/88 via-black/60 to-transparent z-[2]"></div>

            {#if escort.onlyVirtual}
        <span class="absolute top-3 left-1/2 -translate-x-1/2 z-[3] inline-block px-2 py-1 text-xs font-semibold bg-white text-black rounded shadow">
          Solo virtual
        </span>
            {/if}
        </div>

        <!-- caption pill -->
        <div class="relative -mt-16 z-[4] px-4 pb-5">
            <div class="mx-auto w-fit rounded-full px-4 py-2
                  bg-black/50 backdrop-blur-md ring-1 ring-white/10 shadow text-center">
                <h2 class="text-white text-[1.05rem] font-semibold leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
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
