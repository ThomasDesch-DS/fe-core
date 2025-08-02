<script lang="ts">
	import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
	import { escortAuthStore } from '$lib/escort/store/escortAuthStore';
	import { tokenStore } from '$lib/store/tokenStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let showCreditCardOptions = false;
	let showCryptoOptions = false;
	let selectedTokenAmount = 500;
	let customTokenAmount = '';
	let showCustomInput = false;
	let tokenPrices: any = null;
	let isLoadingPrices = true;
	let selectedCurrency = 'usd';

	const currencies = [
		{ key: 'usd', label: 'USD', symbol: '$', packageKey: 'priceUsd' },
		{ key: 'ars', label: 'ARS', symbol: '$', packageKey: 'priceArs' },
		{ key: 'btc', label: 'BTC', symbol: '₿', packageKey: 'priceBtc' },
		{ key: 'eth', label: 'ETH', symbol: 'Ξ', packageKey: 'priceEth' },
		{ key: 'usdc', label: 'USDC', symbol: '$', packageKey: 'priceUSDC' },
		{ key: 'usdt', label: 'USDT', symbol: '₮', packageKey: 'priceUSDT' }
	];

	$: isUserAuthenticated = $dSuserAuthStore.isAuthenticated;
	$: isEscortAuthenticated = $escortAuthStore.isAuthenticated;
	$: isAuthenticated = isUserAuthenticated || isEscortAuthenticated;

	$: tokenPrice = calculateTokenPrice(selectedTokenAmount, selectedCurrency);
	$: availablePaymentMethods = tokenPrices ? getAvailablePaymentMethods() : { crypto: [], fiat: [] };
	$: selectedCurrencyInfo = currencies.find(c => c.key === selectedCurrency);
	$: availableCurrencies = tokenPrices ? getAvailableCurrencies() : [];

	function calculateTokenPrice(amount: number, currency: string): number {
		if (!tokenPrices || !tokenPrices.packages) {
			console.log('No token prices or packages');
			return 0;
		}
		
		const currencyInfo = currencies.find(c => c.key === currency);
		if (!currencyInfo) {
			console.log('Currency not found:', currency);
			return 0;
		}
		
		console.log('Calculating price for:', amount, currency, currencyInfo.packageKey);
		
		// Find the appropriate package or calculate custom price
		const matchingPackage = tokenPrices.packages.find(pkg => pkg.minTokens === amount);
		if (matchingPackage) {
			const price = matchingPackage[currencyInfo.packageKey] || 0;
			console.log('Found matching package:', matchingPackage, 'Price:', price);
			return price;
		}
		
		// For custom amounts, use the base rate from the first package
		if (tokenPrices.packages.length > 0) {
			const basePackage = tokenPrices.packages[0];
			const price = (amount * (basePackage[currencyInfo.packageKey] || 0)) / basePackage.minTokens;
			console.log('Calculated custom price:', price);
			return price;
		}
		
		return 0;
	}

	function getAvailableCurrencies() {
		if (!tokenPrices) return [];
		
		return currencies.filter(currency => {
			// Exclude XMR as it's disabled
			if (currency.key === 'xmr') return false;
			
			// Check if this currency is available (not null)
			return tokenPrices[currency.key] !== null && tokenPrices[currency.key] !== undefined;
		});
	}

	function getAvailablePaymentMethods() {
		if (!tokenPrices) {
			console.log('tokenPrices is null/undefined');
			return { crypto: [], fiat: [] };
		}

		console.log('tokenPrices:', tokenPrices);
		
		const crypto = [];
		const fiat = [];
		
		// Check crypto currencies - only disable if explicitly null
		if (tokenPrices.btc !== null && tokenPrices.btc !== undefined) {
			crypto.push('btc');
		}
		if (tokenPrices.eth !== null && tokenPrices.eth !== undefined) {
			crypto.push('eth');
		}
		if (tokenPrices.usdc !== null && tokenPrices.usdc !== undefined) {
			crypto.push('usdc');
		}
		if (tokenPrices.usdt !== null && tokenPrices.usdt !== undefined) {
			crypto.push('usdt');
		}
		
		// Check fiat currencies - only disable if explicitly null
		if (tokenPrices.usd !== null && tokenPrices.usd !== undefined) {
			fiat.push('stripe');
		}
		if (tokenPrices.ars !== null && tokenPrices.ars !== undefined) {
			fiat.push('mercado_pago');
		}
		
		console.log('Available payment methods:', { crypto, fiat });
		return { crypto, fiat };
	}

	const tokenOptions = [
		{ tokens: 500, label: '500 tokens' },
		{ tokens: 1000, label: '1000 tokens' },
		{ tokens: 1500, label: '1500 tokens' },
		{ tokens: 0, label: 'Custom amount' }
	];

	async function fetchTokenPrices() {
		try {
			console.log('Fetching token prices from:', import.meta.env.VITE_API_URL+'/payments/token-prices');
			const response = await fetch( import.meta.env.VITE_API_URL+'/payments/token-prices', {
				credentials: 'include'
			});
			
			if (response.ok) {
				tokenPrices = await response.json();
				console.log('Successfully fetched token prices:', tokenPrices);
			} else {
				console.error('Failed to fetch token prices, status:', response.status);
				tokenPrices = null;
			}
		} catch (error) {
			console.error('Error fetching token prices:', error);
			tokenPrices = null;
		} finally {
			isLoadingPrices = false;
		}
	}

	onMount(async () => {
		if (!isAuthenticated) {
			goto('/');
			return;
		}
		
		// Make sure 500 tokens is selected by default
		selectedTokenAmount = 500;
		
		await fetchTokenPrices();
	});

	function handleTokenAmountSelect(amount: number) {
		if (amount === 0) {
			showCustomInput = true;
			selectedTokenAmount = 2000; // Default minimum
		} else {
			showCustomInput = false;
			selectedTokenAmount = amount;
		}
	}

	function handleCustomTokenInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value) || 0;
		if (value >= 2000) {
			selectedTokenAmount = value;
		} else {
			selectedTokenAmount = 2000;
		}
	}

	function handleCreditCardClick() {
		showCreditCardOptions = !showCreditCardOptions;
		showCryptoOptions = false;
	}

	function handleCryptoClick() {
		showCryptoOptions = !showCryptoOptions;
		showCreditCardOptions = false;
	}

	function handlePaymentMethodSelect(method: string) {
		if (method === 'mercado_pago') {
			goto(`/payments/fiat/mercadopago?tokens=${selectedTokenAmount}`);
		} else if (method === 'stripe') {
			goto(`/payments/fiat/stripe?tokens=${selectedTokenAmount}`);
		} else if (method === 'usdc') {
			goto(`/payments/crypto/usdc?tokens=${selectedTokenAmount}`);
		} else {
			console.log(`Selected payment method: ${method}`);
		}
	}
</script>

<svelte:head>
	<title>Gestionar pagos</title>
	<style>
		@keyframes fade-in {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}
		.animate-fade-in {
			animation: fade-in 0.3s ease-in-out forwards;
		}
	</style>
</svelte:head>
{#if isAuthenticated}
	<div class="min-h-screen bg-black">
		<div class="max-w-md mx-auto py-12 px-4">
			<div class="bg-black border border-gray-800 rounded-lg">
				<div class="px-6 py-8">
					<div class="text-center mb-8">
						<h1 class="text-2xl font-medium text-white mb-2">Pagos</h1>
						<p class="text-gray-400 text-sm">Agregá tokens a tu cuenta</p>
					</div>

					<div class="bg-gray-900 rounded-lg p-6 mb-8 text-center border border-gray-800">
						<div class="text-xs text-gray-400 mb-1 uppercase tracking-wide">Saldo actual</div>
						<div class="text-4xl font-light text-white">
							{$tokenStore.tokens}
							<span class="text-lg font-normal text-gray-400 ml-2">tokens</span>
						</div>
					</div>

					<div class="mb-8">
						<div class="flex justify-between items-center mb-4">
							<div class="text-sm text-gray-400 uppercase tracking-wide">Elegí la cantidad de tokens</div>
							<div class="flex items-center gap-1">
								<span class="text-xs text-gray-500">Mostrar en:</span>
								<select
										bind:value={selectedCurrency}
										class="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 focus:outline-none focus:border-gray-600"
								>
									{#each availableCurrencies as currency}
										<option value={currency.key}>{currency.symbol} {currency.label}</option>
									{/each}
								</select>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3 mb-4">
							{#each tokenOptions as option}
								<button
										class="p-4 rounded-lg border transition-all duration-200 {selectedTokenAmount === option.tokens || (option.tokens === 0 && showCustomInput) ? 'bg-white text-black border-white' : 'bg-gray-900 text-white border-gray-800 hover:border-gray-700'}"
										on:click={() => handleTokenAmountSelect(option.tokens)}
								>
									<div class="text-sm font-medium">{option.label}</div>
									{#if option.tokens > 0}
										<div class="text-xs {selectedTokenAmount === option.tokens ? 'text-gray-600' : 'text-gray-400'} mt-1">
											{#if isLoadingPrices}
												Cargando...
											{:else if selectedCurrencyInfo}
												{selectedCurrencyInfo.symbol}{calculateTokenPrice(option.tokens, selectedCurrency).toFixed(selectedCurrency === 'btc' || selectedCurrency === 'eth' ? 6 : 2)} {selectedCurrencyInfo.label}
											{/if}
										</div>
									{/if}
								</button>
							{/each}
						</div>

						{#if showCustomInput}
							<div class="mb-4">
								<input
										type="number"
										min="2000"
										placeholder="Ingresá la cantidad de tokens (mínimo 2000)"
										class="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
										on:input={handleCustomTokenInput}
										bind:value={customTokenAmount}
								/>
								<div class="text-xs text-gray-500 mt-1">Mínimo: 2000 tokens</div>
							</div>
						{/if}

						<div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
							<div class="flex justify-between items-center text-sm">
								<span class="text-gray-400">Precio total:</span>
								<span class="text-white font-medium">
									{#if isLoadingPrices}
										Cargando...
									{:else if selectedCurrencyInfo}
										{selectedCurrencyInfo.symbol}{tokenPrice.toFixed(selectedCurrency === 'btc' || selectedCurrency === 'eth' ? 6 : 2)} {selectedCurrencyInfo.label}
									{/if}
								</span>
							</div>
						</div>
					</div>

					<div class="space-y-3">
						<div class="relative">
							<button
									class="w-full bg-white hover:bg-gray-100 text-black font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center group"
									on:click={handleCreditCardClick}
							>
								<svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
								</svg>
								Pagar con tarjeta de crédito
								<svg class="w-4 h-4 ml-auto transition-transform duration-200 {showCreditCardOptions ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{#if showCreditCardOptions}
								<div class="absolute z-10 w-full mt-2 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl">
									{#if availablePaymentMethods.fiat.includes('mercado_pago')}
										<button
												class="w-full px-6 py-3 text-left hover:bg-gray-800 first:rounded-t-lg transition-colors duration-200"
												on:click={() => handlePaymentMethodSelect('mercado_pago')}
										>
											<div class="flex items-center">
												<div class="w-8 h-8 bg-blue-500 rounded mr-3 flex items-center justify-center">
													<span class="text-white font-bold text-xs">MP</span>
												</div>
												<span class="font-medium text-white">Mercado Pago</span>
											</div>
										</button>
									{:else}
										<div class="w-full px-6 py-3 text-left opacity-50 cursor-not-allowed first:rounded-t-lg">
											<div class="flex items-center">
												<div class="w-8 h-8 bg-gray-600 rounded mr-3 flex items-center justify-center">
													<span class="text-white font-bold text-xs">MP</span>
												</div>
												<span class="font-medium text-gray-400">Mercado Pago (No disponible)</span>
											</div>
										</div>
									{/if}
									{#if availablePaymentMethods.fiat.includes('stripe')}
										<button
												class="w-full px-6 py-3 text-left hover:bg-gray-800 last:rounded-b-lg border-t border-gray-800 transition-colors duration-200"
												on:click={() => handlePaymentMethodSelect('stripe')}
										>
											<div class="flex items-center">
												<div class="w-8 h-8 bg-purple-500 rounded mr-3 flex items-center justify-center">
													<span class="text-white font-bold text-xs">S</span>
												</div>
												<span class="font-medium text-white">Stripe</span>
											</div>
										</button>
									{:else}
										<div class="w-full px-6 py-3 text-left opacity-50 cursor-not-allowed last:rounded-b-lg border-t border-gray-800">
											<div class="flex items-center">
												<div class="w-8 h-8 bg-gray-600 rounded mr-3 flex items-center justify-center">
													<span class="text-white font-bold text-xs">S</span>
												</div>
												<span class="font-medium text-gray-400">Stripe (No disponible)</span>
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>

						<div class="relative">
							<button
									class="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center border border-gray-800"
									on:click={handleCryptoClick}
							>
								<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
								</svg>
								Pagar con cripto
								<svg class="w-4 h-4 ml-auto transition-transform duration-200 {showCryptoOptions ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{#if showCryptoOptions}
								<div class="absolute z-10 w-full mt-2 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl">
									{#if availablePaymentMethods.crypto.includes('btc')}
										<button
												class="w-full px-6 py-3 text-left hover:bg-gray-800 first:rounded-t-lg transition-colors duration-200"
												on:click={() => handlePaymentMethodSelect('btc')}
										>
											<div class="flex items-center">
												<div class="w-8 h-8 bg-orange-500 rounded mr-3 flex items-center justify-center">
													<span class="text-white font-bold text-xs">₿</span>
												</div>
												<span class="font-medium text-white">Bitcoin</span>
											</div>
										</button>
									{:else}
										<div class="w-full px-6 py-3 text-left opacity-50 cursor-not-allowed first:rounded-t-lg">
											<div class="flex items-center">
												<div class="w-8 h-8 bg-gray-600 rounded mr-3 flex items-center justify-center">
													<span class="text-white font-bold text-xs">₿</span>
												</div>
												<span class="font-medium text-gray-400">Bitcoin (No disponible)</span>
											</div>
										</div>
									{/if}
									{#if availablePaymentMethods.crypto.includes('eth')}
										<button
												class="w-full px-6 py-3 text-left hover:bg-gray-800 border-t border-gray-800 transition-colors duration-200"
												on:click={() => handlePaymentMethodSelect('eth')}
										>
											<div class="flex items-center">
												<div class="w-8 h-8 bg-blue-600 rounded mr-3 flex items-center justify-center">
													<span class="text-white font-bold text-xs">Ξ</span>
												</div>
												<span class="font-medium text-white">Ethereum</span>
											</div>
										</button>
									{:else}
										<div class="w-full px-6 py-3 text-left opacity-50 cursor-not-allowed border-t border-gray-800">
											<div class="flex items-center">
												<div class="w-8 h-8 bg-gray-600 rounded mr-3 flex items-center justify-center">
													<span class="text-white font-bold text-xs">Ξ</span>
												</div>
												<span class="font-medium text-gray-400">Ethereum (No disponible)</span>
											</div>
										</div>
									{/if}
									{#if availablePaymentMethods.crypto.includes('usdc')}
										<button
												class="w-full px-6 py-3 text-left hover:bg-gray-800 border-t border-gray-800 transition-colors duration-200"
												on:click={() => handlePaymentMethodSelect('usdc')}
										>
											<div class="flex items-center">
												<div class="w-8 h-8 bg-blue-500 rounded mr-3 flex items-center justify-center">
													<span class="text-white font-bold text-xs">$</span>
												</div>
												<span class="font-medium text-white">USD Coin</span>
											</div>
										</button>
									{:else}
										<div class="w-full px-6 py-3 text-left opacity-50 cursor-not-allowed border-t border-gray-800">
											<div class="flex items-center">
												<div class="w-8 h-8 bg-gray-600 rounded mr-3 flex items-center justify-center">
													<span class="text-white font-bold text-xs">$</span>
												</div>
												<span class="font-medium text-gray-400">USD Coin (No disponible)</span>
											</div>
										</div>
									{/if}
									{#if availablePaymentMethods.crypto.includes('usdt')}
										<button
												class="w-full px-6 py-3 text-left hover:bg-gray-800 border-t border-gray-800 transition-colors duration-200"
												on:click={() => handlePaymentMethodSelect('usdt')}
										>
											<div class="flex items-center">
												<div class="w-8 h-8 bg-green-500 rounded mr-3 flex items-center justify-center">
													<span class="text-white font-bold text-xs">₮</span>
												</div>
												<span class="font-medium text-white">Tether</span>
											</div>
										</button>
									{:else}
										<div class="w-full px-6 py-3 text-left opacity-50 cursor-not-allowed border-t border-gray-800">
											<div class="flex items-center">
												<div class="w-8 h-8 bg-gray-600 rounded mr-3 flex items-center justify-center">
													<span class="text-white font-bold text-xs">₮</span>
												</div>
												<span class="font-medium text-gray-400">Tether (No disponible)</span>
											</div>
										</div>
									{/if}
									<!-- XMR está deshabilitado según lo pedido -->
									<div class="w-full px-6 py-3 text-left opacity-50 cursor-not-allowed border-t border-gray-800 last:rounded-b-lg">
										<div class="flex items-center">
											<div class="w-8 h-8 bg-gray-600 rounded mr-3 flex items-center justify-center">
												<span class="text-white font-bold text-xs">M</span>
											</div>
											<span class="font-medium text-gray-400">Monero (Deshabilitado)</span>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<div class="mt-8 text-center">
						<p class="text-xs text-gray-500">
							Pagos seguros con los mejores proveedores
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
