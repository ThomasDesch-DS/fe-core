import { escortAuthStore } from '../store/escortAuthStore';
import { catlist } from '../store/catlistStore';
import { api } from './apiClient';

/**
 * Login user with email and password
 * The JWT cookie is automatically stored by the browser
 */
export async function login(email: string, password: string): Promise<boolean> {
    try {
        const response = await api.post('/login', { 
            email, 
            pass: password 
        });
        
        // The response contains the entire escort profile data
        // Update auth store with escort data
        if (response && response.id) {
            // Store the entire escort data in the auth store
            escortAuthStore.login({
                id: response.id,
                email: response.email,
                displayName: response.basicInfo?.displayName || "Escort",
                profile: response // Store the full profile for later use
            });

            // Save catList to catlistStore if present in the response
            if (response.catList) {
                console.log('Login response catList:', response.catList);
                catlist.set(response.catList);
            }
            
            // Set up auto refresh timer
            setupTokenRefresh();
            return true;
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
        
        // Clear refresh timer
        clearTokenRefresh();
    } catch (error) {
        console.error('Logout error:', error);
        // Still clear local state even if API call fails
        escortAuthStore.logout();
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