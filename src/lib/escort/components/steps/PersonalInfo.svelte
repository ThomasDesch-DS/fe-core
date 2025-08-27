<script lang="ts">
    import { stepStore } from '../../store/formStore';
    import TextInput from '../TextInput.svelte';
    import Button from '../Button.svelte';
    import SelectInput from '../SelectInput.svelte';
    import { genderOptions } from '../../store/formStore';
    import { focusNextOnEnter, formatToE164 } from '../../utils/formUtils';
    import { onMount } from 'svelte';
    import {
        trackPreRegisterEmail,
        trackPreRegisterPhone,
        trackRegisterStepPersonalInfo,
        trackRegisterStepPersonalInfoName,
        trackRegisterStepPersonalInfoSurname,
        trackRegisterStepPersonalInfoDisplayName,
        trackRegisterStepPersonalInfoEmail,
        trackRegisterStepPersonalInfoVerifyCode,
        trackRegisterStepPersonalInfoAge,
        trackRegisterStepPersonalInfoGender,
        trackRegisterStepPersonalInfoPrivatePhone,
        trackRegisterStepPersonalInfoPublicPhone,
        trackRegisterStepPersonalInfoIdNumber,
        trackRegisterStepPersonalInfoPassword,
        trackRegisterStepPersonalInfoDocumentation
    } from '../../../analytics/analytics';
    import { preRegister, validateEmail, verifyEmailCode, validatePhone, verifyPhoneCode } from '../../api/registerApi';

    export let formData;

    // Step handlers
    async function handlePrivatePhone() {
        if (!formData.privatePhoneNumber.trim()) return;

        // Format to E.164
        const formattedPhone = formatToE164(formData.privatePhoneNumber);
        formData.privatePhoneNumber = formattedPhone;

        loading = true;
        phoneError = '';

        try {
            const success = await validatePhone(formattedPhone);
            if (success) {
                await preRegister({ phoneNumber: formattedPhone });
                trackPreRegisterPhone({ phoneNumber: formattedPhone });
                stepStore.set(1.5); // New step for private phone code verification
            }
        } catch (error) {
            phoneError = error.message || 'Error validando teléfono privado. Intentá nuevamente.';
            console.error(error);
        } finally {
            loading = false;
        }
    }

    async function handlePrivatePhoneCode() {
        if (!formData.code.trim()) return;

        loading = true;
        phoneCodeError = '';

        try {
            const success = await verifyPhoneCode(formData.privatePhoneNumber, formData.code);
            if (success) {
                stepStore.set(2);
            }
        } catch (error) {
            phoneCodeError = error.message || 'Código inválido. Intentá nuevamente.';
            console.error(error);
        } finally {
            loading = false;
        }
    }

    function handleName() {
        if (!formData.name.trim()) return;
        stepStore.set(3);
    }

    let emailError = '';
    let codeError = '';
    let phoneError = '';
    let phoneCodeError = '';
    let loading = false;

    async function handleEmail() {
        if (!formData.email.trim()) return;

        loading = true;
        emailError = '';

        try {
            const success = await validateEmail(formData.email);
            if (success) {
                stepStore.set(4);
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
                const data = {
                    name: formData.name,
                    surname: formData.surname,
                    email: formData.email,
                    phoneNumber: formData.privatePhoneNumber
                };
                await preRegister(data);
                trackPreRegisterEmail(data);
                stepStore.set(5);
            }
        } catch (error) {
            codeError = error.message || 'Código inválido. Intentá nuevamente.';
            console.error(error);
        } finally {
            loading = false;
        }
    }

    function handleSurname() {
        if (!formData.surname.trim()) return;
        stepStore.set(6);
    }

    function handleDisplayName() {
        if (!formData.displayName.trim()) return;
        stepStore.set(7);
    }

    function handleAge() {
        const a = parseInt(formData.age);
        if (!a || a < 18) return;
        stepStore.set(8);
    }

    function handleGender() {
        if (!formData.gender) return;
        stepStore.set(9);
    }

    async function handlePublicPhone() {
        if (!formData.publicPhoneNumber.trim()) return;

        // Format to E.164
        const formattedPhone = formatToE164(formData.publicPhoneNumber);
        formData.publicPhoneNumber = formattedPhone;

        // If public phone is same as private phone, skip validation
        if (formattedPhone === formData.privatePhoneNumber) {
            stepStore.set(10);
            return;
        }

        loading = true;
        phoneError = '';

        try {
            const success = await validatePhone(formattedPhone);
            if (success) {
                stepStore.set(9.5); // New step for phone code verification
            }
        } catch (error) {
            phoneError = error.message || 'Error validando teléfono. Intentá nuevamente.';
            console.error(error);
        } finally {
            loading = false;
        }
    }

    async function handlePhoneCode() {
        if (!formData.code.trim()) return;

        loading = true;
        phoneCodeError = '';

        try {
            const success = await verifyPhoneCode(formData.publicPhoneNumber, formData.code);
            if (success) {
                stepStore.set(10);
            }
        } catch (error) {
            phoneCodeError = error.message || 'Código inválido. Intentá nuevamente.';
            console.error(error);
        } finally {
            loading = false;
        }
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

    onMount(() => {
        trackRegisterStepPersonalInfo({ userType: 'Escort' });
    });

    $: {
        switch ($stepStore) {
            case 1:
                trackRegisterStepPersonalInfoPrivatePhone({ userType: 'Escort' });
                break;
            case 1.5:
                // Private phone code verification step
                break;
            case 2:
                trackRegisterStepPersonalInfoName({ userType: 'Escort' });
                break;
            case 3:
                trackRegisterStepPersonalInfoEmail({ userType: 'Escort' });
                break;
            case 4:
                trackRegisterStepPersonalInfoVerifyCode({ userType: 'Escort' });
                break;
            case 5:
                trackRegisterStepPersonalInfoSurname({ userType: 'Escort' });
                break;
            case 6:
                trackRegisterStepPersonalInfoDisplayName({ userType: 'Escort' });
                break;
            case 7:
                trackRegisterStepPersonalInfoAge({ userType: 'Escort' });
                break;
            case 8:
                trackRegisterStepPersonalInfoGender({ userType: 'Escort' });
                break;
            case 9:
                trackRegisterStepPersonalInfoPublicPhone({ userType: 'Escort' });
                break;
            case 9.5:
                // Phone code verification step
                break;
            case 10:
                trackRegisterStepPersonalInfoIdNumber({ userType: 'Escort' });
                break;
            case 11:
                trackRegisterStepPersonalInfoPassword({ userType: 'Escort' });
                break;
            case 11.5:
                trackRegisterStepPersonalInfoDocumentation({ userType: 'Escort' });
                break;
        }
    }
</script>

<!-- Paso 1: Número privado -->
{#if $stepStore === 1}
    <form on:submit|preventDefault={handlePrivatePhone}>
        <h2 class="text-3xl font-bold text-white mb-6">Empecemos con tu número privado</h2>
        <p class="text-gray-400 mb-4">Solo nosotros lo veremos. No te preocupes, no lo compartiremos.</p>
        <TextInput type="tel" bind:value={formData.privatePhoneNumber} placeholder="Ej: +54 9 11 1234-5678" error={phoneError} autofocus />
        {#if phoneError}
            <p class="text-red-500 text-sm mt-1 mb-3">{phoneError}</p>
        {/if}
        <Button type="submit" disabled={loading}>
            {#if loading}
                Enviando...
            {:else}
                { formData.privatePhoneNumber.trim() ? 'Mandame el código' : 'Siguiente' }
            {/if}
        </Button>
    </form>

    <!-- Login link styled like Vercel’s minimal UX -->
    <div class="mt-6 text-center">
        <p class="text-gray-400 text-sm">
            ¿Ya tenés cuenta?
            <a href="/dashboard/login"
               class="text-white font-medium hover:underline hover:text-gray-200 transition-colors">
                Iniciá sesión
            </a>
        </p>
    </div>
{/if}

<!-- Paso 1.5: Verificar código de teléfono privado -->
{#if $stepStore === 1.5}
    <form on:submit|preventDefault={handlePrivatePhoneCode}>
        <h2 class="text-3xl font-bold text-white mb-6">¡Te mandamos un código a {formData.privatePhoneNumber}!</h2>
        <TextInput bind:value={formData.code} placeholder="Ej: 123456" error={phoneCodeError} autofocus />
        {#if phoneCodeError}
            <p class="text-red-500 text-sm mt-1 mb-3">{phoneCodeError}</p>
        {/if}
        <Button type="submit" disabled={loading}>
            {#if loading}
                Verificando...
            {:else}
                { formData.code.trim() ? 'Verificar código' : 'Siguiente' }
            {/if}
        </Button>
    </form>
{/if}

<!-- Paso 2: Nombre -->
{#if $stepStore === 2}
    <form on:submit|preventDefault={handleName}>
        <h2 class="text-3xl font-bold text-white mb-6">Che, ¿cómo te llamás?</h2>
        <TextInput bind:value={formData.name} placeholder="Ej: Juan, María" autofocus />
        <Button type="submit">
            { formData.name.trim() ? `¡Dale, ${formData.name}!` : 'Siguiente' }
        </Button>
    </form>
{/if}

<!-- Paso 3: Email -->
{#if $stepStore === 3}
    <form on:submit|preventDefault={handleEmail}>
        <h2 class="text-3xl font-bold text-white mb-6">Perfecto, {formData.name}. ¿Cuál es tu mail?</h2>
        <TextInput type="email" bind:value={formData.email} placeholder="Ej: ejemplo@correo.com" error={emailError} autofocus />
        {#if emailError}
            <p class="text-red-500 text-sm mt-1 mb-3">{emailError}</p>
        {/if}
        <Button type="submit" disabled={loading}>
            {#if loading}
                Enviando...
            {:else}
                { formData.email.trim() ? 'Mandame el código' : 'Siguiente' }
            {/if}
        </Button>
    </form>
{/if}

<!-- Paso 4: Verificar código -->
{#if $stepStore === 4}
    <form on:submit|preventDefault={handleCode}>
        <h2 class="text-3xl font-bold text-white mb-6">¡Te mandamos un código a {formData.email}!</h2>
        <TextInput bind:value={formData.code} placeholder="Ej: 123456" error={codeError} autofocus />
        {#if codeError}
            <p class="text-red-500 text-sm mt-1 mb-3">{codeError}</p>
        {/if}
        <Button type="submit" disabled={loading}>
            {#if loading}
                Verificando...
            {:else}
                { formData.code.trim() ? 'Verificar código' : 'Siguiente' }
            {/if}
        </Button>
    </form>
{/if}

<!-- Paso 5: Apellido -->
{#if $stepStore === 5}
    <form on:submit|preventDefault={handleSurname}>
        <h2 class="text-3xl font-bold text-white mb-6">Buenísimo, {formData.name}. ¿Y tu apellido?</h2>
        <TextInput bind:value={formData.surname} placeholder="Ej: Pérez, García" autofocus />
        <Button type="submit">
            { formData.surname.trim() ? `¡Buenísimo, ${formData.surname}!` : 'Siguiente' }
        </Button>
    </form>
{/if}

<!-- Paso 6: Display Name -->
{#if $stepStore === 6}
    <form on:submit|preventDefault={handleDisplayName}>
        <h2 class="text-3xl font-bold text-white mb-6">Elegí un nombre público</h2>
        <p class="text-gray-400 mb-4">Para mantener tu anonimato, no pongas tu nombre real.</p>
        <TextInput bind:value={formData.displayName} placeholder="Ej: LunaSensual, MisterX" autofocus />
        <Button type="submit">
            { formData.displayName.trim() ? `¡Genial, ${formData.displayName}!` : 'Siguiente' }
        </Button>
    </form>
{/if}

<!-- Paso 7: Edad -->
{#if $stepStore === 7}
    <form on:submit|preventDefault={handleAge}>
        <h2 class="text-3xl font-bold text-white mb-6">Che, ¿cuántos años tenés?</h2>
        <TextInput type="number" bind:value={formData.age} min="18" placeholder="Ej: 25" autofocus />
        <Button type="submit">
            { formData.age.trim() ? `¡Listo, tenés ${formData.age}!` : 'Siguiente' }
        </Button>
    </form>
{/if}

<!-- Paso 8: Género -->
{#if $stepStore === 8}
    <form on:submit|preventDefault={handleGender}>
        <h2 class="text-3xl font-bold text-white mb-6">Contame tu género</h2>
        <SelectInput 
            bind:value={formData.gender} 
            options={genderOptions} 
            placeholder="Elegí tu género"
            autofocus
        />
        <Button type="submit">
            { formData.gender ? '¡Perfecto!' : 'Siguiente' }
        </Button>
    </form>
{/if}

<!-- Paso 9: Número público -->
{#if $stepStore === 9}
    <form on:submit|preventDefault={handlePublicPhone}>
        <h2 class="text-3xl font-bold text-white mb-6">Ahora tu número público</h2>
        <p class="text-gray-400 mb-4">Este se mostrará en la web. Podés usar el mismo que el privado, pero mejor si no.</p>
        <TextInput type="tel" bind:value={formData.publicPhoneNumber} placeholder="Ej: +54 9 11 8765-4321" error={phoneError} autofocus />
        {#if phoneError}
            <p class="text-red-500 text-sm mt-1 mb-3">{phoneError}</p>
        {/if}
        <Button type="submit" disabled={loading}>
            {#if loading}
                Enviando...
            {:else}
                { formData.publicPhoneNumber.trim() ? '¡Genial!' : 'Siguiente' }
            {/if}
        </Button>
    </form>
{/if}

<!-- Paso 9.5: Verificar código de teléfono -->
{#if $stepStore === 9.5}
    <form on:submit|preventDefault={handlePhoneCode}>
        <h2 class="text-3xl font-bold text-white mb-6">¡Te mandamos un código a {formData.publicPhoneNumber}!</h2>
        <TextInput bind:value={formData.code} placeholder="Ej: 123456" error={phoneCodeError} autofocus />
        {#if phoneCodeError}
            <p class="text-red-500 text-sm mt-1 mb-3">{phoneCodeError}</p>
        {/if}
        <Button type="submit" disabled={loading}>
            {#if loading}
                Verificando...
            {:else}
                { formData.code.trim() ? 'Verificar código' : 'Siguiente' }
            {/if}
        </Button>
    </form>
{/if}

<!-- Paso 10: DNI/ID -->
{#if $stepStore === 10}
    <form on:submit|preventDefault={handleIDNumber}>
        <h2 class="text-3xl font-bold text-white mb-6">Copado, {formData.displayName}. Pasá tu DNI/ID</h2>
        <p class="text-gray-400 mb-4">Puede ser tu DNI argentino o ID de otro país.</p>
        <TextInput bind:value={formData.idNumber} placeholder="Ej: 30.123.456 / ID12345678" autofocus />
        <Button type="submit">
            { formData.idNumber.trim() ? '¡Perfecto!' : 'Siguiente' }
        </Button>
    </form>
{/if}

<!-- Paso 11: Contraseña -->
{#if $stepStore === 11}
    <form on:submit|preventDefault={handlePassword}>
        <h2 class="text-3xl font-bold text-white mb-6">Elegí una contraseña</h2>
        <TextInput type="password" bind:value={formData.password} placeholder="Contraseña" autofocus />
        <TextInput type="password" bind:value={formData.confirmPassword} placeholder="Confirmar contraseña" />
        <Button type="submit">Siguiente</Button>
    </form>
{/if}

<!-- Paso 11.5: Documentación -->
{#if $stepStore === 11.5}
    <form on:submit|preventDefault={handleDocumentation}>
        <h2 class="text-3xl font-bold text-white mb-6">Agregá tu documentación</h2>
        <p class="text-gray-400 mb-4">Para validar tu perfil necesitamos documentación que demuestre que tenés más de 18 años.</p>
        <textarea 
            use:focusNextOnEnter
            bind:value={formData.documentation} 
            rows="3"
            placeholder="Ejemplo: DNI 35123123, nacido 15/02/1990"
            class="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded mb-4"
            autofocus
        />
        <Button type="submit">Siguiente</Button>
    </form>
{/if}

<style>
    /* Estilos adicionales si son necesarios */
</style>