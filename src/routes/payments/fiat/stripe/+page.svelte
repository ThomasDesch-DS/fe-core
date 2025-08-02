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
	$: priceUSD = tokenPrices ? calculateTokenPriceUSD(tokenAmount) : 0;
	
	let tokenPrices: any = null;
	let isLoadingPrices = true;

	function calculateTokenPriceUSD(amount: number): number {
		if (!tokenPrices || !tokenPrices.packages) return 0;
		
		// Find the appropriate package or calculate custom price
		const matchingPackage = tokenPrices.packages.find(pkg => pkg.minTokens === amount);
		if (matchingPackage) {
			return matchingPackage.priceUsd;
		}
		
		// For custom amounts, use the base rate from the first package
		if (tokenPrices.packages.length > 0) {
			const basePackage = tokenPrices.packages[0];
			return (amount * basePackage.priceUsd) / basePackage.minTokens;
		}
		
		return 0;
	}

	async function fetchTokenPrices() {
		try {
			const response = await fetch('/payments/token-prices', {
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

	let processing = false;

	onMount(async () => {
		if (!isAuthenticated) {
			goto('/');
			return;
		}
		
		await fetchTokenPrices();
	});

	async function handlePayment() {
		processing = true;
		
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		// Simulate successful payment
		tokenStore.addTokens(tokenAmount);
		
		alert(`Successfully added ${tokenAmount} tokens to your account!`);
		goto('/payments');
	}
</script>

<svelte:head>
	<title>Pago en Dolares</title>
</svelte:head>

{#if isAuthenticated}
	<div class="min-h-screen bg-black">
		<div class="max-w-md mx-auto py-12 px-4">
			<div class="bg-black border border-gray-800 rounded-lg">
				<div class="px-6 py-8">
					<div class="text-center mb-8">
						<div class="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
							<span class="text-white font-bold text-lg">S</span>
						</div>
						<h1 class="text-2xl font-medium text-white mb-2">Stripe</h1>
						<p class="text-gray-400 text-sm">Complete your payment securely</p>
					</div>

					<div class="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
						<div class="flex justify-between items-center mb-4">
							<span class="text-gray-400">Token Amount</span>
							<span class="text-white font-medium">{tokenAmount.toLocaleString()} tokens</span>
						</div>
						<div class="flex justify-between items-center mb-4">
							<span class="text-gray-400">Rate</span>
							<span class="text-white font-medium">
								{#if isLoadingPrices}
									Loading...
								{:else if tokenPrices?.packages?.[0]}
									${tokenPrices.packages[0].priceUsd} USD per {tokenPrices.packages[0].minTokens} tokens
								{/if}
							</span>
						</div>
						<div class="border-t border-gray-800 pt-4">
							<div class="flex justify-between items-center">
								<span class="text-white font-medium">Total</span>
								<span class="text-white font-bold text-lg">
									{#if isLoadingPrices}
										Loading...
									{:else}
										${priceUSD.toFixed(2)} USD
									{/if}
								</span>
							</div>
						</div>
					</div>

					<div class="space-y-4">
						<div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
							<div class="flex items-center mb-3">
								<div class="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
								<span class="text-white text-sm font-medium">Secure Payment</span>
							</div>
							<p class="text-gray-400 text-xs">Your payment is protected by Stripe's industry-leading security</p>
						</div>

						<button
							class="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
							disabled={processing}
							on:click={handlePayment}
						>
							{#if processing}
								<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Processing...
							{:else}
								{#if isLoadingPrices}
									Loading...
								{:else}
									Pay ${priceUSD.toFixed(2)} USD
								{/if}
							{/if}
						</button>

						<button
							class="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 border border-gray-800"
							on:click={() => goto('/payments')}
						>
							← Back to Payments
						</button>
					</div>

					<div class="mt-6 text-center">
						<p class="text-xs text-gray-500">
							Powered by Stripe • Secure & Fast
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}