<script>
    import IgIcon from '~icons/fa6-brands/instagram';
    import RedditIcon from '~icons/fa6-brands/reddit-alien';
    import XIcon from '~icons/fa6-brands/x-twitter'; // Formerly Twitter
    import TelegramIcon from '~icons/fa6-brands/telegram';
    import FlaskIcon from '~icons/fa6-solid/flask'; // Usa un ícono de "laboratorio" si lo tenés (puede cambiar por otro si preferís)
    import { trackFooterContactClick, trackFooterTelegramClick } from "$lib/analytics/analytics";
    export let year = new Date().getFullYear();
</script>

<footer class="bg-black text-white px-6 py-8">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
        <!-- Logo / Nombre -->
        <div class="text-center md:text-left">
            <a href="/" class="text-xl font-semibold hover:opacity-80 transition">
                Daisy’s Secrets
            </a>
        </div>

        <!-- Links útiles -->
        <nav class="flex flex-col sm:flex-row gap-4 text-sm items-center">
            <a href="https://t.me/daisyssecrets" target="_blank" rel="noopener noreferrer" class="hover:underline transition" on:click={() => trackFooterContactClick({ target: 'telegram' })}>
                Contacto
            </a>
            <a href="/terms" class="hover:underline transition">
                Términos y condiciones
            </a>
            <a href="/privacy" class="hover:underline transition">
                Política de privacidad
            </a>
            <!-- Laboratorio de Fantasías -->
            <a href="/faceswap" class="flex items-center gap-2 px-3 py-1 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow transition duration-150">
                <FlaskIcon class="text-lg" />
                Laboratorio de Fantasías
            </a>
        </nav>

        <!-- Redes sociales -->
        <div class="flex space-x-4 text-white text-2xl items-center">
            <a href="https://instagram.com/daisys__secrets" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition">
                <IgIcon />
            </a>
            <a href="https://reddit.com/r/DaisysSecrets/" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition">
                <RedditIcon />
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition">
                <XIcon />
            </a>
            <div class="relative group">
                <span class="cursor-pointer hover:opacity-80 transition" on:click={() => trackFooterTelegramClick({ option: 'main_icon' })}><TelegramIcon /></span>
                <div class="absolute bottom-full mb-2 w-48 hidden group-hover:flex flex-col items-center bg-gray-800 rounded-lg p-2" style="left: 50%; transform: translateX(-50%);">
                     <a href="https://t.me/daisyssecretsAR" target="_blank" rel="noopener noreferrer" class="text-sm text-white hover:underline whitespace-nowrap" on:click={() => trackFooterTelegramClick({ option: 'channel' })}>Canal Principal</a>
                     <a href="https://t.me/daisyssecrets" target="_blank" rel="noopener noreferrer" class="text-sm text-white hover:underline mt-1 whitespace-nowrap" on:click={() => trackFooterTelegramClick({ option: 'contact' })}>Contacto Directo</a>
                </div>
            </div>
        </div>

        <!-- Copyright -->
        <div class="text-sm text-center md:text-right">
            &copy; {year} Daisy’s Secrets. Todos los derechos reservados.
        </div>
    </div>
</footer>

<style>
    a > :global(svg) {
        transition: transform 0.2s ease;
    }
    a:hover > :global(svg) {
        transform: scale(1.1);
    }

    /* Extra styling for the fantasy lab btn */
    .bg-pink-600 {
        background-color: #ec4899; /* Tailwind's pink-600 */
    }
    .hover\:bg-pink-700:hover {
        background-color: #db2777; /* Tailwind's pink-700 */
    }

    .group:hover .group-hover\:flex {
        display: flex;
    }
</style>
