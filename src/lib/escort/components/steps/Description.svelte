<script lang="ts">
    import { stepStore } from '../../store/formStore';
    import Button from '../Button.svelte';
    import TextInput from '../TextInput.svelte';
    import { contactTypes } from '../../store/formStore';
    import { onMount } from 'svelte';
    import {
        trackRegisterStepDescription,
        trackRegisterStepDescriptionDescription,
        trackRegisterStepDescriptionContactMethods
    } from '../../../analytics/analytics';
    
    export let formData;
    
    // Step handlers
    function handleDescription() { 
        if(!formData.description.trim()) return; 
        stepStore.set(36); 
    }
    
    function addContactMethod() { 
        formData.contactMethods = [
            ...formData.contactMethods,
            {value:'',type:''}
        ]; 
    }
    
    function handleContacts() { 
        stepStore.set(37); 
    }

    onMount(() => {
        trackRegisterStepDescription({ userType: 'Escort' });
    });

    $: {
        switch ($stepStore) {
            case 35:
                trackRegisterStepDescriptionDescription({ userType: 'Escort' });
                break;
            case 36:
                trackRegisterStepDescriptionContactMethods({ userType: 'Escort' });
                break;
        }
    }
</script>

<!-- Paso 35: Descripción -->
{#if $stepStore === 35}
    <h2 class="text-3xl font-bold text-white mb-6">Descripción</h2>
    <textarea 
        bind:value={formData.description} 
        rows="4"
        placeholder="Contanos un poco de vos..."
        class="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded mb-4"
    />
    <Button onClick={handleDescription}>
        { formData.description.trim() ? '¡Quedó genial!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 36: Métodos de contacto -->
{#if $stepStore === 36}
    <h2 class="text-3xl font-bold text-white mb-6">Métodos de contacto</h2>
    <button 
        on:click={addContactMethod} 
        class="mb-4 w-full py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
    >
        + Agregar método
    </button>
    {#each formData.contactMethods as cm, idx}
        <div class="bg-gray-900 p-4 rounded mb-4 text-left">
            <select 
                bind:value={cm.type}
                class="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded mb-2"
            >
                <option value="" disabled selected hidden>Tipo</option>
                {#each contactTypes as ct}
                    <option value={ct.value}>{ct.label}</option>
                {/each}
            </select>
            <TextInput bind:value={cm.value} placeholder="Número o usuario" />
        </div>
    {/each}
    <Button onClick={handleContacts}>
        { formData.contactMethods.length ? '¡Perfecto!' : 'Siguiente' }
    </Button>
{/if}