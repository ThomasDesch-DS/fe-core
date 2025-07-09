<script>
    import { goto } from '$app/navigation';
    import { login } from '$lib/escort/api/authApi';
    import { escortAuthStore } from '$lib/escort/store/escortAuthStore.js';
    
    let email = '';
    let password = '';
    let error = '';
    let isLoading = false;

    const validate = () => {
        if (!email || !password) {
            error = 'Che, faltan datos.';
            return false;
        }
        // validá mail básico
        const re = /\S+@\S+\.\S+/;
        if (!re.test(email)) {
            error = 'Ese mail no pinta ser real.';
            return false;
        }
        error = '';
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        
        isLoading = true;
        error = '';
        
        try {
            const success = await login(email, password);
            if (success) {
                // Redirect to dashboard or home page after successful login
                goto('/dashboard');
            }
        } catch (err) {
            error = err.message || 'Error al iniciar sesión. Intentá nuevamente.';
        } finally {
            isLoading = false;
        }
    };
</script>

<style>
    /* Por si necesitás global */
</style>

<form
        on:submit|preventDefault={handleSubmit}
        class="min-h-screen flex flex-col justify-center items-center bg-black px-4"
>
    <div class="w-full max-w-sm space-y-6">
        <h1 class="text-white text-3xl font-semibold text-center">
            ¡Bienvenido! 👋
        </h1>
        {#if error}
            <p class="text-red-500 text-sm text-center">{error}</p>
        {/if}

        <div class="space-y-4">
            <div>
                <label class="block text-gray-400 text-sm mb-1" for="email">
                    Mail
                </label>
                <input
                        id="email"
                        type="email"
                        bind:value={email}
                        placeholder="tunombre@correo.com"
                        class="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-white"
                        required
                />
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-1" for="password">
                    Contraseña
                </label>
                <input
                        id="password"
                        type="password"
                        bind:value={password}
                        placeholder="••••••••"
                        class="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-white"
                        required
                />
            </div>
        </div>

        <button
                type="submit"
                class="w-full py-2 text-black bg-white font-medium rounded hover:bg-gray-200 transition"
                disabled={isLoading}
        >
            {isLoading ? 'Cargando...' : 'Entrar'}
        </button>

        <div class="flex justify-between text-sm">
            <button
                    type="button"
                    on:click={() => goto('/dashboard/forgot')}
                    class="text-gray-500 hover:text-gray-300 transition"
            >
                ¿Te olvidaste la contraseña?
            </button>
            <button
                    type="button"
                    on:click={() => goto('/dashboard/register')}
                    class="text-gray-500 hover:text-gray-300 transition"
            >
                Registrate
            </button>
        </div>
    </div>
</form>
