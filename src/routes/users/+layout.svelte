<script>
    import { page } from '$app/stores';
    import { onMount, onDestroy } from 'svelte';
    import { refreshToken, setupTokenRefresh, clearTokenRefresh } from '$lib/escort/api/authApi';
    import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore.js';
    import UserAuthGuard from '$lib/components/UserAuthGuard.svelte';
    
    // Login and register don't require authentication
    $: isAuthRoute = $page.url.pathname === '/users/login'
    
    let initialized = false;
    
    // One-time init on mount
    onMount(async () => {
        // Only try to refresh the token if we think we're logged in
        // This prevents unnecessary 401 calls when not logged in
        if ($dSuserAuthStore.isAuthenticated && !initialized && !isAuthRoute) {
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

<UserAuthGuard requiredAuth={!isAuthRoute} redirectTo="/users/login">
    <slot />
</UserAuthGuard>