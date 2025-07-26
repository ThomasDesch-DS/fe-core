<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import 'leaflet/dist/leaflet.css';
  import type { MotelDetailDto } from '$lib/types/motel';
  import { 
    trackMotelDetailView, 
    trackMotelContact, 
    trackMotelMapView, 
    trackMotelImageGallery 
  } from '$lib/analytics/analytics';

  $: params = $page.params;
  
  let motel: MotelDetailDto | null = null;
  let loading = true;
  let error = false;

  // Mock reviews for now
  const reviews = [
    {
      user: 'Camila R.',
      date: 'Junio 2025',
      comment: 'Todo impecable. La cama muy cómoda y la vista increíble. Volvería sin dudas.'
    },
    {
      user: 'Nicolás P.',
      date: 'Mayo 2025',
      comment: 'Perfecta ubicación y excelente atención. Ideal para escapadas discretas.'
    },
    {
      user: 'Luisa M.',
      date: 'Abril 2025',
      comment: 'Muy limpio y moderno. Lo único que faltó fue una cafetera 😅'
    }
  ];

  async function fetchMotelData() {
    try {
      const { country, state, city, hood, name } = params;
      const url = `http://localhost:8080/motels/${country}/${state}/${city}/${hood}/${name}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      motel = await response.json();
      
      // Track motel detail view
      if (motel) {
        trackMotelDetailView({
          motelId: motel.id,
          motelName: motel.name,
          motelLocation: `${motel.location.hood || ''}, ${motel.city}`,
          country: motel.location.country,
          state: motel.location.state,
          city: motel.location.city,
          hood: motel.location.hood,
          rating: motel.rating,
          hasHood: Boolean(motel.location.hood),
          routeType: 'with_hood'
        });
      }
    } catch (err) {
      console.error('Failed to fetch motel data:', err);
      error = true;
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await fetchMotelData();
    
    if (motel) {
      const L = await import('leaflet');

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
      });

      const map = L.map('map').setView([motel.coordinates.latitude, motel.coordinates.longitude], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      L.marker([motel.coordinates.latitude, motel.coordinates.longitude])
        .addTo(map)
        .bindPopup(motel.name)
        .openPopup();
        
      // Track map view
      if (motel) {
        trackMotelMapView({
          motelId: motel.id,
          motelName: motel.name,
          latitude: motel.coordinates.latitude,
          longitude: motel.coordinates.longitude
        });
      }
    }
  });

  function handleContactClick() {
    if (motel) {
      trackMotelContact({
        motelId: motel.id,
        motelName: motel.name,
        contactMethod: 'button_click'
      });
    }
  }

  function handleImageClick(imageIndex: number) {
    if (motel) {
      trackMotelImageGallery({
        motelId: motel.id,
        motelName: motel.name,
        imageIndex,
        totalImages: motel.images.length
      });
    }
  }
</script>

<svelte:head>
  {#if motel}
    <title>{motel.name} en {motel.location.hood ? `${motel.location.hood}, ` : ''}{motel.city} - Motel {motel.rating}/10 | Daisy's Secrets</title>
    <meta name="description" content="{motel.description} Ubicado en {motel.address}, {motel.city}. Rating: {motel.rating}/10. Reservá ahora en Daisy's Secrets." />
    <meta property="og:title" content="{motel.name} - Motel en {motel.city}" />
    <meta property="og:description" content="{motel.description}" />
    <meta property="og:image" content="{motel.images[0] || ''}" />
    <meta property="og:type" content="business.business" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{motel.name} - Motel en {motel.city}" />
    <meta name="twitter:description" content="{motel.description}" />
    <meta name="twitter:image" content="{motel.images[0] || ''}" />
    <link rel="canonical" href="{$page.url.href}" />
  {:else}
    <title>Cargando motel... | Daisy's Secrets</title>
    <meta name="description" content="Descubre los mejores moteles en Argentina con Daisy's Secrets. Alojamientos discretos y de calidad." />
  {/if}
</svelte:head>

<main class="min-h-screen bg-neutral-950 text-neutral-100 p-4">
  {#if loading}
    <!-- Loading State -->
    <section class="max-w-6xl mx-auto">
      <div class="flex flex-col md:flex-row md:gap-10">
        <div class="md:w-2/3 animate-pulse">
          <div class="h-12 bg-neutral-800 rounded mb-4"></div>
          <div class="h-6 bg-neutral-800 rounded w-2/3 mb-6"></div>
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {#each Array(6) as _}
              <div class="h-44 bg-neutral-800 rounded-xl"></div>
            {/each}
          </div>
          
          <div class="h-72 bg-neutral-800 rounded-xl"></div>
        </div>
        
        <div class="md:w-[28%] bg-neutral-900 p-8 rounded-2xl mt-8 md:mt-0 animate-pulse">
          <div class="h-16 bg-neutral-800 rounded mb-3"></div>
          <div class="h-4 bg-neutral-800 rounded w-3/4 mb-4"></div>
          <div class="h-12 bg-neutral-800 rounded"></div>
        </div>
      </div>
    </section>
  {:else if error}
    <!-- Error State -->
    <section class="max-w-4xl mx-auto text-center py-12">
      <div class="text-6xl mb-4">🚫</div>
      <h1 class="text-3xl font-bold mb-4">Motel no encontrado</h1>
      <p class="text-neutral-400 mb-8">
        No pudimos cargar la información de este motel. Por favor, intenta nuevamente.
      </p>
      <button 
        on:click={() => window.history.back()}
        class="bg-neutral-100 text-black px-6 py-3 rounded-lg hover:bg-neutral-200 transition-colors font-semibold"
      >
        Volver atrás
      </button>
    </section>
  {:else if motel}
    <!-- Motel Data -->
    <section class="max-w-6xl mx-auto">
      <div class="flex flex-col md:flex-row md:gap-10">
        <div class="md:w-2/3">
          <h1 class="text-4xl font-semibold mb-2 text-neutral-50">{motel.name}</h1>
          <p class="text-neutral-400">{motel.address}</p>

          <div class="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
            {#each motel.images as img, index}
              <img
                src={img}
                alt="Foto del alojamiento"
                class="rounded-xl w-full h-44 object-cover shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                on:click={() => handleImageClick(index)}
              />
            {/each}
          </div>

          <div class="mt-8">
            <h2 class="text-2xl font-semibold mb-3 text-neutral-100">Descripción</h2>
            <p class="text-neutral-300 leading-relaxed">{motel.description}</p>
          </div>

          <div class="mt-8">
            <h2 class="text-2xl font-semibold mb-3 text-neutral-100">Mapa del alojamiento</h2>
            <div id="map" class="w-full h-72 rounded-xl mt-3" style="z-index: 0;"></div>
          </div>

          <div class="mt-12">
            <!--    <h2 class="text-2xl font-semibold mb-4 text-neutral-100">Chicas disponibles cerca de este alojamiento</h2>
            <div class="flex overflow-x-auto gap-4 pb-4">
                {#each Array(5) as _, i}
                  <div class="min-w-[220px] bg-neutral-900 rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
                    <img
                      src={`https://source.unsplash.com/random/300x400?sig=${i}&girl`}
                      alt="Perfil de acompañante"
                      class="rounded-lg h-48 w-full object-cover mb-3"
                    />
                    <div class="text-lg font-medium text-neutral-50">Sofía {i + 1}</div>
                    <div class="text-sm text-neutral-400">Zona {motel.location.hood || motel.city} · 25 años</div>
                    <button class="mt-3 w-full bg-neutral-100 text-black text-sm py-1.5 rounded-md hover:bg-neutral-200">
                      Ver perfil
                    </button>
                  </div>
                {/each }
              </div> -->
          </div>
        </div>

        <div class="md:w-[28%] bg-neutral-900 p-8 rounded-2xl mt-8 md:mt-0 shadow-2xl">
          <div class="text-5xl font-bold text-green-400 mb-3">{motel.rating}</div>
          <p class="text-sm text-neutral-400 mb-4">
            Puntuación del alojamiento
          </p>

          <button 
            on:click={handleContactClick}
            class="w-full bg-neutral-50 text-black py-3 rounded-lg hover:bg-neutral-200 transition-colors font-semibold"
          >
            Ver métodos de contacto
          </button>

          <div class="mt-4 text-sm text-neutral-500">
            <strong>Ubicación:</strong><br>
            {motel.location.hood ? `${motel.location.hood}, ` : ''}{motel.city}<br>
            {motel.state}, {motel.location.country}
            {#if motel.zipCode}
              <br>CP: {motel.zipCode}
            {/if}
          </div>
        </div>
      </div>
    </section>

    <!-- Reviews Section -->
    <section class="mt-12 max-w-4xl mx-auto">
      <h2 class="text-2xl font-semibold text-neutral-100 mb-4">Reseñas</h2>
      <div class="space-y-6">
        {#each reviews as review}
          <div class="bg-neutral-900 p-4 rounded-lg shadow">
            <div class="flex justify-between mb-1">
              <span class="text-neutral-100 font-medium">{review.user}</span>
              <span class="text-neutral-500 text-sm">{review.date}</span>
            </div>
            <p class="text-neutral-300 text-sm">{review.comment}</p>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</main>

<style>
  img {
    transition: transform 0.2s ease;
  }
  img:hover {
    transform: scale(1.03);
  }
  #map {
    height: 18rem;
  }
</style>
