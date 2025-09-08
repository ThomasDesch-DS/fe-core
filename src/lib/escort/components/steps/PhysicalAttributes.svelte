<script lang="ts">
  import { stepStore } from '../../store/formStore';
  import TextInput from '../TextInput.svelte';
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
  import { onMount } from 'svelte';
  import {
      trackRegisterStepPhysicalAttributes,
      trackRegisterStepPhysicalAttributesHeight,
      trackRegisterStepPhysicalAttributesWeight,
      trackRegisterStepPhysicalAttributesNationality,
      trackRegisterStepPhysicalAttributesHairColor,
      trackRegisterStepPhysicalAttributesEyeColor,
      trackRegisterStepPhysicalAttributesSkinColor,
      trackRegisterStepPhysicalAttributesEthnicity,
      trackRegisterStepPhysicalAttributesBust,
      trackRegisterStepPhysicalAttributesWaist,
      trackRegisterStepPhysicalAttributesHips,
      trackRegisterStepPhysicalAttributesButtSize,
      trackRegisterStepPhysicalAttributesBreastSize,
      trackRegisterStepPhysicalAttributesWaxingLevel,
      trackRegisterStepPhysicalAttributesPenisSize
  } from '../../../analytics/analytics';
  
  export let formData;
  
  // Step handlers
  function handleHeight() { 
      const h = parseInt(formData.heightInCm); 
      if(!h || h < 50) return; 
      stepStore.set(13); 
  }
  
  function handleWeight() { 
      const w = parseInt(formData.weightInKg);
      if(!w || w < 30 || w > 150) return;
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

  onMount(() => {
      trackRegisterStepPhysicalAttributes({ userType: 'Escort' });
  });

  $: {
      switch ($stepStore) {
          case 12:
              trackRegisterStepPhysicalAttributesHeight({ userType: 'Escort' });
              break;
          case 13:
              trackRegisterStepPhysicalAttributesWeight({ userType: 'Escort' });
              break;
          case 14:
              trackRegisterStepPhysicalAttributesNationality({ userType: 'Escort' });
              break;
          case 15:
              trackRegisterStepPhysicalAttributesHairColor({ userType: 'Escort' });
              break;
          case 16:
              trackRegisterStepPhysicalAttributesEyeColor({ userType: 'Escort' });
              break;
          case 17:
              trackRegisterStepPhysicalAttributesSkinColor({ userType: 'Escort' });
              break;
          case 18:
              trackRegisterStepPhysicalAttributesEthnicity({ userType: 'Escort' });
              break;
          case 19:
              trackRegisterStepPhysicalAttributesBust({ userType: 'Escort' });
              break;
          case 20:
              trackRegisterStepPhysicalAttributesWaist({ userType: 'Escort' });
              break;
          case 21:
              trackRegisterStepPhysicalAttributesHips({ userType: 'Escort' });
              break;
          case 22:
              trackRegisterStepPhysicalAttributesButtSize({ userType: 'Escort' });
              break;
          case 23:
              trackRegisterStepPhysicalAttributesBreastSize({ userType: 'Escort' });
              break;
          case 24:
              trackRegisterStepPhysicalAttributesWaxingLevel({ userType: 'Escort' });
              break;
          case 25:
              trackRegisterStepPhysicalAttributesPenisSize({ userType: 'Escort' });
              break;
      }
  }
</script>

<!-- Paso 12: Altura -->
{#if $stepStore === 12}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Bien, contanos tu altura en cm
      </h2>
    </header>
    <TextInput 
        type="number" 
        bind:value={formData.heightInCm} 
        min="50" 
        placeholder="Ej: 170" 
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleHeight}
      >
        { formData.heightInCm ? `¡Altura: ${formData.heightInCm}cm!` : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 13: Peso -->
{#if $stepStore === 13}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Ahora tu peso en kg
      </h2>
    </header>
    <TextInput 
        type="number" 
        bind:value={formData.weightInKg}
        min="30" 
        placeholder="Ej: 65" 
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleWeight}
      >
        { formData.weightInKg ? `¡Peso: ${formData.weightInKg}kg!` : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 14: Nacionalidad -->
{#if $stepStore === 14}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        ¿Cuál es tu nacionalidad?
      </h2>
    </header>
    <SelectInput 
        bind:value={formData.nationality} 
        options={countriesList} 
        placeholder="Elegí tu país"
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleNationality}
      >
        { formData.nationality ? '¡Genial!' : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 15: Color de pelo -->
{#if $stepStore === 15}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Contanos tu color de pelo
      </h2>
    </header>
    <SelectInput 
        bind:value={formData.hairColor} 
        options={$hairColorOptions} 
        placeholder="Elegí color de pelo"
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleHairColor}
      >
        { formData.hairColor ? '¡Perfecto!' : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 16: Color de ojos -->
{#if $stepStore === 16}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        ¿De qué color tenés los ojos?
      </h2>
    </header>
    <SelectInput 
        bind:value={formData.eyeColor} 
        options={$eyeColorOptions} 
        placeholder="Elegí color de ojos"
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleEyeColor}
      >
        { formData.eyeColor ? '¡Genial!' : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 17: Tono de piel -->
{#if $stepStore === 17}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        ¿Cuál es tu tono de piel?
      </h2>
    </header>
    <SelectInput 
        bind:value={formData.skinColor} 
        options={$skinColorOptions} 
        placeholder="Elegí tono de piel"
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleSkinColor}
      >
        { formData.skinColor ? '¡Perfecto!' : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 18: Etnia -->
{#if $stepStore === 18}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Contanos tu etnia
      </h2>
    </header>
    <SelectInput 
        bind:value={formData.ethnicity} 
        options={$ethnicityOptions} 
        placeholder="Elegí tu etnia"
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleEthnicity}
      >
        { formData.ethnicity ? '¡Genial!' : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 19: Busto -->
{#if $stepStore === 19}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Ahora tu busto (cm)
      </h2>
    </header>
    <TextInput 
        type="number" 
        bind:value={formData.bust} 
        min="50" 
        placeholder="Ej: 90" 
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleBust}
      >
        { formData.bust ? `¡Busto: ${formData.bust}cm!` : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 20: Cintura -->
{#if $stepStore === 20}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Contanos tu cintura (cm)
      </h2>
    </header>
    <TextInput 
        type="number" 
        bind:value={formData.waist} 
        min="40" 
        placeholder="Ej: 60" 
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleWaist}
      >
        { formData.waist ? `¡Cintura: ${formData.waist}cm!` : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 21: Caderas -->
{#if $stepStore === 21}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Ahora tus caderas (cm)
      </h2>
    </header>
    <TextInput 
        type="number" 
        bind:value={formData.hips} 
        min="50" 
        placeholder="Ej: 95" 
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleHips}
      >
        { formData.hips ? `¡Caderas: ${formData.hips}cm!` : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 22: Talla de glúteos -->
{#if $stepStore === 22}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Talla de glúteos
      </h2>
    </header>
    <SelectInput 
        bind:value={formData.buttSize} 
        options={$buttSizeOptions} 
        placeholder="Elegí tamaño"
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleButtSize}
      >
        { formData.buttSize ? '¡Genial!' : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 23: Talla de pecho -->
{#if $stepStore === 23}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Talla de pecho
      </h2>
    </header>
    <SelectInput 
        bind:value={formData.breastSize} 
        options={$breastSizeOptions} 
        placeholder="Elegí tamaño"
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleBreastSize}
      >
        { formData.breastSize ? '¡Perfecto!' : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 24: Nivel de depilación -->
{#if $stepStore === 24}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Nivel de depilación
      </h2>
    </header>
    <SelectInput 
        bind:value={formData.waxingLevel} 
        options={$waxingLevelOptions} 
        placeholder="Elegí nivel"
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handleWaxingLevel}
      >
        { formData.waxingLevel ? '¡Genial!' : 'Siguiente' }
      </button>
    </div>
</section>
{/if}

<!-- Paso 25: Tamaño de pene (si aplica) -->
{#if $stepStore === 25}
<section class="mx-auto w-full max-w-3xl px-4 sm:px-6">
    <header class="mb-6">
      <h2 class="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
        Tamaño de pene
      </h2>
    </header>
    <SelectInput 
        bind:value={formData.penisSize} 
        options={$penisSizeOptions} 
        placeholder="Elegí tamaño"
    />
    <div class="sticky bottom-4 mt-6">
      <button
        class="w-full rounded-2xl bg-white/95 text-black font-medium py-3.5
             shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white
             focus:outline-none focus:ring-2 focus:ring-white/20 transition"
        on:click={handlePenisSize}
      >
        { formData.penisSize ? '¡Perfecto!' : 'Siguiente' }
      </button>
    </div>
</section>
{/if}
