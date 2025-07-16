<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
	import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
	import { tokenStore } from '$lib/store/tokenStore';

	let mobileMenuOpen = false;

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
</script>

<header class="bg-black text-white px-4 sm:px-6 py-4 flex items-center justify-between relative">
	<!-- Left Section -->
	<div class="hidden md:flex items-center space-x-4">
		{#if $dSuserAuthStore.isAuthenticated}
            {$dSuserAuthStore.user.username}
			<div class="px-3 py-1 text-sm font-medium bg-gray-800 rounded-lg">
				{$tokenStore.tokens} tokens
			</div>
			<a
				href="/users/catlist"
				class="px-4 py-2 text-sm font-medium hover:text-gray-300 transition"
			>
				Catlist
			</a>
			<button on:click={handleUserLogout} class="px-4 py-2 text-sm font-medium hover:text-gray-300 transition">
				Logout
			</button>
		{:else if $escortAuthStore.isAuthenticated}
			<div class="px-3 py-1 text-sm font-medium bg-gray-800 rounded-lg">
				{$tokenStore.tokens} tokens
			</div>
			<a
				href="/dashboard"
				class="px-4 py-2 text-sm font-medium hover:text-gray-300 transition"
			>
				Dashboard
			</a>
			<button on:click={handleEscortLogout} class="px-4 py-2 text-sm font-medium hover:text-gray-300 transition">
				Logout
			</button>
		{:else}
			<a
				href="/users/login"
				class="px-5 py-2 text-sm font-medium border border-black rounded-lg bg-white text-black transition-shadow shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
			>
				Login
			</a>
		{/if}
	</div>

	<!-- Logo (always centered) -->
	<div class="absolute left-1/2 transform -translate-x-1/2">
		<a href="/" class="text-xl sm:text-2xl font-semibold hover:opacity-80 transition">
			Daisy’s Secrets
		</a>
	</div>

	<!-- Right Section -->
	<div class="hidden md:flex">
		<a
			href="/dashboard/login"
			class="px-5 py-2 text-sm font-medium uppercase tracking-wide border border-white rounded-lg bg-transparent text-white transition-all shadow-sm hover:bg-white hover:text-black hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
		>
			Publica tu aviso
		</a>
	</div>

	<!-- Mobile: Hamburger -->
	<div class="md:hidden">
		<button
			class="mobile-menu-button flex items-center focus:outline-none"
			on:click={toggleMobileMenu}
			aria-label="Menu"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
				/>
			</svg>
		</button>
	</div>

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div
			class="mobile-menu absolute top-full right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg py-2 z-20"
		>
			{#if $dSuserAuthStore.isAuthenticated}
				<div class="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md mx-2 mb-2">
					{$tokenStore.tokens} tokens
				</div>
				<a
					href="/users/catlist"
					class="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
				>
					Catlist
				</a>
				<button
					on:click={handleUserLogout}
					class="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
				>
					Logout
				</button>
			{:else if $escortAuthStore.isAuthenticated}
				<div class="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md mx-2 mb-2">
					{$tokenStore.tokens} tokens
				</div>
				<a
					href="/dashboard"
					class="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
				>
					Dashboard
				</a>
				<button
					on:click={handleEscortLogout}
					class="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
				>
					Logout
				</button>
			{:else}
				<a
					href="/users/login"
					class="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
				>
					Login
				</a>
			{/if}
			<div class="border-t border-gray-200 my-2"></div>
			<a
				href="/dashboard/login"
				class="block w-full text-left px-4 py-2 text-sm font-medium uppercase tracking-wide text-white bg-black hover:bg-gray-800 transition rounded-md mx-2"
			>
				Publica tu aviso
			</a>
		</div>
	{/if}
</header>
