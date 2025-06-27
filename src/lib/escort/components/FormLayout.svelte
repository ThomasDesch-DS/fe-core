<script lang="ts">
    import { stepStore } from '../store/formStore';
    
    let currentStep: number;
    stepStore.subscribe(value => {
        currentStep = value;
    });
    
    function goBack() {
        if (currentStep > 1) {
            stepStore.set(currentStep - 1);
        }
    }
</script>

<div class="min-h-screen flex items-center justify-center bg-black px-4">
    <div class="w-full max-w-md text-center">
        {#if currentStep > 1}
            <button 
                on:click={goBack}
                class="flex items-center gap-2 mb-6 px-3 py-2 text-gray-400 hover:text-white transition-colors duration-200 group"
            >
                <svg class="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                <span class="text-sm font-medium">atrás</span>
            </button>
        {/if}
        <slot></slot>
    </div>
</div>