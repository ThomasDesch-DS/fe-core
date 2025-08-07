<script lang="ts">
	import posthog from 'posthog-js';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
	import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
	import { tokenStore } from '$lib/store/tokenStore';

	let mobileMenuOpen = false;
	let faqOpen: boolean[] = [false, false, false, false];

	const faqs = [
		{
			q: '¿Tengo que mostrar mi cara?',
			a: `No es obligatorio. Podés publicar tu perfil sin mostrar tu cara si preferís mantener tu privacidad. Muchas escorts eligen mostrar solo su cuerpo o usar fotos artísticas.`
		},
		{
			q: '¿Cómo me contactan los clientes?',
			a: `La escort publica su método de contacto (WhatsApp, Telegram, etc.). Nosotros no intervenimos, solo facilitamos visibilidad.`
		},
		{
			q: '¿Qué datos son públicos?',
			a: `Solo se publican los datos que vos elegís: fotos, descripción, servicios, zona y horarios. Tu información personal (nombre real, DNI, teléfono) nunca se comparte.`
		},
		{
			q: '¿Puedo borrar mi perfil?',
			a: `Sí, podés eliminar tu perfil en cualquier momento desde tu panel de control. La eliminación es inmediata y permanente.`
		}
	];

	function toggleMobileMenu(): void {
		mobileMenuOpen = !mobileMenuOpen;
	}
	function toggleFaq(i: number): void {
		faqOpen[i] = !faqOpen[i];
		if (faqOpen[i]) {
			posthog.capture('faq_opened', {
				question: faqs[i].q,
				timestamp: new Date().toISOString()
			});
		}
	}
	function handleClickOutside(event: MouseEvent): void {
		if (
			mobileMenuOpen &&
			!event.target.closest('.mobile-menu') &&
			!event.target.closest('.mobile-menu-button')
		) {
			mobileMenuOpen = false;
		}
	}

	onMount(() => {
		posthog.capture('escort_landing_viewed', {
			timestamp: new Date().toISOString()
		});
		document.addEventListener('click', handleClickOutside);
	});
	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});

	function goRegister(): void {
		goto('/dashboard/register');
	}
	function goLogin(): void {
		posthog.capture('loginLinkClicked', {
			location: 'header',
			timestamp: new Date().toISOString()
		});
		goto('/users/login');
	}
	function goDashboard(): void {
		goto('/dashboard');
	}
	function goPayments(): void {
		goto('/payments');
	}
	function handleUserLogout(): void {
		dSuserAuthStore.logout();
		goto('/');
	}
	function handleEscortLogout(): void {
		escortAuthStore.logout();
		goto('/');
	}
	function handlePublish(): void {
		posthog.capture('register_now_button_clicked', {
			location: 'final_cta_section',
			timestamp: new Date().toISOString()
		});
		goto('/dashboard/register');
	}

	function startNow(): void {
		posthog.capture('start_now_button_clicked', {
			location: 'hero_section',
			timestamp: new Date().toISOString()
		});
		window.location.href = '/dashboard/register';
	}
</script>

<main class="bg-black text-center text-white">
	<!-- Hero -->
	<section class="bg-gradient-to-b from-[#09090F] via-black to-[#000] py-20 px-4">
		<h1 class="text-4xl sm:text-5xl font-extrabold">
			Publicá tu anuncio. <span class="text-amber-500">Ganá más.</span>
		</h1>
		<h2 class="mt-2 text-4xl sm:text-5xl font-extrabold">
			<span class="text-green-500">Trabajá con seguridad.</span>
		</h2>
		<p class="mt-4 max-w-2xl mx-auto text-gray-400">
			Tenemos tráfico real y mostramos tu perfil junto a los mejores telos del país. Vos decidís
			cuándo, cómo y con quién.
		</p>
		<div class="mt-8">
			<button
				on:click={startNow}
				class="bg-white text-black font-semibold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-shadow"
			>
				Empezar ya
			</button>
		</div>
	</section>

	<!-- Why choose us -->
	<section class="py-20 px-4">
		<h2 class="text-3xl sm:text-4xl font-extrabold mb-12 text-white">
			¿Por qué elegir nuestra plataforma?
		</h2>
		<div class="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-4">
			<!-- Card 1 -->
			<div class="bg-neutral-900 p-6 rounded-lg flex flex-col items-center">
				<div class="bg-rose-500 p-4 rounded-full">
					<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path d="M10 2a6 6 0 00-6 6h2a4 4 0 114 4v2a6 6 0 100-12z" />
					</svg>
				</div>
				<h3 class="mt-4 font-semibold text-white">Publicación gratuita</h3>
				<p class="mt-2 text-gray-400 text-sm">Sin costos ocultos ni comisiones</p>
			</div>
			<!-- Card 2 -->
			<div class="bg-neutral-900 p-6 rounded-lg flex flex-col items-center">
				<div class="bg-amber-500 p-4 rounded-full">
					<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M5.05 3.05a7 7 0 119.9 9.9L10 18.9l-4.95-5.95a7 7 0 010-9.9z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<h3 class="mt-4 font-semibold text-white">Perfil visible junto a telos</h3>
				<p class="mt-2 text-gray-400 text-sm">Aparecés en tu zona geográfica</p>
			</div>
			<!-- Card 3 -->
			<div class="bg-neutral-900 p-6 rounded-lg flex flex-col items-center">
				<div class="bg-red-500 p-4 rounded-full">
					<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M10 2a8 8 0 00-8 8v2a2 2 0 002 2h3v-4H4v-2a6 6 0 0112 0v2h-3v4h3a2 2 0 002-2v-2a8 8 0 00-8-8z"
						/>
					</svg>
				</div>
				<h3 class="mt-4 font-semibold text-white">Lista negra de clientes</h3>
				<p class="mt-2 text-gray-400 text-sm">Protección contra usuarios problemáticos</p>
			</div>
			<!-- Card 4 -->
			<div class="bg-neutral-900 p-6 rounded-lg flex flex-col items-center">
				<div class="bg-green-500 p-4 rounded-full">
					<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path d="M10 2a6 6 0 00-6 6h2a4 4 0 114 4v2a6 6 0 100-12z" />
					</svg>
				</div>
				<h3 class="mt-4 font-semibold text-white">100% de ganancias</h3>
				<p class="mt-2 text-gray-400 text-sm">Todo lo que ganás es tuyo</p>
			</div>
		</div>
	</section>

	<!-- How it works -->
	<section class="py-20 px-4">
		<h2 class="text-3xl sm:text-4xl font-extrabold mb-12 text-white">¿Cómo funciona?</h2>
		<div class="grid gap-8 grid-cols-1 sm:grid-cols-3 px-4">
			<!-- Paso 1 -->
			<div class="flex flex-col items-center">
				<div class="bg-rose-500 p-4 rounded-full">
					<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path d="M8 9a3 3 0 106 0 3 3 0 00-6 0z" />
						<path fill-rule="evenodd" d="M2 13a6 6 0 1112 0v1H2v-1z" clip-rule="evenodd" />
					</svg>
				</div>
				<span class="mt-4 text-sm font-medium text-white uppercase">Paso 1</span>
				<h4 class="mt-2 font-semibold text-white">Completá tu perfil</h4>
				<p class="mt-1 text-gray-400 text-sm">Agregá tus fotos, descripción y servicios</p>
			</div>
			<!-- Paso 2 -->
			<div class="flex flex-col items-center">
				<div class="bg-green-500 p-4 rounded-full">
					<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11l-4 4 4 4"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<span class="mt-4 text-sm font-medium text-white uppercase">Paso 2</span>
				<h4 class="mt-2 font-semibold text-white">Verificamos tu edad</h4>
				<p class="mt-1 text-gray-400 text-sm">Proceso rápido y confidencial</p>
			</div>
			<!-- Paso 3 -->
			<div class="flex flex-col items-center">
				<div class="bg-purple-500 p-4 rounded-full">
					<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V5z" />
					</svg>
				</div>
				<span class="mt-4 text-sm font-medium text-white uppercase">Paso 3</span>
				<h4 class="mt-2 font-semibold text-white">Publicás tu método de contacto</h4>
				<p class="mt-1 text-gray-400 text-sm">WhatsApp, Telegram o como prefieras</p>
			</div>
		</div>
	</section>

	<!-- Security & Privacy -->
	<section class="py-20 px-4">
		<h2 class="text-3xl sm:text-4xl font-extrabold mb-12 text-white">
			Tu seguridad y privacidad son prioridad
		</h2>
		<div class="grid gap-8 grid-cols-1 sm:grid-cols-2 px-4">
			<!-- Verificación de edad confidencial -->
			<div class="bg-neutral-900 p-6 rounded-lg flex items-center">
				<div class="bg-rose-500 p-4 rounded-full">
					<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path d="M4 4h12v2H4V4zM4 8h12v2H4V8z" />
					</svg>
				</div>
				<div class="ml-4 text-left">
					<h3 class="font-semibold text-white">Verificación de edad confidencial</h3>
					<p class="mt-1 text-gray-400 text-sm">
						KYC solo para verificar edad. Tus datos no se publican nunca.
					</p>
				</div>
			</div>
			<!-- Lista negra compartida -->
			<div class="bg-neutral-900 p-6 rounded-lg flex items-center">
				<div class="bg-red-500 p-4 rounded-full">
					<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path d="M6 2a4 4 0 00-4 4v3h2V6a2 2 0 012-2h8a2 2 0 012 2v3h2V6a4 4 0 00-4-4H6z" />
					</svg>
				</div>
				<div class="ml-4 text-left">
					<h3 class="font-semibold text-white">Lista negra compartida</h3>
					<p class="mt-1 text-gray-400 text-sm">
						Protección contra clientes violentos o irrespetuosos.
					</p>
				</div>
			</div>
			<!-- Opciones de bloqueo y denuncia -->
			<div class="bg-neutral-900 p-6 rounded-lg flex items-center">
				<div class="bg-amber-500 p-4 rounded-full">
					<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M8.257 3.099c.366-.446.957-.5 1.412-.134l6 6a1 1 0 011.32.083l-6 6a1 1 0 01-1.32-1.497l6-6-6-6z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-4 text-left">
					<h3 class="font-semibold text-white">Opciones de bloqueo y denuncia</h3>
					<p class="mt-1 text-gray-400 text-sm">
						Herramientas para reportar y bloquear usuarios problemáticos.
					</p>
				</div>
			</div>
			<!-- Soporte vía Telegram -->
			<div class="bg-neutral-900 p-6 rounded-lg flex items-center">
				<div class="bg-purple-500 p-4 rounded-full">
					<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path d="M2.94 2.94l14.12 6.06-8.06 8.06-3.06-5.94 2.94-2.12-6.94-6.16z" />
					</svg>
				</div>
				<div class="ml-4 text-left">
					<h3 class="font-semibold text-white">Soporte vía Telegram</h3>
					<p class="mt-1 text-gray-400 text-sm">Asistencia rápida y discreta cuando la necesités.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQ -->
	<section class="py-20 px-4">
		<h2 class="text-3xl sm:text-4xl font-extrabold mb-12 text-white">Preguntas frecuentes</h2>
		<div class="max-w-2xl mx-auto space-y-4 text-left px-4">
			{#each faqs as item, i}
				<div class="bg-neutral-900 rounded-lg overflow-hidden">
					<button
						class="w-full flex justify-between items-center p-4 focus:outline-none"
						on:click={() => toggleFaq(i)}
					>
						<span class="font-medium text-white">{item.q}</span>
						<svg
							class="w-5 h-5 transform {faqOpen[i] ? 'rotate-180' : ''} transition-transform text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if faqOpen[i]}
						<div class="px-4 pb-4 text-gray-400 text-sm">{item.a}</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<!-- Final CTA -->
	<section class="bg-gradient-to-b from-[#09090F] via-black to-[#000] py-20 px-4">
		<h2 class="text-3xl sm:text-4xl font-extrabold">Sé una de las primeras escorts</h2>
		<p class="mt-4 max-w-xl mx-auto text-gray-400">
			Uníte a nuestra plataforma desde el inicio y aprovechá las ventajas de ser pionera.
		</p>
		<button
			on:click={handlePublish}
			class="mt-8 bg-amber-500 text-black font-semibold py-3 px-8 rounded-full shadow-md hover:opacity-90 transition-opacity"
		>
			Regístrate ahora
		</button>
	</section>
</main>

<style>
	/* flecha FAQ rotada */
	.rotate-180 {
		transform: rotate(180deg);
	}
</style>