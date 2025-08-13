<script lang="ts">
	import posthog from 'posthog-js';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
	import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
	import { tokenStore } from '$lib/store/tokenStore';

	let mobileMenuOpen = false;
	let avatarMenuOpen = false;

	const avatar = (seed: string) =>
			`https://api.dicebear.com/8.x/shapes/svg?scale=90&seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;

	// Hamburguesa
	const paths = { menu: 'M4 7h16M4 12h16M4 17h16' };

	// NAV (las 4 secciones)
	const leftNav = [
		{ id: 'escorts',   label: 'Escorts',   icon: 'users',     href: '/' },
		{ id: 'telos',     label: 'Telos',     icon: 'building',  href: '/motels' },
		{ id: 'faceswap',  label: 'Face Swap', icon: 'sparkles',  href: '/faceswap' },
		{ id: 'perfil',    label: 'Mi Perfil', icon: 'user',      href: '/users/profile' }
	];
	const navPaths: Record<string, string> = {
		users: 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21c0-3.314 2.686-6 6-6s6 2.686 6 6H2Zm8 0c0-3.314 2.686-6 6-6s6 2.686 6 6H10Z',
		building: 'M4 3h16v18H4V3Zm4 3h4v4H8V6Zm0 6h4v4H8v-4Zm6-6h4v4h-4V6Zm0 6h4v4h-4v-4Z',
		sparkles: 'M5 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Zm10 2l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Zm2 8l1.5 3 3 1.5-3 1.5L17 21l-1.5-3-3-1.5 3-1.5 1.5-3Z',
		user: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM4 21a8 8 0 1 1 16 0H4Z'
	};

	function toggleMobileMenu() { mobileMenuOpen = !mobileMenuOpen; }
	function toggleAvatarMenu() { avatarMenuOpen = !avatarMenuOpen; }

	function handleClickOutside(e: MouseEvent) {
		const t = e.target as HTMLElement | null;
		if (!t) return;
		if (mobileMenuOpen && !t.closest('.mobile-menu') && !t.closest('.mobile-menu-button')) mobileMenuOpen = false;
		if (avatarMenuOpen && !t.closest('.avatar-menu') && !t.closest('.avatar-button')) avatarMenuOpen = false;
	}
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') { mobileMenuOpen = false; avatarMenuOpen = false; }
	}
	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleKeydown);
	});
	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
		document.removeEventListener('keydown', handleKeydown);
	});

	// Nav helpers
	function goRegister() { goto('/dashboard/register'); }
	function goLogin() { posthog.capture('loginLinkClicked', { location: 'header', timestamp: new Date().toISOString() }); goto('/users/login'); }
	function goDashboard() { goto('/dashboard'); }
	function goPayments() { goto('/payments'); }
	function goBlacklist() { goto('/dashboard/blacklist'); }
	function goProfile() { goto('/users/profile'); }
	function go(href: string) { mobileMenuOpen = false; goto(href); }

	// Logout
	function handleUserLogout() { dSuserAuthStore.logout(); goto('/'); }
	function handleEscortLogout() { escortAuthStore.logout(); goto('/'); }

	// Stores
	$: isEscort = $escortAuthStore?.isAuthenticated;
	$: isUser = $dSuserAuthStore?.isAuthenticated;
	$: tokens = $tokenStore?.tokens ?? 0;

	function localPart(email?: string) {
		if (!email) return '';
		const at = email.indexOf('@');
		return at > 0 ? email.slice(0, at) : email;
	}
	function safeDisplayName(u: any): string {
		return (u?.username?.toString().trim() || u?.name?.toString().trim() || localPart(u?.email) || 'Usuario');
	}
	$: escortUser = ($escortAuthStore as any)?.user;
	$: normalUser = ($dSuserAuthStore as any)?.user;
	$: displayName = isEscort ? safeDisplayName(escortUser) : isUser ? safeDisplayName(normalUser) : '';
	$: avatarSeed = displayName || 'guest';

	const nf = new Intl.NumberFormat('es-AR');
	$: tokenText = nf.format(tokens);
</script>

<header class="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 bg-neutral-950/90 border-b border-neutral-800">
	<div class="px-3 sm:px-4 lg:px-6 h-14 flex items-center gap-3">
		<!-- Mobile menu button -->
		<button
				class="md:hidden mobile-menu-button p-2 rounded border border-neutral-800 hover:bg-neutral-900 active:bg-neutral-900"
				aria-label="Abrir menú"
				on:click={toggleMobileMenu}
		>
			<svg viewBox="0 0 24 24" class="size-5 stroke-neutral-300" fill="none" aria-hidden="true">
				<path d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : paths.menu} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>

		<!-- Brand -->
		<a href="/" class="flex items-center gap-2">
			<span class="font-semibold text-neutral-100 tracking-tight text-lg sm:text-xl">Daisy’s Secrets</span>
		</a>

		<!-- Right side -->
		<div class="ml-auto flex items-center gap-2">
			{#if !isEscort}
				<button class="h-9 px-3 rounded border border-neutral-700 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 font-medium" on:click={goRegister}>
					Registrate como Modelo
				</button>
			{/if}

			{#if isEscort || isUser}
				<button class="h-9 px-3 rounded border border-neutral-800 text-neutral-100 hover:bg-neutral-900" on:click={goPayments} aria-label="Comprar tokens" title="Ir a Comprar tokens">
					Tokens: {tokenText}
				</button>

				<span class="hidden md:block text-sm text-neutral-400 max-w-[10rem] truncate" title={displayName} aria-label={`Usuario ${displayName}`}>
					@{displayName}
				</span>
			{/if}

			<!-- Avatar + dropdown (solo desktop) -->
			<div class="hidden md:flex items-center relative">
				<button
						class="avatar-button h-9 w-9 rounded-full overflow-hidden border border-neutral-800 hover:ring-2 hover:ring-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-600"
						aria-label="Abrir menú de usuario" aria-haspopup="menu" aria-expanded={avatarMenuOpen}
						on:click={toggleAvatarMenu}
				>
					<img alt="Avatar" src={avatar(avatarSeed)} />
				</button>

				{#if avatarMenuOpen}
					<div role="menu" class="avatar-menu absolute right-0 top-12 w-56 rounded-xl border border-neutral-800 bg-neutral-950/95 backdrop-blur shadow-xl p-1">
						{#if isEscort || isUser}
							<div class="px-3 py-2 border-b border-neutral-800">
								<div class="text-sm text-neutral-300 truncate">@{displayName}</div>
								<div class="text-xs text-neutral-500">{isEscort ? 'Modelo' : 'Usuario'}</div>
							</div>
						{/if}

						{#if isEscort}
							<button role="menuitem" class="menu-item" on:click={() => { avatarMenuOpen = false; goto('/'); }}>Escorts</button>
							<button role="menuitem" class="menu-item" on:click={() => { avatarMenuOpen = false; goto('/motels'); }}>Telos</button>
							<button role="menuitem" class="menu-item" on:click={() => { avatarMenuOpen = false; goto('/faceswap'); }}>Face Swap</button>
							<button role="menuitem" class="menu-item" on:click={() => { avatarMenuOpen = false; goProfile(); }}>Mi Perfil</button>
							<button role="menuitem" class="menu-item danger" on:click={() => { avatarMenuOpen = false; handleEscortLogout(); }}>Salir</button>
						{:else if isUser}
							<button role="menuitem" class="menu-item" on:click={() => { avatarMenuOpen = false; goto('/'); }}>Escorts</button>
							<button role="menuitem" class="menu-item" on:click={() => { avatarMenuOpen = false; goto('/motels'); }}>Telos</button>
							<button role="menuitem" class="menu-item" on:click={() => { avatarMenuOpen = false; goto('/faceswap'); }}>Face Swap</button>
							<button role="menuitem" class="menu-item" on:click={() => { avatarMenuOpen = false; goProfile(); }}>Mi Perfil</button>
							<button role="menuitem" class="menu-item danger" on:click={() => { avatarMenuOpen = false; handleUserLogout(); }}>Salir</button>
						{:else}
							<button role="menuitem" class="menu-item" on:click={() => { avatarMenuOpen = false; goto('/'); }}>Escorts</button>
							<button role="menuitem" class="menu-item" on:click={() => { avatarMenuOpen = false; goto('/motels'); }}>Telos</button>
							<button role="menuitem" class="menu-item" on:click={() => { avatarMenuOpen = false; goto('/faceswap'); }}>Face Swap</button>
							<button role="menuitem" class="menu-item" on:click={() => { avatarMenuOpen = false; goLogin(); }}>Iniciar sesión</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Mobile Menu: AHORA muestra la sidebar (sin Create Post) -->
	{#if mobileMenuOpen}
		<div class="mobile-menu md:hidden bg-neutral-950/95 border-t border-neutral-800 backdrop-blur px-4 py-4 space-y-3">
			<nav class="space-y-1">
				{#each leftNav as item}
					<a
							href={item.href}
							on:click|preventDefault={() => go(item.href)}
							class="flex items-center gap-3 px-3 h-11 rounded-md text-neutral-200 hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
							aria-label={item.label}
					>
						<svg viewBox="0 0 24 24" class="size-5 stroke-neutral-300">
							<path d={navPaths[item.icon]} stroke-width="1.5" fill="none" stroke-linecap="round"/>
						</svg>
						<span class="text-[15px]">{item.label}</span>
					</a>
				{/each}
			</nav>

			<!-- Sección cuenta, igual que antes -->
			<div class="space-y-2 pt-3 mt-3 border-t border-neutral-800/60">
				{#if !$escortAuthStore.isAuthenticated && !$dSuserAuthStore.isAuthenticated}
					<button class="w-full h-10 rounded border border-neutral-700 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 font-medium"
							on:click={() => { mobileMenuOpen = false; goRegister(); }}>
						Registrate como Modelo
					</button>
					<button class="w-full h-10 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900 font-medium"
							on:click={() => { mobileMenuOpen = false; goLogin(); }}>
						Iniciar sesión
					</button>
				{:else if $escortAuthStore.isAuthenticated}
					<div class="flex items-center gap-3 pb-2">
						<div class="h-10 w-10 rounded-full overflow-hidden border border-neutral-800"><img alt="Avatar" src={avatar(avatarSeed)} /></div>
						<div class="min-w-0">
							<div class="text-neutral-100 font-medium truncate">@{displayName}</div>
							<div class="text-neutral-400 text-xs truncate">Modelo</div>
						</div>
					</div>
					<button class="w-full h-10 rounded border border-neutral-800 text-neutral-100 hover:bg-neutral-900 font-medium" on:click={() => { mobileMenuOpen = false; goDashboard(); }}>Panel de control</button>
					<button class="w-full h-10 rounded border border-neutral-800 text-neutral-100 hover:bg-neutral-900 font-medium" on:click={() => { mobileMenuOpen = false; goBlacklist(); }}>Ver blacklist</button>
					<button class="w-full h-10 rounded border border-neutral-700 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 font-medium" on:click={() => { mobileMenuOpen = false; goPayments(); }}>Comprar tokens ({tokenText})</button>
					<button class="w-full h-10 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900 font-medium" on:click={() => { mobileMenuOpen = false; handleEscortLogout(); }}>Salir</button>
				{:else}
					<div class="flex items-center gap-3 pb-2">
						<div class="h-10 w-10 rounded-full overflow-hidden border border-neutral-800"><img alt="Avatar" src={avatar(avatarSeed)} /></div>
						<div class="min-w-0">
							<div class="text-neutral-100 font-medium truncate">@{displayName}</div>
							<div class="text-neutral-400 text-xs truncate">Usuario</div>
						</div>
					</div>
					<button class="w-full h-10 rounded border border-neutral-700 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 font-medium" on:click={() => { mobileMenuOpen = false; goPayments(); }}>Comprar tokens ({tokenText})</button>
					<button class="w-full h-10 rounded border border-neutral-800 text-neutral-100 hover:bg-neutral-900 font-medium" on:click={() => { mobileMenuOpen = false; goProfile(); }}>Ver perfil</button>
					<button class="w-full h-10 rounded border border-neutral-800 text-neutral-300 hover:bg-neutral-900 font-medium" on:click={() => { mobileMenuOpen = false; handleUserLogout(); }}>Salir</button>
				{/if}
			</div>
		</div>
	{/if}
</header>

<style>
	.size-4{ width:1rem; height:1rem }
	.size-5{ width:1.25rem; height:1.25rem }
	.size-6{ width:1.5rem; height:1.5rem }
	.size-8{ width:2rem; height:2rem }
	.menu-item{ @apply w-full text-left px-3 py-2 rounded-lg text-sm text-neutral-200 hover:bg-neutral-900; }
	.menu-item.danger{ @apply text-neutral-300; }
</style>
