<script lang="ts">
	import posthog from 'posthog-js';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
	import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
	import { tokenStore } from '$lib/store/tokenStore';

	let mobileMenuOpen = false;

	function trackLoginClick() {
		posthog.capture('loginLinkClicked', {
			location: 'header', // optional: lets you know where the click came from
			timestamp: new Date().toISOString()
		});
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function handleClickOutside(event: MouseEvent) {
		if (
				mobileMenuOpen &&
				!event.target.closest('.mobile-menu') &&
				!event.target.closest('.mobile-menu-button')
		) {
			mobileMenuOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});

	function handleUserLogout() {
		dSuserAuthStore.logout();
		goto('/');
	}

	function handleEscortLogout() {
		escortAuthStore.logout();
		goto('/');
	}

	function goPayments() {
		goto('/payments');
	}
</script>

<header class="bg-black text-white px-4 py-3 flex items-center justify-between relative shadow-lg z-30">
	<!-- Left (desktop nav) -->
	<div class="hidden md:flex items-center space-x-4 flex-1">
		{#if $dSuserAuthStore.isAuthenticated}
			<span class="font-medium opacity-80 truncate max-w-[180px]">{$dSuserAuthStore.user.username}</span>
			<span class="px-3 py-1 rounded-full text-sm bg-gray-900 font-semibold select-none">{$tokenStore.tokens} tokens</span>
			<button
					class="flex items-center gap-1 px-3 py-1 rounded-full bg-pink-700 hover:bg-pink-800 transition text-white font-semibold shadow"
					on:click={goPayments}
					title="Ver pagos / tokens"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4" />
				</svg>
				Pagos / Tokens
			</button>
			<a href="/users/catlist" class="text-sm font-medium hover:text-pink-300 transition">Catlist</a>
			<button on:click={handleUserLogout} class="text-sm font-medium hover:text-red-400 transition">Logout</button>
		{:else if $escortAuthStore.isAuthenticated}
			<span class="px-3 py-1 rounded-full text-sm bg-gray-900 font-semibold select-none">{$tokenStore.tokens} tokens</span>
			<button
					class="flex items-center gap-1 px-3 py-1 rounded-full bg-pink-700 hover:bg-pink-800 transition text-white font-semibold shadow"
					on:click={goPayments}
					title="Ver pagos / tokens"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4" />
				</svg>
				Pagos / Tokens
			</button>
			<a href="/dashboard" class="text-sm font-medium hover:text-pink-300 transition">Dashboard</a>
			<button on:click={handleEscortLogout} class="text-sm font-medium hover:text-red-400 transition">Logout</button>
		{:else}
			<a href="/users/login" 
			   on:click={trackLoginClick}
			   class="px-5 py-2 text-sm font-medium border border-black rounded-lg bg-white text-black shadow-md hover:shadow-lg hover:bg-gray-200 focus:ring-2 focus:ring-black transition">
				Login
			</a>
		{/if}
	</div>

	<!-- Centered logo, always center-aligned -->
	<div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 select-none">
		<a href="/" class="text-2xl font-extrabold hover:opacity-80 transition tracking-tight">
			Daisy’s Secrets
		</a>
	</div>

	<!-- Desktop: Publish Button (right side) -->
	<div class="hidden md:flex">
		<a href="/dashboard/login"
		   class="ml-3 px-5 py-2 text-sm font-medium border border-white rounded-lg bg-transparent text-white transition hover:bg-white hover:text-black shadow-sm focus:ring-2 focus:ring-white uppercase">
			Publica tu aviso
		</a>
	</div>

	<!-- Hamburger (mobile) -->
	<div class="md:hidden flex items-center z-20">
		<button class="mobile-menu-button flex items-center focus:outline-none" on:click={toggleMobileMenu} aria-label="Menu">
			<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
					  stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
			</svg>
		</button>
	</div>

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div class="mobile-menu absolute top-full right-2 w-64 mt-2 bg-white text-black rounded-2xl shadow-2xl py-4 z-50 border border-gray-200 flex flex-col">
			{#if $dSuserAuthStore.isAuthenticated}
				<span class="px-5 py-2 font-semibold text-pink-700 truncate">{$dSuserAuthStore.user.username}</span>
				<span class="px-5 py-1 text-sm bg-gray-100 rounded-full text-pink-700 font-semibold mb-1">
          {$tokenStore.tokens} tokens
        </span>
				<button
						class="flex items-center gap-2 px-5 py-2 text-base font-semibold bg-pink-700 text-white rounded-xl my-1 hover:bg-pink-800 transition shadow"
						on:click={() => { mobileMenuOpen = false; goPayments(); }}>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4" />
					</svg>
					Ver pagos / tokens
				</button>
				<a href="/users/catlist" class="px-5 py-2 text-base hover:bg-pink-50 transition rounded-xl">Catlist</a>
				<button on:click={() => { mobileMenuOpen = false; handleUserLogout(); }}
						class="px-5 py-2 text-base text-red-600 hover:bg-pink-100 transition rounded-xl">
					Logout
				</button>
			{:else if $escortAuthStore.isAuthenticated}
        <span class="px-5 py-1 text-sm bg-gray-100 rounded-full text-pink-700 font-semibold mb-1">
          {$tokenStore.tokens} tokens
        </span>
				<button
						class="flex items-center gap-2 px-5 py-2 text-base font-semibold bg-pink-700 text-white rounded-xl my-1 hover:bg-pink-800 transition shadow"
						on:click={() => { mobileMenuOpen = false; goPayments(); }}>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4" />
					</svg>
					Ver pagos / tokens
				</button>
				<a href="/dashboard" class="px-5 py-2 text-base hover:bg-pink-50 transition rounded-xl">Dashboard</a>
				<button on:click={() => { mobileMenuOpen = false; handleEscortLogout(); }}
						class="px-5 py-2 text-base text-red-600 hover:bg-pink-100 transition rounded-xl">
					Logout
				</button>
			{:else}
				<a href="/users/login" class="px-5 py-2 text-base font-semibold hover:bg-pink-50 transition rounded-xl">Login</a>
			{/if}
			<div class="border-t border-gray-200 my-2"></div>
			<a href="/dashboard/login"
			   class="px-5 py-2 text-base font-bold text-white bg-black hover:bg-gray-900 rounded-xl mx-4 uppercase transition text-center">
				Publica tu aviso
			</a>
		</div>
	{/if}
</header>
