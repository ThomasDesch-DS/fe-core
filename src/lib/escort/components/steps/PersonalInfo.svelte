<script lang="ts">
    import { stepStore } from '../../store/formStore';
    import TextInput from '../TextInput.svelte';
    import Button from '../Button.svelte';
    import SelectInput from '../SelectInput.svelte';
    import { genderOptions } from '../../store/formStore';
    
    export let formData;
    
    // Step handlers
    function handleName() { 
        if (!formData.name.trim()) return; 
        stepStore.set(2); 
    }
    
    function handleSurname() { 
        if (!formData.surname.trim()) return; 
        stepStore.set(3); 
    }
    
    function handleDisplayName() { 
        if (!formData.displayName.trim()) return; 
        stepStore.set(4); 
    }
    
    import { validateEmail, verifyEmailCode } from '../../api/registerApi';
    
    let emailError = '';
    let codeError = '';
    let loading = false;
    
    async function handleEmail() { 
        if (!formData.email.trim()) return;
        
        loading = true;
        emailError = '';
        
        try {
            const success = await validateEmail(formData.email);
            if (success) {
                stepStore.set(5);
            }
        } catch (error) {
            emailError = error.message || 'Error validando email. Intentá nuevamente.';
            console.error(error);
        } finally {
            loading = false;
        }
    }
    
    async function handleCode() { 
        if (!formData.code.trim()) return;
        
        loading = true;
        codeError = '';
        
        try {
            const success = await verifyEmailCode(formData.email, formData.code);
            if (success) {
                stepStore.set(6);
            }
        } catch (error) {
            codeError = error.message || 'Código inválido. Intentá nuevamente.';
            console.error(error);
        } finally {
            loading = false;
        }
    }
    
    function handleAge() { 
        const a = parseInt(formData.age); 
        if (!a || a < 18) return; 
        stepStore.set(7); 
    }
    
    function handleGender() { 
        if (!formData.gender) return; 
        stepStore.set(8); 
    }
    
    function handlePrivatePhone() { 
        if (!formData.privatePhoneNumber.trim()) return; 
        stepStore.set(9); 
    }
    
    function handlePublicPhone() { 
        if (!formData.publicPhoneNumber.trim()) return; 
        stepStore.set(10); 
    }
    
    function handleIDNumber() { 
        if (!formData.idNumber.trim()) return; 
        stepStore.set(11); 
    }
    
    function handlePassword() { 
        if (!formData.password.trim() || formData.password !== formData.confirmPassword) return; 
        stepStore.set(11.5); 
    }
    
    function handleDocumentation() { 
        if (!formData.documentation.trim()) return; 
        stepStore.set(12); 
    }
</script>

<!-- Paso 1: Nombre -->
{#if $stepStore === 1}
    <h2 class="text-3xl font-bold text-white mb-6">Che, ¿cómo te llamás?</h2>
    <TextInput bind:value={formData.name} placeholder="Ej: Juan, María" />
    <Button onClick={handleName}>
        { formData.name.trim() ? `¡Dale, ${formData.name}!` : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 2: Apellido -->
{#if $stepStore === 2}
    <h2 class="text-3xl font-bold text-white mb-6">Buenísimo, {formData.name}. ¿Y tu apellido?</h2>
    <TextInput bind:value={formData.surname} placeholder="Ej: Pérez, García" />
    <Button onClick={handleSurname}>
        { formData.surname.trim() ? `¡Buenísimo, ${formData.surname}!` : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 3: Display Name -->
{#if $stepStore === 3}
    <h2 class="text-3xl font-bold text-white mb-6">Elegí un nombre público</h2>
    <p class="text-gray-400 mb-4">Para mantener tu anonimato, no pongas tu nombre real.</p>
    <TextInput bind:value={formData.displayName} placeholder="Ej: LunaSensual, MisterX" />
    <Button onClick={handleDisplayName}>
        { formData.displayName.trim() ? `¡Genial, ${formData.displayName}!` : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 4: Email -->
{#if $stepStore === 4}
    <h2 class="text-3xl font-bold text-white mb-6">Perfecto, {formData.displayName}. ¿Cuál es tu mail?</h2>
    <TextInput type="email" bind:value={formData.email} placeholder="Ej: ejemplo@correo.com" error={emailError} />
    {#if emailError}
        <p class="text-red-500 text-sm mt-1 mb-3">{emailError}</p>
    {/if}
    <Button onClick={handleEmail} disabled={loading}>
        {#if loading}
            Enviando...
        {:else}
            { formData.email.trim() ? 'Mandame el código' : 'Siguiente' }
        {/if}
    </Button>
{/if}

<!-- Paso 5: Verificar código -->
{#if $stepStore === 5}
    <h2 class="text-3xl font-bold text-white mb-6">¡Te mandamos un código a {formData.email}!</h2>
    <TextInput bind:value={formData.code} placeholder="Ej: 123456" error={codeError} />
    {#if codeError}
        <p class="text-red-500 text-sm mt-1 mb-3">{codeError}</p>
    {/if}
    <Button onClick={handleCode} disabled={loading}>
        {#if loading}
            Verificando...
        {:else}
            { formData.code.trim() ? 'Verificar código' : 'Siguiente' }
        {/if}
    </Button>
{/if}

<!-- Paso 6: Edad -->
{#if $stepStore === 6}
    <h2 class="text-3xl font-bold text-white mb-6">Che, ¿cuántos años tenés?</h2>
    <TextInput type="number" bind:value={formData.age} min="18" placeholder="Ej: 25" />
    <Button onClick={handleAge}>
        { formData.age.trim() ? `¡Listo, tenés ${formData.age}!` : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 7: Género -->
{#if $stepStore === 7}
    <h2 class="text-3xl font-bold text-white mb-6">Contame tu género</h2>
    <SelectInput 
        bind:value={formData.gender} 
        options={genderOptions} 
        placeholder="Elegí tu género" 
    />
    <Button onClick={handleGender}>
        { formData.gender ? '¡Perfecto!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 8: Número privado -->
{#if $stepStore === 8}
    <h2 class="text-3xl font-bold text-white mb-6">Dale, {formData.displayName}. Poné tu número privado</h2>
    <p class="text-gray-400 mb-4">Solo nosotros lo veremos; puede coincidir con el público, pero es mejor que no.</p>
    <TextInput type="tel" bind:value={formData.privatePhoneNumber} placeholder="Ej: +54 9 11 1234-5678" />
    <Button onClick={handlePrivatePhone}>
        { formData.privatePhoneNumber.trim() ? '¡Listo!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 9: Número público -->
{#if $stepStore === 9}
    <h2 class="text-3xl font-bold text-white mb-6">Ahora tu número público</h2>
    <p class="text-gray-400 mb-4">Este se mostrará en la web. Podés usar el mismo que el privado, pero mejor si no.</p>
    <TextInput type="tel" bind:value={formData.publicPhoneNumber} placeholder="Ej: +54 9 11 8765-4321" />
    <Button onClick={handlePublicPhone}>
        { formData.publicPhoneNumber.trim() ? '¡Genial!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 10: DNI/ID -->
{#if $stepStore === 10}
    <h2 class="text-3xl font-bold text-white mb-6">Copado, {formData.displayName}. Pasá tu DNI/ID</h2>
    <p class="text-gray-400 mb-4">Puede ser tu DNI argentino o ID de otro país.</p>
    <TextInput bind:value={formData.idNumber} placeholder="Ej: 30.123.456 / ID12345678" />
    <Button onClick={handleIDNumber}>
        { formData.idNumber.trim() ? '¡Perfecto!' : 'Siguiente' }
    </Button>
{/if}

<!-- Paso 11: Contraseña -->
{#if $stepStore === 11}
    <h2 class="text-3xl font-bold text-white mb-6">Elegí una contraseña</h2>
    <TextInput type="password" bind:value={formData.password} placeholder="Contraseña" />
    <TextInput type="password" bind:value={formData.confirmPassword} placeholder="Confirmar contraseña" />
    <Button onClick={handlePassword}>Siguiente</Button>
{/if}

<!-- Paso 11.5: Documentación -->
{#if $stepStore === 11.5}
    <h2 class="text-3xl font-bold text-white mb-6">Agregá tu documentación</h2>
    <p class="text-gray-400 mb-4">Para validar tu perfil necesitamos documentación que demuestre que tenés más de 18 años.</p>
    <textarea 
        bind:value={formData.documentation} 
        rows="3"
        placeholder="Ejemplo: DNI 35123123, nacido 15/02/1990"
        class="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded mb-4"
    />
    <Button onClick={handleDocumentation}>Siguiente</Button>
{/if}