<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    let pass = '';
    let confirmPassword = '';
    let error = '';
    let success = '';
    let isLoading = false;

    const { token } = $page.params;

    const handleSubmit = async () => {
        error = '';
        success = '';
        if (!pass || !confirmPassword) {
            error = 'Completá ambos campos.';
            return;
        }
        if (pass !== confirmPassword) {
            error = 'Las contraseñas no coinciden.';
            return;
        }
        isLoading = true;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/escort/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type':'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ pass: pass })
            });
            if (res.ok) {
                success = 'Contraseña actualizada! Redirigiendo al login...';
                setTimeout(() => goto('/dashboard/login'), 2000);
            } else {
                const data = await res.json();
                error = data.message || 'Error al resetear contraseña.';
            }
        } catch (err) {
            error = 'Error de red.';
        } finally {
            isLoading = false;
        }
    };
</script>

<form on:submit|preventDefault={handleSubmit} class="min-h-screen flex items-center justify-center bg-black px-4">
    <div class="w-full max-w-sm space-y-6">
        <h2 class="text-white text-2xl font-semibold text-center">Restablecé tu contraseña</h2>
        {#if error}<p class="text-red-500 text-sm text-center">{error}</p>{/if}
        {#if success}<p class="text-green-400 text-sm text-center">{success}</p>{/if}
        <div class="space-y-4">
            <div>
                <label class="block text-gray-400 text-sm mb-1" for="password">Nueva contraseña</label>
                <input id="password" type="password" bind:value={pass} placeholder="••••••••"
                       class="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-white" />
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-1" for="confirmPassword">Confirmar contraseña</label>
                <input id="confirmPassword" type="password" bind:value={confirmPassword} placeholder="••••••••"
                       class="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-white" />
            </div>
        </div>
        <button type="submit" class="w-full py-2 text-black bg-white font-medium rounded hover:bg-gray-200 transition" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
        <p class="text-center text-gray-500 text-sm">
            <a href="/dashboard/login" class="hover:text-gray-300">Volver al login</a>
        </p>
    </div>
</form>
