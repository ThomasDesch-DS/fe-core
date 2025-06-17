<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { authStore } from '../store/authStore';
    
    export let requiredAuth = true; // If true, redirects to login if not authenticated
    export let redirectTo = '/dashboard/login'; // Where to redirect if authentication check fails
    
    let loading = true;
    let mounted = false;
    
    // Authentication check on mount
    onMount(() => {
        mounted = true;
        
        // Check if user is already authenticated based on store state
        const isAuthenticated = $authStore.isAuthenticated;
        
        if (requiredAuth && !isAuthenticated) {
            // User needs to be authenticated but isn't
            goto(redirectTo);
        } else if (!requiredAuth && isAuthenticated) {
            // User is already authenticated but on a non-auth page (like login)
            goto('/dashboard');
        }
        
        loading = false;
    });
</script>

{#if loading}
    <div class="flex justify-center items-center h-screen">
        <p class="text-gray-600">Cargando...</p>
    </div>
{:else}
    <slot />
{/if}