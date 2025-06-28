<script>
    import IgIcon from '~icons/fa6-brands/instagram';
    import RedditIcon from '~icons/fa6-brands/reddit-alien';
    import XIcon from '~icons/fa6-brands/x-twitter'; // Formerly Twitter
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
        <nav class="flex flex-col sm:flex-row gap-4 text-sm">
            <a href="/contacto" class="hover:underline transition">
                Contacto
            </a>
            <a href="/terminos-y-condiciones" class="hover:underline transition">
                Términos y condiciones
            </a>
            <a href="/politica-privacidad" class="hover:underline transition">
                Política de privacidad
            </a>
        </nav>

        <!-- Redes sociales -->
        <div class="flex space-x-4 text-white text-2xl">
            <a href="https://instagram.com/daisys__secrets" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition">
                <IgIcon />
            </a>
            <a href="https://reddit.com/r/DaisysSecrets/" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition">
                <RedditIcon />
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" class="hover:opacity-80 transition">
                <XIcon />
            </a>
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

</style>