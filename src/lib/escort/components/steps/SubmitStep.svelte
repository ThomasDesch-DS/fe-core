<script lang="ts">
    import { stepStore } from '../../store/formStore';
    import Button from '../Button.svelte';
    import { submitRegistration } from '../../api/registerApi';
    
    export let formData;
    
    let submitError = '';
    let loading = false;
    
    async function submit() {
        loading = true;
        submitError = '';
        
        try {
            await submitRegistration(formData);
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
    <h2 class="text-3xl font-bold text-white mb-6">¡Todo listo, {formData.displayName}!</h2>
    
    {#if submitError}
        <div class="bg-red-900 border border-red-500 rounded p-3 mb-4">
            <p class="text-white">{submitError}</p>
        </div>
    {/if}
    
    <Button onClick={submit} disabled={loading}>
        {#if loading}
            Enviando...
        {:else}
            Enviar y completar
        {/if}
    </Button>
{/if}