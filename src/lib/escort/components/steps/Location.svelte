<script lang="ts">
    import { stepStore } from '../../store/formStore';
    import Button from '../Button.svelte';
    import TextInput from '../TextInput.svelte';
    import SelectInput from '../SelectInput.svelte';
    import { countriesList } from '../../store/formStore';
    
    export let formData;
    
    // Step handlers
    function handleLocation() { 
        if (!formData.country || !formData.state.trim() || !formData.city.trim() || !formData.hood.trim()) return; 
        stepStore.set(38); 
    }
</script>

<!-- Paso 37: Ubicación -->
{#if $stepStore === 37}
    <h2 class="text-3xl font-bold text-white mb-6">Ubicación</h2>
    <SelectInput 
        bind:value={formData.country} 
        options={countriesList} 
        placeholder="País"
    />
    <TextInput bind:value={formData.state} placeholder="Provincia/Estado" />
    <TextInput bind:value={formData.city} placeholder="Ciudad" />
    <TextInput bind:value={formData.hood} placeholder="Barrio/Zona" />
    <Button onClick={handleLocation}>
        { formData.country && formData.state.trim() && formData.city.trim() && formData.hood.trim() 
            ? '¡Listo!' 
            : 'Siguiente' 
        }
    </Button>
{/if}