<script lang="ts">
    import { stepStore } from '../../store/formStore';
    import Button from '../Button.svelte';
    import { submitRegistration } from '../../api/registerApi';
    import SuccessRegister from '../SuccessRegister.svelte';
    import LoadingAnimation from "../../../common/LoadingAnimation.svelte";
    import { trackUserRegister, trackRegisterStepSubmit, trackRegisterStepSubmitSubmit } from "../../../analytics/analytics";
    import { onMount } from 'svelte';

    export let formData;

    let submitError = '';
    let loading = false;
    let registrationSuccess = false;

    async function submit() {
        loading = true;
        submitError = '';

        try {
            await submitRegistration(formData);
            registrationSuccess = true;
            trackUserRegister({ success: true, userType: 'Escort' });
        } catch(error) {
            submitError = error.message || 'Error al registrar. Intentá nuevamente.';
            trackUserRegister({ success: false, userType: 'Escort', error: error.message });
            console.error(error);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        trackRegisterStepSubmit({ userType: 'Escort' });
    });

    $: {
        if ($stepStore === 39) {
            trackRegisterStepSubmitSubmit({ userType: 'Escort' });
        }
    }
</script>

<!-- Paso 39: Final y Submit -->
{#if $stepStore === 39}
    {#if loading}
        <div class="min-h-screen flex flex-col justify-center items-center bg-black px-4">
            <LoadingAnimation />
        </div>
    {:else if registrationSuccess}
        <SuccessRegister displayName={formData.displayName} />
    {:else}
        <h2 class="text-3xl font-bold text-white mb-6">¡Todo listo, {formData.displayName}!</h2>

        {#if submitError}
            <div class="bg-red-900 border border-red-500 rounded p-3 mb-4">
                <p class="text-white">{submitError}</p>
            </div>
        {/if}

        <Button onClick={submit} disabled={loading}>
            Enviar y completar
        </Button>
    {/if}
{/if}