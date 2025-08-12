<script lang="ts">
	import posthog from 'posthog-js';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
	import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
	import { tokenStore } from '$lib/store/tokenStore';

	let mobileMenuOpen = false;

	const avatar = (seed: string) =>
			`https://api.dicebear.com/8.x/shapes/svg?scale=90&seed=${seed}&backgroundType=gradientLinear`;

	const paths = {
		menu: 'M4 7h16M4 12h16M4 17h16'
	};

	function toggleMobileMenu() { mobileMenuOpen = !mobileMenuOpen; }
	function handleClickOutside(e: MouseEvent) {
		const t = e.target as HTMLElement | null;
		if (
				mobileMenuOpen &&
				t &&
				!t.closest('.mobile-menu') &&
				!t.closest('.mobile-menu-button')
		) {
			mobileMenuOpen = false;
		}
	}
	onMount(() => document.addEventListener('click', handleClickOutside));
	onDestroy(() => document.removeEventListener('click', handleClickOutside));

	function goRegister() { goto('/dashboard/register'); }
	function goLogin() {
		posthog.capture('loginLinkClicked', { location: 'header', timestamp: new Date().toISOString() });
		goto('/users/login');
	}
	function goDashboard() { goto('/dashboard'); }
	function goPayments() { goto('/payments'); }
	function handleUserLogout() { dSuserAuthStore.logout(); goto('/'); }
	function handleEscortLogout() { escortAuthStore.logout(); goto('/'); }
</script>

<header class="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 bg-neutral-950/90 border-b border-neutral-800">
	<div class="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 h-14 flex items-center gap-3">
		<!-- Mobile menu button -->
		<button
				class="md:hidden mobile-menu-button p-2 rounded border border-neutral-800 hover:bg-neutral-900 active:bg-neutral-900"
				aria-label="Menu"
				on:click={toggleMobileMenu}
		>
			<svg viewBox="0 0 24 24" class="size-5 stroke-neutral-300" fill="none">
				<path
						d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : paths.menu}
						stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>

		<!-- Brand -->
		<a href="/" class="flex items-center gap-2">
			<span class="font-semibold text-neutral-100 tracking-tight text-lg sm:text-xl">Daisy’s Secrets</span>
		</a>

		<!-- Right Actions / CTAs (Desktop) -->
		<div class="hidden md:flex items-center gap-2 ml-auto">
			{#if $escortAuthStore.isAuthenticated}
				<button class="h-9 px-3 rounded border border-neutral-800 text-neutral-100 hover:bg-neutral-900" on:click={goDashboard}>
					Mi Dashboard
				</button>
				<button class="h-9 px-3 rounded border border-neutral-700 bg-neutral-100 text-neutral-900 hover:bg-neutral-200" on:click={goPayments}>
					Tokens: {$tokenStore.tokens}
				</button>
				<button class="h-9 px-3 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900" on:click={handleEscortLogout}>
					Logout
				</button>
			{:else if $dSuserAuthStore.isAuthenticated}
				<button class="h-9 px-3 rounded border border-neutral-700 bg-neutral-100 text-neutral-900 hover:bg-neutral-200" on:click={goPayments}>
					Tokens: {$tokenStore.tokens}
				</button>
				<button class="h-9 px-3 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900" on:click={handleUserLogout}>
					Logout
				</button>
			{:else}
				<button class="h-9 px-3 rounded border border-neutral-700 bg-neutral-100 text-neutral-900 hover:bg-neutral-200" on:click={goRegister}>
					Regístrate como Escort
				</button>
				<button class="h-9 px-3 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900" on:click={goLogin}>
					Login para Usuarios
				</button>
			{/if}

			<!-- Avatar -->
			<div class="h-9 w-9 rounded-full overflow-hidden border border-neutral-800">
				<img alt="" src={avatar('you')} />
			</div>
		</div>
	</div>

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div class="mobile-menu md:hidden bg-neutral-950/95 border-t border-neutral-800 backdrop-blur px-4 py-4 space-y-2">
			{#if !$escortAuthStore.isAuthenticated && !$dSuserAuthStore.isAuthenticated}
				<button class="w-full h-10 rounded border border-neutral-700 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 font-medium"
						on:click={() => { mobileMenuOpen = false; goRegister(); }}>
					Regístrate como Model
				</button>
				<button class="w-full h-10 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900 font-medium"
						on:click={() => { mobileMenuOpen = false; goLogin(); }}>
					Login
				</button>
			{:else if $escortAuthStore.isAuthenticated}
				<button class="w-full h-10 rounded border border-neutral-800 text-neutral-100 hover:bg-neutral-900 font-medium"
						on:click={() => { mobileMenuOpen = false; goDashboard(); }}>
					Mi Dashboard
				</button>
				<button class="w-full h-10 rounded border border-neutral-700 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 font-medium"
						on:click={() => { mobileMenuOpen = false; goPayments(); }}>
					Tokens: {$tokenStore.tokens}
				</button>
				<button class="w-full h-10 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900 font-medium"
						on:click={() => { mobileMenuOpen = false; handleEscortLogout(); }}>
					Logout
				</button>
			{:else}
				<button class="w-full h-10 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900 font-medium"
						on:click={() => { mobileMenuOpen = false; handleUserLogout(); }}>
					Logout
				</button>
			{/if}
		</div>
	{/if}
</header>


<style>
	.size-4{ width:1rem; height:1rem }
	.size-5{ width:1.25rem; height:1.25rem }
	.size-6{ width:1.5rem; height:1.5rem }
	.size-8{ width:2rem; height:2rem }
</style>
