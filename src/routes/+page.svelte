<!-- src/routes/escort/+page.svelte -->
<script lang="ts">
  import LoadingAnimation from "$lib/common/LoadingAnimation.svelte";
  import MotelPreviews from "$lib/components/MotelPreviews.svelte";
  import LocationSelector from "$lib/components/LocationSelector.svelte";
  import { onMount } from 'svelte';

  // ---------- CONFIG ----------
  const CACHE_KEY = 'escortsListCache';
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min

  const DETAIL_CACHE_KEY = 'escortDetailCache';
  const DETAIL_TTL_MS = 15 * 60 * 1000; // 15 min

  interface Escort {
    displayName: string;
    id: string;
    media: string;
    age: number;
    location: string;
    onlyVirtual: boolean;
    slug: string;
  }
  interface ApiResponse {
    content: Escort[];
    page: number;
    totalPages: number;
  }
  interface ListCacheEntry {
    escorts: Escort[];
    page: number;
    totalPages: number;
    timestamp: number;
  }
  interface DetailCacheEntry {
    escort: any; // shape del detail endpoint
    timestamp: number;
  }

  // ---------- STATE ----------
  let escorts: Escort[] = [];
  let page = 0;
  const size = 100;
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
  function makeKey({ search = '', page = 0, size = 100, state = '', city = '', hood = '' } = {}) {
    if (search) {
      return `search::${search.toLowerCase().trim()}::${page}::${size}`;
    }
    if (state || city || hood) {
      return `loc::${state}::${city}::${hood}::${page}::${size}`;
    }
    return `list::${page}::${size}`;
  }
  function getFromCache(opts = { search: '', page: 0, size: 100, state: '', city: '', hood: '' }) {
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

  // Detail cache
  function getDetailCache(): Record<string, DetailCacheEntry> {
    try { return JSON.parse(localStorage.getItem(DETAIL_CACHE_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveDetailCache(c: Record<string, DetailCacheEntry>) {
    localStorage.setItem(DETAIL_CACHE_KEY, JSON.stringify(c));
  }
  function getDetail(slug: string) {
    const c = getDetailCache()[slug];
    if (!c) return null;
    if (Date.now() - c.timestamp > DETAIL_TTL_MS) {
      const cache = getDetailCache();
      delete cache[slug];
      saveDetailCache(cache);
      return null;
    }
    return c.escort;
  }
  function setDetail(slug: string, escort: any) {
    const cache = getDetailCache();
    cache[slug] = { escort, timestamp: Date.now() };
    saveDetailCache(cache);
  }

  // ---------- PREFETCH ON HOVER ----------
  async function prefetchDetail(slug: string) {
    if (getDetail(slug)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/escort/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDetail(slug, data);
    } catch {
      // si falla el prefetch, no hacer nada
    }
  }

  // ---------- LOAD ESCORTS (LIST) ----------
  async function loadEscorts() {
    if (loading || page >= totalPages) return;
    loading = true;

    const cached = getFromCache({ page, size });
    if (cached) {
      escorts = [...escorts, ...cached.escorts];
      totalPages = cached.totalPages;
      page += 1;
      loading = false;
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/escort?page=${page}&size=${size}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();

      escorts = [...escorts, ...data.content];
      totalPages = data.totalPages;
      setToCache({ page, size }, {
        escorts: data.content,
        page,
        totalPages: data.totalPages,
        timestamp: Date.now()
      });
      page += 1;
    } catch (err) {
      console.error('Failed to load escorts:', err);
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
      escorts = cached.escorts;
      searchTotalPages = cached.totalPages;
      searchPage = 1;
      searchLoading = false;
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/escort/search/${encodeURIComponent(searchQuery.trim())}?page=0&size=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();

      escorts = data.content;
      searchTotalPages = data.totalPages;
      setToCache({ search: searchQuery, page: 0, size: 20 }, {
        escorts: data.content,
        page: 0,
        totalPages: data.totalPages,
        timestamp: Date.now()
      });
      searchPage = 1;
    } catch (err) {
      console.error('Failed to search escorts:', err);
      escorts = [];
    } finally {
      searchLoading = false;
    }
  }

  async function loadMoreSearchResults() {
    if (searchLoading || searchPage >= searchTotalPages || !isSearchMode) return;
    searchLoading = true;

    const cached = getFromCache({ search: searchQuery, page: searchPage, size: 20 });
    if (cached) {
      escorts = [...escorts, ...cached.escorts];
      searchPage += 1;
      searchLoading = false;
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/escort/search/${encodeURIComponent(searchQuery.trim())}?page=${searchPage}&size=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();

      escorts = [...escorts, ...data.content];
      setToCache({ search: searchQuery, page: searchPage, size: 20 }, {
        escorts: data.content,
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
  async function loadLocationEscorts() {
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
      escorts = [...escorts, ...cached.escorts];
      locationTotalPages = cached.totalPages;
      locationPage += 1;
      locationLoading = false;
      return;
    }

    try {
      let url = `${import.meta.env.VITE_API_URL}/escort/location/${encodeURIComponent(selectedState)}?page=${locationPage}&size=${size}`;
      if (selectedCity) url += `&city=${encodeURIComponent(selectedCity)}`;
      if (selectedHood) url += `&hood=${encodeURIComponent(selectedHood)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();

      escorts = [...escorts, ...data.content];
      locationTotalPages = data.totalPages;
      setToCache({ 
        page: locationPage, 
        size, 
        state: selectedState, 
        city: selectedCity, 
        hood: selectedHood 
      }, {
        escorts: data.content,
        page: locationPage,
        totalPages: data.totalPages,
        timestamp: Date.now()
      });
      locationPage += 1;
    } catch (err) {
      console.error('Failed to load location escorts:', err);
    } finally {
      locationLoading = false;
    }
  }

  async function handleLocationSearch() {
    if (!selectedState) return;
    
    isLocationMode = true;
    isSearchMode = false;
    searchQuery = '';
    escorts = [];
    locationPage = 0;
    locationTotalPages = 1;
    loadLocationEscorts();
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
    escorts = [];
    page = 0;
    totalPages = 1;
    loadEscorts();
  }

  function clearAllFilters() {
    searchQuery = '';
    selectedState = '';
    selectedCity = '';
    selectedHood = '';
    isSearchMode = false;
    isLocationMode = false;
    escorts = [];
    page = 0;
    totalPages = 1;
    loadEscorts();
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

  // ---------- INFINITE SCROLL ----------
  onMount(() => {
    loadEscorts();
    const io = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                if (isSearchMode) {
                  loadMoreSearchResults();
                } else if (isLocationMode) {
                  loadLocationEscorts();
                } else {
                  loadEscorts();
                }
              }
            },
            { rootMargin: '300px' }
    );
    if (sentinel) io.observe(sentinel);
    return () => io.disconnect();
  });

  // ---------- IMAGE HELPER ----------
  function getMediaUrl(escortId: string, fileName: string, type: 'profile' | 'pics'): string {
    if (!fileName) return '';
    if (fileName.startsWith('http')) return fileName;
    return `https://nexus.daisyssecrets.com/escorts/${escortId}/${type}/${fileName}`;
  }
</script>

<svelte:head>
  <link rel="preconnect" href={ import.meta.env.VITE_MEDIA_CDN} />
  {#if escorts.length && escorts[0]?.media}
    <link
            rel="preload"
            as="image"
            href={`https://nexus.daisyssecrets.com/escorts/${escorts[0].id}/profile/${escorts[0].media}`}
    />
  {/if}
</svelte:head>

<main class="bg-black min-h-screen py-8 px-4">

  <!-- 🚀 Mini-Banner Laboratorio de Fantasías -->
  <div class="flex justify-center mb-7">
    <a
            href="/faceswap"
            class="flex items-center gap-3 px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-700 shadow-lg text-white font-semibold text-sm transition-all duration-200"
            style="box-shadow: 0 4px 24px 0 rgb(236 72 153 / 30%);"
            title="Descubrí Face Swap y otras fantasías interactivas"
    >
      <span class="text-lg">🧪</span>
      Laboratorio de Fantasías
      <span class="ml-2 font-normal opacity-80 text-xs hidden sm:inline">Face Swap | Intercambio de caras </span>
    </a>
  </div>
  <!-- Fin mini-banner -->

  <!-- Search Bar -->
  <div class="max-w-2xl mx-auto mb-12">
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
                  placeholder="Buscar escorts..."
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
      on:locationChange={handleLocationChange}
    />
  </div>

  <!-- Search Results Header -->
  {#if isSearchMode}
    <div class="max-w-7xl mx-auto mb-6 px-4">
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
    <div class="max-w-7xl mx-auto mb-6 px-4">
      <div class="flex items-center justify-between">
        <h2 class="text-white text-lg font-medium">
          {#if selectedHood}
            Escorts en {selectedHood}, {selectedCity}, {selectedState}
          {:else if selectedCity}
            Escorts en {selectedCity}, {selectedState}
          {:else}
            Escorts en {selectedState}
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

  <!-- Motel Previews Section -->
  <MotelPreviews />

  <div class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center">
    {#each escorts as escort (escort.id)}
      <a
              href={`/escort/${encodeURIComponent(escort.slug)}`}
              on:mouseenter={() => prefetchDetail(escort.slug)}
              class="relative bg-black rounded-lg overflow-hidden shadow-lg flex flex-col items-center hover:opacity-90 transition-opacity max-w-md"
      >
        <div class="relative bg-black rounded-lg overflow-hidden shadow-lg flex flex-col items-center">
          {#if escort.onlyVirtual}
            <span
                    class="absolute top-3 left-1/2 transform -translate-x-1/2 inline-block px-2 py-1 text-xs font-semibold bg-white text-black rounded"
            >
              Solo virtual
            </span>
          {/if}

          <img
                  src={getMediaUrl(escort.id, escort.media, 'profile')}
                  alt={`Foto de ${escort.displayName}`}
                  class="w-full h-[28rem] object-cover transition-transform duration-300 ease-in-out hover:scale-105 active:scale-105"
          />

          <div class="p-6 text-white text-center">
            <h2 class="text-xl font-semibold">{escort.displayName}, {escort.age}</h2>
            <p class="text-sm opacity-80">{escort.location}</p>
          </div>
        </div>
      </a>
    {/each}
  </div>

  <!-- Empty state for search -->
  {#if isSearchMode && escorts.length === 0 && !searchLoading}
    <div class="text-center py-12">
      <svg class="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      <h3 class="text-white text-lg font-medium mb-2">No se encontraron resultados</h3>
      <p class="text-zinc-400 text-sm">Intenta con otros términos de búsqueda</p>
    </div>
  {:else if isLocationMode && escorts.length === 0 && !locationLoading}
    <div class="text-center py-12">
      <svg class="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
      <h3 class="text-white text-lg font-medium mb-2">No hay escorts en esta ubicación</h3>
      <p class="text-zinc-400 text-sm">Intenta seleccionar otra ubicación</p>
    </div>
  {/if}

  <div bind:this={sentinel}></div>

  {#if loading || searchLoading || locationLoading}
    <LoadingAnimation/>
  {/if}
</main>
