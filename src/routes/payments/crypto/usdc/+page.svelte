<script lang="ts">
	import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
	import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
	import { tokenStore } from '$lib/store/tokenStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { jwtDecode } from 'jwt-decode';
	import QRCode from 'svelte-qr';
	import QRWrapper from "$lib/components/QRWrapper.svelte";

	$: isUserAuthenticated = $dSuserAuthStore.isAuthenticated;
	$: isEscortAuthenticated = $escortAuthStore.isAuthenticated;
	$: isAuthenticated = isUserAuthenticated || isEscortAuthenticated;

	let tokenAmount: number = parseInt($page.url.searchParams.get('tokens') || '500');
	let paymentIntent: string = '';
	let walletAddress: string = '';
	let actualPrice: number = 0;
	let isLoading = false;
	let isValidating = false;
	let toastMsg = "";
	let toastType: "success" | "error" | "" = "";
	let lastValidationTime = 0;
	let validationCooldown = 10000; // 10 segundos
	let cooldownTimer: NodeJS.Timeout | null = null;
	let remainingCooldown = 0;
	let intentExpiryTimer: NodeJS.Timeout | null = null;
	let intentTimeRemaining = 0;
	let isIntentExpired = false;

	const STORAGE_KEY = `usdc-payment-intent-${tokenAmount}`;

	function updateCooldownDisplay() {
		if (remainingCooldown > 0) {
			remainingCooldown -= 1000;
			if (remainingCooldown <= 0 && cooldownTimer) {
				clearInterval(cooldownTimer);
				cooldownTimer = null;
			}
		}
	}

	function startExpiryCountdown() {
		intentTimeRemaining = 300000; // 5 minutos
		isIntentExpired = false;
		if (intentExpiryTimer) clearInterval(intentExpiryTimer);
		intentExpiryTimer = setInterval(() => {
			intentTimeRemaining -= 1000;
			if (intentTimeRemaining <= 0 && intentExpiryTimer) {
				isIntentExpired = true;
				clearInterval(intentExpiryTimer);
				intentExpiryTimer = null;
			}
		}, 1000);
	}

	function formatTimeRemaining(ms: number): string {
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.floor((ms % 60000) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	async function refreshPaymentIntent() {
		isIntentExpired = false;
		intentTimeRemaining = 0;
		if (intentExpiryTimer) clearInterval(intentExpiryTimer);
		await createPaymentIntent();
	}

	function savePaymentIntentToStorage() {
		if (typeof localStorage !== 'undefined' && paymentIntent) {
			const paymentData = { paymentIntent, walletAddress, actualPrice, tokenAmount, timestamp: Date.now() };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(paymentData));
		}
	}

	function loadPaymentIntentFromStorage() {
		if (typeof localStorage !== 'undefined') {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				try {
					const paymentData = JSON.parse(stored);
					const fiveMin = 5 * 60 * 1000;
					const elapsed = Date.now() - paymentData.timestamp;
					if (elapsed < fiveMin) {
						paymentIntent = paymentData.paymentIntent;
						walletAddress = paymentData.walletAddress;
						actualPrice = paymentData.actualPrice;
						tokenAmount = paymentData.tokenAmount;
						intentTimeRemaining = fiveMin - elapsed;
						startExpiryCountdown();
						return true;
					} else {
						localStorage.removeItem(STORAGE_KEY);
					}
				} catch {
					localStorage.removeItem(STORAGE_KEY);
				}
			}
		}
		return false;
	}

	async function createPaymentIntent() {
		try {
			isLoading = true;
			const paymentIntentData = { tokens: tokenAmount, currency: "USDC" };
			const res = await fetch(import.meta.env.VITE_API_URL + "/payments/intent", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(paymentIntentData)
			});
			if (!res.ok) throw new Error();
			const result = await res.json();
			paymentIntent = result.paymentIntent;
			const decoded: any = jwtDecode(paymentIntent);
			walletAddress = decoded.wallet || '';
			actualPrice = parseFloat(decoded.price || decoded.amount || '0');
			tokenAmount = parseInt(decoded.tokens || tokenAmount.toString());
			if (!walletAddress) throw new Error('sin wallet');
			savePaymentIntentToStorage();
			startExpiryCountdown();
		} catch {
			toastMsg = "No se pudo crear el pago. Intentá de nuevo.";
			toastType = "error";
		} finally {
			isLoading = false;
		}
	}

	async function validatePayment() {
		const now = Date.now();
		if (now - lastValidationTime < validationCooldown) {
			const sec = Math.ceil((validationCooldown - (now - lastValidationTime)) / 1000);
			toastMsg = `Esperá ${sec}s antes de validar de nuevo.`;
			toastType = "error";
			return;
		}
		try {
			isValidating = true;
			lastValidationTime = now;
			remainingCooldown = validationCooldown;
			cooldownTimer = setInterval(updateCooldownDisplay, 1000);
			const validationData = {
				transactionAmount: actualPrice.toString(),
				paymentIntent,
				wallet: walletAddress,
				method: "CRYPTO",
				currency: "USDC"
			};
			const res = await fetch(import.meta.env.VITE_API_URL + "/payments/crypto/usdc", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(validationData)
			});
			if (res.ok) {
				toastMsg = "¡Pago validado exitosamente!";
				toastType = "success";
				tokenStore.addTokens(tokenAmount);
				localStorage.removeItem(STORAGE_KEY);
				setTimeout(() => goto('/payments'), 2000);
			} else {
				const body = await res.json().catch(() => ({}));
				toastMsg = body.message || "Pago no encontrado o ya procesado.";
				toastType = "error";
			}
		} catch {
			toastMsg = "Error al validar el pago. Intentá otra vez.";
			toastType = "error";
		} finally {
			isValidating = false;
		}
	}

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			toastMsg = "¡Dirección copiada!";
			toastType = "success";
		} catch {
			toastMsg = "Error copiando la dirección.";
			toastType = "error";
		}
	}

	onMount(async () => {
		if (!isAuthenticated) return goto('/');
		const hasStored = loadPaymentIntentFromStorage();
		if (!hasStored) await createPaymentIntent();
	});
</script>

<svelte:head>
	<title>Pagar con USDC</title>
</svelte:head>

{#if toastMsg}
	<div class="fixed z-50 top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg font-semibold
		{toastType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} transition-all">
		{toastMsg}
	</div>
{/if}

{#if isAuthenticated}
	<div class="flex items-center justify-center min-h-screen bg-black">
		<div class="w-full max-w-lg bg-[#101010] rounded-2xl shadow-2xl px-8 py-10 border border-white/5">
			<div class="flex justify-between items-center mb-8">
				<span class="font-bold text-lg text-white/90 tracking-wide">Pago con USDC</span>
				<button class="text-gray-400 hover:text-white text-sm" on:click={() => goto('/payments')}>
					← Volvé
				</button>
			</div>

			<div class="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
				<div class="flex justify-between items-center mb-2">
					<span class="text-gray-400 text-sm">Cantidad de tokens</span>
					<span class="text-white font-medium">{tokenAmount.toLocaleString()} tokens</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-white font-medium">Total</span>
					<span class="text-white font-bold text-lg">
						{#if isLoading || !actualPrice}
							Cargando...
						{:else}
							${actualPrice.toFixed(2)} USDC
						{/if}
					</span>
				</div>

				{#if intentTimeRemaining > 0 && !isIntentExpired}
					<div class="mt-3 pt-3 border-t border-gray-800">
						<div class="flex justify-between items-center">
							<span class="text-gray-400 text-xs">Expira en</span>
							<span class="text-orange-400 font-mono text-sm">{formatTimeRemaining(intentTimeRemaining)}</span>
						</div>
					</div>
				{/if}
			</div>

			{#if isLoading}
				<div class="text-center py-8">
					<svg class="animate-spin h-8 w-8 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
						<path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
					</svg>
					<p class="text-white">Generando dirección de pago...</p>
				</div>
			{:else if isIntentExpired}
				<div class="text-center py-8">
					<div class="bg-red-900/20 border border-red-500/20 rounded-lg p-6 mb-6">
						<div class="flex justify-center mb-4">
							<svg class="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
						</div>
						<h3 class="text-red-200 font-medium text-lg mb-2">La dirección expiró</h3>
						<p class="text-red-300 text-sm mb-6">
							La dirección expiró tras 5 minutos por seguridad. Generá otra para seguir.
						</p>
						<button type="button" class="w-full h-12 rounded-2xl bg-white text-black font-bold text-lg shadow-xl hover:bg-white/90 transition" on:click={refreshPaymentIntent}>
							Generar nueva dirección
						</button>
					</div>
				</div>
			{:else if walletAddress.trim().length > 0}
				<div class="space-y-6">
					<div class="text-center">
						<h2 class="text-white text-xl font-semibold mb-4 tracking-tight">Enviá USDC a esta dirección</h2>
						<div class="bg-white p-6 rounded-xl mb-4 inline-block">
							<QRWrapper otpUrl={walletAddress} size="200" />
						</div>
						<div class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 mb-4">
							<div class="flex items-center justify-center">
								<div class="w-6 h-6 bg-gray-600 rounded-full mr-2 flex items-center justify-center">
									<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
									</svg>
								</div>
								<span class="text-gray-300 text-sm font-medium">Red Polygon</span>
							</div>
						</div>
						<div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
							<div class="flex items-center justify-between">
								<div class="flex-1 min-w-0">
									<p class="text-gray-400 text-xs mb-1">Dirección de wallet (Polygon)</p>
									<p class="text-white text-sm font-mono break-all">{walletAddress}</p>
								</div>
								<button on:click={() => copyToClipboard(walletAddress)} class="ml-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
									<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
									</svg>
								</button>
							</div>
						</div>
					</div>

					<div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
						<h3 class="text-white font-medium mb-2">¿Cómo lo hacés?</h3>
						<ol class="text-gray-400 text-sm space-y-1 list-decimal list-inside">
							<li>Enviá justo <strong class="text-white">${actualPrice.toFixed(2)} USDC</strong> a la dirección de arriba</li>
							<li>Usá cualquier wallet que soporte la <strong class="text-white">red Polygon</strong></li>
							<li>Asegurate de mandar en <strong class="text-white">Polygon</strong>, no en Ethereum Mainnet</li>
							<li>Levantá y hacé click en "Validar Pago" cuando termines</li>
							<li>Esperá la confirmación de la blockchain</li>
						</ol>
					</div>

					<button type="button" class="w-full h-12 rounded-2xl bg-white text-black font-bold text-lg shadow-xl hover:bg-white/90 transition disabled:opacity-60 flex items-center justify-center" disabled={isValidating || remainingCooldown > 0} on:click={validatePayment}>
						{#if isValidating}
							<svg class="animate-spin mr-2 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
								<path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
							</svg>
							Validando...
						{:else if remainingCooldown > 0}
							Esperá {Math.ceil(remainingCooldown / 1000)}s
						{:else}
							Validar Pago
						{/if}
					</button>

					<div class="bg-orange-900/20 border border-orange-500/20 rounded-lg p-4">
						<div class="flex">
							<svg class="flex-shrink-0 w-5 h-5 text-orange-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
							</svg>
							<div class="ml-3">
								<p class="text-orange-200 text-sm">
									Sólo mandá <strong>USDC por Polygon</strong> a esta dirección. Si usás otro token o red, lo perdés.
								</p>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="text-center py-8">
					<div class="bg-gray-900 rounded-lg p-6 border border-gray-800">
						<p class="text-gray-400">No hay dirección disponible. Probá refrescando.</p>
						<button type="button" class="mt-4 px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition" on:click={refreshPaymentIntent}>
							Refrescar
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
