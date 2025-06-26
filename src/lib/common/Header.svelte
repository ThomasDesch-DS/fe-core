<script>
    import { authStore } from "$lib/escort/store/authStore";

</script>
<header class="bg-black text-white px-6 py-4 flex items-center">
    <!-- Spacer para centrar -->
    <div class="flex-1"></div>

    <!-- Logo / título centrado -->
    <div class="flex-1 text-center">
        <a href="/"
           class="text-2xl sm:text-3xl md:text-4xl font-semibold hover:opacity-80 transition"
        >
            Daisy's Secrets
        </a>

    </div>


    {#if $authStore.isAuthenticated}
        <div class="flex-1 text-right">
            <a
                    href="/dashboard"
                    class="inline-block px-4 py-2 border border-white rounded hover:bg-white hover:text-black transition"
            >
               Hola, {$authStore.user.profile.displayName}!
            </a>
        </div>
    {:else}
        <div class="flex-1 text-right">
            <a
                    href="/dashboard/login"
                    class="inline-block px-4 py-2 border border-white rounded hover:bg-white hover:text-black transition"
            >
                Publicá tu aviso acá
            </a>
        </div>
    {/if}
</header>
