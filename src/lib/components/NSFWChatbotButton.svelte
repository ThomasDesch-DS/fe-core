<script>
  import { onMount } from 'svelte';
  import posthog from 'posthog-js';
  import { toast } from 'svelte-sonner';

  let buttonText = 'Cargando...';
  let variantKey = null;
  let description = '';
  let isLoading = false;
  let showButton = false;

  onMount(() => {
    // Check if PostHog is properly initialized and connected
    if (!posthog || !posthog.isFeatureEnabled) {
      showButton = false;
      return;
    }

    try {
      posthog.onFeatureFlags(() => {
        variantKey = posthog.getFeatureFlag('nsfw_button_text_test');
        const payload = posthog.getFeatureFlagPayload('nsfw_button_text_test');

        buttonText = payload?.key || variantKey || 'Entrar';

        // Only show button if we have a valid feature flag
        showButton = !!variantKey;

        if (showButton) {
          posthog.capture('nsfw button viewed', {
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
    
    isLoading = true;
    
    try {
      posthog.capture('nsfw button clicked', {
        variant: variantKey,
        text: buttonText,
        description
      });
    } catch (error) {
      console.warn('PostHog tracking failed:', error);
    }

    // Show work in progress toast
    setTimeout(() => {
      isLoading = false;
      toast('🚧 Todavía estamos trabajando en esta función. ¡Volvé pronto!');
    }, 800);
  }
</script>

{#if showButton}
<div class="flex justify-center">
  <button
    on:click={handleClick}
    disabled={isLoading}
    class="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 shadow-lg text-white font-semibold text-sm transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
    style="box-shadow: 0 4px 24px 0 rgb(220 38 127 / 30%);"
    title={description}
  >
    <span class="text-lg">🔥</span>
    {#if isLoading}
      <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      <span>Cargando...</span>
    {:else}
      <span>{buttonText}</span>
      <span class="ml-2 font-normal opacity-80 text-xs hidden sm:inline">Chat Porno</span>
    {/if}
  </button>
</div>
{/if}