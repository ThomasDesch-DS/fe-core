import { escortAuthStore } from '../store/escortAuthStore';
import { catlist } from '../store/catlistStore';
import { api } from './apiClient';
import { tokenStore } from '$lib/store/tokenStore';

/**
 * Login user with email and password
 * The JWT cookie is automatically stored by the browser
 */
import type { Escort } from '../store/escortAuthStore'; // Import the Escort type

export async function login(email: string, password: string): Promise<Escort> {
    try {
        const response = await api.post('/login', { 
            email, 
            pass: password 
        });
        
        // The response contains the entire escort profile data
        // Update auth store with escort data
        if (response && response.id) {
            const escortUser: Escort = { // Define escortUser here
                id: response.id,
                email: response.email,
                displayName: response.basicInfo?.displayName || "Escort",
                profile: response // Store the full profile for later use
            };
            escortAuthStore.login(escortUser); // Pass the constructed escortUser

            // Save catList to catlistStore if present in the response
            if (response.catList) {
                console.log('Login response catList:', response.catList);
                catlist.set(response.catList);
            }
            
            // Handle tokens if present in response
            if (response.tokens !== undefined) {
                tokenStore.setTokens(response.tokens);
            }
            
            // Set up auto refresh timer
            setupTokenRefresh();
            return escortUser; // Return the constructed escortUser
        } else {
            throw new Error('Invalid response from server');
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Logout user by clearing cookies and store
 */
export async function logout(): Promise<void> {
    try {
        await api.post('/logout');
        
        // Clear local state regardless of server response
        escortAuthStore.logout();
        
        // Clear tokens
        tokenStore.clearTokens();
        
        // Clear refresh timer
        clearTokenRefresh();
    } catch (error) {
        console.error('Logout error:', error);
        // Still clear local state even if API call fails
        escortAuthStore.logout();
        tokenStore.clearTokens();
        clearTokenRefresh();
    }
}

// Flag to prevent multiple refresh requests in parallel
let isRefreshing = false;

// Flag to track if user is logged in (prevent refresh attempts when logged out)
let isLoggedIn = false;

/**
 * Refresh JWT token
 * This should be called periodically to keep the session alive
 */
export async function refreshToken(): Promise<boolean> {
    // Don't attempt refresh if already refreshing or not logged in
    if (isRefreshing || !isLoggedIn) {
        return false;
    }
    
    isRefreshing = true;
    
    try {
        await api.post('/refresh-jwt');
        isRefreshing = false;
        return true;
    } catch (error) {
        isRefreshing = false;
        
        // If we get 401, user is not authenticated
        if (error.message.includes('401') || error.message.includes('Session expired')) {
            // Token is invalid or expired, log out the user
            isLoggedIn = false;
            escortAuthStore.logout();
            tokenStore.clearTokens();
            clearTokenRefresh(); // Clear the refresh timer
        }
        
        // Don't log every 401 error if we're not logged in - it's expected
        if (isLoggedIn) {
            console.error('Token refresh error:', error);
        }
        
        return false;
    }
}

// Timer reference for token refresh
let refreshTimerId: number | null = null;

/**
 * Set up automatic token refresh (every 9 minutes)
 * JWT expires after 10 minutes, so refresh slightly before
 */
export function setupTokenRefresh(): void {
    // Clear any existing timer
    if (refreshTimerId !== null) {
        clearInterval(refreshTimerId);
    }
    
    // Mark as logged in
    isLoggedIn = true;
    
    // Refresh every 9 minutes (540000 ms)
    // This gives a 1-minute buffer before the 10-minute expiration
    refreshTimerId = window.setInterval(refreshToken, 540000);
}

/**
 * Clear the token refresh timer
 */
export function clearTokenRefresh(): void {
    if (refreshTimerId !== null) {
        clearInterval(refreshTimerId);
        refreshTimerId = null;
    }
    
    // Mark as logged out
    isLoggedIn = false;
}