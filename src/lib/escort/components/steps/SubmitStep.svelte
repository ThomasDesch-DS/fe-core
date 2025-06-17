<script lang="ts">
    import { stepStore } from '../../store/formStore';
    import Button from '../Button.svelte';
    import { submitRegistration } from '../../api/registerApi';
    import SuccessRegister from '../SuccessRegister.svelte';
    
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
        } catch(error) {
            submitError = error.message || 'Error al registrar. Intentá nuevamente.';
            console.error(error);
        } finally {
            loading = false;
        }
    }
</script>

<!-- Paso 39: Final y Submit -->
{#if $stepStore === 39}
    {#if registrationSuccess}
        <SuccessRegister displayName={formData.displayName} />
    {:else}
        <h2 class="text-3xl font-bold text-white mb-6">¡Todo listo, {formData.displayName}!</h2>
        
        {#if submitError}
            <div class="bg-red-900 border border-red-500 rounded p-3 mb-4">
                <p class="text-white">{submitError}</p>
            </div>
        {/if}
        
        <Button onClick={submit} disabled={loading}>
            {#if loading}
                <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>Enviando...</span>
                </div>
            {:else}
                Enviar y completar
            {/if}
        </Button>
    {/if}
{/if}