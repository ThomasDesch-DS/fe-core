<script lang="ts">
    import { trackEscortShare } from "$lib/analytics/analytics";
    import { toast } from 'svelte-sonner';

    export let escortId: string | undefined = undefined;
    export let escortName: string | undefined = undefined;
    export let className: string = "share-btn";

    async function shareEscort() {
        const currentUrl = window.location.href;
        
        try {
            // First try to get shortened URL from backend
            let urlToShare = currentUrl;
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/r/shorten`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: currentUrl })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    urlToShare = data.shortUrl || currentUrl;
                }
            } catch (shortenError) {
                console.warn('Could not shorten URL, using original:', shortenError);
                // Continue with original URL if shortening fails
            }

            // Try native sharing first
            if (navigator.share) {
                trackEscortShare({
                    method: 'native_share',
                    escortId,
                    escortName
                });
                await navigator.share({ 
                    title: escortName, 
                    url: urlToShare 
                });
            } else {
                // Fallback to clipboard
                trackEscortShare({
                    method: 'clipboard_copy',
                    escortId,
                    escortName
                });
                await navigator.clipboard.writeText(urlToShare);
                toast.success('¡Link copiado!');
            }
        } catch (err) {
            console.error('Error compartiendo:', err);
            trackEscortShare({
                method: 'error',
                escortId,
                escortName,
                error: err.message
            });
            toast.error('No se pudo compartir. Intentá de nuevo.');
        }
    }
</script>

<style>
    .share-btn {
        @apply p-2 rounded-full bg-white/10 text-white transition-colors duration-200;
    }
    .share-btn:hover {
        @apply bg-white text-black;
    }
</style>

<button
    on:click={shareEscort}
    class={className}
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