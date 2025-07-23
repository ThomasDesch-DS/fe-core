<!-- src/routes/escort/[displayName]/+page.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { api } from '$lib/escort/api/apiClient';
    import { page } from '$app/stores';
    import { toast } from 'svelte-sonner';
    import { getMediaUrl } from "../../../util/MediaUtils";
    import IconWhatsapp from "~icons/fa6-brands/whatsapp";
    import SocialIcon from "$lib/common/SocialIcon.svelte";
    import { catlist } from "$lib/escort/store/catlistStore";
    import { dSuserAuthStore } from "$lib/escort/store/dsUserAuthStore";
    import { goto } from "$app/navigation";
    import PriceChart from "$lib/charts/PriceChart.svelte";

    // ---- CONFIGURACIÓN ----
    const ESCORT_CACHE_KEY = 'escortDetailCache';
    const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

    // ---- INTERFACES ----
    interface Escort {
        id: string;
        displayName: string;
        publicPhoneNumber: string;
        description: string;
        location: { country: string; state: string; city: string; hood: string; };
        appearance: {
            heightInCm: number; weightInKg: number;
            nationality: string; gender: string;
            hairColor: string; eyeColor: string;
            skinColor: string; ethnicity: string;
            breastSize: string; buttSize: string;
            waxingLevel: string; penisSize: null | string;
            bust: number; waist: number; hips: number;
        };
        servicesInfo: {
            escortServices: string[]; escortFantasies: string[];
            massageType: string[]; virtualServices: string[];
            hourPrice: { amount: number; currency: string; };
            customRate: { serviceName: string; duration: string; incallPrice: number; outcallPrice: number; }[];
        };
        availability: {
            onlyVirtual: boolean; onlyInPerson: boolean;
            ownApartment: boolean; motels: boolean; clientPlace: boolean;
            schedule: { day: string; slots: { startHourWithMinutes: string; endHourWithMinutes: string; }[]; }[];
        };
        contactMethod: { value: string; type: string; }[];
        media: {
            profilePicture: string;
            pics: { media: string; order: number; }[];
            videos: { media: string; order: number; }[];
            audioClip: null | string;
            kyc: string[];
        };
        age: number; ageType: string;
    }
    interface EscortCacheEntry {
        escort: Escort;
        timestamp: number;
    }

    // ---- ESTADO ----
    let escort: Escort | null = null;
    let loading = true;
    let error = '';
    let activeServiceTab: 'in_person' | 'fantasies' | 'virtual' = 'in_person';
    const tabs = [
        { key: 'in_person', label: 'Presencial' },
        { key: 'fantasies', label: 'Fantasías' },
        { key: 'virtual', label: 'Virtual' },
    ];

    // ---- AUTENTICACIÓN ----
    let isLoggedIn: boolean;
    $: isLoggedIn = $dSuserAuthStore.isAuthenticated;

    // ---- CATLIST ----
    let isInCatlist = false;
    $: if (escort) {
        isInCatlist = isLoggedIn && $catlist.some(item => item.escortId === escort.id);
    }

    async function handleCatlistToggle() {
        if (!escort) return;
        if (!isLoggedIn) {
            toast.error(`Tenés que loguearte para guardar a ${escort.displayName} en tu Catlist!`);
            goto("/users/login");
            return;
        }
        const existing = $catlist.find(i => i.escortId === escort.id);
        if (existing) {
            const promise = catlist.remove(existing.id);
            toast.promise(promise, {
                loading: 'Quitando de tu Catlist…',
                success: '💔 Quitada de tu Catlist',
                error: 'No se pudo quitar 😕'
            });
        } else {
            const promise = catlist.add(escort.id, {
                slug: $page.params.displayName,
                displayName: escort.displayName,
                profilePic: escort.media.profilePicture
            });
            toast.promise(promise, {
                loading: `Añadiendo a ${escort.displayName}…`,
                success: '💖 Añadida a tu Catlist!',
                error: 'No se pudo añadir 😢'
            });
        }
    }

    // ---- MEDIA TABS ----
    let activeMediaTab: 'all' | 'fotos' | 'videos' = 'all';
    const mediaTabs = [
        { key: 'all', label: 'Todo' },
        { key: 'fotos', label: 'Fotos' },
        { key: 'videos', label: 'Videos' },
    ];

    // ---- GALERÍA + SWIPE + SHARE ----
    let modalOpen = false;
    let modalIndex = 0;
    let touchStartX = 0;

    $: sortedPics = escort
        ? [...escort.media.pics]
            .sort((a, b) => a.order - b.order)
            .map(pic => ({ ...pic, media: getMediaUrl(escort.id, pic.media, 'pics') }))
        : [];
    $: sortedVideos = escort
        ? [...escort.media.videos]
            .sort((a, b) => a.order - b.order)
            .map(vid => ({ ...vid, media: getMediaUrl(escort.id, vid.media, 'videos') }))
        : [];
    $: audioClipURL = escort?.media.audioClip
        ? getMediaUrl(escort.id, escort.media.audioClip, 'audio')
        : null;

    // ---- CACHE LOGIC ----
    function getCache(): Record<string, EscortCacheEntry> {
        try {
            return JSON.parse(localStorage.getItem(ESCORT_CACHE_KEY) || '{}');
        } catch {
            return {};
        }
    }
    function saveCache(cache: Record<string, EscortCacheEntry>) {
        localStorage.setItem(ESCORT_CACHE_KEY, JSON.stringify(cache));
    }
    function getFromCache(displayName: string): Escort | null {
        const cache = getCache();
        const entry = cache[displayName];
        if (!entry) return null;
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            delete cache[displayName];
            saveCache(cache);
            return null;
        }
        return entry.escort;
    }
    function setToCache(displayName: string, escort: Escort) {
        const cache = getCache();
        cache[displayName] = { escort, timestamp: Date.now() };
        saveCache(cache);
    }

    // ---- UX HANDLERS ----
    function openModal(i: number) {
        modalIndex = i;
        modalOpen = true;
        history.pushState({ lightbox: true }, '');
    }
    function closeModal() {
        modalOpen = false;
        if (history.state?.lightbox) history.back();
    }
    function prevImage() {
        modalIndex = (modalIndex - 1 + sortedPics.length) % sortedPics.length;
    }
    function nextImage() {
        modalIndex = (modalIndex + 1) % sortedPics.length;
    }
    function handleKeydown(e: KeyboardEvent) {
        if (!modalOpen) return;
        if (e.key === 'Escape') closeModal();
        else if (e.key === 'ArrowLeft') prevImage();
        else if (e.key === 'ArrowRight') nextImage();
    }
    function handlePopState() {
        if (modalOpen && !history.state?.lightbox) {
            modalOpen = false;
        }
    }
    function handleTouchStart(e: TouchEvent) {
        touchStartX = e.touches[0].clientX;
    }
    function handleTouchEnd(e: TouchEvent) {
        const diff = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? prevImage() : nextImage();
        }
    }
    async function shareEscort() {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: escort?.displayName, url });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('¡Link copiado!');
            }
        } catch (err) {
            console.error('Error compartiendo:', err);
        }
    }

    // ---- FETCH Y MOUNT ----
    onMount(async () => {
        window.addEventListener('keydown', handleKeydown);
        window.addEventListener('popstate', handlePopState);
        try {
            const { displayName } = $page.params;
            if (!displayName) throw new Error('Nombre de escort no encontrado');

            const cachedEscort = getFromCache(displayName);
            if (cachedEscort) {
                if (cachedEscort.media.profilePicture) {
                    cachedEscort.media.profilePicture = getMediaUrl(
                        cachedEscort.id,
                        cachedEscort.media.profilePicture,
                        'profile'
                    );
                }
                escort = cachedEscort;
            } else {
                const data = await api.get<Escort>(`/${displayName}`);
                if (data.media.profilePicture) {
                    data.media.profilePicture = getMediaUrl(
                        data.id,
                        data.media.profilePicture,
                        'profile'
                    );
                }
                escort = data;
                setToCache(displayName, data);
            }
        } catch (err) {
            console.error(err);
            error = err instanceof Error ? err.message : 'Error desconocido';
        } finally {
            loading = false;
        }
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
        window.removeEventListener('popstate', handlePopState);
    });

    // ---- TAGS ----
    $: primaryTags = escort
        ? [
            'Disponible',
            escort.appearance.gender === 'Mujer' ? 'Mujer' : 'Hombre',
            escort.availability.onlyVirtual ? 'Solo virtual' : 'Presencial'
        ]
        : [];
    $: secondaryTags = escort
        ? [
            ...(escort.publicPhoneNumber ? [`☎️ ${escort.publicPhoneNumber}`] : []),
            `NAC ${escort.appearance.nationality}`,
            `CABELLO ${escort.appearance.hairColor}`,
            `OJOS ${escort.appearance.eyeColor}`,
            `DEPILACIÓN ${escort.appearance.waxingLevel}`,
            `PECHO ${escort.appearance.breastSize}`,
            `GLÚTEOS ${escort.appearance.buttSize}`,
            `ALT ${escort.appearance.heightInCm}cm`,
            `PESO ${escort.appearance.weightInKg}kg`
        ]
        : [];

    $: if (escort?.displayName) {
        document.title = escort.displayName;
    }
</script>

<svelte:head>
    <link rel="preconnect" href={ import.meta.env.VITE_MEDIA_CDN} />
    {#if escort?.media.profilePicture}
        <link rel="preload" as="image" href={escort.media.profilePicture} />
    {/if}
</svelte:head>

<style>
    :root { --black:#000; --white:#fff; }
    :global(html){scroll-behavior:smooth;}
    :global(body){margin:0;padding:0;background:var(--black);color:var(--white);}
    table{width:100%;border-collapse:collapse;margin-top:.5rem;}
    th,td{border:1px solid #333;padding:.5rem;text-align:left;}
    th{background:#111;}

    .btn-vercel {
        @apply inline-block px-8 py-3 font-semibold uppercase rounded-full
        border border-white bg-transparent text-white transition-colors duration-200;
    }
    .btn-vercel:hover {
        @apply bg-white text-black;
    }
    .share-btn {
        @apply p-2 rounded-full bg-white/10 text-white transition-colors duration-200;
    }
    .share-btn:hover {
        @apply bg-white text-black;
    }
    .audio-card {
        @apply max-w-xl mx-auto bg-white/10 rounded-lg p-6 flex items-center gap-4;
    }
    .audio-icon {
        width: 2rem; height: 2rem; flex-shrink: 0;
    }
    .audio-player { @apply w-full; }
    .group:hover .group-hover\:opacity-100 { opacity:1; }
    .transition-opacity { transition: opacity 0.2s ease-in-out; }
    .pointer-events-none { pointer-events:none; }
    .transform { transform: translateX(-50%); }
</style>

<main class="font-sans">
    {#if loading}
        <div class="p-8 space-y-6">
            <div class="h-96 bg-gray-800 rounded animate-pulse"></div>
            <div class="h-8 bg-gray-800 rounded animate-pulse w-1/3"></div>
            <div class="h-6 bg-gray-800 rounded animate-pulse w-1/4"></div>
            <div class="h-64 bg-gray-800 rounded animate-pulse"></div>
            <div class="h-8 bg-gray-800 rounded animate-pulse w-1/2"></div>
        </div>
    {:else if error}
        <div class="flex items-center justify-center h-screen">
            <div class="bg-red-900/50 p-6 rounded-lg text-center max-w-sm">
                <h2 class="text-xl font-bold mb-2">Error</h2>
                <p class="text-gray-300">{error}</p>
                <button
                        on:click={() => location.reload()}
                        class="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                    Reintentar
                </button>
            </div>
        </div>
    {:else if escort}
        <!-- HERO -->
        <section class="relative h-screen flex items-center justify-center text-center">
            <img
                    src={escort.media.profilePicture}
                    alt="Imagen destacada"
                    class="absolute inset-0 object-cover w-full h-full filter brightness-50"
            />
            <div class="absolute top-4 right-4 z-20">
                <button
                        on:click={shareEscort}
                        class="share-btn"
                        aria-label="Compartir"
                >
                    <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            viewBox="0 0 24 24"
                    >
                        <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M4 12v1a2 2 0 002 2h4m4 0h4a2 2 0 002-2v-1m-5 1V8m0 0l-4 4m4-4l-4-4"
                        />
                    </svg>
                </button>
            </div>
            <div class="relative z-10 space-y-4">
                <h1 class="text-6xl font-extrabold">
                    {escort.displayName}
                </h1>
                <div class="flex justify-center gap-2 flex-wrap">
                    {#each primaryTags as t}
                        <span class="px-4 py-1 rounded-full bg-white/20 backdrop-blur text-white">
                            {t}
                        </span>
                    {/each}
                </div>
                <div class="flex justify-center gap-4">
                    <a
                            href={`https://wa.me/${escort.publicPhoneNumber}`}
                            target="_blank"
                            class="btn-vercel"
                    >
                        Reservá ahora
                    </a>

                    <!-- Botón con toggle Catlist -->
                    <div class="relative group inline-block">
                        <button
                                on:click={handleCatlistToggle}
                                class="btn-vercel"
                        >
                            {#if isInCatlist}
                                Quitar de Catlist
                            {:else}
                                Añadir a Catlist
                            {/if}
                        </button>
                        <div
                                class="absolute bottom-full left-1/2 mb-2 w-48 p-2 text-sm text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none transform -translate-x-1/2"
                        >
                            Catlist es tu lista de “cats” que querés visitar. 🐱✨
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- AUDIO SECTION -->
        {#if audioClipURL}
            <section class="bg-black py-12 px-8 md:px-16">
                <div class="audio-card">
                    <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            stroke="currentColor"
                            class="audio-icon text-white"
                            viewBox="0 0 24 24"
                    >
                        <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 19V6l12-2v15M9 19l-5-5H5a2 2 0 01-2-2V8a2 2 0 012-2h1l5-5v18z"
                        />
                    </svg>
                    <audio controls src={audioClipURL} class="audio-player"></audio>
                </div>
            </section>
        {/if}

        <!-- Sticky CTA -->
        <div class="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md p-4 flex justify-between items-center md:hidden">
            <p class="text-sm text-gray-300">
                Precio por hora: {escort.servicesInfo.hourPrice.currency}
                {escort.servicesInfo.hourPrice.amount.toLocaleString('es-AR')}
            </p>
            <a
                    href={`https://wa.me/${escort.publicPhoneNumber}`}
                    class="p-3 rounded-full border border-white hover:bg-white/10 transition"
            >
                💬
            </a>
        </div>

        <!-- GALLERY con tabs -->
        <section class="bg-black py-16 px-8 md:px-16">
            <h2 class="text-4xl font-semibold mb-8">Galería</h2>
            <nav class="border-b border-gray-700 mb-8">
                <ul class="flex gap-6">
                    {#each mediaTabs as { key, label }}
                        <li>
                            <button
                                    role="tab"
                                    aria-selected={activeMediaTab === key}
                                    class="pb-2 px-4 -mb-px border-b-2 transition-all duration-200
                                    {activeMediaTab === key
                                        ? 'border-white text-white font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-white hover:border-gray-500'}"
                                    on:click={() => (activeMediaTab = key)}
                            >
                                {label}
                            </button>
                        </li>
                    {/each}
                </ul>
            </nav>

            {#if activeMediaTab === 'all'}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {#each sortedPics as pic, i}
                        <div class="relative group">
                            <img
                                    src={pic.media}
                                    alt="imagen"
                                    loading="lazy"
                                    class="w-full h-64 object-cover rounded-md transform transition duration-200 group-hover:scale-105 cursor-pointer"
                                    on:click={() => openModal(i)}
                            />
                            <span class="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded">
                                #{i + 1}
                            </span>
                        </div>
                    {/each}
                    {#each sortedVideos as vid}
                        <video
                                controls
                                src={vid.media}
                                class="w-full h-64 object-cover rounded-md"
                        ></video>
                    {/each}
                </div>
            {:else if activeMediaTab === 'fotos'}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {#each sortedPics as pic, i}
                        <div class="relative group">
                            <img
                                    src={pic.media}
                                    alt="imagen"
                                    loading="lazy"
                                    class="w-full h-64 object-cover rounded-md transform transition duration-200 group-hover:scale-105 cursor-pointer"
                                    on:click={() => openModal(i)}
                            />
                            <span class="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded">
                                #{i + 1}
                            </span>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="space-y-8">
                    {#each sortedVideos as vid}
                        <video
                                controls
                                src={vid.media}
                                class="w-full h-auto rounded-md"
                        ></video>
                    {/each}
                </div>
            {/if}
        </section>

        {#if modalOpen}
            <!-- Lightbox -->
            <div
                    class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
                    on:touchstart={handleTouchStart}
                    on:touchend={handleTouchEnd}
            >
                <button on:click={closeModal} class="absolute top-4 right-4 text-white text-3xl">
                    &times;
                </button>
                <button on:click={prevImage} class="absolute left-4 text-white text-3xl">
                    &lt;
                </button>
                <img
                        src={sortedPics[modalIndex].media}
                        alt="Imagen completa"
                        class="max-h-full max-w-full object-contain"
                />
                <button on:click={nextImage} class="absolute right-4 text-white text-3xl">
                    &gt;
                </button>
            </div>
        {/if}

        <!-- SERVICES & PRICING -->
        <section class="bg-black py-16 px-8 md:px-16">
            <h2 class="text-4xl font-semibold mb-8">Servicios y Tarifas</h2>
            <nav class="border-b border-gray-700 mb-8">
                <ul class="flex gap-6">
                    {#each tabs as { key, label }}
                        <li>
                            <button
                                    role="tab"
                                    aria-selected={activeServiceTab === key}
                                    class="pb-2 px-4 -mb-px border-b-2 transition-all duration-200
                                    {activeServiceTab === key
                                        ? 'border-white text-white font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-white hover:border-gray-500'}"
                                    on:click={() => (activeServiceTab = key)}
                            >
                                {label}
                            </button>
                        </li>
                    {/each}
                </ul>
            </nav>

            {#if activeServiceTab === 'in_person'}
                <div class="flex flex-wrap gap-3">
                    {#each escort.servicesInfo.escortServices as s}
                        <span class="px-4 py-2 bg-gray-800 text-gray-200 rounded-full">
                            {s}
                        </span>
                    {/each}
                </div>
            {:else if activeServiceTab === 'fantasies'}
                <div class="flex flex-wrap gap-3">
                    {#each escort.servicesInfo.escortFantasies as f}
                        <span class="px-4 py-2 bg-gray-800 text-gray-200 rounded-full">
                            {f}
                        </span>
                    {/each}
                </div>
            {:else}
                <div class="flex flex-wrap gap-3">
                    {#each escort.servicesInfo.virtualServices as v}
                        <span class="px-4 py-2 bg-gray-800 text-gray-200 rounded-full">
                            {v}
                        </span>
                    {/each}
                </div>
            {/if}

            <div class="border-t border-gray-700 pt-6 mt-6">
                <p class="text-xl font-semibold">
                    Precio por hora: {escort.servicesInfo.hourPrice.currency}
                    {escort.servicesInfo.hourPrice.amount.toLocaleString('es-AR')}
                </p>

                {#if escort.servicesInfo.customRate.length}
                    <table>
                        <thead>
                        <tr>
                            <th>Servicio</th>
                            <th>Duración</th>
                            <th>En mi lugar</th>
                            <th>A domicilio</th>
                        </tr>
                        </thead>
                        <tbody>
                        {#each escort.servicesInfo.customRate as cr}
                            <tr>
                                <td>{cr.serviceName}</td>
                                <td>{cr.duration}</td>
                                <td>${cr.incallPrice.toLocaleString('es-AR')}</td>
                                <td>${cr.outcallPrice.toLocaleString('es-AR')}</td>
                            </tr>
                        {/each}
                        </tbody>
                    </table>
                {/if}
            </div>
        </section>

        <!-- SOBRE MÍ -->
        <section class="bg-black py-16 px-8 md:px-16">
            <h2 class="text-3xl font-semibold mb-4">Sobre mí 🌹</h2>
            <p class="leading-relaxed">{escort.description}</p>
        </section>

        <!-- INFORMACIÓN BÁSICA & APARIENCIA -->
        <section class="bg-black py-16 px-8 md:px-16 grid md:grid-cols-2 gap-16">
            <div>
                <h2 class="text-3xl font-semibold mb-4">Información Básica</h2>
                <ul class="space-y-3 text-lg">
                    <li><strong>Nombre:</strong> {escort.displayName}</li>
                    <li><strong>Edad:</strong> {escort.age}</li>
                    <li><strong>Nacionalidad:</strong> {escort.appearance.nationality}</li>
                    <li><strong>Género:</strong> {escort.appearance.gender}</li>
                    <li><strong>Ubicación:</strong> {escort.location.city}, {escort.location.state}, {escort.location.country}</li>
                </ul>
            </div>
            <div>
                <h2 class="text-3xl font-semibold mb-4">Apariencia</h2>
                <ul class="space-y-3 text-lg">
                    <li><strong>Pelo:</strong> {escort.appearance.hairColor}</li>
                    <li><strong>Ojos:</strong> {escort.appearance.eyeColor}</li>
                    <li><strong>Altura:</strong> {escort.appearance.heightInCm} cm</li>
                    <li><strong>Peso:</strong> {escort.appearance.weightInKg} kg</li>
                    <li><strong>Glúteos:</strong> {escort.appearance.buttSize}</li>
                    <li><strong>Medidas:</strong> {escort.appearance.bust}-{escort.appearance.waist}-{escort.appearance.hips}</li>
                </ul>
                <p class="mt-6"><strong>Depilación:</strong> {escort.appearance.waxingLevel}</p>
            </div>
        </section>

        <!-- HORARIO DE ATENCIÓN -->
        <section class="bg-black py-16 px-8 md:px-16">
            <h2 class="text-3xl font-semibold mb-4">Horario de Atención</h2>
            {#if escort.availability.schedule.length}
                <div class="space-y-3">
                    {#each escort.availability.schedule as day}
                        <div class="flex justify-between">
                            <span class="font-medium">{day.day}</span>
                            <div>
                                {#each day.slots as slot}
                                    <span class="mx-1">{slot.startHourWithMinutes}–{slot.endHourWithMinutes}</span>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="uppercase font-medium">TIEMPO COMPLETO</p>
            {/if}
        </section>
        <section class="bg-black py-16 px-8 md:px-16">
            <h2 class="text-3xl font-semibold mb-4 text-white">
                Rango de Precios
            </h2>
            <p class="text-gray-400 mb-6">
                “Barato” a la izquierda — “Caro” a la derecha
            </p>
            <PriceChart currentEscortPrice={escort.servicesInfo.hourPrice.amount}/>
        </section>
        <!-- CONTACTO -->
        <section class="bg-black py-16 px-8 md:px-16 text-white">
            <h2 class="text-4xl font-semibold mb-6">Contacto</h2>
            <div class="flex flex-wrap gap-8">
                {#if escort.publicPhoneNumber}
                    <a
                            href={`https://wa.me/${escort.publicPhoneNumber}`}
                            class="flex items-center gap-2 border border-gray-700 px-3 py-1 rounded text-lg hover:text-white hover:border-white transition"
                    >
                        <IconWhatsapp class="text-green-500 w-5 h-5" />
                        {escort.publicPhoneNumber}
                    </a>
                {/if}

                {#each escort.contactMethod as cm}
                    <SocialIcon type={cm.type} value={cm.value} />
                {/each}
            </div>
        </section>

    {/if}
</main>
