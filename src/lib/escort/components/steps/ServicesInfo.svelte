<script lang="ts">
    import { stepStore } from '../../store/formStore';
    import Button from '../Button.svelte';
    import TextInput from '../TextInput.svelte';
    import CheckboxGroup from '../CheckboxGroup.svelte';
    import { 
        escortServices, 
        escortFantasies,
        massageTypes,
        virtualServices
    } from '../../store/formStore';
    
    export let formData;
    
    // Step handlers
    function handleServices() { 
        if(!formData.selectedServices.size) return; 
        stepStore.set(27); 
    }
    
    function handleFantasies() { 
        stepStore.set(28); 
    }
    
    function handleMassages() { 
        stepStore.set(29); 
    }
    
    function handleVirtual() { 
        stepStore.set(30); 
    }
    
    function handleHourPrice() { 
        if(!parseFloat(formData.hourPriceAmount)) return; 
        stepStore.set(31); 
    }
    
    function addCustomRate() { 
        formData.customRates = [
            ...formData.customRates,
            {serviceName:'',duration:'',incallPrice:'',outcallPrice:''}
        ]; 
    }
    
    function handleCustomRates() { 
        stepStore.set(32); 
    }
</script>

<!-- Paso 26: Servicios -->
{#if $stepStore === 26}
    <h2 class="text-3xl font-bold text-white mb-6">¿Qué servicios ofrecés?</h2>
    <p class="text-gray-400 mb-4">Marcalos con un click; podés elegir todos.</p>
    <CheckboxGroup options={escortServices} bind:selectedValues={formData.selectedServices} />
    <Button onClick={handleServices}>
        { formData.selectedServices.size ? '¡Genial, seguimos!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 27: Fantasías -->
{#if $stepStore === 27}
    <h2 class="text-3xl font-bold text-white mb-6">Contanos tus fantasías</h2>
    <p class="text-gray-400 mb-4">Marcalas si te copa alguna.</p>
    <CheckboxGroup options={escortFantasies} bind:selectedValues={formData.selectedFantasies} />
    <Button onClick={handleFantasies}>¡Listo!</Button>
{/if}

<!-- Paso 28: Masajes -->
{#if $stepStore === 28}
    <h2 class="text-3xl font-bold text-white mb-6">¿Qué masajes ofrecés?</h2>
    <p class="text-gray-400 mb-4">Marcalos si los tenés.</p>
    <CheckboxGroup options={massageTypes} bind:selectedValues={formData.selectedMassages} />
    <Button onClick={handleMassages}>¡Vamos!</Button>
{/if}

<!-- Paso 29: Virtual -->
{#if $stepStore === 29}
    <h2 class="text-3xl font-bold text-white mb-6">Servicios virtuales</h2>
    <p class="text-gray-400 mb-4">Marcalos si hacés video call, dirty talk, etc.</p>
    <CheckboxGroup options={virtualServices} bind:selectedValues={formData.selectedVirtual} />
    <Button onClick={handleVirtual}>¡Perfecto!</Button>
{/if}

<!-- Paso 30: Precio por hora -->
{#if $stepStore === 30}
    <h2 class="text-3xl font-bold text-white mb-6">Cuánto cobrás por hora</h2>
    <p class="text-gray-400 mb-4">Poné monto y moneda (ej: 100 USD).</p>
    <TextInput 
        type="number" 
        bind:value={formData.hourPriceAmount} 
        min="0" 
        placeholder="Precio (ej: 100)" 
    />
    <select 
        bind:value={formData.hourPriceCurrency} 
        class="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded mb-4"
    >
        <option value="USD">USD</option>
        <option value="ARS">ARS</option>
        <option value="EUR">EUR</option>
    </select>
    <Button onClick={handleHourPrice}>
        { formData.hourPriceAmount.trim() ? '¡Genial!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 31: Tarifas custom -->
{#if $stepStore === 31}
    <h2 class="text-3xl font-bold text-white mb-6">¿Tenés tarifas especiales?</h2>
    <p class="text-gray-400 mb-4">Agregá los servicios custom que quieras.</p>
    <button 
        on:click={addCustomRate} 
        class="mb-4 w-full py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
    >
        + Agregar tarifa
    </button>
    {#each formData.customRates as rate, idx}
        <div class="bg-gray-900 p-4 rounded mb-4 text-left">
            <h3 class="text-xl text-white mb-2">Tarifa {idx + 1}</h3>
            <TextInput 
                bind:value={rate.serviceName} 
                placeholder="Nombre del servicio" 
            />
            <TextInput 
                bind:value={rate.duration} 
                placeholder="Duración (ej: 30m, 1h)" 
            />
            <TextInput 
                type="number" 
                bind:value={rate.incallPrice} 
                placeholder="Precio incall (ej: 50)" 
            />
            <TextInput 
                type="number" 
                bind:value={rate.outcallPrice} 
                placeholder="Precio outcall (ej: 70)" 
            />
        </div>
    {/each}
    <Button onClick={handleCustomRates}>
        { formData.customRates.length ? 'Terminé' : 'Saltar' }
    </Button>
{/if}

<!-- Paso 32: Ir a disponibilidad -->
{#if $stepStore === 32}
    <Button onClick={() => stepStore.set(33)}>
        Continuar a disponibilidad
    </Button>
{/if}