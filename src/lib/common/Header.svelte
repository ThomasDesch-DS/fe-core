<script lang="ts">
	import posthog from 'posthog-js';
	import { onMount, onDestroy } from 'svelte';
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

	onMount(() => document.addEventListener('click', handleClickOutside));
	onDestroy(() => document.removeEventListener('click', handleClickOutside));

	function goRegister() {
		goto('/dashboard/register');
	}
	function goLogin() {
		posthog.capture('loginLinkClicked', { location: 'header', timestamp: new Date().toISOString() });
		goto('/users/login');
	}
	function goDashboard() {
		goto('/dashboard');
	}
	function goPayments() {
		goto('/payments');
	}
	function handleUserLogout() {
		dSuserAuthStore.logout();
		goto('/');
	}
	function handleEscortLogout() {
		escortAuthStore.logout();
		goto('/');
	}
</script>

<header class="bg-black text-white shadow-lg z-30">
	<div class="relative flex items-center justify-between px-4 py-3 md:px-8">
		<!-- Desktop Nav / CTA -->
		<nav class="hidden md:flex items-center space-x-4">
			{#if $escortAuthStore.isAuthenticated}
				<button
						class="px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-700 transition font-semibold"
						on:click={goDashboard}
				>
					Mi Dashboard
				</button>
				<button
						class="px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-700 transition font-semibold"
						on:click={goPayments}
				>
					Tokens: {$tokenStore.tokens}
				</button>
				<button
						class="text-sm hover:text-red-400 transition"
						on:click={handleEscortLogout}
				>
					Logout
				</button>
			{:else if $dSuserAuthStore.isAuthenticated}
				<button
						class="px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-700 transition font-semibold"
						on:click={goPayments}
				>
					Tokens: {$tokenStore.tokens}
				</button>
				<button
						class="text-sm hover:text-red-400 transition"
						on:click={handleUserLogout}
				>
					Logout
				</button>
			{:else}
				<button
						class="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 transition font-semibold"
						on:click={goRegister}
				>
					Regístrate como Escort
				</button>
				<button
						class="px-4 py-2 rounded-full border border-white hover:bg-white hover:text-black transition font-semibold"
						on:click={goLogin}
				>
					Login
				</button>
			{/if}
		</nav>

		<!-- Logo centrado -->
		<a
				href="/"
				class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-extrabold hover:opacity-80 transition select-none"
		>
			Daisy’s Secrets
		</a>

		<!-- Mobile toggle -->
		<button
				class="md:hidden mobile-menu-button focus:outline-none"
				on:click={toggleMobileMenu}
				aria-label="Menu"
		>
			<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
		<div class="mobile-menu bg-black text-white flex flex-col space-y-2 px-4 py-4 border-t border-gray-800">
			{#if !$escortAuthStore.isAuthenticated && !$dSuserAuthStore.isAuthenticated}
				<button
						class="w-full text-left px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 transition font-semibold"
						on:click={() => { mobileMenuOpen = false; goRegister(); }}
				>
					Regístrate como Escort
				</button>
				<button
						class="w-full text-left px-4 py-2 rounded-full border border-white hover:bg-white hover:text-black transition font-semibold"
						on:click={() => { mobileMenuOpen = false; goLogin(); }}
				>
					Login
				</button>
			{:else if $escortAuthStore.isAuthenticated}
				<button
						class="w-full text-left px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-700 transition font-semibold"
						on:click={() => { mobileMenuOpen = false; goDashboard(); }}
				>
					Mi Dashboard
				</button>
				<button
						class="w-full text-left px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-700 transition font-semibold"
						on:click={() => { mobileMenuOpen = false; goPayments(); }}
				>
					Tokens: {$tokenStore.tokens}
				</button>
				<button
						class="w-full text-left px-4 py-2 hover:text-red-400 transition font-semibold"
						on:click={() => { mobileMenuOpen = false; handleEscortLogout(); }}
				>
					Logout
				</button>
			{:else}
				<button
						class="w-full text-left px-4 py-2 hover:text-red-400 transition font-semibold"
						on:click={() => { mobileMenuOpen = false; handleUserLogout(); }}
				>
					Logout
				</button>
			{/if}
		</div>
	{/if}
</header>
