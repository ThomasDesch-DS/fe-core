<script lang="ts">
	import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
	import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
	import { tokenStore } from '$lib/store/tokenStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	$: isUserAuthenticated = $dSuserAuthStore.isAuthenticated;
	$: isEscortAuthenticated = $escortAuthStore.isAuthenticated;
	$: isAuthenticated = isUserAuthenticated || isEscortAuthenticated;

	$: tokenAmount = parseInt($page.url.searchParams.get('tokens') || '500');
	$: priceARS = tokenPrices ? calculateTokenPriceARS(tokenAmount) : 0;
	
	let tokenPrices: any = null;
	let isLoadingPrices = true;

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

	let mp: any;
	let isLoading = false;
	let toastMsg = "";
	let toastType: "success" | "error" | "" = "";
	let paymentMethodId = "";
	let email = "";
	let isFormValid = false;

	onMount(async () => {
		if (!isAuthenticated) {
			goto('/');
			return;
		}
		
		await fetchTokenPrices();

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


		// BIN Change para obtener paymentMethodId
		let currentBin = "";
		cardNumberElement.on("binChange", async (data) => {
			const bin = data.bin;
			if (bin && bin.length >= 6 && bin !== currentBin) {
				try {
					const { results } = await mp.getPaymentMethods({ bin });
					const pm = results[0];
					if (pm) {
						paymentMethodId = pm.id;
						document.getElementById("paymentMethodId").value = pm.id;
						console.log("paymentMethodId seteado:", pm.id);
					} else {
						paymentMethodId = "";
						document.getElementById("paymentMethodId").value = "";
						console.log("No se encontró paymentMethodId para bin:", bin);
					}
				} catch (error) {
					console.error("Error getting payment methods:", error);
					paymentMethodId = "";
					document.getElementById("paymentMethodId").value = "";
				}
				validateForm();
			}
			currentBin = bin;
		});

		// Form validation
		function validateForm() {
			const cardholderName = document.getElementById("cardholderName")?.value || "";
			isFormValid = paymentMethodId !== "" && cardholderName.trim() !== "";
		}

		// Listen for cardholder name changes
		setTimeout(() => {
			document.getElementById("cardholderName")?.addEventListener("input", validateForm);
		}, 100);

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
			// Tokeniza la tarjeta
			const tokenRes = await mp.fields.createCardToken({
				cardholderName: document.getElementById("cardholderName").value,
			});
			document.getElementById("token").value = tokenRes.id;

			// Validar paymentMethodId antes de seguir
			if (!paymentMethodId) {
				isLoading = false;
				toastMsg = "Faltan datos de la tarjeta. Revisá el número.";
				toastType = "error";
				return;
			}

			// Prepara datos para el backend (form a objeto)
			const form = document.getElementById("form-checkout") as HTMLFormElement;
			const data = Object.fromEntries(new FormData(form).entries());

			// Instala cuotas 1 fijo (core methods requiere sí o sí)
			data.installments = 1;

			// Email, si lo querés hardcodear
			data.email = email || "test@test.com";

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
			console.error(err);
		}
	}
</script>

<svelte:head>
	<title>Mercado Pago Payment - DeepSeek</title>
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
				<span class="font-bold text-lg text-white/90 tracking-wide">DeepSeek Payment</span>
				<button
					class="text-gray-400 hover:text-white text-sm"
					on:click={() => goto('/payments')}
				>
					← Back
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
						{#if isLoadingPrices}
							Loading...
						{:else}
							${priceARS.toFixed(2)} ARS
						{/if}
					</span>
				</div>
			</div>

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
					<input id="cardholderName" type="text" required
						   class="h-12 rounded-xl bg-white ring-1 ring-white/20 px-4 text-black font-semibold placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-black/40"
						   placeholder="Nombre completo" />
				</div>
				
				<!-- Campos ocultos -->
				<input id="token" name="token" type="hidden" />
				<input id="paymentMethodId" name="paymentMethodId" type="hidden" />
				<input id="transactionAmount" name="transactionAmount" type="hidden" value={priceARS} />
				<input id="description" name="description" type="hidden" value="Compra DeepSeek Tokens" />

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
					{isLoading ? "Procesando..." : `Pagar $${priceARS.toFixed(2)} ARS`}
				</button>
			</form>
		</div>
	</div>
{/if}