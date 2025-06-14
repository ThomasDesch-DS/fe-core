<script lang="ts">
    import { stepStore } from '../../store/formStore';
    import TextInput from '../TextInput.svelte';
    import Button from '../Button.svelte';
    import SelectInput from '../SelectInput.svelte';
    import { 
        hairColorOptions, 
        eyeColorOptions, 
        skinColorOptions, 
        ethnicityOptions,
        breastSizeOptions,
        buttSizeOptions,
        waxingLevelOptions,
        penisSizeOptions,
        countriesList
    } from '../../store/formStore';
    
    export let formData;
    
    // Step handlers
    function handleHeight() { 
        const h = parseInt(formData.heightInCm); 
        if(!h || h < 50) return; 
        stepStore.set(13); 
    }
    
    function handleWeight() { 
        const w = parseInt(formData.weightInCm); 
        if(!w || w < 30) return; 
        stepStore.set(14); 
    }
    
    function handleNationality() { 
        if(!formData.nationality) return; 
        stepStore.set(15); 
    }
    
    function handleHairColor() { 
        if(!formData.hairColor) return; 
        stepStore.set(16); 
    }
    
    function handleEyeColor() { 
        if(!formData.eyeColor) return; 
        stepStore.set(17); 
    }
    
    function handleSkinColor() { 
        if(!formData.skinColor) return; 
        stepStore.set(18); 
    }
    
    function handleEthnicity() { 
        if(!formData.ethnicity) return; 
        stepStore.set(19); 
    }
    
    function handleBust() { 
        const b = parseInt(formData.bust); 
        if(!b) return; 
        stepStore.set(20); 
    }
    
    function handleWaist() { 
        const w = parseInt(formData.waist); 
        if(!w) return; 
        stepStore.set(21); 
    }
    
    function handleHips() { 
        const h = parseInt(formData.hips); 
        if(!h) return; 
        stepStore.set(22); 
    }
    
    function handleButtSize() { 
        if(!formData.buttSize) return; 
        stepStore.set(23); 
    }
    
    function handleBreastSize() { 
        if(!formData.breastSize) return; 
        stepStore.set(24); 
    }
    
    function handleWaxingLevel() { 
        if(!formData.waxingLevel) return; 
        stepStore.set((formData.gender === 'MALE' || formData.gender === 'TRANSGENDER_MALE') ? 25 : 26); 
    }
    
    function handlePenisSize() { 
        if(!formData.penisSize) return; 
        stepStore.set(26); 
    }
</script>

<!-- Paso 12: Altura -->
{#if $stepStore === 12}
    <h2 class="text-3xl font-bold text-white mb-6">Bien, contanos tu altura en cm</h2>
    <TextInput 
        type="number" 
        bind:value={formData.heightInCm} 
        min="50" 
        placeholder="Ej: 170" 
    />
    <Button onClick={handleHeight}>
        { formData.heightInCm.trim() ? `¡Height: ${formData.heightInCm}cm!` : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 13: Peso -->
{#if $stepStore === 13}
    <h2 class="text-3xl font-bold text-white mb-6">Ahora tu peso en kg</h2>
    <TextInput 
        type="number" 
        bind:value={formData.weightInCm} 
        min="30" 
        placeholder="Ej: 65" 
    />
    <Button onClick={handleWeight}>
        { formData.weightInCm.trim() ? `¡Peso: ${formData.weightInCm}kg!` : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 14: Nacionalidad -->
{#if $stepStore === 14}
    <h2 class="text-3xl font-bold text-white mb-6">¿Cuál es tu nacionalidad?</h2>
    <SelectInput 
        bind:value={formData.nationality} 
        options={countriesList} 
        placeholder="Elegí tu país"
    />
    <Button onClick={handleNationality}>
        { formData.nationality ? '¡Genial!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 15: Color de pelo -->
{#if $stepStore === 15}
    <h2 class="text-3xl font-bold text-white mb-6">Contanos tu color de pelo</h2>
    <SelectInput 
        bind:value={formData.hairColor} 
        options={hairColorOptions} 
        placeholder="Elegí color de pelo"
    />
    <Button onClick={handleHairColor}>
        { formData.hairColor ? '¡Perfecto!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 16: Color de ojos -->
{#if $stepStore === 16}
    <h2 class="text-3xl font-bold text-white mb-6">¿De qué color tenés los ojos?</h2>
    <SelectInput 
        bind:value={formData.eyeColor} 
        options={eyeColorOptions} 
        placeholder="Elegí color de ojos"
    />
    <Button onClick={handleEyeColor}>
        { formData.eyeColor ? '¡Genial!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 17: Tono de piel -->
{#if $stepStore === 17}
    <h2 class="text-3xl font-bold text-white mb-6">¿Cuál es tu tono de piel?</h2>
    <SelectInput 
        bind:value={formData.skinColor} 
        options={skinColorOptions} 
        placeholder="Elegí tono de piel"
    />
    <Button onClick={handleSkinColor}>
        { formData.skinColor ? '¡Perfecto!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 18: Etnia -->
{#if $stepStore === 18}
    <h2 class="text-3xl font-bold text-white mb-6">Contanos tu etnia</h2>
    <SelectInput 
        bind:value={formData.ethnicity} 
        options={ethnicityOptions} 
        placeholder="Elegí tu etnia"
    />
    <Button onClick={handleEthnicity}>
        { formData.ethnicity ? '¡Genial!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 19: Busto -->
{#if $stepStore === 19}
    <h2 class="text-3xl font-bold text-white mb-6">Ahora tu busto (cm)</h2>
    <TextInput 
        type="number" 
        bind:value={formData.bust} 
        min="50" 
        placeholder="Ej: 90" 
    />
    <Button onClick={handleBust}>
        { formData.bust.trim() ? `¡Busto: ${formData.bust}cm!` : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 20: Cintura -->
{#if $stepStore === 20}
    <h2 class="text-3xl font-bold text-white mb-6">Contanos tu cintura (cm)</h2>
    <TextInput 
        type="number" 
        bind:value={formData.waist} 
        min="40" 
        placeholder="Ej: 60" 
    />
    <Button onClick={handleWaist}>
        { formData.waist.trim() ? `¡Cintura: ${formData.waist}cm!` : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 21: Caderas -->
{#if $stepStore === 21}
    <h2 class="text-3xl font-bold text-white mb-6">Ahora tus caderas (cm)</h2>
    <TextInput 
        type="number" 
        bind:value={formData.hips} 
        min="50" 
        placeholder="Ej: 95" 
    />
    <Button onClick={handleHips}>
        { formData.hips.trim() ? `¡Caderas: ${formData.hips}cm!` : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 22: Talla de glúteos -->
{#if $stepStore === 22}
    <h2 class="text-3xl font-bold text-white mb-6">Talla de glúteos</h2>
    <SelectInput 
        bind:value={formData.buttSize} 
        options={buttSizeOptions} 
        placeholder="Elegí tamaño"
    />
    <Button onClick={handleButtSize}>
        { formData.buttSize ? '¡Genial!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 23: Talla de pecho -->
{#if $stepStore === 23}
    <h2 class="text-3xl font-bold text-white mb-6">Talla de pecho</h2>
    <SelectInput 
        bind:value={formData.breastSize} 
        options={breastSizeOptions} 
        placeholder="Elegí tamaño"
    />
    <Button onClick={handleBreastSize}>
        { formData.breastSize ? '¡Perfecto!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 24: Nivel de depilación -->
{#if $stepStore === 24}
    <h2 class="text-3xl font-bold text-white mb-6">Nivel de depilación</h2>
    <SelectInput 
        bind:value={formData.waxingLevel} 
        options={waxingLevelOptions} 
        placeholder="Elegí nivel"
    />
    <Button onClick={handleWaxingLevel}>
        { formData.waxingLevel ? '¡Genial!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 25: Tamaño de pene (si aplica) -->
{#if $stepStore === 25}
    <h2 class="text-3xl font-bold text-white mb-6">Tamaño de pene</h2>
    <SelectInput 
        bind:value={formData.penisSize} 
        options={penisSizeOptions} 
        placeholder="Elegí tamaño"
    />
    <Button onClick={handlePenisSize}>
        { formData.penisSize ? '¡Perfecto!' : 'Siguiente' }
    </Button>
{/if}