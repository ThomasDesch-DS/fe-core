<script lang="ts">
    import { stepStore } from '../../store/formStore';
    import Button from '../Button.svelte';
    import TextInput from '../TextInput.svelte';
    import { daysMap } from '../../store/formStore';
    import { addTimeSlot, removeTimeSlot, copyScheduleToAllDays } from '../../utils/scheduleUtils';
    import { onMount } from 'svelte';
    import {
        trackRegisterStepAvailability,
        trackRegisterStepAvailabilityPrefs,
        trackRegisterStepAvailabilitySchedule
    } from '../../../analytics/analytics';
    
    export let formData;
    
    // Step handlers
    function handleAvailabilityPrefs() { 
        stepStore.set(34); 
    }
    
    function handleSchedule() { 
        // Validate at least one time slot is filled
        let hasValidTimeSlot = false;
        for (const day in formData.daySlots) {
            for (const slot of formData.daySlots[day]) {
                if (slot.start.trim() && slot.end.trim()) {
                    hasValidTimeSlot = true;
                    break;
                }
            }
            if (hasValidTimeSlot) break;
        }
        if (!hasValidTimeSlot) return;
        stepStore.set(35); 
    }
    
    function handleAddTimeSlot(day) {
        formData.daySlots = addTimeSlot(formData.daySlots, day);
    }
    
    function handleRemoveTimeSlot(day, index) {
        formData.daySlots = removeTimeSlot(formData.daySlots, day, index);
    }
    
    function handleCopyScheduleToAllDays(sourceDay) {
        formData.daySlots = copyScheduleToAllDays(formData.daySlots, sourceDay);
    }

    onMount(() => {
        trackRegisterStepAvailability({ userType: 'Escort' });
    });

    $: {
        switch ($stepStore) {
            case 33:
                trackRegisterStepAvailabilityPrefs({ userType: 'Escort' });
                break;
            case 34:
                trackRegisterStepAvailabilitySchedule({ userType: 'Escort' });
                break;
        }
    }
</script>

<!-- Paso 33: Disponibilidad -->
{#if $stepStore === 33}
    <h2 class="text-3xl font-bold text-white mb-6">Disponibilidad</h2>
    <div class="space-y-3 text-left mb-4">
        <label class="flex items-center space-x-2">
            <input 
                type="checkbox" 
                bind:checked={formData.onlyVirtual} 
                class="form-checkbox text-white"
            />
            <span class="text-white">Solo virtual</span>
        </label>
        <label class="flex items-center space-x-2">
            <input 
                type="checkbox" 
                bind:checked={formData.onlyInPerson} 
                class="form-checkbox text-white"
            />
            <span class="text-white">Solo presencial</span>
        </label>
        <label class="flex items-center space-x-2">
            <input 
                type="checkbox" 
                bind:checked={formData.ownApartment} 
                class="form-checkbox text-white"
            />
            <span class="text-white">Tengo depto propio</span>
        </label>
        <label class="flex items-center space-x-2">
            <input 
                type="checkbox" 
                bind:checked={formData.motels} 
                class="form-checkbox text-white"
            />
            <span class="text-white">Trabajo en moteles</span>
        </label>
        <label class="flex items-center space-x-2">
            <input 
                type="checkbox" 
                bind:checked={formData.clientPlace} 
                class="form-checkbox text-white"
            />
            <span class="text-white">Voy al lugar del cliente</span>
        </label>
    </div>
    <Button onClick={handleAvailabilityPrefs}>Siguiente</Button>
{/if}

<!-- Paso 34: Horario semanal -->
{#if $stepStore === 34}
    <h2 class="text-3xl font-bold text-white mb-6">Horario semanal</h2>
    <p class="text-gray-400 mb-4">Indicá tu disponibilidad para cada día.</p>
    
    <div class="space-y-4 mb-4">
        {#each Object.entries(daysMap) as [dayShort, dayEnum], index}
            <div class="bg-gray-900 p-4 rounded text-left">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-xl text-white">{dayShort}</h3>
                    <button 
                        on:click={() => handleCopyScheduleToAllDays(dayEnum)}
                        class="text-xs bg-blue-900 text-white px-2 py-1 rounded hover:bg-blue-800"
                        title="Copiar estos horarios a todos los días"
                    >
                        Copiar a todos
                    </button>
                </div>
                <div id="slots-{dayEnum}" class="space-y-2">
                    {#each formData.daySlots[dayEnum] || [] as slot, slotIndex}
                        <div class="flex space-x-2">
                            <input 
                                type="text" 
                                placeholder="10:00" 
                                bind:value={slot.start}
                                class="w-1/2 px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded"
                            />
                            <input 
                                type="text" 
                                placeholder="14:00" 
                                bind:value={slot.end}
                                class="w-1/2 px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded"
                            />
                            {#if slotIndex > 0}
                                <button 
                                    on:click={() => handleRemoveTimeSlot(dayEnum, slotIndex)}
                                    class="bg-red-800 text-white px-2 rounded hover:bg-red-700"
                                >
                                    ×
                                </button>
                            {/if}
                        </div>
                    {/each}
                </div>
                <button 
                    on:click={() => handleAddTimeSlot(dayEnum)}
                    class="mt-2 py-1 px-3 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
                >
                    + Agregar horario
                </button>
            </div>
        {/each}
    </div>
    
    <Button onClick={handleSchedule}>Siguiente</Button>
{/if}