<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();

  interface City {
    name: string;
    hoods: string[];
  }

  interface State {
    name: string;
    cities: City[];
  }

  interface LocationData {
    country: string;
    states: State[];
  }

  export let selectedState = '';
  export let selectedCity = '';
  export let selectedHood = '';
  export let apiEndpoint = 'escort'; // 'escort' or 'motels'

  let locationData: LocationData | null = null;
  let loading = false;
  let error = false;

  $: availableCities = selectedState 
    ? locationData?.states.find(s => s.name === selectedState)?.cities || []
    : [];

  $: availableHoods = selectedCity && selectedState
    ? availableCities.find(c => c.name === selectedCity)?.hoods || []
    : [];

  async function loadLocations() {
    if (locationData) return;
    
    loading = true;
    error = false;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/${apiEndpoint}/locations`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      locationData = await response.json();
    } catch (err) {
      console.error('Failed to load locations:', err);
      error = true;
    } finally {
      loading = false;
    }
  }

  function handleStateChange() {
    selectedCity = '';
    selectedHood = '';
    dispatch('locationChange', {
      state: selectedState,
      city: selectedCity,
      hood: selectedHood
    });
  }

  function handleCityChange() {
    selectedHood = '';
    dispatch('locationChange', {
      state: selectedState,
      city: selectedCity,
      hood: selectedHood
    });
  }

  function handleHoodChange() {
    dispatch('locationChange', {
      state: selectedState,
      city: selectedCity,
      hood: selectedHood
    });
  }

  function clearSelection() {
    selectedState = '';
    selectedCity = '';
    selectedHood = '';
    dispatch('locationChange', {
      state: '',
      city: '',
      hood: ''
    });
  }

  onMount(() => {
    loadLocations();
  });
</script>

<div class="location-selector">
  {#if loading}
    <div class="flex items-center justify-center py-4">
      <svg class="w-5 h-5 animate-spin text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      <span class="ml-2 text-white/60 text-sm">Cargando ubicaciones...</span>
    </div>
  {:else if error}
    <div class="text-red-400 text-sm text-center py-4">
      Error al cargar ubicaciones
      <button 
        on:click={loadLocations}
        class="ml-2 text-white/80 hover:text-white underline"
      >
        Reintentar
      </button>
    </div>
  {:else if locationData}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- State Selector -->
      <div class="relative">
        <select
          bind:value={selectedState}
          on:change={handleStateChange}
          class="w-full bg-zinc-900/80 border border-zinc-800/50 rounded-lg px-4 py-3 text-white text-sm focus:border-white/30 focus:outline-none transition-colors duration-200 appearance-none cursor-pointer hover:border-zinc-700/70"
        >
          <option value="">Seleccionar Estado</option>
          {#each locationData.states as state}
            <option value={state.name}>{state.name}</option>
          {/each}
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>

      <!-- City Selector -->
      <div class="relative">
        <select
          bind:value={selectedCity}
          on:change={handleCityChange}
          disabled={!selectedState}
          class="w-full bg-zinc-900/80 border border-zinc-800/50 rounded-lg px-4 py-3 text-white text-sm focus:border-white/30 focus:outline-none transition-colors duration-200 appearance-none cursor-pointer hover:border-zinc-700/70 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Seleccionar Ciudad</option>
          {#each availableCities as city}
            <option value={city.name}>{city.name}</option>
          {/each}
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>

      <!-- Hood Selector -->
      <div class="relative">
        <select
          bind:value={selectedHood}
          on:change={handleHoodChange}
          disabled={!selectedCity}
          class="w-full bg-zinc-900/80 border border-zinc-800/50 rounded-lg px-4 py-3 text-white text-sm focus:border-white/30 focus:outline-none transition-colors duration-200 appearance-none cursor-pointer hover:border-zinc-700/70 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Seleccionar Barrio</option>
          {#each availableHoods as hood}
            <option value={hood}>{hood}</option>
          {/each}
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
    </div>

    <!-- Clear Selection Button -->
    {#if selectedState || selectedCity || selectedHood}
      <div class="mt-4 text-center">
        <button
          on:click={clearSelection}
          class="text-zinc-400 hover:text-white text-sm transition-colors duration-200 flex items-center space-x-1 mx-auto"
        >
          <span>Limpiar filtros</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  select {
    background-image: none;
  }
  
  select::-ms-expand {
    display: none;
  }
  
  option {
    background-color: #18181b;
    color: white;
  }
</style>