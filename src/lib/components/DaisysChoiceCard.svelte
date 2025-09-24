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
            encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#ff4db8"/><stop offset="1" stop-color="#6ea8ff"/></linearGradient></defs><rect width="1200" height="1600" fill="url(#g)"/></svg>');
    }
    function handleClick(_: MouseEvent) { dispatch('click', { slug: escort.slug }); }
</script>

<div class={`relative z-0 w-full overflow-visible ${rootClass}`}>
    <!-- softer outer halo -->
    <div
            aria-hidden="true"
            class="pointer-events-none absolute -inset-12 md:-inset-16 lg:-inset-20 z-0 rounded-[34px]
           blur-[60px] md:blur-[72px] opacity-60"
            style="
      background:
        conic-gradient(from 0deg,
          #7dd3fc, #a78bfa, #f472b6, #fbbf24, #7dd3fc);
    "
    ></div>

    <a
            href={`/escort/${encodeURIComponent(escort.slug)}`}
            class="group relative z-10 block w-full overflow-hidden rounded-2xl
           bg-black/70 backdrop-blur-sm transition-transform duration-300 ease-out
           hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label={`Ver perfil de ${escort.displayName}`}
            on:click|stopPropagation={handleClick}
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e as any)}
            tabindex="0"
    >
        <!-- gradient ring (subtle) -->
        <div class="absolute inset-0 rounded-2xl p-[2px]">
            <div class="absolute inset-0 rounded-2xl"
                 style="background:
             radial-gradient(120% 120% at 0% 0%,    #7dd3fc33, transparent 60%),
             radial-gradient(120% 120% at 100% 0%,  #a78bfa33, transparent 60%),
             radial-gradient(120% 120% at 0% 100%,  #f472b633, transparent 60%),
             radial-gradient(120% 120% at 100% 100%,#fbbf2433, transparent 60%);
             filter: blur(12px);">
            </div>
            <div class="absolute inset-0 rounded-2xl ring-1 ring-white/10"></div>
            <div class="relative h-full w-full rounded-[14px] bg-black/70"></div>
        </div>

        <!-- badge top-left (avoid faces) -->
        <div class="absolute top-4 left-4 z-[3]">
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold
                   text-black ring-1 ring-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.25)]
                   bg-gradient-to-r from-pink-300 via-violet-300 to-sky-300">
        ✨ DAISY’S CHOICE
      </span>
        </div>

        <div class="relative overflow-hidden rounded-2xl">
            <!-- subtle inner edge glow -->
            <div class="absolute -inset-2 rounded-2xl opacity-45 blur-lg"
                 style="background: linear-gradient(45deg,#ff7ab3,#8ab4ff,#ffd36e);"></div>

            <img
                    src={imgSrc}
                    alt={`Foto de ${escort.displayName}`}
                    class="relative z-[1] w-full h-[28rem] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] will-change-transform"
                    loading="lazy" decoding="async" on:error={onImgError}
                    sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            />

            <!-- bottom scrim for captions -->
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
                  bg-black/55 backdrop-blur-md ring-1 ring-white/10 shadow text-center">
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
