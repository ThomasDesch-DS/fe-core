<!-- src/routes/escort/[displayName]/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { api } from '$lib/escort/api/apiClient';
    import { page } from '$app/stores';

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
            videos: any[]; audioClip: null | string; kyc: string[];
        };
        age: number; ageType: string;
    }

    let escort: Escort | null = null;
    let loading = true;
    let error = '';
    let activeServiceTab: 'in_person'|'fantasies'|'virtual' = 'in_person';

    // Lightbox
    let modalOpen = false;
    let modalIndex = 0;
    $: sortedPics = escort ? [...escort.media.pics].sort((a,b)=>a.order-b.order) : [];

    function getMediaUrl(id: string, file: string, type: 'profile'|'pics') {
        return `https://nexus.daisyssecrets.com/escorts/${id}/${type}/${file}`;
    }
    function openModal(i: number) { modalIndex = i; modalOpen = true; }
    function closeModal() { modalOpen = false; }
    function prevImage() { modalIndex = (modalIndex - 1 + sortedPics.length) % sortedPics.length; }
    function nextImage() { modalIndex = (modalIndex + 1) % sortedPics.length; }

    onMount(async () => {
        try {
            const { displayName } = $page.params;
            if (!displayName) throw new Error('Display name not found');
            const data = await api.get<Escort>(`/${displayName}`);
            escort = data;
            if (escort.media.profilePicture)
                escort.media.profilePicture = getMediaUrl(escort.id, escort.media.profilePicture, 'profile');
            if (escort.media.pics)
                escort.media.pics = escort.media.pics.map(pic => ({
                    ...pic,
                    media: getMediaUrl(escort.id, pic.media, 'pics')
                }));
        } catch (err) {
            console.error(err);
            error = err instanceof Error ? err.message : 'Unknown error';
        } finally {
            loading = false;
        }
    });

    $: primaryTags = escort ? [
        'Available',
        escort.appearance.gender==='FEMALE' ? 'Female':'Male',
        escort.availability.onlyVirtual?'Only Virtual':'In Person'
    ] : [];

    $: secondaryTags = escort ? [
        ...(escort.publicPhoneNumber?[`☎️ ${escort.publicPhoneNumber}`]:[]),
        `NAT ${escort.appearance.nationality}`,
        `HAIR ${escort.appearance.hairColor}`,
        `EYES ${escort.appearance.eyeColor}`,
        `WAX ${escort.appearance.waxingLevel}`,
        `BREAST ${escort.appearance.breastSize}`,
        `BUTT ${escort.appearance.buttSize}`,
        `HT ${escort.appearance.heightInCm}cm`,
        `WT ${escort.appearance.weightInKg}kg`
    ] : [];
</script>

<svelte:head>
    <link rel="preconnect" href="https://nexus.daisyssecrets.com" />
    {#if escort?.media.profilePicture}
        <link rel="preload" as="image" href={escort.media.profilePicture} />
    {/if}
</svelte:head>

<style>
    :root { --accent:#00ACEE; --black:#000; --white:#fff; }
    :global(html){scroll-behavior:smooth;}
    :global(body){margin:0;padding:0;background:var(--black);color:var(--white);}
    table{width:100%;border-collapse:collapse;margin-top:.5rem;}
    th,td{border:1px solid #333;padding:.5rem;text-align:left;}
    th{background:#111;}
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
                <button on:click={()=>location.reload()}
                        class="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                    Try Again
                </button>
            </div>
        </div>
    {:else if escort}
        <!-- HERO -->
        <section class="relative h-screen flex items-center justify-center text-center">
            <img src={escort.media.profilePicture} alt="Hero"
                 class="absolute inset-0 object-cover w-full h-full filter brightness-50"/>
            <div class="relative z-10 space-y-4">
                <h1 class="text-6xl font-extrabold">{escort.displayName}</h1>
                <div class="flex justify-center gap-2 flex-wrap">
                    {#each primaryTags as t}
                        <span class="px-4 py-1 rounded-full bg-white/20 backdrop-blur text-white">{t}</span>
                    {/each}
                </div>
                <a href={`https://wa.me/${escort.publicPhoneNumber}`}
                   class="mt-6 inline-block px-8 py-3 font-semibold uppercase rounded-full border-2 border-[var(--accent)] hover:bg-[var(--accent)] transition">
                    Book Now
                </a>
            </div>
        </section>

        <!-- Sticky CTA -->
        <div class="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md p-4 flex justify-between items-center md:hidden">
            <p class="text-sm text-gray-300">
                Hourly: {escort.servicesInfo.hourPrice.currency} {escort.servicesInfo.hourPrice.amount.toLocaleString('es-AR')}
            </p>
            <a href={`https://wa.me/${escort.publicPhoneNumber}`}
               class="p-3 rounded-full border border-[var(--accent)] hover:bg-[var(--accent)]/20">💬</a>
        </div>

        <!-- GALLERY -->
        <section class="bg-black py-16 px-8 md:px-16">
            <h2 class="text-4xl font-semibold mb-8">Gallery</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each sortedPics as pic,i}
                    <div class="relative group">
                        <img src={pic.media} alt="pic" loading="lazy"
                             class="w-full h-64 object-cover rounded-md transform transition duration-200 group-hover:scale-105 cursor-pointer"
                             on:click={()=>openModal(i)}/>
                        <span class="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded">#{i+1}</span>
                    </div>
                {/each}
            </div>
        </section>

        <!-- Lightbox -->
        {#if modalOpen}
            <div class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
                <button on:click={closeModal} class="absolute top-4 right-4 text-white text-3xl">&times;</button>
                <button on:click={prevImage} class="absolute left-4 text-white text-3xl">&lt;</button>
                <img src={sortedPics[modalIndex].media} alt="Full" class="max-h-full max-w-full object-contain"/>
                <button on:click={nextImage} class="absolute right-4 text-white text-3xl">&gt;</button>
            </div>
        {/if}

        <!-- SERVICES & PRICING -->
        <section class="bg-black py-16 px-8 md:px-16">
            <h2 class="text-4xl font-semibold mb-8">Services & Pricing</h2>
            <div class="tabs flex gap-6 mb-8">
                <button on:click={()=>activeServiceTab='in_person'} class:font-bold={activeServiceTab==='in_person'}>In-Person</button>
                <button on:click={()=>activeServiceTab='fantasies'} class:font-bold={activeServiceTab==='fantasies'}>Fantasies</button>
                <button on:click={()=>activeServiceTab='virtual'} class:font-bold={activeServiceTab==='virtual'}>Virtual</button>
            </div>
            {#if activeServiceTab==='in_person'}
                <div class="flex flex-wrap gap-3">
                    {#each escort.servicesInfo.escortServices as s}
                        <span class="px-4 py-2 bg-gray-800 text-gray-200 rounded-full">{s}</span>
                    {/each}
                </div>
            {:else if activeServiceTab==='fantasies'}
                <div class="flex flex-wrap gap-3">
                    {#each escort.servicesInfo.escortFantasies as f}
                        <span class="px-4 py-2 bg-gray-800 text-gray-200 rounded-full">{f}</span>
                    {/each}
                </div>
            {:else}
                <div class="flex flex-wrap gap-3">
                    {#each escort.servicesInfo.virtualServices as v}
                        <span class="px-4 py-2 bg-gray-800 text-gray-200 rounded-full">{v}</span>
                    {/each}
                </div>
            {/if}

            <div class="border-t border-gray-700 pt-6 mt-6">
                <p class="text-xl font-semibold">
                    Hourly Rate: {escort.servicesInfo.hourPrice.currency} {escort.servicesInfo.hourPrice.amount.toLocaleString('es-AR')}
                </p>

                <!-- Custom Rates Table -->
                {#if escort.servicesInfo.customRate.length}
                    <table>
                        <thead>
                        <tr>
                            <th>Servicio</th>
                            <th>Duración</th>
                            <th>Incall</th>
                            <th>Outcall</th>
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

        <!-- ABOUT ME -->
        <section class="bg-black py-16 px-8 md:px-16">
            <h2 class="text-3xl font-semibold mb-4">About Me 🌹</h2>
            <p class="leading-relaxed">{escort.description}</p>
        </section>

        <!-- BASIC INFO & APPEARANCE -->
        <section class="bg-black py-16 px-8 md:px-16 grid md:grid-cols-2 gap-16">
            <div>
                <h2 class="text-3xl font-semibold mb-4">Basic Info</h2>
                <ul class="space-y-3 text-lg">
                    <li><strong>Name:</strong> {escort.displayName}</li>
                    <li><strong>Age:</strong> {escort.age}</li>
                    <li><strong>Nationality:</strong> {escort.appearance.nationality}</li>
                    <li><strong>Gender:</strong> {escort.appearance.gender}</li>
                    <li><strong>Location:</strong> {escort.location.city}, {escort.location.state}, {escort.location.country}</li>
                </ul>
            </div>
            <div>
                <h2 class="text-3xl font-semibold mb-4">Appearance</h2>
                <ul class="space-y-3 text-lg">
                    <li><strong>Hair:</strong> {escort.appearance.hairColor}</li>
                    <li><strong>Eyes:</strong> {escort.appearance.eyeColor}</li>
                    <li><strong>Height:</strong> {escort.appearance.heightInCm} cm</li>
                    <li><strong>Weight:</strong> {escort.appearance.weightInKg} kg</li>
                    <li><strong>Butt:</strong> {escort.appearance.buttSize}</li>
                    <li><strong>Measurements:</strong> {escort.appearance.bust}-{escort.appearance.waist}-{escort.appearance.hips}</li>
                </ul>
                <p class="mt-6"><strong>Waxing:</strong> {escort.appearance.waxingLevel}</p>
            </div>
        </section>

        <!-- WORKING HOURS -->
        <section class="bg-black py-16 px-8 md:px-16">
            <h2 class="text-3xl font-semibold mb-4">Working Hours</h2>
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
                <p class="uppercase font-medium">FULL TIME</p>
            {/if}
        </section>

        <!-- CONTACT -->
        <section class="bg-black py-16 px-8 md:px-16">
            <h2 class="text-4xl font-semibold mb-6">Contact</h2>
            <div class="flex flex-wrap gap-8">
                {#if escort.publicPhoneNumber}
                    <a href={`https://wa.me/${escort.publicPhoneNumber}`}
                       class="flex items-center gap-2 border border-gray-700 px-3 py-1 rounded text-lg hover:text-[var(--accent)] transition">
                        📞 {escort.publicPhoneNumber}
                    </a>
                {/if}
                {#each escort.contactMethod as cm}
                    <div class="flex items-center gap-2">
                        <span class="uppercase text-sm border border-gray-700 px-3 py-1 rounded">{cm.type}</span>
                        <span class="text-lg">{cm.value}</span>
                    </div>
                {/each}
            </div>
        </section>
    {/if}
</main>
