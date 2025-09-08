<script lang="ts">
  import { stepStore } from '../../store/formStore';
  import { submitRegistration } from '../../api/registerApi';
  import SuccessRegister from '../SuccessRegister.svelte';
  import LoadingAnimation from "../../../common/LoadingAnimation.svelte";
  import { trackUserRegister, trackRegisterStepSubmit, trackRegisterStepSubmitSubmit } from "../../../analytics/analytics";
  import { onMount } from 'svelte';

  export let formData;

  let submitError = '';
  let loading = false;
  let registrationSuccess = false;

  async function submit() {
    loading = true;
    submitError = '';

    try {
      await submitRegistration(formData);
      registrationSuccess = true;
      trackUserRegister({ success: true, userType: 'Escort' });
    } catch (error) {
      submitError = error.message || 'Error al registrar. Intentá nuevamente.';
      trackUserRegister({ success: false, userType: 'Escort', error: error.message });
      console.error(error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    trackRegisterStepSubmit({ userType: 'Escort' });
  });

  $: {
    if ($stepStore === 39) {
      trackRegisterStepSubmitSubmit({ userType: 'Escort' });
    }
  }
</script>

<!-- Paso 39: Final y Submit -->
{#if $stepStore === 39}
  <section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    {#if loading}
      <div class="min-h-screen flex flex-col justify-center items-center bg-black px-4">
        <LoadingAnimation />
      </div>
    {:else if registrationSuccess}
      <SuccessRegister displayName={formData.displayName} />
    {:else}
      <header class="mb-6">
        <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
          ¡Todo listo, {formData.displayName}!
        </h2>
      </header>

      {#if submitError}
        <div class="bg-red-900 border border-red-500 rounded p-3 mb-4">
          <p class="text-white">{submitError}</p>
        </div>
      {/if}

      <div class="sticky bottom-4 mt-6">
        <button
          class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
          on:click={submit} disabled={loading}>
          Enviar y completar
        </button>
      </div>
    {/if}
  </section>
{/if}
