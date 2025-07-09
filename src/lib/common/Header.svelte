<script>
    import { escortAuthStore } from "$lib/escort/store/escortAuthStore.js";
    import { dSuserAuthStore } from "$lib/escort/store/dsUserAuthStore.js";
    import { goto } from '$app/navigation';

    let showDropdown = false;

    function toggleDropdown() {
        showDropdown = !showDropdown;
    }

    function handleClickOutside(event) {
        if (showDropdown && !event.target.closest('.dropdown-container')) {
            showDropdown = false;
        }
    }

    function handleLogout() {
        dSuserAuthStore.logout();
        goto('/');
    }
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


    {#if $dSuserAuthStore.isAuthenticated}
        <div class="flex-1 text-right relative dropdown-container">
            <button on:click={toggleDropdown} class="inline-block px-4 py-2 border border-white rounded hover:bg-white hover:text-black transition">
                Hola, {$dSuserAuthStore.user.username}!
            </button>
            {#if showDropdown}
                <div class="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg py-1 z-10">
                    <button on:click={handleLogout} class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-200">
                        Logout
                    </button>
                </div>
            {/if}
        </div>
    {:else if $escortAuthStore.isAuthenticated}
        <div class="flex-1 text-right">
            <a
                    href="/dashboard"
                    class="inline-block px-4 py-2 border border-white rounded hover:bg-white hover:text-black transition"
            >
               Hola, {$escortAuthStore.user.profile.displayName}!
            </a>
        </div>
    {:else}
        <div class="flex-1 text-right flex flex-col sm:flex-row justify-end sm:space-x-4 space-y-2 sm:space-y-0">
            <a
                    href="/users/login"
                    class="inline-block px-4 py-2 border border-white rounded hover:bg-white hover:text-black transition"
            >
                Login
            </a>
            <a
                    href="/dashboard"
                    class="inline-block px-4 py-2 border border-white rounded hover:bg-white hover:text-black transition"
            >
                Publicá tu aviso acá
            </a>
        </div>
    {/if}
</header>
