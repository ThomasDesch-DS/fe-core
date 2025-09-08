<script lang="ts">
  import { stepStore } from '../../store/formStore';
  import TextInput from '../TextInput.svelte';
  import { contactTypes } from '../../store/formStore';
  import { onMount } from 'svelte';
  import {
    trackRegisterStepDescription,
    trackRegisterStepDescriptionDescription,
    trackRegisterStepDescriptionContactMethods
  } from '../../../analytics/analytics';

  export let formData;

  // Step handlers
  function handleDescription() {
    if (!formData.description.trim()) return;
    stepStore.set(36);
  }

  function addContactMethod() {
    formData.contactMethods = [
      ...formData.contactMethods,
      { value: '', type: '' }
    ];
  }

  function handleContacts() {
    stepStore.set(37);
  }

  onMount(() => {
    trackRegisterStepDescription({ userType: 'Escort' });
  });

  $: {
    switch ($stepStore) {
      case 35:
        trackRegisterStepDescriptionDescription({ userType: 'Escort' });
        break;
      case 36:
        trackRegisterStepDescriptionContactMethods({ userType: 'Escort' });
        break;
    }
  }
</script>

<!-- Paso 35: Descripción -->
{#if $stepStore === 35}
  <section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Descripción
      </h2>
      <p class="mt-2 text-neutral-400">
        Contanos un poco de vos...
      </p>
    </header>

    <textarea
      bind:value={formData.description}
      rows="4"
      placeholder="Describite en algunas líneas..."
      class="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded mb-4"
    />

    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleDescription}
      >
        {formData.description.trim() ? '¡Quedó genial!' : 'Siguiente'}
      </button>
    </div>
  </section>
{/if}

<!-- Paso 36: Métodos de contacto -->
{#if $stepStore === 36}
  <section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Métodos de contacto
      </h2>
      <p class="mt-2 text-neutral-400">
        Agregá cómo querés que te contacten.
      </p>
    </header>

    <button
      on:click={addContactMethod}
      class="mb-4 w-full py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
    >
      + Agregar método
    </button>

    {#each formData.contactMethods as cm, idx}
      <div class="bg-gray-900 p-4 rounded mb-4 text-left">
        <select
          bind:value={cm.type}
          class="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded mb-2"
        >
          <option value="" disabled selected hidden>Tipo</option>
          {#each contactTypes as ct}
            <option value={ct.value}>{ct.label}</option>
          {/each}
        </select>
        <TextInput bind:value={cm.value} placeholder="Número o usuario" />
      </div>
    {/each}

    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleContacts}
      >
        {formData.contactMethods.length ? '¡Perfecto!' : 'Siguiente'}
      </button>
    </div>
  </section>
{/if}
