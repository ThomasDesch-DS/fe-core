<script>
    import IgIcon from '~icons/fa6-brands/instagram';
    import RedditIcon from '~icons/fa6-brands/reddit-alien';
    import XIcon from '~icons/fa6-brands/x-twitter';
    import TelegramIcon from '~icons/fa6-brands/telegram';
    import WhatsappIcon from '~icons/fa6-brands/whatsapp';
    import { trackFooterContactClick, trackFooterTelegramClick } from "$lib/analytics/analytics";
    import { onDestroy } from 'svelte';
    import SquirtButton from "$lib/components/SquirtButton.svelte"; // 👈 nuevo

    export let year = new Date().getFullYear();

    // --- UX: hover intent + touch toggle for Telegram ---
    let tgOpen = false;
    let hoverTimer;

    const openNow = () => { clearTimeout(hoverTimer); tgOpen = true; };
    const closeNow = () => { clearTimeout(hoverTimer); tgOpen = false; };

    const openWithDelay = (ms = 80) => {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => (tgOpen = true), ms);
    };
    const closeWithDelay = (ms = 120) => {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => (tgOpen = false), ms);
    };

    // Close on outside click (for touch/keyboard)
    const onDocClick = (e) => {
        const wrapper = document.getElementById('telegram-wrapper');
        if (wrapper && !wrapper.contains(e.target)) tgOpen = false;
    };
    if (typeof window !== 'undefined') {
        window.addEventListener('click', onDocClick);
    }
    onDestroy(() => window.removeEventListener('click', onDocClick));
</script>

<footer class="bg-black text-white px-6 py-8">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <!-- Logo / Nombre -->
        <div class="text-center md:text-left">
            <a href="/" class="text-xl font-semibold hover:opacity-80 transition">
                Daisy’s Secrets
            </a>
        </div>

        <!-- Links útiles -->
        <nav class="flex flex-col sm:flex-row gap-4 text-sm items-center">
            <a href="https://t.me/daisyssecrets" target="_blank" rel="noopener noreferrer"
               class="hover:underline transition"
               on:click={() => trackFooterContactClick({ target: 'telegram' })}>
                Contacto
            </a>
            <a href="/terms" class="hover:underline transition">
                Términos y condiciones
            </a>
            <a href="/privacy" class="hover:underline transition">
                Política de privacidad
            </a>

            <!-- Squirt Button con estilos heredados -->
            <SquirtButton class="flex items-center gap-2 px-3 py-1 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow transition duration-150" />
        </nav>

        <!-- Redes sociales -->
        <div class="flex items-center gap-3 text-white text-2xl">
            <a aria-label="Instagram"
               href="https://instagram.com/daisys__secrets"
               target="_blank" rel="noopener noreferrer"
               class="icon-btn">
                <IgIcon />
            </a>
            <a aria-label="Reddit"
               href="https://reddit.com/r/DaisysSecrets/"
               target="_blank" rel="noopener noreferrer"
               class="icon-btn">
                <RedditIcon />
            </a>
            <a aria-label="X (Twitter)"
               href="https://x.com"
               target="_blank" rel="noopener noreferrer"
               class="icon-btn">
                <XIcon />
            </a>
            <a aria-label="WhatsApp"
               href="https://wa.me/5491138764039"
               target="_blank" rel="noopener noreferrer"
               class="icon-btn">
                <WhatsappIcon />
            </a>

            <!-- Telegram: bigger hit area + hover intent + click toggle -->
            <div id="telegram-wrapper"
                 class="relative"
                 on:mouseenter={() => openWithDelay()}
                 on:mouseleave={() => closeWithDelay()}>
                <button
                        type="button"
                        class="icon-btn !p-2"
                        aria-haspopup="menu"
                        aria-expanded={tgOpen}
                        aria-controls="telegram-menu"
                        on:click={() => { tgOpen = !tgOpen; trackFooterTelegramClick({ option: 'main_icon' }); }}
                        on:focus={() => openNow()}>
                    <TelegramIcon aria-hidden="true" />
                </button>

                {#if tgOpen}
                    <div id="telegram-menu"
                         role="menu"
                         class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 rounded-lg border border-white/10 bg-gray-800/95 p-2 shadow-lg backdrop-blur
                                animate-in fade-in-0 zoom-in-95"
                         on:mouseenter={() => openNow()}
                         on:mouseleave={() => closeWithDelay()}>
                        <div class="absolute -bottom-2 left-0 right-0 h-3"></div>

                        <a role="menuitem"
                           href="https://t.me/daisyssecretsAR"
                           target="_blank" rel="noopener noreferrer"
                           class="menu-item"
                           on:click={() => trackFooterTelegramClick({ option: 'channel' })}>
                            Canal Principal
                        </a>
                        <a role="menuitem"
                           href="https://t.me/daisyssecrets"
                           target="_blank" rel="noopener noreferrer"
                           class="menu-item"
                           on:click={() => trackFooterTelegramClick({ option: 'contact' })}>
                            Contacto Directo
                        </a>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Copyright -->
        <div class="text-sm text-center md:text-right">
            &copy; {year} Daisy’s Secrets. Todos los derechos reservados.
        </div>
    </div>
</footer>

<style>
    /* estilos del icon-btn y menu se mantienen iguales */
    .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        border-radius: 0.5rem;
        transition: transform 0.12s ease, background-color 0.12s ease, opacity 0.12s ease, box-shadow 0.12s ease;
        outline: none;
    }
    .icon-btn:hover {
        background-color: rgba(255,255,255,0.08);
        transform: translateY(-1px) scale(1.05);
    }
    .icon-btn:active {
        transform: translateY(0) scale(0.98);
    }
    .icon-btn:focus-visible {
        box-shadow: 0 0 0 3px rgba(59,130,246,0.6);
    }

    .icon-btn > :global(svg) {
        transition: transform 0.18s ease;
    }
    .icon-btn:hover > :global(svg) {
        transform: scale(1.08);
    }

    .menu-item {
        display: block;
        width: 100%;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        color: white;
        font-size: 0.875rem;
        text-decoration: none;
        white-space: nowrap;
        transition: background-color 0.12s ease, transform 0.12s ease;
    }
    .menu-item:hover,
    .menu-item:focus-visible {
        background-color: rgba(255,255,255,0.08);
    }

    .bg-pink-600 { background-color: #ec4899; }
    .hover\:bg-pink-700:hover { background-color: #db2777; }

    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes zoom-in {
        from { transform: translate(-50%, 4px) scale(0.98); }
        to { transform: translate(-50%, 0) scale(1); }
    }
    .animate-in { animation-duration: 120ms; animation-fill-mode: both; }
    .fade-in-0 { animation-name: fade-in; }
    .zoom-in-95 { animation-name: zoom-in, fade-in; }

    a > :global(svg) {
        transition: transform 0.2s ease;
    }
    a:hover > :global(svg) {
        transform: scale(1.1);
    }
</style>
