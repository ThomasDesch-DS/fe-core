<script lang="ts">
  import LoadingAnimation from "$lib/common/LoadingAnimation.svelte";
  import LocationSelector from "$lib/components/LocationSelector.svelte";
  import { onMount } from 'svelte';
  import { slugify } from '$lib/utils/slugify';
  import {getMediaUrl} from "../../util/MediaUtils";

  // ---------- CONFIG ----------
  const CACHE_KEY = 'motelsListCache';
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min

  interface MotelLocation {
    country: string;
    state: string;
    city: string;
    hood: string | null;
  }

  interface MotelPreviewDto {
    id: string;
    name: string;
    imageUrl: string;
    location: MotelLocation;
    description: string;
  }

  interface ApiResponse {
    content: MotelPreviewDto[];
    page: number;
    totalPages: number;
  }

  interface ListCacheEntry {
    motels: MotelPreviewDto[];
    page: number;
    totalPages: number;
    timestamp: number;
  }

  // ---------- STATE ----------
  let motels: MotelPreviewDto[] = [];
  let page = 0;
  const size = 20;
  let totalPages = 1;
  let loading = false;
  let sentinel: HTMLDivElement;

  // Search
  let searchQuery = '';
  let searchInputElement: HTMLInputElement;
  let isSearchFocused = false;
  let isSearchMode = false;
  let searchLoading = false;
  let searchPage = 0;
  let searchTotalPages = 1;

  // Location filtering
  let selectedState = '';
  let selectedCity = '';
  let selectedHood = '';
  let isLocationMode = false;
  let locationLoading = false;
  let locationPage = 0;
  let locationTotalPages = 1;

  // ---------- CACHE UTILS ----------
  function getCache(): Record<string, ListCacheEntry> {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveCache(c: Record<string, ListCacheEntry>) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  }
  function makeKey({ search = '', page = 0, size = 20, state = '', city = '', hood = '' } = {}) {
    if (search) {
      return `search::${search.toLowerCase().trim()}::${page}::${size}`;
    }
    if (state || city || hood) {
      return `loc::${state}::${city}::${hood}::${page}::${size}`;
    }
    return `list::${page}::${size}`;
  }
  function getFromCache(opts = { search: '', page: 0, size: 20, state: '', city: '', hood: '' }) {
    const cache = getCache();
    const key = makeKey(opts);
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      delete cache[key];
      saveCache(cache);
      return null;
    }
    return entry;
  }
  function setToCache(opts: any, entry: ListCacheEntry) {
    const cache = getCache();
    cache[makeKey(opts)] = entry;
    saveCache(cache);
  }

  // ---------- LOAD MOTELS ----------
  async function loadMotels() {
    if (loading || page >= totalPages) return;
    loading = true;

    const cached = getFromCache({ page, size });
    if (cached) {
      motels = [...motels, ...cached.motels];
      totalPages = cached.totalPages;
      page += 1;
      loading = false;
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/motels?page=${page}&size=${size}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();

      motels = [...motels, ...data.content];
      totalPages = data.totalPages;
      setToCache({ page, size }, {
        motels: data.content,
        page,
        totalPages: data.totalPages,
        timestamp: Date.now()
      });
      page += 1;
    } catch (err) {
      console.error('Failed to load motels:', err);
    } finally {
      loading = false;
    }
  }

  // ---------- LOAD SEARCH ----------
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    searchLoading = true;
    isSearchMode = true;
    searchPage = 0;

    const cached = getFromCache({ search: searchQuery, page: 0, size: 20 });
    if (cached) {
      motels = cached.motels;
      searchTotalPages = cached.totalPages;
      searchPage = 1;
      searchLoading = false;
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/motels/search/${encodeURIComponent(searchQuery.trim())}?page=0&size=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();

      motels = data.content;
      searchTotalPages = data.totalPages;
      setToCache({ search: searchQuery, page: 0, size: 20 }, {
        motels: data.content,
        page: 0,
        totalPages: data.totalPages,
        timestamp: Date.now()
      });
      searchPage = 1;
    } catch (err) {
      console.error('Failed to search motels:', err);
      motels = [];
    } finally {
      searchLoading = false;
    }
  }

  async function loadMoreSearchResults() {
    if (searchLoading || searchPage >= searchTotalPages || !isSearchMode) return;
    searchLoading = true;

    const cached = getFromCache({ search: searchQuery, page: searchPage, size: 20 });
    if (cached) {
      motels = [...motels, ...cached.motels];
      searchPage += 1;
      searchLoading = false;
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/motels/search/${encodeURIComponent(searchQuery.trim())}?page=${searchPage}&size=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();

      motels = [...motels, ...data.content];
      setToCache({ search: searchQuery, page: searchPage, size: 20 }, {
        motels: data.content,
        page: searchPage,
        totalPages: searchTotalPages,
        timestamp: Date.now()
      });
      searchPage += 1;
    } catch (err) {
      console.error('Failed to load more search results:', err);
    } finally {
      searchLoading = false;
    }
  }

  // ---------- LOCATION SEARCH ----------
  async function loadLocationMotels() {
    if (locationLoading || locationPage >= locationTotalPages) return;
    locationLoading = true;

    const cached = getFromCache({ 
      page: locationPage, 
      size, 
      state: selectedState, 
      city: selectedCity, 
      hood: selectedHood 
    });
    if (cached) {
      motels = [...motels, ...cached.motels];
      locationTotalPages = cached.totalPages;
      locationPage += 1;
      locationLoading = false;
      return;
    }

    try {
      const locationPath = [selectedState, selectedCity, selectedHood]
        .filter(Boolean)
        .map(s => encodeURIComponent(s.trim()))
        .join('/');

      let url = `${import.meta.env.VITE_API_URL}/motels/location/${locationPath}?page=${locationPage}&size=${size}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();

      motels = [...motels, ...data.content];
      locationTotalPages = data.totalPages;
      setToCache({ 
        page: locationPage, 
        size, 
        state: selectedState, 
        city: selectedCity, 
        hood: selectedHood 
      }, {
        motels: data.content,
        page: locationPage,
        totalPages: data.totalPages,
        timestamp: Date.now()
      });
      locationPage += 1;
    } catch (err) {
      console.error('Failed to load location motels:', err);
    } finally {
      locationLoading = false;
    }
  }

  async function handleLocationSearch() {
    if (!selectedState) return;
    
    isLocationMode = true;
    isSearchMode = false;
    searchQuery = '';
    motels = [];
    locationPage = 0;
    locationTotalPages = 1;
    loadLocationMotels();
  }

  function handleLocationChange(event: CustomEvent) {
    const { state, city, hood } = event.detail;
    selectedState = state;
    selectedCity = city;
    selectedHood = hood;
    
    if (state) {
      handleLocationSearch();
    } else {
      clearAllFilters();
    }
  }

  // ---------- CLEAR SEARCH ----------
  function clearSearch() {
    searchQuery = '';
    isSearchMode = false;
    motels = [];
    page = 0;
    totalPages = 1;
    loadMotels();
  }

  function clearAllFilters() {
    searchQuery = '';
    selectedState = '';
    selectedCity = '';
    selectedHood = '';
    isSearchMode = false;
    isLocationMode = false;
    motels = [];
    page = 0;
    totalPages = 1;
    loadMotels();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') handleSearch();
    if (event.key === 'Escape') {
      searchInputElement?.blur();
      isSearchFocused = false;
      if (isSearchMode) clearSearch();
    }
  }
  function handleSearchFocus() { isSearchFocused = true; }
  function handleSearchBlur() { isSearchFocused = false; }

  // ---------- URL HELPER ----------
  function getMotelUrl(motel: MotelPreviewDto): string {
    const { location, name } = motel;
    const country = slugify(location.country);
    const state = slugify(location.state);
    const city = slugify(location.city);
    const motelName = slugify(name);
    
    if (location.hood) {
      const hood = slugify(location.hood);
      return `/motels/${country}/${state}/${city}/${hood}/${motelName}`;
    }
    
    return `/motels/${country}/${state}/${city}/${motelName}`;
  }

  function formatLocation(motel: MotelPreviewDto): string {
    const { location } = motel;
    return location.hood ? `${location.hood}, ${location.city}` : location.city;
  }

  // ---------- INFINITE SCROLL ----------
  onMount(() => {
    loadMotels();
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (isSearchMode) {
            loadMoreSearchResults();
          } else if (isLocationMode) {
            loadLocationMotels();
          } else {
            loadMotels();
          }
        }
      },
      { rootMargin: '300px' }
    );
    if (sentinel) io.observe(sentinel);
    return () => io.disconnect();
  });
</script>

<svelte:head>
  <title>Todos los Telos | Daisy's Secrets</title>
  <link rel="preconnect" href={ import.meta.env.VITE_MEDIA_CDN} />
</svelte:head>

<main class="bg-black min-h-screen py-8 px-4">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-12">
      <h1 class="text-white text-4xl font-bold mb-4">
        🏨 Todos los Telos
      </h1>
      <p class="text-zinc-400 text-lg">
        Descubre todos nuestros moteles destacados
      </p>
    </div>

    <!-- Search Bar -->
    <div class="max-w-2xl mx-auto mb-8">
      <div class="relative group">
        <div class="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div class="relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 rounded-lg transition-all duration-300 ease-out {isSearchFocused ? 'border-white/30 shadow-lg shadow-white/5' : 'hover:border-zinc-700/70'}">
          <div class="flex items-center px-4 py-3">
            <svg class="w-5 h-5 text-zinc-400 transition-colors duration-200 {isSearchFocused ? 'text-white/80' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input
              bind:this={searchInputElement}
              bind:value={searchQuery}
              on:keydown={handleKeydown}
              on:focus={handleSearchFocus}
              on:blur={handleSearchBlur}
              placeholder="Buscar moteles..."
              class="flex-1 bg-transparent text-white placeholder-zinc-400 ml-3 outline-none text-sm font-medium placeholder:font-normal transition-all duration-200"
              autocomplete="off"
              spellcheck="false"
            />
            {#if searchQuery}
              <button
                on:click={() => {
                  if (isSearchMode) {
                    clearSearch();
                  } else {
                    searchQuery = '';
                  }
                  searchInputElement?.focus();
                }}
                class="ml-2 p-1 rounded-full hover:bg-zinc-800/50 transition-colors duration-200 group/clear"
              >
                <svg class="w-4 h-4 text-zinc-500 group-hover/clear:text-zinc-300 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            {/if}
            {#if searchQuery.trim()}
              <button
                on:click={handleSearch}
                disabled={searchLoading}
                class="ml-2 px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-md hover:bg-zinc-200 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {#if searchLoading}
                  <svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                {:else}
                  Buscar
                {/if}
              </button>
            {/if}
          </div>
        </div>
      </div>

      <!-- Search shortcuts/hints -->
      <div class="mt-3 flex items-center justify-center text-xs text-zinc-500 space-x-4">
        <span class="flex items-center space-x-1">
          <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-xs">Enter</kbd>
          <span>para buscar</span>
        </span>
        <span class="flex items-center space-x-1">
          <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-xs">Esc</kbd>
          <span>para cancelar</span>
        </span>
      </div>
    </div>

    <!-- Location Selector -->
    <div class="max-w-4xl mx-auto mb-8">
      <LocationSelector 
        bind:selectedState
        bind:selectedCity
        bind:selectedHood
        apiEndpoint="motels"
        on:locationChange={handleLocationChange}
      />
    </div>

    <!-- Search Results Header -->
    {#if isSearchMode}
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <h2 class="text-white text-lg font-medium">
            Resultados para "{searchQuery}"
          </h2>
          <button
            on:click={clearSearch}
            class="text-zinc-400 hover:text-white text-sm transition-colors duration-200 flex items-center space-x-1"
          >
            <span>Ver todos</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    {:else if isLocationMode}
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <h2 class="text-white text-lg font-medium">
            {#if selectedHood}
              Moteles en {selectedHood}, {selectedCity}, {selectedState}
            {:else if selectedCity}
              Moteles en {selectedCity}, {selectedState}
            {:else}
              Moteles en {selectedState}
            {/if}
          </h2>
          <button
            on:click={clearAllFilters}
            class="text-zinc-400 hover:text-white text-sm transition-colors duration-200 flex items-center space-x-1"
          >
            <span>Ver todos</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each motels as motel (motel.id)}
        <a
          href={getMotelUrl(motel)}
          class="group relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden transition-all duration-300 hover:border-zinc-700/70 hover:bg-zinc-900/90 hover:shadow-lg hover:shadow-white/5"
        >
          <div class="relative overflow-hidden">
            <img
              src={getMediaUrl("", motel.imageUrl, "motel")}
              alt={`Foto de ${motel.name}`}
              class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          
          <div class="p-4">
            <h3 class="text-white font-semibold text-lg mb-1 line-clamp-1">
              {motel.name}
            </h3>
            
            <p class="text-zinc-400 text-sm mb-2 flex items-center">
              <svg class="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {formatLocation(motel)}
            </p>
            
            <p class="text-zinc-300 text-sm line-clamp-2 leading-relaxed">
              {motel.description}
            </p>
          </div>
          
          <!-- Hover indicator -->
          <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div class="bg-white/10 backdrop-blur-sm rounded-full p-2">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </a>
      {/each}
    </div>

    <!-- Empty states -->
    {#if isSearchMode && motels.length === 0 && !searchLoading}
      <div class="text-center py-12">
        <svg class="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <h3 class="text-white text-lg font-medium mb-2">No se encontraron moteles</h3>
        <p class="text-zinc-400 text-sm">Intenta con otros términos de búsqueda</p>
      </div>
    {:else if isLocationMode && motels.length === 0 && !locationLoading}
      <div class="text-center py-12">
        <svg class="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        <h3 class="text-white text-lg font-medium mb-2">No hay moteles en esta ubicación</h3>
        <p class="text-zinc-400 text-sm">Intenta seleccionar otra ubicación</p>
      </div>
    {:else if motels.length === 0 && !loading}
      <div class="text-center py-12">
        <svg class="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        <h3 class="text-white text-lg font-medium mb-2">No hay moteles disponibles</h3>
        <p class="text-zinc-400 text-sm">Vuelve más tarde para ver nuestros moteles</p>
      </div>
    {/if}

    <div bind:this={sentinel}></div>

    {#if loading || searchLoading || locationLoading}
      <LoadingAnimation/>
    {/if}
  </div>
</main>

<style>
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>