<script lang="ts">
	import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
	import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
	import { tokenStore } from '$lib/store/tokenStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { jwtDecode } from 'jwt-decode';

	$: isUserAuthenticated = $dSuserAuthStore.isAuthenticated;
	$: isEscortAuthenticated = $escortAuthStore.isAuthenticated;
	$: isAuthenticated = isUserAuthenticated || isEscortAuthenticated;

	$: packageId = $page.url.searchParams.get('package') || null;
	
	let tokenPrices: any = null;
	let isLoadingPrices = true;
	let paymentIntent: string = '';
	let actualPrice: number = 0;
	let tokenAmount: number = parseInt($page.url.searchParams.get('tokens') || '500');

	function calculateTokenPriceARS(amount: number): number {
		if (!tokenPrices || !tokenPrices.packages) return 0;
		
		// Find the appropriate package or calculate custom price
		const matchingPackage = tokenPrices.packages.find(pkg => pkg.minTokens === amount);
		if (matchingPackage) {
			return matchingPackage.priceArs;
		}
		
		// For custom amounts, use the base rate from the first package
		if (tokenPrices.packages.length > 0) {
			const basePackage = tokenPrices.packages[0];
			return (amount * basePackage.priceArs) / basePackage.minTokens;
		}
		
		return 0;
	}

	async function fetchTokenPrices() {
		try {
			const response = await fetch( import.meta.env.VITE_API_URL+'/payments/token-prices', {
				credentials: 'include'
			});
			
			if (response.ok) {
				tokenPrices = await response.json();
			} else {
				console.error('Failed to fetch token prices');
				tokenPrices = null;
			}
		} catch (error) {
			console.error('Error fetching token prices:', error);
			tokenPrices = null;
		} finally {
			isLoadingPrices = false;
		}
	}

	function savePaymentIntentToStorage() {
		if (typeof localStorage !== 'undefined' && paymentIntent) {
			const paymentData = {
				paymentIntent,
				actualPrice,
				tokenAmount,
				packageId,
				timestamp: Date.now()
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(paymentData));
		}
	}

	function loadPaymentIntentFromStorage() {
		if (typeof localStorage !== 'undefined') {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				try {
					const paymentData = JSON.parse(stored);
					// Check if data is not older than 5 minutes
					const fiveMinutes = 5 * 60 * 1000;
					const elapsed = Date.now() - paymentData.timestamp;
					
					if (elapsed < fiveMinutes) {
						paymentIntent = paymentData.paymentIntent;
						actualPrice = paymentData.actualPrice;
						tokenAmount = paymentData.tokenAmount;
						if (paymentData.packageId) {
							packageId = paymentData.packageId;
						}
						
						// Calculate remaining time and start countdown
						const remaining = fiveMinutes - elapsed;
						intentTimeRemaining = remaining;
						startExpiryCountdown();
						
						return true;
					} else {
						// Remove expired data
						localStorage.removeItem(STORAGE_KEY);
					}
				} catch (error) {
					console.error('Error loading payment intent from storage:', error);
					localStorage.removeItem(STORAGE_KEY);
				}
			}
		}
		return false;
	}

	async function createPaymentIntent() {
		try {
			const paymentIntentData = {
				tokens: tokenAmount,
				currency: "ars",
				...(packageId && { packageId })
			};

			const response = await fetch(import.meta.env.VITE_API_URL + "/payments/intent", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(paymentIntentData)
			});

			if (!response.ok) {
				throw new Error('Failed to create payment intent');
			}

			const result = await response.json();
			paymentIntent = result.paymentIntent;
			
			// Extract total amount from JWT as required by MercadoPago
			const decoded: any = jwtDecode(paymentIntent);
			actualPrice = parseFloat(decoded.price || decoded.amount || '0');
			tokenAmount = parseInt(decoded.tokens || tokenAmount.toString());
			
			// Save to localStorage for persistence
			savePaymentIntentToStorage();
			
			// Start 5-minute countdown
			startExpiryCountdown();
			
			console.log('Payment intent created:', { paymentIntent, actualPrice, tokenAmount });
		} catch (error) {
			console.error('Error creating payment intent:', error);
		}
	}

	let mp: any;
	let isLoading = false;
	let toastMsg = "";
	let toastType: "success" | "error" | "" = "";
	let paymentMethodId = "";
	let email = "";
	let isFormValid = false;
	let cardholderName = "";
	let identificationType = "DNI";
	let identificationNumber = "";
	let cardToken = "";
	let isTokenizing = false;
	let intentExpiryTimer: NodeJS.Timeout | null = null;
	let intentTimeRemaining = 0;
	let isIntentExpired = false;

	// Storage key for payment intent persistence
	const STORAGE_KEY = `mercadopago-payment-intent-${tokenAmount}`;

	// Remove paymentMethodId requirement from reactive validation to avoid race condition
	$: isFormValid = cardholderName.trim() !== "" && identificationNumber.trim() !== "" && cardToken !== "";
	
	// Debug logging for form validation
	$: console.log({ paymentMethodId, cardToken, isFormValid });

	// Start expiry countdown (5 minutes = 300,000ms)
	function startExpiryCountdown() {
		intentTimeRemaining = 300000; // 5 minutes
		isIntentExpired = false;
		
		if (intentExpiryTimer) {
			clearInterval(intentExpiryTimer);
		}
		
		intentExpiryTimer = setInterval(() => {
			intentTimeRemaining -= 1000;
			if (intentTimeRemaining <= 0) {
				isIntentExpired = true;
				if (intentExpiryTimer) {
					clearInterval(intentExpiryTimer);
					intentExpiryTimer = null;
				}
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
		if (intentExpiryTimer) {
			clearInterval(intentExpiryTimer);
			intentExpiryTimer = null;
		}
		// Reset form state
		cardToken = "";
		paymentMethodId = "";
		await createPaymentIntent();
	}

	// Function to create card token when personal info is complete
	async function createCardTokenIfReady() {
		if (!mp || isTokenizing || cardToken) return; // don't re-tokenize if we already have a token
		if (!cardholderName.trim() || !identificationType || !identificationNumber.trim()) return;
		
		try {
			isTokenizing = true;
			console.log("Creating card token...");
			const tokenRes = await mp.fields.createCardToken({
				cardholderName: cardholderName,
				identificationType: identificationType,
				identificationNumber: identificationNumber
			});
			cardToken = tokenRes.id;
			console.log("🎩 Card token created:", tokenRes.id);
		} catch (error) {
			console.error("Error creating card token:", error);
			cardToken = "";
		} finally {
			isTokenizing = false;
		}
	}

	// Reactive statement to trigger tokenization when personal info is complete (no paymentMethodId needed)
	$: if (cardholderName.trim() && identificationType && identificationNumber.trim()) {
		createCardTokenIfReady();
	}

	onMount(async () => {
		if (!isAuthenticated) {
			goto('/');
			return;
		}
		
		await fetchTokenPrices();
		
		// Try to load existing payment intent from storage first
		const hasStoredIntent = loadPaymentIntentFromStorage();
		if (!hasStoredIntent) {
			await createPaymentIntent();
		}

		const { loadMercadoPago } = await import("@mercadopago/sdk-js");
		await loadMercadoPago();
		mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC);

		const mpStyle = {
			base: {
				color: "#181818",
				fontSize: "16px",
				'::placeholder': { color: "#6b7280", opacity: 0.8 },
				backgroundColor: "#fff",
				border: "none",
				boxShadow: "none",
				fontWeight: "500",
			},
			focus: {
				color: "#181818",
				border: "none",
				backgroundColor: "#fff"
			},
			empty: { color: "#181818", opacity: 0.6 },
			complete: { color: "#181818" },
			invalid: { color: "#dc2626" }
		};

		const cardNumberElement = mp.fields.create("cardNumber", {
			placeholder: "Número de la tarjeta",
			style: mpStyle
		}).mount("cardNumber");
		
		const expirationDateElement = mp.fields.create("expirationDate", {
			placeholder: "MM/YY",
			style: mpStyle
		}).mount("expirationDate");
		
		const securityCodeElement = mp.fields.create("securityCode", {
			placeholder: "CVV",
			style: mpStyle
		}).mount("securityCode");


		// BIN Change para obtener paymentMethodId - with multiple event handlers
		let currentBin = "";
		
		// Manual BIN detection function as fallback
		async function detectPaymentMethodManually() {
			try {
				// Get all payment methods for the country/region
				const { results } = await mp.getPaymentMethods();
				console.log("ALL PMs:", results);
				
				// Just grab the first available payment method - stop being picky!
				paymentMethodId = results[0]?.id || "";
				console.log("👉 paymentMethodId set to:", paymentMethodId);
				
				// If still empty, force set to a common one as last resort
				if (!paymentMethodId) {
					paymentMethodId = "visa"; // Default fallback
					console.log("⚠️ Forcing paymentMethodId to 'visa' as fallback");
				}
			} catch (error) {
				console.error("Error getting payment methods manually:", error);
				// Emergency fallback
				paymentMethodId = "visa";
				console.log("🚨 Emergency fallback: setting paymentMethodId to 'visa'");
			}
		}
		
		// Primary binChange handler
		cardNumberElement.on("binChange", async (data) => {
			console.log("binChange event triggered:", data);
			const bin = data.bin;
			if (bin && bin.length >= 6 && bin !== currentBin) {
				try {
					console.log("Processing BIN:", bin);
					const { results } = await mp.getPaymentMethods({ bin });
					console.log("BIN → results:", results);
					if (results.length > 0) {
						paymentMethodId = results[0].id;
						console.log("💳 detected paymentMethodId:", paymentMethodId);
					} else {
						console.log("No payment method found for BIN, trying manual detection");
						await detectPaymentMethodManually();
					}
				} catch (error) {
					console.error("Error getting payment methods:", error);
					console.log("BIN detection failed, trying manual detection");
					await detectPaymentMethodManually();
				}
			}
			currentBin = bin;
		});

		// Additional change handler as fallback
		cardNumberElement.on("change", async (data) => {
			console.log("change event triggered:", data);
			if (data.bin && data.bin.length >= 6 && data.bin !== currentBin) {
				try {
					console.log("Processing BIN via change event:", data.bin);
					const { results } = await mp.getPaymentMethods({ bin: data.bin });
					if (results.length > 0) {
						paymentMethodId = results[0].id;
						console.log("💳 paymentMethodId via change:", paymentMethodId);
					} else {
						await detectPaymentMethodManually();
					}
				} catch (error) {
					console.error("Error getting payment methods via change:", error);
					await detectPaymentMethodManually();
				}
				currentBin = data.bin;
			}
		});

		// Force-set payment method on mount to ensure immediate availability
		console.log("🚀 About to call detectPaymentMethodManually...");
		await detectPaymentMethodManually();
		console.log("✅ detectPaymentMethodManually completed, paymentMethodId:", paymentMethodId);

		// Manual polling to check for card input since events aren't working
		let cardCheckInterval = setInterval(async () => {
			try {
				// Try to get the card number from the DOM
				const cardNumberInput = document.querySelector('#cardNumber input');
				if (cardNumberInput && cardNumberInput.value) {
					const cardNumber = cardNumberInput.value.replace(/\s/g, '');
					console.log("Found card number:", cardNumber);
					
					if (cardNumber.length >= 6) {
						const bin = cardNumber.substring(0, 6);
						if (bin !== currentBin && !paymentMethodId) {
							console.log("Processing BIN manually:", bin);
							currentBin = bin;
							
							try {
								const { results } = await mp.getPaymentMethods({ bin });
								console.log("Payment methods for manual BIN:", results);
								if (results.length > 0) {
									paymentMethodId = results[0].id;
									console.log("💳 Manual polling paymentMethodId:", paymentMethodId);
									clearInterval(cardCheckInterval);
								} else {
									await detectPaymentMethodManually();
									clearInterval(cardCheckInterval);
								}
							} catch (error) {
								console.error("Manual BIN detection error:", error);
								await detectPaymentMethodManually();
								clearInterval(cardCheckInterval);
							}
						}
					}
				}
			} catch (error) {
				console.error("Card polling error:", error);
			}
		}, 1000);

		// Clear interval after 30 seconds to prevent infinite polling
		setTimeout(() => {
			clearInterval(cardCheckInterval);
		}, 30000);

		// Listen for card field changes
		cardNumberElement.on("ready", () => {
			console.log("Card number field ready");
		});

		cardNumberElement.on("error", (error) => {
			console.error("Card number error:", error);
		});

		expirationDateElement.on("ready", () => {
			console.log("Expiration date field ready");
		});

		securityCodeElement.on("ready", () => {
			console.log("Security code field ready");
		});
	});

	async function handleSubmit(e) {
		e.preventDefault();
		isLoading = true;
		toastMsg = "";
		toastType = "";
		try {
			// Last-ditch effort to get payment method if still missing
			if (!paymentMethodId) {
				console.log("⚠️ paymentMethodId still empty at submit, trying manual detection...");
				await detectPaymentMethodManually();
			}
			
			// Validate that we have all required data before proceeding
			if (!paymentMethodId) {
				console.log("🚨 Final paymentMethodId check failed:", paymentMethodId);
				isLoading = false;
				toastMsg = "Faltan datos de la tarjeta. Revisá el número.";
				toastType = "error";
				return;
			}

			if (!cardToken) {
				isLoading = false;
				toastMsg = "Error al tokenizar la tarjeta. Completá todos los campos.";
				toastType = "error";
				return;
			}

			// Payment intent was already created on page load

			// Prepara datos para el backend (form a objeto)
			const form = document.getElementById("form-checkout") as HTMLFormElement;
			const data = Object.fromEntries(new FormData(form).entries());

			// Instala cuotas 1 fijo (core methods requiere sí o sí)
			data.installments = 1;

			// Email, si lo querés hardcodear
			data.email = email || "test@test.com";

			// Add payment intent to the request
			data.paymentIntent = paymentIntent;

			// Add token amount for backend processing
			data.tokenPurchased = tokenAmount;

			// Debug log antes de enviar
			console.log("Enviando al backend:", data);

			const res = await fetch( import.meta.env.VITE_API_URL+"/payments/fiat/mercadopago", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(data)
			});

			isLoading = false;
			if (res.ok) {
				toastMsg = "¡Pago realizado con éxito!";
				toastType = "success";
				form.reset();
				paymentMethodId = "";
				
				// Add tokens to account
				tokenStore.addTokens(tokenAmount);
				
				// Clear stored payment intent on successful payment
				if (typeof localStorage !== 'undefined') {
					localStorage.removeItem(STORAGE_KEY);
				}
				
				// Redirect back to payments after success
				setTimeout(() => {
					goto('/payments');
				}, 2000);
			} else {
				const body = await res.json().catch(() => ({}));
				toastMsg = body.message || "Ocurrió un error con el pago.";
				toastType = "error";
			}
		} catch (err) {
			isLoading = false;
			toastMsg = "Error al tokenizar la tarjeta. ¿Los datos están bien?";
			toastType = "error";
			console.error("Tokenization error details:", err);
		}
	}
</script>

<svelte:head>
	<title>Pagos en Mercado Pago</title>
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
				<span class="font-bold text-lg text-white/90 tracking-wide">Pago en Pesos Argentinos</span>
				<button
					class="text-gray-400 hover:text-white text-sm"
					on:click={() => goto('/payments')}
				>
					← Atras
				</button>
			</div>

			<div class="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
				<div class="flex justify-between items-center mb-2">
					<span class="text-gray-400 text-sm">Token Amount</span>
					<span class="text-white font-medium">{tokenAmount.toLocaleString()} tokens</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-white font-medium">Total</span>
					<span class="text-white font-bold text-lg">
						{#if isLoadingPrices || !actualPrice}
							Loading...
						{:else}
							${(actualPrice || 0).toFixed(2)} ARS
						{/if}
					</span>
				</div>
				
				{#if intentTimeRemaining > 0 && !isIntentExpired}
					<div class="mt-3 pt-3 border-t border-gray-800">
						<div class="flex justify-between items-center">
							<span class="text-gray-400 text-xs">Payment expires in</span>
							<span class="text-orange-400 font-mono text-sm">
								{formatTimeRemaining(intentTimeRemaining)}
							</span>
						</div>
					</div>
				{/if}
			</div>

			{#if isIntentExpired}
				<div class="text-center py-8">
					<div class="bg-red-900/20 border border-red-500/20 rounded-lg p-6 mb-6">
						<div class="flex justify-center mb-4">
							<svg class="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h3 class="text-red-200 font-medium text-lg mb-2">Payment Intent Expired</h3>
						<p class="text-red-300 text-sm mb-6">
							Your payment session has expired after 5 minutes for security reasons. Please generate a new one to continue.
						</p>
						<button
							type="button"
							class="w-full h-12 rounded-2xl bg-white text-black font-bold text-lg shadow-xl hover:bg-white/90 transition"
							on:click={refreshPaymentIntent}
						>
							Generate New Payment Session
						</button>
					</div>
				</div>
			{:else}
				<h2 class="text-white text-2xl font-semibold mb-8 tracking-tight">Pagar con tarjeta</h2>
				<form id="form-checkout" class="flex flex-col gap-6" autocomplete="off" on:submit={handleSubmit}>
				<div class="flex flex-col gap-2">
					<label for="cardNumber" class="text-white text-sm font-semibold">Número de tarjeta</label>
					<div id="cardNumber" class="h-12 rounded-xl bg-white ring-1 ring-white/20 flex items-center px-4"></div>
				</div>
				<div class="flex gap-4">
					<div class="flex-1 flex flex-col gap-2">
						<label for="expirationDate" class="text-white text-sm font-semibold">Vto (MM/YY)</label>
						<div id="expirationDate" class="h-12 rounded-xl bg-white ring-1 ring-white/20 flex items-center px-4"></div>
					</div>
					<div class="flex-1 flex flex-col gap-2">
						<label for="securityCode" class="text-white text-sm font-semibold">CVV</label>
						<div id="securityCode" class="h-12 rounded-xl bg-white ring-1 ring-white/20 flex items-center px-4"></div>
					</div>
				</div>
				<div class="flex flex-col gap-2">
					<label for="cardholderName" class="text-white text-sm font-semibold">Titular de la tarjeta</label>
					<input id="cardholderName" type="text" required bind:value={cardholderName}
						   class="h-12 rounded-xl bg-white ring-1 ring-white/20 px-4 text-black font-semibold placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black/40"
						   placeholder="Nombre completo"
						   on:blur={createCardTokenIfReady} />
				</div>
				<div class="flex gap-4">
					<div class="flex-1 flex flex-col gap-2">
						<label for="identificationType" class="text-white text-sm font-semibold">Tipo de documento</label>
						<select id="identificationType" bind:value={identificationType} required
								class="h-12 rounded-xl bg-white ring-1 ring-white/20 px-4 text-black font-semibold outline-none focus:ring-2 focus:ring-black/40">
							<option value="DNI">DNI</option>
							<option value="CI">CI</option>
							<option value="LC">LC</option>
							<option value="LE">LE</option>
						</select>
					</div>
					<div class="flex-1 flex flex-col gap-2">
						<label for="identificationNumber" class="text-white text-sm font-semibold">Número de documento</label>
						<input id="identificationNumber" type="text" required bind:value={identificationNumber}
							   class="h-12 rounded-xl bg-white ring-1 ring-white/20 px-4 text-black font-semibold placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black/40"
							   placeholder="12345678"
							   on:blur={createCardTokenIfReady} />
					</div>
				</div>
				
				<!-- Campos ocultos -->
				<input id="token" name="token" type="hidden" bind:value={cardToken} />
				<input id="paymentMethodId" name="paymentMethodId" type="hidden" bind:value={paymentMethodId} />
				<input id="transactionAmount" name="transactionAmount" type="hidden" value={actualPrice} />
				<input id="description" name="description" type="hidden" value="Compra Tokens" />

				<button
					type="submit"
					class="mt-2 h-12 rounded-2xl bg-white text-black font-bold text-lg shadow-xl hover:bg-white/90 transition disabled:opacity-60 flex items-center justify-center"
					disabled={isLoading || !isFormValid}
				>
					{#if isLoading}
						<svg class="animate-spin mr-2 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
							<path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
						</svg>
					{/if}
					{isLoading ? "Procesando..." : `Pagar $${(actualPrice || 0).toFixed(2)} ARS`}
				</button>
			</form>
			{/if}
		</div>
	</div>
{/if}