<script>
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore.js';

    let showDropdown = false;
    let mobileMenuOpen = false;
    let isDesktop = false;
    let mql;
    let hideTimeout;

    function toggleDropdown() {
        showDropdown = !showDropdown;
    }

    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }

    function handleMouseEnter() {
        if (isDesktop) {
            clearTimeout(hideTimeout);
            showDropdown = true;
        }
    }

    function handleMouseLeave() {
        if (isDesktop) {
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => (showDropdown = false), 150);
        }
    }

    function handleClickOutside(event) {
        if (showDropdown && !event.target.closest('.dropdown-container')) {
            showDropdown = false;
        }
        if (
            mobileMenuOpen &&
            !event.target.closest('.mobile-menu') &&
            !event.target.closest('.mobile-menu-button')
        ) {
            mobileMenuOpen = false;
        }
    }

    onMount(() => {
        mql = window.matchMedia('(hover: hover) and (pointer: fine)');
        isDesktop = mql.matches;
        mql.addEventListener('change', e => {
            isDesktop = e.matches;
            clearTimeout(hideTimeout);
        });
        document.addEventListener('click', handleClickOutside);
    });

    onDestroy(() => {
        mql.removeEventListener('change', () => {});
        document.removeEventListener('click', handleClickOutside);
        clearTimeout(hideTimeout);
    });

    function handleLogout() {
        dSuserAuthStore.logout();
        goto('/');
    }
</script>

<header class="bg-black text-white px-6 py-4 flex items-center justify-between relative">
    <!-- Desktop Left: Login -->
    <div class="hidden md:flex">
        <a
                href="/login"
                class="px-5 py-2 text-sm font-medium border border-black rounded-lg bg-white text-black transition-shadow shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
            Login
        </a>
    </div>

    <!-- Logo (always centered) -->
    <div class="absolute left-1/2 transform -translate-x-1/2">
        <a href="/" class="text-2xl font-semibold hover:opacity-80 transition">
            Daisy’s Secrets
        </a>
    </div>

    <!-- Desktop Right: Publica tu aviso (upgraded) -->
    <div class="hidden md:flex">
        <a
                href="/dashboard/login"
                class="px-5 py-2 text-sm font-medium uppercase tracking-wide border border-white rounded-lg bg-transparent text-white transition-all shadow-sm hover:bg-white hover:text-black hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
        >
            Publica tu aviso
        </a>
    </div>

    <!-- Mobile: Hamburger -->
    <button
            class="mobile-menu-button md:hidden flex items-center focus:outline-none"
            on:click={toggleMobileMenu}
            aria-label="Menu"
    >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                    d={mobileMenuOpen
          ? 'M6 18L18 6M6 6l12 12'
          : 'M4 6h16M4 12h16M4 18h16'}
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
            />
        </svg>
    </button>

    <!-- Mobile Menu -->
    {#if mobileMenuOpen}
        <div
                class="mobile-menu absolute top-full right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg py-2 z-20"
        >
            {#if $dSuserAuthStore.isAuthenticated}
                <button
                        on:click={() => goto('/users/catlist')}
                        class="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
                >
                    Catlist
                </button>
                <button
                        on:click={handleLogout}
                        class="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
                >
                    Logout
                </button>
            {:else}
                <a
                        href="/login"
                        class="block w-full text-left px-4 py-2 text-sm font-medium border border-black rounded-md hover:bg-gray-100 transition"
                >
                    Login
                </a>
            {/if}
            <!-- Mobile CTA styled as a solid button -->
            <a
                    href="/dashboard/login"
                    class="mt-1 block w-full text-left px-4 py-2 text-sm font-medium uppercase tracking-wide border border-black rounded-md bg-black text-white transition-shadow shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
                Publica tu aviso
            </a>
        </div>
    {/if}
</header>
