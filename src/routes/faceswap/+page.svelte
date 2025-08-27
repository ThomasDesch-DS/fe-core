<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
    import { getMediaUrl } from "../../util/MediaUtils";
    import { dSuserAuthStore } from "$lib/escort/store/dsUserAuthStore";
    import { escortAuthStore } from "$lib/escort/store/escortAuthStore";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";
    import CaptchaWrapper from '$lib/components/CaptchaWrapper.svelte';
    import { trackPageOpen, trackFaceSwap, trackFaceSwapResult } from "$lib/analytics/analytics";
    import { get } from 'svelte/store';
    import { tokenStore } from "$lib/store/tokenStore";

    let file1: File | null = null;
    let file2: File | null = null;
    let preview1 = '';
    let preview2 = '';
    let base641 = '';
    let base642 = '';
    let isLoading = false;
    let resultUrl = '';
    let errorMessage = '';
    let isLoggedIn: boolean;
    let imageLoading = false;
    let imageError = false;
    $: isLoggedIn = $dSuserAuthStore.isAuthenticated || get(escortAuthStore).isAuthenticated;

    let captchaToken = '';
    let captchaValid = false;

    // ref to the result <img>
    let resultImgEl: HTMLImageElement | null = null;

    const tips = [
        'Mientras esperás, hacé un mate y relajate.',
        'No te distraigas con más swaps… ¡este va a quedar épico!',
        'Tip pro: guardá tu cara favorita antes de que se vaya.',
    ];
    let currentTip = tips[0];
    let tipInterval: number | undefined;

    function startTips() {
        let idx = 0;
        currentTip = tips[idx];
        tipInterval = setInterval(() => {
            idx = (idx + 1) % tips.length;
            currentTip = tips[idx];
        }, 5000) as unknown as number; // satisfy TS in Svelte env
    }
    function stopTips() {
        if (tipInterval) clearInterval(tipInterval);
        tipInterval = undefined;
    }
    onDestroy(() => stopTips());

    function handleFileChange(event: Event, slot: 1 | 2) {
        errorMessage = '';
        const target = event.target as HTMLInputElement;
        if (!target.files?.length) return;
        const file = target.files[0];
        if (!file.type.startsWith('image/')) {
            errorMessage = 'Solo podés subir imágenes.';
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            if (slot === 1) {
                preview1 = dataUrl;
                base641 = dataUrl;
            } else {
                preview2 = dataUrl;
                base642 = dataUrl;
            }
        };
        reader.readAsDataURL(file);
    }

    function handleCaptcha(token: string) {
        captchaToken = token;
        captchaValid = !!token;
    }

    onMount(() => {
        // PostHog initialized in +layout.ts
        trackPageOpen();
    });

    async function processSwap() {
        if (!base641 || !base642) return;
        if (!isLoggedIn) {
            toast.error(`Tenés que loguearte para cambiar las caras!`);
            goto("/users/login");
            return;
        }
        if (!captchaToken) {
            errorMessage = 'Por favor, completá el captcha.';
            return;
        }

        trackFaceSwap({ captchaUsed: !!captchaToken });

        isLoading = true;
        resultUrl = '';
        imageLoading = false;
        imageError = false;
        startTips();
        errorMessage = '';
        const startTime = Date.now();
        try {
            const resp = await fetch(import.meta.env.VITE_API_URL + '/face-swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-captcha-token': captchaToken
                },
                credentials: 'include',
                body: JSON.stringify({ input: base641, swap: base642 })
            });
            const latencyMs = Date.now() - startTime;

            if (!resp.ok) throw new Error('Status ' + resp.status);
            const data = await resp.json();

            // If backend returns a data URL, use it directly; otherwise build CDN URL correctly.
            if (typeof data.result === 'string' && data.result.startsWith('data:')) {
                resultUrl = data.result;
            } else {
                // Add cache-busting parameter to force image reload
                const baseUrl = getMediaUrl(null, data.result, "swap");
                resultUrl = `${baseUrl}?t=${Date.now()}`;
                console.log('Generated URL:', resultUrl);
            }

            // Reset image states
            imageLoading = true;
            imageError = false;

            // wait for DOM to render the <img>, then scroll it into view so the browser definitely fetches it
            await tick();
            resultImgEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });

            tokenStore.setTokens(data.newTokens);
            captchaValid = false;

            trackFaceSwapResult({
                result: "success",
                latencyMs,
                source: "upload",
            });
        } catch (err) {
            console.error(err);
            errorMessage = 'Ocurrió un error durante el swap. Intentá de nuevo.';
            trackFaceSwapResult({
                result: "fail",
                errorMessage
            });
        } finally {
            isLoading = false;
            stopTips();
        }
    }
</script>

<svelte:head>
    <title>Face Swap</title>
    {#if import.meta.env.VITE_MEDIA_CDN}
        <link rel="preconnect" href={ import.meta.env.VITE_MEDIA_CDN } />
    {/if}
</svelte:head>

<style>
    .spinner {
        border: 4px solid white;
        border-top-color: transparent;
        border-radius: 9999px;
        width: 3rem;
        height: 3rem;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        to { transform: rotate(360deg) }
    }
</style>

<div class="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
    <h1 class="text-2xl mb-6 font-bold">Intercambiá caras 💥</h1>

    <!-- Circles for images -->
    <div class="flex flex-col sm:flex-row gap-10">
        <label class="w-44 h-44 sm:w-60 sm:h-60 rounded-full border-4 border-white flex items-center justify-center overflow-hidden cursor-pointer transition hover:border-pink-400" for="file1">
            {#if preview1}
                <img src="{preview1}" alt="Preview 1" class="object-cover w-full h-full" />
            {:else}
                <span class="text-base sm:text-lg text-center px-2">Subí foto 1</span>
            {/if}
        </label>
        <input id="file1" type="file" accept="image/*" class="hidden" on:change="{e => handleFileChange(e, 1)}" />

        <label class="w-44 h-44 sm:w-60 sm:h-60 rounded-full border-4 border-white flex items-center justify-center overflow-hidden cursor-pointer transition hover:border-pink-400" for="file2">
            {#if preview2}
                <img src="{preview2}" alt="Preview 2" class="object-cover w-full h-full" />
            {:else}
                <span class="text-base sm:text-lg text-center px-2">Subí foto 2</span>
            {/if}
        </label>
        <input id="file2" type="file" accept="image/*" class="hidden" on:change="{e => handleFileChange(e, 2)}" />
    </div>

    {#if errorMessage}
        <p class="mt-4 text-red-500 text-center">{errorMessage}</p>
    {/if}

    <div class="mt-8 mb-3">
        <CaptchaWrapper
                siteKey={import.meta.env.VITE_TURNSTILE}
                onVerify={handleCaptcha}
        />
        {#if !captchaValid}
            <p class="text-xs text-pink-400 mt-2 text-center">Por favor, resolvé el captcha para continuar.</p>
        {/if}
    </div>

    <button
            class="mt-2 px-8 py-3 bg-white text-black font-bold text-lg rounded-full shadow-lg disabled:opacity-50 transition hover:scale-105 active:scale-98"
            on:click="{processSwap}"
            disabled="{!base641 || !base642 || isLoading || !captchaValid}">
        {#if isLoading}
            Procesando…
        {:else}
            Intercambiar Caras
        {/if}
    </button>

    {#if isLoading}
        <div class="mt-7 flex flex-col items-center">
            <div class="spinner"></div>
            <p class="mt-3 italic text-center">{currentTip}</p>
        </div>
    {/if}

    {#if resultUrl}
        <div class="mt-8 flex flex-col items-center">
            <img
            referrerpolicy="no-referrer"
                    bind:this="{resultImgEl}"
                    src="{resultUrl}"
                    alt="Resultado Face-Swap"
                    class="max-w-full sm:max-w-sm rounded border-2 border-white shadow-lg"
                    loading="eager"
                    decoding="async"
                    on:load={() => console.log('swap img loaded', resultImgEl?.naturalWidth, resultImgEl?.naturalHeight)}
                    on:error={(e) => console.error('swap img error', e)}
            />
            <a
                    href="{resultUrl}"
                    download="face-swap.png"
                    class="mt-5 px-8 py-3 bg-white text-black font-semibold text-lg rounded-full shadow-lg hover:scale-105 transition">
                Descargá la imagen
            </a>
        </div>
    {/if}

    <div class="mt-12 text-sm text-center text-zinc-400 max-w-md mx-auto px-4">
        ⚠️ <strong>Disclaimer:</strong> El Face Swap es solo para uso recreativo. No subas fotos sin consentimiento ni generes contenido ofensivo o ilegal. Las imágenes que generás <strong>no se guardan</strong> en nuestros servidores y desaparecen una vez descargadas. El uso de esta herramienta es bajo tu exclusiva responsabilidad.
    </div>
</div>
