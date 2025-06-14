<script lang="ts">
    export let showModal = false;
    export let previewSrc = '';
    export let isVideo = false;
    
    function closeModal() {
        showModal = false;
        document.body.style.overflow = '';
    }
</script>

{#if showModal}
    <div class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" on:click={closeModal}>
        <div class="relative max-w-4xl max-h-[90vh]">
            <button 
                class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
                on:click|stopPropagation={closeModal}
            >
                ✕
            </button>
            {#if isVideo}
                <video src={previewSrc} controls autoplay class="max-w-full max-h-[90vh] rounded-lg" />
            {:else}
                <img src={previewSrc} class="max-w-full max-h-[90vh] rounded-lg object-contain" />
            {/if}
        </div>
    </div>
{/if}