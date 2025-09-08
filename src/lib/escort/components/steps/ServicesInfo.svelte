<script lang="ts">
  import { stepStore } from '../../store/formStore';
  import CheckboxGroup from '../CheckboxGroup.svelte';
  import {
    escortServices,
    escortFantasies,
    massageTypes,
    virtualServices,
    virtualServiceOptions
  } from '../../store/formStore';
  import { onMount } from 'svelte';
  import {
    trackRegisterStepServicesInfo,
    trackRegisterStepServicesInfoServices,
    trackRegisterStepServicesInfoFantasies,
    trackRegisterStepServicesInfoMassages,
    trackRegisterStepServicesInfoVirtual,
    trackRegisterStepServicesInfoHourPrice,
    trackRegisterStepServicesInfoCustomRates,
    trackRegisterStepServicesInfoGoToAvailability
  } from '../../../analytics/analytics';
  import TextInput from "../TextInput.svelte";

  export let formData;

  // Step handlers
  function handleServices() {
    if (!formData.selectedServices.size) return;
    stepStore.set(27);
  }

  function handleFantasies() {
    stepStore.set(28);
  }

  function handleMassages() {
    stepStore.set(29);
  }

  function handleVirtual() {
    stepStore.set(30);
  }

  function handleHourPrice() {
    if (!parseFloat(formData.hourPriceAmount)) return;
    stepStore.set(31);
  }

  function addCustomRate() {
    formData.customRates = [
      ...formData.customRates,
      { serviceName: '', duration: '', incallPrice: '', outcallPrice: '' }
    ];
  }

  function handleCustomRates() {
    stepStore.set(32);
  }

  onMount(() => {
    trackRegisterStepServicesInfo({ userType: 'Escort' });
  });

  $: {
    switch ($stepStore) {
      case 26:
        trackRegisterStepServicesInfoServices({ userType: 'Escort' });
        break;
      case 27:
        trackRegisterStepServicesInfoFantasies({ userType: 'Escort' });
        break;
      case 28:
        trackRegisterStepServicesInfoMassages({ userType: 'Escort' });
        break;
      case 29:
        trackRegisterStepServicesInfoVirtual({ userType: 'Escort' });
        break;
      case 30:
        trackRegisterStepServicesInfoHourPrice({ userType: 'Escort' });
        break;
      case 31:
        trackRegisterStepServicesInfoCustomRates({ userType: 'Escort' });
        break;
      case 32:
        trackRegisterStepServicesInfoGoToAvailability({ userType: 'Escort' });
        break;
    }
  }
</script>

<!-- Paso 26: Servicios -->
{#if $stepStore === 26}
  <section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        ¿Qué servicios ofrecés?
      </h2>
      <p class="mt-2 text-neutral-400">
        Marcalos con un click; podés elegir todos.
      </p>
    </header>

    <CheckboxGroup options={$escortServices} bind:selectedValues={formData.selectedServices} />

    <!-- Sticky action -->
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleServices}
      >
        {formData.selectedServices.size ? '¡Genial, seguimos!' : 'Siguiente'}
      </button>
    </div>
  </section>
{/if}

<!-- Paso 27: Fantasías -->
{#if $stepStore === 27}
  <section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Contanos tus fantasías
      </h2>
      <p class="mt-2 text-neutral-400">
        Marcalas si te copa alguna.
      </p>
    </header>

    <CheckboxGroup options={$escortFantasies} bind:selectedValues={formData.selectedFantasies} />

    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleFantasies}
      >
        ¡Listo!
      </button>
    </div>
  </section>
{/if}

<!-- Paso 28: Masajes -->
{#if $stepStore === 28}
  <section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        ¿Qué masajes ofrecés?
      </h2>
      <p class="mt-2 text-neutral-400">
        Elegí todo lo que aplique — sin límite.
      </p>
    </header>

    <CheckboxGroup options={$massageTypes} bind:selectedValues={formData.selectedMassages} />

    <!-- Sticky action -->
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleMassages}
      >
        ¡Vamos!
      </button>
    </div>
  </section>
{/if}

<!-- Paso 29: Virtual -->
{#if $stepStore === 29}
  <section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Servicios virtuales
      </h2>
      <p class="mt-2 text-neutral-400">
        Marcalos si hacés video call, dirty talk, etc.
      </p>
    </header>

    <CheckboxGroup options={$virtualServiceOptions} bind:selectedValues={formData.selectedVirtual} />

    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleVirtual}
      >
        ¡Perfecto!
      </button>
    </div>
  </section>
{/if}

<!-- Paso 30: Precio por hora -->
{#if $stepStore === 30}
  <section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Cuánto cobrás por hora
      </h2>
      <p class="mt-2 text-neutral-400">
        Poné monto y moneda (ej: 100 USD).
      </p>
    </header>

    <TextInput
      type="number"
      bind:value={formData.hourPriceAmount}
      min="0"
      placeholder="Precio (ej: 100)"
    />
    <select
      bind:value={formData.hourPriceCurrency}
      class="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded mb-4"
    >
      <option value="USD">USD</option>
      <option value="ARS">ARS</option>
      <option value="EUR">EUR</option>
    </select>

    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleHourPrice}
      >
        {formData.hourPriceAmount.trim() ? '¡Genial!' : 'Siguiente'}
      </button>
    </div>
  </section>
{/if}

<!-- Paso 31: Tarifas custom -->
{#if $stepStore === 31}
  <section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        ¿Tenés tarifas especiales?
      </h2>
      <p class="mt-2 text-neutral-400">
        Agregá los servicios custom que quieras.
      </p>
    </header>

    <button
      on:click={addCustomRate}
      class="mb-4 w-full py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
    >
      + Agregar tarifa
    </button>
    {#each formData.customRates as rate, idx}
      <div class="bg-gray-900 p-4 rounded mb-4 text-left">
        <h3 class="text-xl text-white mb-2">Tarifa {idx + 1}</h3>
        <TextInput
          bind:value={rate.serviceName}
          placeholder="Nombre del servicio"
        />
        <TextInput
          bind:value={rate.duration}
          placeholder="Duración (ej: 30m, 1h)"
        />
        <TextInput
          type="number"
          bind:value={rate.incallPrice}
          placeholder="Precio incall (ej: 50)"
        />
        <TextInput
          type="number"
          bind:value={rate.outcallPrice}
          placeholder="Precio outcall (ej: 70)"
        />
      </div>
    {/each}

    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleCustomRates}
      >
        {formData.customRates.length ? 'Terminé' : 'Saltar'}
      </button>
    </div>
  </section>
{/if}

<!-- Paso 32: Ir a disponibilidad -->
{#if $stepStore === 32}
  <section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={() => stepStore.set(33)}
      >
        Continuar a disponibilidad
      </button>
    </div>
  </section>
{/if}
