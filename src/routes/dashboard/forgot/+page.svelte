<script lang="ts">
    import { goto } from '$app/navigation';
    let email = '';
    let error = '';
    let success = '';
    let isLoading = false;

    const handleSubmit = async () => {
        error = '';
        success = '';
        if (!email) {
            error = 'Poné tu mail.';
            return;
        }
        const re = /\S+@\S+\.\S+/;
        if (!re.test(email)) {
            error = 'Ese mail no pinta ser real.';
            return;
        }
        isLoading = true;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/escort/forgot-password`, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                success = 'Si existe una cuenta asociada, chequeá tu casilla.';
                setTimeout(() => goto('/dashboard/login'), 1000);
            } else {
                const data = await res.json();
                error = data.message || 'Error al solicitar restablecer contraseña.';
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
        <h2 class="text-white text-2xl font-semibold text-center">¿Olvidaste tu contraseña?</h2>
        {#if error}<p class="text-red-500 text-sm text-center">{error}</p>{/if}
        {#if success}<p class="text-green-400 text-sm text-center">{success}</p>{/if}
        <div>
            <label class="block text-gray-400 text-sm mb-1" for="email">Mail</label>
            <input id="email" type="email" bind:value={email} placeholder="tunombre@correo.com"
                   class="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-white" />
        </div>
        <button type="submit" class="w-full py-2 text-black bg-white font-medium rounded hover:bg-gray-200 transition" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar link'}
        </button>
        <p class="text-center text-gray-500 text-sm">
            <a href="/dashboard/login" class="hover:text-gray-300">Volver al login</a>
        </p>
    </div>
</form>