<script>
    import { page } from '$app/stores';
    import { onMount, onDestroy } from 'svelte';
    import { refreshToken, setupTokenRefresh, clearTokenRefresh } from '$lib/escort/api/authApi';
    import { escortAuthStore } from '$lib/escort/store/escortAuthStore.js';
    import AuthGuard from '$lib/escort/components/AuthGuard.svelte';
    
    // Login and register don't require authentication
    $: isAuthRoute = $page.url.pathname === '/dashboard/login' || 
                     $page.url.pathname === '/dashboard/register' ||
                     $page.url.pathname === '/dashboard/forgot' ||
                     $page.url.pathname.startsWith('/dashboard/reset/');
    
    let initialized = false;
    
    // One-time init on mount
    onMount(async () => {
        // Only try to refresh the token if we think we're logged in
        // This prevents unnecessary 401 calls when not logged in
        if ($escortAuthStore.isAuthenticated && !initialized && !isAuthRoute) {
            // Try one token refresh to verify auth is still valid
            const stillValid = await refreshToken();
            
            if (stillValid) {
                // If refresh successful, set up the refresh timer
                setupTokenRefresh();
            }
            // If refresh fails, the refreshToken function will handle logout
        }
        
        initialized = true;
    });
    
    onDestroy(() => {
        clearTokenRefresh();
    });
</script>

<AuthGuard requiredAuth={!isAuthRoute} redirectTo="/dashboard/login">
    <slot />
</AuthGuard>