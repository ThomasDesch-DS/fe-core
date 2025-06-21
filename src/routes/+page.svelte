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
            ([entry]) => entry.isIntersecting && loadEscorts(),
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


</script>

<main class="bg-black min-h-screen py-8 px-4">
  <div class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center">
  {#each escorts as escort (escort.id)}
      <a
              href={`/escort/${encodeURIComponent(escort.displayName)}`}
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

  <!-- the magic spot: when this hits the viewport, we load more -->
  <div bind:this={sentinel}></div>

  {#if loading}
    <p class="text-center text-white mt-4">Loading more…</p>
  {/if}
</main>
