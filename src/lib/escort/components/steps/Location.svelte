<script lang="ts">
  import { stepStore } from '../../store/formStore';
  import TextInput from '../TextInput.svelte';
  import SelectInput from '../SelectInput.svelte';
  import { countriesList } from '../../store/formStore';
  import { onMount } from 'svelte';
  import {
    trackRegisterStepLocation,
    trackRegisterStepLocationLocation
  } from '../../../analytics/analytics';

  export let formData;

  // Step handlers
  function handleLocation() {
    if (!formData.country || !formData.state.trim() || !formData.city.trim() || !formData.hood.trim()) return;
    stepStore.set(38);
  }

  onMount(() => {
    trackRegisterStepLocation({ userType: 'Escort' });
  });

  $: {
    if ($stepStore === 37) {
      trackRegisterStepLocationLocation({ userType: 'Escort' });
    }
  }
</script>

<!-- Paso 37: Ubicación -->
{#if $stepStore === 37}
  <section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Ubicación
      </h2>
      <p class="mt-2 text-neutral-400">
        ¿Dónde te van a encontrar?
      </p>
    </header>

    <SelectInput
      bind:value={formData.country}
      options={countriesList}
      placeholder="País"
    />
    <TextInput bind:value={formData.state} placeholder="Provincia/Estado" />
    <TextInput bind:value={formData.city} placeholder="Ciudad" />
    <TextInput bind:value={formData.hood} placeholder="Barrio/Zona" />

    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleLocation}
      >
        {formData.country && formData.state.trim() && formData.city.trim() && formData.hood.trim()
          ? '¡Listo!'
          : 'Siguiente'}
      </button>
    </div>
  </section>
{/if}
