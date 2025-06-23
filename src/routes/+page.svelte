<script lang="ts">
  import { onMount } from 'svelte';

  // Mirror your backend shape
  interface Escort {
    displayName: string;
    id: string;
    media: string;
    age: number;
    location: string;
    onlyVirtual: boolean;
    slug: string
  }
  interface ApiResponse {
    content: Escort[];
    page: number;
    totalPages: number;
  }

  let escorts: Escort[] = [];
  let page = 0;
  const size = 100;          // whatever chunk‐size you like
  let totalPages = 1;        // will be overwritten by the real payload
  let loading = false;
  let sentinel: HTMLDivElement;
  
  // Search functionality
  let searchQuery = '';
  let searchInputElement: HTMLInputElement;
  let isSearchFocused = false;
  let isSearchMode = false;
  let searchLoading = false;
  let searchPage = 0;
  let searchTotalPages = 1;

  async function loadEscorts() {
    if (loading || page >= totalPages) return;
    loading = true;
    try {
      const res = await fetch(`http://localhost:8080/escort?page=${page}&size=${size}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      escorts = [...escorts, ...data.content];
      totalPages = data.totalPages;
      page += 1;
    } catch (err) {
      console.error('Failed to load escorts:', err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadEscorts();

    // Fire off loadEscorts() when sentinel scrolls into view
    const io = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                if (isSearchMode) {
                  loadMoreSearchResults();
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

  // Helper to build your image URL—adjust if your media lives somewhere else
  function imageUrl(escort: Escort) {
    return `http://localhost:8080/media/${escort.media}`;
  }

  function getMediaUrl(escortId: string, fileName: string, type: 'profile' | 'pics'): string {
    return `https://nexus.daisyssecrets.com/escorts/${escortId}/${type}/${fileName}`;
  }

  // Search functionality
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    
    searchLoading = true;
    isSearchMode = true;
    searchPage = 0;
    
    try {
      const res = await fetch(`http://localhost:8080/escort/search/${encodeURIComponent(searchQuery.trim())}?page=0&size=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      escorts = data.content;
      searchTotalPages = data.totalPages;
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
    
    try {
      const res = await fetch(`http://localhost:8080/escort/search/${encodeURIComponent(searchQuery.trim())}?page=${searchPage}&size=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      escorts = [...escorts, ...data.content];
      searchPage += 1;
    } catch (err) {
      console.error('Failed to load more search results:', err);
    } finally {
      searchLoading = false;
    }
  }

  function clearSearch() {
    searchQuery = '';
    isSearchMode = false;
    escorts = [];
    page = 0;
    loadEscorts(); // Load original content
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSearch();
    }
    if (event.key === 'Escape') {
      searchInputElement?.blur();
      isSearchFocused = false;
      if (isSearchMode) {
        clearSearch();
      }
    }
  }

  function handleSearchFocus() {
    isSearchFocused = true;
  }

  function handleSearchBlur() {
    isSearchFocused = false;
  }

</script>

<main class="bg-black min-h-screen py-8 px-4">
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
  {/if}

  <div class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center">
  {#each escorts as escort (escort.id)}
      <a
              href={`/escort/${encodeURIComponent(escort.slug)}`}
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
                class="w-full h-[28rem] object-cover
         transition-transform duration-300 ease-in-out
         hover:scale-105 active:scale-105"
        />


        <div class="p-6 text-white text-center">
          <h2 class="text-xl font-semibold">
            {escort.displayName}, {escort.age}
          </h2>
          <p class="text-sm opacity-80">
            {escort.location}
          </p>
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
  {/if}

  <!-- the magic spot: when this hits the viewport, we load more -->
  <div bind:this={sentinel}></div>

  {#if loading || searchLoading}
    <p class="text-center text-white mt-4">
      {isSearchMode ? 'Buscando...' : 'Loading more…'}
    </p>
  {/if}
</main>
