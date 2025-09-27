<script>
  import { onMount } from 'svelte';
  import posthog from 'posthog-js';

  let buttonText = 'Cargando...';
  let variantKey = null;
  let isLoading = false;
  let showButton = false;
  let userInput = '';
  let showInput = false;

  onMount(() => {
    if (!posthog || !posthog.isFeatureEnabled) {
      showButton = false;
      return;
    }

    try {
      posthog.onFeatureFlags(() => {
        variantKey = posthog.getFeatureFlag('squirt_button_text_test');
        const payload = posthog.getFeatureFlagPayload('squirt_button_text_test');

        buttonText = payload?.key || variantKey || 'Entrar';
        showButton = !!variantKey;

        if (showButton) {
          posthog.capture('squirt_button_viewed', {
            variant: variantKey,
            text: buttonText,
          });
        }
      });
    } catch (error) {
      console.warn('PostHog connection failed:', error);
      showButton = false;
    }
  });

  function handleClick() {
    if (isLoading || !showButton) return;
    showInput = true;
  }

  function submitInfo() {
    if (!userInput) return;

    try {
      posthog.capture('squirt_waitlist_submitted', {
        variant: variantKey,
        text: buttonText,
        contact: userInput,
      });
      userInput = '';
      showInput = false;
      alert('✅ Gracias! Te avisamos pronto.');
    } catch (error) {
      console.warn('PostHog tracking failed:', error);
    }
  }
</script>

{#if showButton}
  <div class="flex flex-col items-center gap-4">
    <button
            on:click={handleClick}
            disabled={isLoading}
            class="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 disabled:from-gray-600 disabled:to-gray-700 shadow-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            style="box-shadow: 0 4px 24px 0 rgb(236 72 153 / 30%);"
    >
      <span class="text-xl">💦</span>
      <span>{buttonText}</span>
    </button>

    {#if showInput}
      <div class="flex flex-col items-center gap-2">
        <input
                type="text"
                bind:value={userInput}
                placeholder="Dejanos tu mail, cel o @telegram"
                class="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 w-64 text-sm"
        />
        <button
                on:click={submitInfo}
                class="px-4 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold transition-all duration-200"
        >
          Enviar
        </button>
      </div>
    {/if}
  </div>
{/if}
