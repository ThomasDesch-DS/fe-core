<script lang="ts">
  import { onMount } from 'svelte';
  import posthog from 'posthog-js';
  import { toast } from 'svelte-sonner';

  const FLAG_KEY = 'squirt_btn';

  let buttonText = 'Cargando...';
  let variantKey: string | null = null;
  let isLoading = false;
  let showButton = false;
  let showInput = false;
  let userInput = '';
  let isSubmitting = false;

  onMount(() => {
    if (!posthog || !posthog.isFeatureEnabled) {
      showButton = false;
      return;
    }

    try {
      posthog.onFeatureFlags(() => {
        variantKey = posthog.getFeatureFlag(FLAG_KEY) as string | null;
        const payload = posthog.getFeatureFlagPayload(FLAG_KEY) as { key?: string } | null;

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

    posthog.capture('squirt_button_clicked', {
      variant: variantKey,
      text: buttonText,
    });

    showInput = true;
  }

  async function submitInfo() {
    if (!userInput) return;
    isSubmitting = true;

    try {
      await new Promise((r) => setTimeout(r, 800));

      posthog.capture('squirt_waitlist_submitted', {
        variant: variantKey,
        text: buttonText,
        contact: userInput,
      });

      userInput = '';
      showInput = false;
      toast('✅ ¡Gracias! Te avisamos pronto');
    } catch (err) {
      console.warn('PostHog tracking failed:', err);
    } finally {
      isSubmitting = false;
    }
  }
</script>

{#if showButton}
  <div class="flex flex-col items-center gap-4">
    <!-- Botón principal -->
    <button
            on:click={handleClick}
            disabled={isLoading}
            class="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 disabled:from-gray-600 disabled:to-gray-700 shadow-lg text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            style="box-shadow: 0 4px 24px 0 rgb(236 72 153 / 30%);"
    >
      <span class="text-xl">💦</span>
      {#if isLoading}
        <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        <span>Cargando...</span>
      {:else}
        <span>{buttonText}</span>
      {/if}
    </button>

    <!-- Input + submit -->
    {#if showInput}
      <div class="flex flex-col items-center gap-3 w-full max-w-xs">
        <input
                type="text"
                bind:value={userInput}
                placeholder="Dejanos tu mail, cel o @telegram"
                class="px-4 py-2 rounded-md bg-zinc-900/80 text-white placeholder-zinc-400 border border-pink-500/60 focus:outline-none focus:ring-2 focus:ring-pink-500 w-full text-sm"
                disabled={isSubmitting}
        />
        <button
                on:click={submitInfo}
                disabled={isSubmitting}
                class="px-4 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full"
        >
          {#if isSubmitting}
            <svg
                    class="w-4 h-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
            >
              <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
              ></circle>
              <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          {:else}
            Enviar
          {/if}
        </button>
      </div>
    {/if}
  </div>
{/if}
