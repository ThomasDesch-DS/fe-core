<!-- Footer.svelte -->
<script>
    // Año dinámico para no estar actualizando
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

        <!-- Botón para publicar aviso -->
        <div class="text-center">
            <a
                    href="/escorts/register"
                    class="inline-block px-4 py-2 border border-white rounded hover:bg-white hover:text-black transition"
            >
                Publicá tu aviso
            </a>
        </div>

        <!-- Copyright -->
        <div class="text-sm text-center md:text-right">
            &copy; {year} Daisy’s Secrets. Todos los derechos reservados.
        </div>
    </div>
</footer>
