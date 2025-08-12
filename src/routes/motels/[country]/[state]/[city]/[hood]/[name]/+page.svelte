<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import 'leaflet/dist/leaflet.css';
  import type { MotelDetailDto, MotelReview } from '$lib/types/motel';
  import {
    trackMotelDetailView,
    trackMotelContact,
    trackMotelMapView,
    trackMotelImageGallery
  } from '$lib/analytics/analytics';
  import ReviewList from '$lib/components/reviews/ReviewList.svelte';
  import ImageLightbox from '$lib/components/ImageLightbox.svelte';
  import { getMediaUrl, getAbsoluteMediaUrl } from "../../../../../../../util/MediaUtils";
  import { fetchMotelReviews } from '$lib/api/reviews';

  export let data;
  const { motel, reviews: initialReviews, reviewCount: initialReviewCount, pageUrl } = data;

  let loading = false;
  let error = false;
  let reviewError = '';
  let showContact = false;
  let reviews: MotelReview[] = initialReviews;
  let reviewCount = initialReviewCount;
  let lightboxImages: string[] = [];
  let lightboxOpen = false;
  let lightboxCurrentIndex = 0;

  function buildJsonLd(motel: MotelDetailDto, pageUrl: string, reviews: MotelReview[], reviewCount: number) {
    const ld: any = {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: motel.name,
      description: motel.description || `Alojamiento discreto y de calidad en ${motel.location.city}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: motel.address,
        addressLocality: motel.location.city,
        addressRegion: motel.location.state,
        addressCountry: motel.location.country
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: motel.coordinates.latitude,
        longitude: motel.coordinates.longitude
      },
      url: pageUrl
    };

    if (motel.location.zipCode) {
      ld.address.postalCode = motel.location.zipCode;
    }

    if (motel.images?.length > 0) {
      ld.image = motel.images.map(img => getAbsoluteMediaUrl(motel.id, img.media, "motel"));
    }

    if (motel.__telephone) {
      ld.telephone = motel.__telephone.replace('tel:', '');
    }

    if (motel.services?.length > 0) {
      ld.amenityFeature = motel.services.map(service => ({
        "@type": "LocationFeatureSpecification",
        name: service
      }));
    }

    if (motel.rating != null && reviewCount > 0) {
      ld.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: motel.rating,
        reviewCount: reviewCount,
        bestRating: "10",
        worstRating: "1"
      };
    }

    const topLevelReviews = reviews?.filter(r => !r.parentId && r.rating !== null) || [];
    if (topLevelReviews.length > 0) {
      ld.review = topLevelReviews.slice(0, 3).map(r => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: r.username || 'Usuario Anónimo'
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: "10",
          worstRating: "1"
        },
        reviewBody: r.content,
        datePublished: new Date(r.createdAt).toISOString().split('T')[0]
      }));
    }

    return ld;
  }

  onMount(async () => {
    // Track motel detail view
    if (motel) {
      trackMotelDetailView({
        motelId: motel.id,
        motelName: motel.name,
        motelLocation: `${motel.location.hood || ''}, ${motel.location.city}`,
        country: motel.location.country,
        state: motel.location.state,
        city: motel.location.city,
        hood: motel.location.hood,
        hasHood: Boolean(motel.location.hood),
        routeType: 'with_hood'
      });

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
      trackMotelMapView({
        motelId: motel.id,
        motelName: motel.name,
        latitude: motel.coordinates.latitude,
        longitude: motel.coordinates.longitude
      });
    }
  });

  function handleContactClick() {
    showContact = !showContact;
    if (motel) {
      trackMotelContact({
        motelId: motel.id,
        motelName: motel.name,
        contactMethod: 'button_click'
      });
    }
  }

  function handleImageClick(imageIndex: number, imageType: 'motel' | 'room' = 'motel', roomImages?: any[]) {
    if (!motel) return;

    if (imageType === 'motel') {
      lightboxImages = motel.images.map(img => getMediaUrl(motel!.id, img.media, "motel"));
      lightboxCurrentIndex = imageIndex;
    } else if (roomImages) {
      lightboxImages = roomImages.map(img => getMediaUrl(motel!.id, img.media, "motel"));
      lightboxCurrentIndex = imageIndex;
    }

    lightboxOpen = true;

    trackMotelImageGallery({
      motelId: motel.id,
      motelName: motel.name,
      imageIndex,
      totalImages: lightboxImages.length
    });
  }

  function handleLightboxClose() {
    lightboxOpen = false;
  }

  function handleReviewError(event: CustomEvent<string>) {
    reviewError = event.detail;
  }
</script>

<svelte:head>
  <title>{motel.name} en {motel.location.hood ? `${motel.location.hood}, ` : ''}{motel.location.city} | Daisy's Secrets</title>
  <meta name="description" content="{motel.description || `Disfrutá de ${motel.name}, alojamiento ubicado en ${motel.address}, ${motel.location.city}`}. Reservá ahora en Daisy's Secrets." />
  <meta property="og:title" content="{motel.name} - Motel en {motel.location.city}" />
  <meta property="og:description" content="{motel.description || `Disfrutá de ${motel.name}, alojamiento ubicado en ${motel.address}, ${motel.location.city}`}" />
  <meta property="og:image" content="{motel.images[0] ? getAbsoluteMediaUrl(motel.id, motel.images[0].media, 'motel') : ''}" />
  <meta property="og:url" content="{pageUrl}" />
  <meta property="og:type" content="business.business" />
  <meta property="og:locale" content="es_AR" />
  <meta property="og:site_name" content="Daisy's Secrets" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{motel.name} - Motel en {motel.location.city}" />
  <meta name="twitter:description" content="{motel.description || `Disfrutá de ${motel.name}, alojamiento ubicado en ${motel.address}, ${motel.location.city}`}" />
  <meta name="twitter:image" content="{motel.images[0] ? getAbsoluteMediaUrl(motel.id, motel.images[0].media, 'motel') : ''}" />
  <link rel="canonical" href="{pageUrl}" />
  <link rel="alternate" hreflang="es-ar" href="{pageUrl}" />
  <link rel="alternate" hreflang="es" href="{pageUrl}" />
  <link rel="alternate" hreflang="x-default" href="{pageUrl}" />
  <script type="application/ld+json">
    {JSON.stringify(buildJsonLd(motel, pageUrl, reviews, reviewCount))}
  </script>
</svelte:head>

<main class="min-h-screen bg-neutral-950 text-neutral-100 p-4">
  {#if motel}
    <!-- Motel Data -->
    <section class="max-w-6xl mx-auto">
      <div class="flex flex-col md:flex-row md:gap-10">
        <div class="md:w-2/3">
          <h1 class="text-4xl font-semibold mb-2 text-neutral-50">{motel.name}</h1>
          <p class="text-neutral-400">{motel.address}</p>

          <div class="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
            {#each motel.images.sort((a, b) => a.order - b.order) as img, index}
              <img
                      src={getMediaUrl(motel.id, img.media, "motel")}
                      alt="Foto del alojamiento"
                      class="rounded-xl w-full h-44 object-cover shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                      on:click={() => handleImageClick(index, 'motel')}
              />
            {/each}
          </div>

          <div class="mt-8">
            <h2 class="text-2xl font-semibold mb-3 text-neutral-100">Descripción</h2>
            <p class="text-neutral-300 leading-relaxed">{motel.description}</p>
          </div>

          <div class="mt-8">
            <h2 class="text-2xl font-semibold mb-3 text-neutral-100">Servicios</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {#each motel.services as service}
                <div class="bg-neutral-800 p-4 rounded-lg flex items-center">
                  <span class="text-green-400 mr-3">✓</span>
                  <span>{service}</span>
                </div>
              {/each}
            </div>
          </div>

          {#if motel.rooms && motel.rooms.length > 0}
            <div class="mt-8">
              <h2 class="text-2xl font-semibold mb-3 text-neutral-100">Habitaciones</h2>
              <div class="grid gap-6">
                {#each motel.rooms as room}
                  <div class="bg-neutral-800 p-6 rounded-lg">
                    <h3 class="text-xl font-semibold text-neutral-100 mb-1">{room.name}</h3>
                    {#if room.price != null}
                      <div class="text-sm text-neutral-400 mb-2">Desde ${room.price.toLocaleString('es-AR')}</div>
                    {/if}
                    <p class="text-neutral-300 mb-4">{room.description}</p>

                    {#if room.features && room.features.length > 0}
                      <div class="mb-4">
                        <h4 class="text-sm font-semibold text-neutral-200 mb-2">Características:</h4>
                        <div class="flex flex-wrap gap-2">
                          {#each room.features as feature}
                            <span class="bg-neutral-700 text-neutral-300 px-2 py-1 rounded text-sm">{feature}</span>
                          {/each}
                        </div>
                      </div>
                    {/if}

                    {#if room.images && room.images.length > 0}
                      <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                        {#each room.images as img, index}
                          <img
                                  src={getMediaUrl(motel.id, img.media, "motel")}
                                  alt="Foto de {room.name}"
                                  class="rounded w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  on:click={() => handleImageClick(index, 'room', room.images)}
                          />
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if motel.motelStaySlots && motel.motelStaySlots.length > 0}
            <div class="mt-8">
              <h2 class="text-2xl font-semibold mb-3 text-neutral-100">Tarifas por Turno</h2>
              <div class="grid gap-4">
                {#each motel.motelStaySlots as slot}
                  {@const room = motel.rooms?.find(r => r.id === slot.roomId)}
                  <div class="bg-neutral-800 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <div class="font-semibold text-neutral-100">{room ? room.name : (slot.roomId || 'General')}</div>
                      <div class="text-sm text-neutral-400">
                        {Array.isArray(slot.days) ? slot.days.join(', ') : ''}{slot.durationHours ? ` • ${slot.durationHours}h` : ''}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-lg font-bold text-green-400">${slot.price?.toLocaleString('es-AR')}</div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if motel.overnightInfo && motel.overnightInfo.length > 0}
            <div class="mt-8">
              <h2 class="text-2xl font-semibold mb-3 text-neutral-100">Pernocte</h2>
              <div class="grid gap-4">
                {#each motel.overnightInfo as overnight}
                  {@const room = motel.rooms?.find(r => r.id === (overnight as any).roomId)}
                  <div class="bg-neutral-800 p-4 rounded-lg">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <div class="font-semibold text-neutral-100">{room ? room.name : 'Pernocte general'}</div>
                        <div class="text-sm text-neutral-400">{Array.isArray(overnight.days) ? overnight.days.join(', ') : ''}</div>
                      </div>
                      <div class="text-right">
                        <div class="text-lg font-bold text-green-400">${overnight.price.toLocaleString('es-AR')}</div>
                        <div class="text-sm text-neutral-400">por pernocte</div>
                      </div>
                    </div>
                    <div class="text-sm text-neutral-300 space-y-1">
                      <div>Check-in: {overnight.checkInTime} • Check-out: {overnight.checkOutTime}</div>
                      {#if overnight.breakfastIncluded}
                        <div>Desayuno incluido</div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <div class="mt-8">
            <h2 class="text-2xl font-semibold mb-3 text-neutral-100">Mapa del alojamiento</h2>
            <div id="map" class="w-full h-72 rounded-xl mt-3" style="z-index: 0;"></div>
          </div>

          <div class="mt-12">
            <!-- reserved for nearby profiles -->
          </div>
        </div>

        <div class="md:w-[28%] bg-neutral-900 p-8 rounded-2xl mt-8 md:mt-0 shadow-2xl">
          <div class="text-2xl font-bold text-green-400 mb-3">Alojamiento verificado</div>
          <p class="text-sm text-neutral-400 mb-4">
            La información de este alojamiento ha sido verificada por nuestro equipo.
          </p>

          <button
                  on:click={handleContactClick}
                  class="w-full bg-neutral-50 text-black py-3 rounded-lg hover:bg-neutral-200 transition-colors font-semibold"
          >
            {#if showContact}Ocultar{:else}Ver{/if} métodos de contacto
          </button>

          {#if showContact}
            <div class="mt-4 bg-neutral-800 p-4 rounded-lg">
              <h4 class="font-semibold text-neutral-100 mb-2">Información de Contacto</h4>
              <ul class="text-neutral-300 space-y-2">
                {#each motel.contactMethods as method}
                  {#if typeof method === 'string' && (method.startsWith('tel:') || /^\+?\d[\d\s\-().]+$/.test(method))}
                    {@const tel = method.startsWith('tel:') ? method : `tel:${method.replace(/[^\d+]/g,'')}`}
                    <li><a href={tel} class="underline underline-offset-2 hover:text-neutral-100">{method.replace(/^tel:/,'')}</a></li>
                  {:else}
                    <li>{method}</li>
                  {/if}
                {/each}
              </ul>
            </div>
          {/if}

          <div class="mt-4 text-sm text-neutral-500">
            <strong>Ubicación:</strong><br>
            {motel.location.hood ? `${motel.location.hood}, ` : ''}{motel.location.city}<br>
            {motel.location.state}, {motel.location.country}
            {#if motel.location.zipCode}
              <br>CP: {motel.location.zipCode}
            {/if}
          </div>

          <div class="mt-6">
            <h3 class="text-lg font-semibold text-neutral-200 mb-3">Etiquetas</h3>
            <div class="flex flex-wrap gap-2">
              {#each motel.tags as tag}
                <span class="bg-neutral-700 text-neutral-300 px-3 py-1 rounded-full text-sm">{tag}</span>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Reviews Section -->
    {#if reviewError}
      <div class="mt-8 max-w-4xl mx-auto bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
        {reviewError}
      </div>
    {/if}

    <ReviewList
            motelId={motel.id}
            motelName={motel.name}
            on:error={handleReviewError}
    />
  {/if}
</main>

<!-- Image Lightbox -->
<ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxCurrentIndex}
        isOpen={lightboxOpen}
        alt="{motel?.name || 'Imagen del motel'}"
        on:close={handleLightboxClose}
/>

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
