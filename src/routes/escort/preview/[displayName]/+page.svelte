<!-- src/routes/escort/preview/[displayName]/+page.svelte -->
<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
    import { api } from '$lib/escort/api/apiClient';
    import { page } from '$app/stores';
    import { toast } from 'svelte-sonner';
    import IconWhatsapp from "~icons/fa6-brands/whatsapp";
    import SocialIcon from "$lib/common/SocialIcon.svelte";
    import { catlist } from "$lib/escort/store/catlistStore";
    import { dSuserAuthStore } from "$lib/escort/store/dsUserAuthStore";
    import { goto } from "$app/navigation";
    import PriceChart from "$lib/charts/PriceChart.svelte";
    import { trackPageOpen, trackEscortContact, trackEscortGallery, trackEscortCatlist, trackEscortShare, trackEscortAudio, trackEscortDetailView, trackUserLogin } from "$lib/analytics/analytics";
    import ShareButton from "$lib/common/ShareButton.svelte";
    import posthog from 'posthog-js';
    import { getMediaUrl } from "../../../../util/MediaUtils";
    import { escortAuthStore } from '$lib/escort/store/escortAuthStore.js';
    import { tokenStore } from '$lib/store/tokenStore';
    import { setupTokenRefresh } from '$lib/escort/api/authApi';
    import { hiddenProfilesStore } from '$lib/store/hiddenProfilesStore';

    // ---- CONFIG ----
    const ESCORT_CACHE_KEY = 'escortDetailCache';
    const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos
    const CODE_LENGTH = 6;

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
            trackEscortCatlist({
                action: 'remove',
                escortId: escort.id,
                escortName: escort.displayName
            });
            const promise = catlist.remove(existing.id);
            toast.promise(promise, {
                loading: 'Quitando de tu Catlist…',
                success: '💔 Quitada de tu Catlist',
                error: 'No se pudo quitar 😕'
            });
        } else {
            trackEscortCatlist({
                action: 'add',
                escortId: escort.id,
                escortName: escort.displayName
            });
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

    // ---- helper: slug del URL (displayName) ----
    function getSlug() {
        return $page.params.displayName;
    }

    // ---- UX HANDLERS ----
    function openModal(i: number) {
        trackEscortGallery({
            action: 'modal_open',
            imageIndex: i,
            totalImages: sortedPics.length,
            escortId: escort?.id,
            escortName: escort?.displayName
        });
        modalIndex = i;
        modalOpen = true;
        history.pushState({ lightbox: true }, '');
    }
    function closeModal() {
        modalOpen = false;
        if (history.state?.lightbox) history.back();
    }
    function prevImage() {
        trackEscortGallery({
            action: 'image_prev',
            fromIndex: modalIndex,
            toIndex: (modalIndex - 1 + sortedPics.length) % sortedPics.length,
            escortId: escort?.id
        });
        modalIndex = (modalIndex - 1 + sortedPics.length) % sortedPics.length;
    }
    function nextImage() {
        trackEscortGallery({
            action: 'image_next',
            fromIndex: modalIndex,
            toIndex: (modalIndex + 1) % sortedPics.length,
            escortId: escort?.id
        });
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

    // ---- FETCH Y MOUNT ----
    onMount(async () => {
        trackPageOpen();
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
                
                // Hide this profile from main listings when user visits preview (cached version)
                hiddenProfilesStore.hide(cachedEscort.id, displayName, cachedEscort.displayName);
                
                trackEscortDetailView({
                    escortId: escort.id,
                    escortName: escort.displayName,
                    location: escort.location,
                    age: escort.age,
                });
            } else {
                try {
                    const data = await api.get<Escort>(`/preview/${displayName}`);
                    if (data.media.profilePicture) {
                        data.media.profilePicture = getMediaUrl(
                            data.id,
                            data.media.profilePicture,
                            'profile'
                        );
                    }
                    escort = data;
                    setToCache(displayName, data);
                    
                    // Hide this profile from main listings when user visits preview
                    hiddenProfilesStore.hide(data.id, displayName, data.displayName);
                    
                    trackEscortDetailView({
                        escortId: escort.id,
                        escortName: escort.displayName,
                        location: escort.location,
                        age: escort.age,
                    });
                } catch (redirectError: any) {
                    if (redirectError.status === 300 || redirectError.message?.includes('redirect')) {
                        goto(`/escort/${displayName}`);
                        return;
                    }
                    throw redirectError;
                }
            }
        } catch (err: any) {
            console.error(err);
            error = err instanceof Error ? err.message : 'Error desconocido';
        } finally {
            loading = false;
        }
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
        window.removeEventListener('popstate', handlePopState);
        if (resendTicker) clearInterval(resendTicker);
    });

    // ---- TAGS ----
    $: primaryTags = escort
        ? [
            'Vista previa',
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
        document.title = `${escort.displayName} — Vista previa`;
    }

    // ---- AUDIO HANDLERS ----
    function handleAudioPlay() {
        trackEscortAudio({
            action: 'play',
            escortId: escort?.id,
            escortName: escort?.displayName
        });
    }
    function handleAudioPause() {
        trackEscortAudio({
            action: 'pause',
            escortId: escort?.id,
            escortName: escort?.displayName
        });
    }

    // ─── RECLAMO DE PERFIL (CLAIM FLOW) ─────────────────────────────────────────
    let claimOpen = false;
    type ClaimStep = 'intro' | 'sending' | 'code' | 'verifying' | 'success';
    let claimStep: ClaimStep = 'intro';
    let phoneInput = '';
    $: phoneEditable = !escort?.publicPhoneNumber;
    $: phoneTarget = escort?.publicPhoneNumber || phoneInput;

    let resendCooldown = 0;
    let resendTicker: number | null = null;

    let codeDigits: string[] = Array(CODE_LENGTH).fill('');
    let codeRefs: (HTMLInputElement | null)[] = [];
    $: code = codeDigits.join('');

    // Confetti simple para éxito
    const CONFETTI_COUNT = 24;
    let confetti = Array.from({ length: CONFETTI_COUNT }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 0.9 + Math.random() * 0.6,
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
        color: ['#f472b6','#fb7185','#e879f9','#fca5a5','#f0abfc'][Math.floor(Math.random()*5)]
    }));
    let celebrating = false;

    // Svelte action para refs de inputs
    function codeRefAction(node: HTMLInputElement, index: number) {
        codeRefs[index] = node;
        return {
            destroy() { codeRefs[index] = null; }
        };
    }

    function normalizePhone(p: string) {
        return (p || '').replace(/[^\d+]/g, '');
    }
    function maskPhone(p?: string) {
        if (!p) return '';
        const digits = p.replace(/\D/g, '');
        const visible = digits.slice(-4);
        return `•• •• •• ${visible}`;
    }

    function startResendCooldown(sec = 30) {
        if (resendTicker) clearInterval(resendTicker);
        resendCooldown = sec;
        resendTicker = window.setInterval(() => {
            resendCooldown = Math.max(0, resendCooldown - 1);
            if (resendCooldown === 0 && resendTicker) {
                clearInterval(resendTicker);
                resendTicker = null;
            }
        }, 1000);
    }

    function resetCode() {
        codeDigits = Array(CODE_LENGTH).fill('');
    }

    function onCodeInput(i: number, e: Event) {
        const target = e.currentTarget as HTMLInputElement;
        const v = target.value.replace(/\D/g, '');
        codeDigits[i] = v.slice(-1) || '';
        if (v && i < CODE_LENGTH - 1) codeRefs[i + 1]?.focus();
    }
    function onCodeKeydown(i: number, e: KeyboardEvent) {
        if (e.key === 'Backspace' && !codeDigits[i] && i > 0) {
            codeRefs[i - 1]?.focus();
        }
    }

    function openClaim() {
        claimOpen = true;
        claimStep = 'intro';
        posthog.capture('escortClaimOpen', {
            escortId: escort?.id,
            escortName: escort?.displayName
        });
    }

    async function sendClaimCode() {
        if (!escort) return;
        // ahora solo slug
        const slug = getSlug();
        if (!slug) {
            toast.error('No encontramos el perfil. Refrescá la página.');
            return;
        }
        claimStep = 'sending';
        posthog.capture('escortClaimStart', { escortId: escort.id, phoneHasValue: !!phoneTarget });
        try {
            await api.post('/claim/send-code', { slug });
            toast.success('Listo. Te mandamos un código por WhatsApp/SMS 💬');
            resetCode();
            claimStep = 'code';
            startResendCooldown(30);
            await tick();
            codeRefs[0]?.focus();
        } catch (err: any) {
            console.error(err);
            posthog.capture('escortClaimFail', { escortId: escort.id, stage: 'send', error: err?.message });
            claimStep = 'intro';
            toast.error('No pudimos enviar el código ahora. Probá de nuevo en un toque.');
        }
    }

    async function resendCode() {
        if (resendCooldown > 0 || !escort) return;
        const slug = getSlug();
        if (!slug) return;
        posthog.capture('escortClaimResend', { escortId: escort.id });
        try {
            await api.post('/claim/send-code', { slug });
            toast.success('Código reenviado 🔁');
            startResendCooldown(30);
        } catch (err: any) {
            console.error(err);
            toast.error('No pudimos reenviar el código. Intentá más tarde.');
        }
    }

    async function verifyClaimCode() {
        if (!escort) return;
        if (code.length !== CODE_LENGTH) {
            toast.error(`El código debe tener ${CODE_LENGTH} dígitos`);
            return;
        }
        const slug = getSlug();
        if (!slug) {
            toast.error('No encontramos el perfil. Refrescá la página.');
            return;
        }
        claimStep = 'verifying';
        posthog.capture('escortClaimVerify', { escortId: escort.id });
        try {
            // ahora { slug, code } a /claim/verify
            const response = await api.post('/claim/verify', {
                slug,
                code,
            });

            const escortUser = {
                id: response.id,
                email: response.email,
                displayName: response.basicInfo?.displayName || "Escort",
                profile: response
            };

            escortAuthStore.login(escortUser);

            // Save catList to catlistStore if present in the response
            if (response.catList) {
                console.log('Claim verify response catList:', response.catList);
                catlist.set(response.catList);
            }
            
            // Handle tokens if present in response
            if (response.tokens !== undefined) {
                tokenStore.setTokens(response.tokens);
            }
            
            // Set up auto refresh timer
            setupTokenRefresh();

            posthog.identify(escortUser.id, {
                userType: 'Escort',
                email: escortUser.email,
                displayName: escortUser.displayName
            });

            trackUserLogin({ success: true, userType: 'Escort' });

            claimStep = 'success';
            celebrating = true;
            toast.success('¡Hecho! Sos la dueña del perfil ✅');
            posthog.capture('escortClaimSuccess', { escortId: escort.id });
            
            // Show the profile again on main page after successful validation
            hiddenProfilesStore.show(escort.id);
            
            setTimeout(() => goto('/dashboard'), 1200);
        } catch (err: any) {
            console.error(err);
            claimStep = 'code';
            toast.error('Mmm, ese código no va. Revisá y probá de nuevo.');
            posthog.capture('escortClaimFail', { escortId: escort.id, stage: 'verify', error: err?.message });
            trackUserLogin({ success: false, userType: 'Escort', error: err.message });
            resetCode();
            await tick();
            codeRefs[0]?.focus();
        }
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
    .btn-vercel:hover { @apply bg-white text-black; }
    .audio-card { @apply max-w-xl mx-auto bg-white/10 rounded-lg p-6 flex items-center gap-4; }
    .audio-icon { width: 2rem; height: 2rem; flex-shrink: 0; }
    .audio-player { @apply w-full; }
    .group:hover .group-hover\:opacity-100 { opacity:1; }
    .transition-opacity { transition: opacity 0.2s ease-in-out; }
    .pointer-events-none { pointer-events:none; }
    .transform { transform: translateX(-50%); }

    .media-container { position: relative; overflow: hidden; border-radius: 0.375rem; cursor: pointer; }
    .media-item { width: 100%; height: 16rem; object-fit: cover; transition: transform 0.3s ease-in-out; }
    .media-container:hover .media-item { transform: scale(1.1); }
    .media-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.2); opacity:0; transition: opacity .3s; display:flex; align-items:center; justify-content:center; color:white; font-weight:600; }
    .media-container:hover .media-overlay { opacity:1; }
    .video-container { position: relative; overflow: hidden; border-radius: 0.375rem; }
    .video-item { width: 100%; height: 16rem; object-fit: cover; transition: transform .3s; }
    .video-container:hover .video-item { transform: scale(1.05); }
    @media (max-width: 768px) {
        .media-item { height: 12rem; }
        .video-item { height: 12rem; }
        .media-container:hover .media-item { transform: scale(1.05); }
    }

    /* Vista previa banner – ROSADO */
    .banner {
        @apply fixed top-0 left-0 right-0 z-40;
        background: linear-gradient(90deg, #ec4899, #d946ef);
        color: #111827;
        box-shadow: 0 10px 30px rgba(236,72,153,.3);
    }
    .banner-content { @apply max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-3 flex-wrap; }
    .chip {
        @apply inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide;
        background: rgba(255,255,255,.85);
        color: #be185d;
    }

    /* Claim Modal */
    .modal-backdrop { @apply fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4; }
    .modal-card {
        @apply w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden;
    }
    .code-grid { @apply grid grid-cols-6 gap-2 mt-4; }
    .code-input {
        @apply w-10 h-12 text-center text-xl rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white;
    }

    /* Éxito: confetti + check animado */
    @keyframes confettiFall {
        0% { transform: translateY(-120%) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
    }
    .confetti {
        position: absolute;
        top: -10%;
        width: var(--size);
        height: var(--size);
        background: var(--color);
        left: var(--left);
        border-radius: 2px;
        opacity: 0;
        animation: confettiFall var(--duration) ease-in forwards;
        animation-delay: var(--delay);
        filter: drop-shadow(0 2px 2px rgba(0,0,0,.2));
    }
    @keyframes popIn {
        0% { transform: scale(.8); opacity: 0; }
        60% { transform: scale(1.05); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
    }
    .success-card {
        @apply mt-2 p-4 rounded-lg border;
        border-color: #10b981;
        background: rgba(16,185,129,.15);
        animation: popIn .35s ease-out both;
    }
    .pink-badge {
        @apply px-3 py-1 rounded-full text-black text-xs font-bold uppercase;
        background: linear-gradient(90deg, #f472b6, #e879f9);
    }
</style>

<main class="font-sans">
    {#if !loading && !error && escort}
        <div class="banner">
            <div class="banner-content">
                <span class="chip">Vista previa</span>
                <span class="text-sm sm:text-base">
                    Este perfil todavía <strong>no está publicado</strong>. Estamos validando que todo esté OK.
                </span>
                <button
                        class="btn-vercel !py-2 !px-4"
                        on:click={openClaim}
                        aria-label="Reclamá tu perfil"
                >
                    ¿Sos {escort.displayName}? Reclamá tu perfil
                </button>
            </div>
        </div>
    {/if}

    {#if loading}
        <div class="p-8 space-y-6 mt-16">
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
        <section class="relative h-screen flex items-center justify-center text-center mt-16">
            <img
                    src={escort.media.profilePicture}
                    alt="Imagen destacada"
                    class="absolute inset-0 object-cover w-full h-full filter brightness-50"
            />
            <div class="absolute top-4 left-4 z-20">
                <span class="pink-badge">Vista previa</span>
            </div>
            <div class="absolute top-4 right-4 z-20">
                <ShareButton 
                    escortId={escort?.id} 
                    escortName={escort?.displayName} 
                />
            </div>
            <div class="relative z-10 space-y-4">
                <h1 class="text-6xl font-extrabold">{escort.displayName}</h1>
                <div class="flex justify-center gap-2 flex-wrap">
                    {#each primaryTags as t}
                        <span class="px-4 py-1 rounded-full bg-white/20 backdrop-blur text-white">{t}</span>
                    {/each}
                </div>
                <div class="flex justify-center gap-4">
                    <a
                            href={`https://wa.me/${escort.publicPhoneNumber}`}
                            target="_blank"
                            class="btn-vercel"
                            on:click={() => trackEscortContact({
                            method: 'whatsapp',
                            location: 'hero_cta',
                            phoneNumber: escort.publicPhoneNumber,
                            escortId: escort.id,
                            escortName: escort.displayName
                        })}
                    >
                        Reservá ahora
                    </a>

                    <div class="relative group inline-block">
                        <button on:click={handleCatlistToggle} class="btn-vercel">
                            {#if isInCatlist}Quitar de Catlist{:else}Añadir a Catlist{/if}
                        </button>
                        <div class="absolute bottom-full left-1/2 mb-2 w-48 p-2 text-sm text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none transform -translate-x-1/2">
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
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" class="audio-icon text-white" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-2v15M9 19l-5-5H5a2 2 0 01-2-2V8a2 2 0 012-2h1l5-5v18z"/>
                    </svg>
                    <audio
                            controls
                            src={audioClipURL}
                            class="audio-player"
                            on:play={handleAudioPlay}
                            on:pause={handleAudioPause}
                    ></audio>
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
                    on:click={() => trackEscortContact({
                    method: 'whatsapp',
                    location: 'sticky_cta',
                    phoneNumber: escort.publicPhoneNumber,
                    escortId: escort.id,
                    escortName: escort.displayName
                })}
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
                                    on:click={() => {
                                    trackEscortGallery({
                                        action: 'tab_switch',
                                        fromTab: activeMediaTab,
                                        toTab: key,
                                        escortId: escort?.id
                                    });
                                    activeMediaTab = key;
                                }}
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
                        <div class="media-container" on:click={() => openModal(i)}>
                            <img src={pic.media} alt="imagen" loading="lazy" class="media-item" />
                            <div class="media-overlay"><span class="text-sm">Ver imagen</span></div>
                            <span class="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">#{i + 1}</span>
                        </div>
                    {/each}
                    {#each sortedVideos as vid}
                        <div class="video-container">
                            <video controls src={vid.media} class="video-item"></video>
                        </div>
                    {/each}
                </div>
            {:else if activeMediaTab === 'fotos'}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {#each sortedPics as pic, i}
                        <div class="media-container" on:click={() => openModal(i)}>
                            <img src={pic.media} alt="imagen" loading="lazy" class="media-item" />
                            <div class="media-overlay"><span class="text-sm">Ver imagen</span></div>
                            <span class="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">#{i + 1}</span>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {#each sortedVideos as vid}
                        <div class="video-container">
                            <video controls src={vid.media} class="video-item"></video>
                        </div>
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
                <button on:click={closeModal} class="absolute top-4 right-4 text-white text-3xl">&times;</button>
                <button on:click={prevImage} class="absolute left-4 text-white text-3xl">&lt;</button>
                <img
                        src={sortedPics[modalIndex].media}
                        alt="Imagen completa"
                        class="max-h-full max-w-full object-contain"
                />
                <button on:click={nextImage} class="absolute right-4 text-white text-3xl">&gt;</button>
            </div>
        {/if}

        <!-- SERVICES & PRICING -->
        <section class="bg-black py-16 px-4 sm:px-8 md:px-16">
            <h2 class="text-3xl sm:text-4xl font-semibold mb-8">Servicios y Tarifas</h2>
            <nav class="border-b border-gray-700 mb-8 overflow-x-auto">
                <ul class="flex gap-6 min-w-max">
                    {#each tabs as { key, label }}
                        <li class="flex-shrink-0">
                            <button
                                    role="tab"
                                    aria-selected={activeServiceTab === key}
                                    class="pb-2 px-4 -mb-px border-b-2 transition-all duration-200 whitespace-nowrap
                                    {activeServiceTab === key
                                        ? 'border-white text-white font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-white hover:border-gray-500'}"
                                    on:click={() => {
                                    posthog.capture('escortServiceTab', {
                                        action: 'tab_switch',
                                        fromTab: activeServiceTab,
                                        toTab: key,
                                        escortId: escort?.id,
                                        escortName: escort?.displayName
                                    });
                                    activeServiceTab = key;
                                }}
                            >
                                {label}
                            </button>
                        </li>
                    {/each}
                </ul>
            </nav>

            {#if activeServiceTab === 'in_person'}
                <div class="flex flex-wrap gap-2 sm:gap-3">
                    {#each escort.servicesInfo.escortServices as s}
                        <span class="px-3 py-2 sm:px-4 bg-gray-800 text-gray-200 rounded-full text-sm sm:text-base">{s}</span>
                    {/each}
                </div>
            {:else if activeServiceTab === 'fantasies'}
                <div class="flex flex-wrap gap-2 sm:gap-3">
                    {#each escort.servicesInfo.escortFantasies as f}
                        <span class="px-3 py-2 sm:px-4 bg-gray-800 text-gray-200 rounded-full text-sm sm:text-base">{f}</span>
                    {/each}
                </div>
            {:else}
                <div class="flex flex-wrap gap-2 sm:gap-3">
                    {#each escort.servicesInfo.virtualServices as v}
                        <span class="px-3 py-2 sm:px-4 bg-gray-800 text-gray-200 rounded-full text-sm sm:text-base">{v}</span>
                    {/each}
                </div>
            {/if}

            <div class="border-t border-gray-700 pt-6 mt-6">
                <p class="text-xl font-semibold">
                    Precio por hora: {escort.servicesInfo.hourPrice.currency}
                    {escort.servicesInfo.hourPrice.amount.toLocaleString('es-AR')}
                </p>

                {#if escort.servicesInfo.customRate.length}
                    <div class="overflow-x-auto">
                        <table class="min-w-full">
                            <thead>
                            <tr>
                                <th class="text-left text-xs sm:text-sm">Servicio</th>
                                <th class="text-left text-xs sm:text-sm">Duración</th>
                                <th class="text-left text-xs sm:text-sm">En mi lugar</th>
                                <th class="text-left text-xs sm:text-sm">A domicilio</th>
                            </tr>
                            </thead>
                            <tbody>
                            {#each escort.servicesInfo.customRate as cr}
                                <tr>
                                    <td class="text-xs sm:text-sm">{cr.serviceName}</td>
                                    <td class="text-xs sm:text-sm">{cr.duration}</td>
                                    <td class="text-xs sm:text-sm">${cr.incallPrice ? cr.incallPrice.toLocaleString('es-AR') : '-'}</td>
                                    <td class="text-xs sm:text-sm">${cr.outcallPrice ? cr.outcallPrice.toLocaleString('es-AR') : '-'}</td>
                                </tr>
                            {/each}
                            </tbody>
                        </table>
                    </div>
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

        <!-- PRICE CHART -->
        <section class="bg-black py-16 px-4 sm:px-8 md:px-16">
            <h2 class="text-3xl font-semibold mb-4 text-white text-center md:text-left">
                Rango de Precios
            </h2>
            <p class="text-gray-400 mb-6 text-center md:text-left">
                “Barato” a la izquierda — “Caro” a la derecha
            </p>
            <div class="overflow-x-auto">
                <div class="flex justify-center min-w-[320px]">
                    <div class="w-[300px] h-48 sm:w-[500px] sm:h-60 md:w-full md:h-64">
                        <PriceChart class="w-full h-full" currentEscortPrice={escort.servicesInfo.hourPrice.amount} />
                    </div>
                </div>
            </div>
        </section>

        <!-- CONTACTO -->
        <section class="bg-black py-16 px-8 md:px-16 text-white">
            <h2 class="text-4xl font-semibold mb-6">Contacto</h2>
            <p class="text-pink-400 mb-4">
                Nota: este es un perfil en <strong>vista previa</strong>. Para publicar y aparecer en los listados,
                reclamá tu perfil y completá la verificación.
            </p>
            <div class="flex flex-wrap gap-8 items-center">
                {#if escort.publicPhoneNumber}
                    <a
                            href={`https://wa.me/${escort.publicPhoneNumber}`}
                            class="flex items-center gap-2 border border-gray-700 px-3 py-1 rounded text-lg hover:text-white hover:border-white transition"
                            on:click={() => trackEscortContact({
                            method: 'whatsapp',
                            location: 'contact_section',
                            phoneNumber: escort.publicPhoneNumber,
                            escortId: escort.id,
                            escortName: escort.displayName
                        })}
                    >
                        <IconWhatsapp class="text-green-500 w-5 h-5" />
                        {escort.publicPhoneNumber}
                    </a>
                {/if}

                {#each escort.contactMethod as cm}
                    <SocialIcon
                            type={cm.type}
                            value={cm.value}
                            onClick={() => trackEscortContact({
                            method: cm.type.toLowerCase(),
                            location: 'contact_section',
                            contactValue: cm.value,
                            escortId: escort.id,
                            escortName: escort.displayName
                        })}
                    />
                {/each}

                <button class="btn-vercel" on:click={openClaim}>
                    Reclamá tu perfil
                </button>
            </div>
        </section>
    {/if}

    <!-- MODAL: RECLAMAR PERFIL -->
    {#if claimOpen}
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Reclamar perfil">
            <div class="modal-card">
                {#if celebrating}
                    {#each confetti as c, i}
                        <span
                                class="confetti"
                                style="--left:{c.left}%;
                                   --size:{c.size}px;
                                   --duration:{c.duration}s;
                                   --delay:{c.delay}s;
                                   --color:{c.color};
                                   transform: rotate({c.rotate}deg);"
                        />
                    {/each}
                {/if}

                <div class="flex items-start justify-between gap-4">
                    <div>
                        <h3 class="text-2xl font-semibold">¿Sos {escort?.displayName}?</h3>
                        <p class="text-sm text-neutral-300 mt-1">
                            Reclamá tu perfil para poder editarlo y publicarlo. Es gratis y tarda menos de 1 minuto.
                        </p>
                    </div>
                    <button class="text-2xl leading-none" on:click={() => (claimOpen = false)} aria-label="Cerrar modal">&times;</button>
                </div>

                {#if claimStep === 'intro' || claimStep === 'sending'}
                    <div class="mt-6 space-y-4">
                        {#if escort?.publicPhoneNumber}
                            <div class="text-sm text-neutral-300">
                                Te enviamos un código al número del perfil: <strong class="text-white">{maskPhone(escort.publicPhoneNumber)}</strong>
                                <div class="text-xs mt-1">Por WhatsApp o SMS (lo que llegue mejor).</div>
                            </div>
                        {:else}
                            <div>
                                <label class="block text-sm mb-1">Tu número de WhatsApp (con +54)</label>
                                <input
                                        class="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white"
                                        placeholder="+54 9 11 1234 5678"
                                        bind:value={phoneInput}
                                        inputmode="tel"
                                />
                                <p class="text-xs text-neutral-400 mt-1">Solo para verificar que sos la dueña del perfil.</p>
                            </div>
                        {/if}

                        <button
                                class="btn-vercel w-full"
                                on:click={sendClaimCode}
                                disabled={claimStep === 'sending'}
                        >
                            {claimStep === 'sending' ? 'Enviando código…' : 'Enviar código'}
                        </button>
                        <p class="text-xs text-neutral-500">
                            Tip: fijate si tenés señal/Internet. Si no llega, pedilo de nuevo en un toque.
                        </p>
                    </div>
                {/if}

                {#if claimStep === 'code' || claimStep === 'verifying' || claimStep === 'success'}
                    <div class="mt-6">
                        {#if claimStep !== 'success'}
                            <p class="text-sm text-neutral-300">
                                Ingresá el código de {CODE_LENGTH} dígitos
                                {#if escort?.publicPhoneNumber} enviado al {maskPhone(escort.publicPhoneNumber)}{/if}.
                            </p>
                            <div class="code-grid">
                                {#each Array(CODE_LENGTH).fill(0) as _, i}
                                    <input
                                            class="code-input"
                                            maxlength="1"
                                            use:codeRefAction={i}
                                            value={codeDigits[i]}
                                            on:input={(e) => onCodeInput(i, e)}
                                            on:keydown={(e) => onCodeKeydown(i, e)}
                                            inputmode="numeric"
                                            pattern="[0-9]*"
                                    />
                                {/each}
                            </div>

                            <div class="mt-4 flex items-center justify-between">
                                <button
                                        class="btn-vercel !px-4"
                                        on:click={verifyClaimCode}
                                        disabled={claimStep === 'verifying' || code.length !== CODE_LENGTH}
                                >
                                    {claimStep === 'verifying' ? 'Verificando…' : 'Verificar y reclamar'}
                                </button>

                                <button
                                        class="text-sm underline disabled:no-underline disabled:text-neutral-600"
                                        on:click={resendCode}
                                        disabled={resendCooldown > 0}
                                >
                                    {#if resendCooldown > 0}
                                        Reenviar en {resendCooldown}s
                                    {:else}
                                        Reenviar código
                                    {/if}
                                </button>
                            </div>
                        {:else}
                            <div class="success-card">
                                <p class="font-semibold text-emerald-300">¡Perfil reclamado con éxito!</p>
                                <p class="text-sm text-neutral-200 mt-1">
                                    Te llevamos a tu panel para que lo publiques y brilles ✨
                                </p>
                            </div>
                        {/if}
                        <p class="text-xs text-neutral-500 mt-6">
                            ¿No sos esta persona? Cerrá este modal. Solo funciona si tenés acceso al número del perfil.
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</main>
