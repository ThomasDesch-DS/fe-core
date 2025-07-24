<script lang="ts">
  import type { MotelPreviewDto } from '$lib/types/motel';
  import { slugify } from '$lib/utils/slugify';
  import { trackMotelPreviewClick } from '$lib/analytics/analytics';

  export let motel: MotelPreviewDto;

  function formatLocation(motel: MotelPreviewDto): string {
    const { location } = motel;
    return location.hood ? `${location.hood}, ${location.city}` : location.city;
  }

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

  function handleClick() {
    trackMotelPreviewClick({
      motelName: motel.name,
      motelLocation: formatLocation(motel),
      country: motel.location.country,
      state: motel.location.state,
      city: motel.location.city,
      hood: motel.location.hood,
      hasHood: Boolean(motel.location.hood),
      clickSource: 'homepage_preview'
    });
  }
</script>

<a
  href={getMotelUrl(motel)}
  on:click={handleClick}
  class="group relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden transition-all duration-300 hover:border-zinc-700/70 hover:bg-zinc-900/90 hover:shadow-lg hover:shadow-white/5 flex-shrink-0 w-80 md:w-auto"
>
  <div class="relative overflow-hidden">
    <img
      src={motel.imageUrl}
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