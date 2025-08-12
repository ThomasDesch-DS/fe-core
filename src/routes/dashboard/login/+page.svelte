<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import posthog from 'posthog-js';
    import { login as escortLogin } from '$lib/escort/api/authApi';
    import { escortAuthStore } from '$lib/escort/store/escortAuthStore.js';
    import { get } from 'svelte/store';
    import LoadingAnimation from "$lib/common/LoadingAnimation.svelte";
    import { trackUserLogin } from "$lib/analytics/analytics";

    let email = '';
    let password = '';
    let error = '';
    let isLoading = false;

    const validate = () => {
        if (!email || !password) {
            error = 'Che, faltan datos.';
            return false;
        }
        const re = /\S+@\S+\.\S+/;
        if (!re.test(email)) {
            error = 'Ese mail no pinta ser real.';
            return false;
        }
        error = '';
        return true;
    };

    onMount(() => {
        // PostHog is initialized in +layout.ts
    });

    const handleSubmit = async () => {
        if (!validate()) return;

        isLoading = true;
        error = '';

        try {
            // call your API
            const escortUser = await escortLogin(email, password);
            // escortAuthStore.login(escortUser); // This call is now handled internally by escortLogin

            // --- identify the user in PostHog ---
            posthog.identify(escortUser.id, {
                userType: 'Escort',
                email: escortUser.email,
                displayName: escortUser.displayName
            });

            trackUserLogin({ success: true, userType: 'Escort' });

            // now navigate
            goto('/dashboard');
        } catch (err) {
            error = err.message || 'Error al iniciar sesión. Intentá nuevamente.';
            trackUserLogin({ success: false, userType: 'Escort', error: err.message });
        } finally {
            isLoading = false;
        }
    };
</script>

<svelte:head>
    <title>Entrar</title>
</svelte:head>

{#if isLoading}
    <div class="min-h-screen flex flex-col justify-center items-center bg-black px-4">
        <LoadingAnimation />
    </div>
{:else}
    <form on:submit|preventDefault={handleSubmit}
          class="min-h-screen flex flex-col justify-center items-center bg-black px-4">
        <div class="w-full max-w-sm space-y-6">
            <h1 class="text-white text-3xl font-semibold text-center">¡Bienvenido! 👋</h1>
            {#if error}
                <p class="text-red-500 text-sm text-center">{error}</p>
            {/if}

            <div class="space-y-4">
                <div>
                    <label for="email" class="block text-gray-400 text-sm mb-1">Mail</label>
                    <input id="email" type="email" bind:value={email}
                           placeholder="tunombre@correo.com"
                           class="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-white" />
                </div>
                <div>
                    <label for="password" class="block text-gray-400 text-sm mb-1">Contraseña</label>
                    <input id="password" type="password" bind:value={password}
                           placeholder="••••••••"
                           class="w-full px-3 py-2 bg-gray-900 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-white" />
                </div>
            </div>

            <button type="submit"
                    class="w-full py-2 text-black bg-white font-medium rounded hover:bg-gray-200 transition"
                    disabled={isLoading}>
                Entrar
            </button>

            <div class="flex justify-between text-sm">
                <button type="button" on:click={() => goto('/dashboard/forgot')}
                        class="text-gray-500 hover:text-gray-300 transition">
                    ¿Te olvidaste la contraseña?
                </button>
                <button type="button" on:click={() => goto('/dashboard/register')}
                        class="text-gray-500 hover:text-gray-300 transition">
                    Registrate
                </button>
            </div>
        </div>
    </form>
{/if}
