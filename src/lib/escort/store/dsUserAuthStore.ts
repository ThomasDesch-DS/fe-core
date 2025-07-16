import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { tokenStore } from '$lib/store/tokenStore';

// Extended user interface with profile data
interface DSUser {
    username: string;
    id?: string;
    profilePic?: string; // Full escort profile data
}

interface DSUserAuthState {
    isAuthenticated: boolean;
    user: DSUser | null;
    isLoading: boolean;
}

// Check for stored auth data in localStorage
const getDSUserStoredAuth = (): DSUserAuthState => {
    if (browser) {
        const storedAuth = localStorage.getItem('ds_user_auth');
        if (storedAuth) {
            try {
                return JSON.parse(storedAuth);
            } catch (e) {
                console.error('Failed to parse stored ds user auth data', e);
            }
        }
    }
    
    // Default initial state if nothing stored
    return {
        isAuthenticated: false,
        user: null,
        isLoading: false
    };
};

// Initial state (try to load from localStorage if in browser)
const dSUserInitialState: DSUserAuthState = getDSUserStoredAuth();

// Variable to hold the JWT refresh interval ID
let jwtRefreshInterval: number | null = null;

// Create the store
function createDSUserAuthStore() {
    const { subscribe, set, update } = writable<DSUserAuthState>(dSUserInitialState);

    // Helper to persist state to localStorage
    const persistState = (state: DSUserAuthState) => {
        if (browser) {
            localStorage.setItem('ds_user_auth', JSON.stringify(state));
        }
        return state;
    };

    // Function to refresh the JWT
    const refreshJwt = async () => {
        if (!browser) return; // Only run in browser environment

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/refresh-jwt`, {
                method: 'POST',
                credentials: 'include' // Send cookies with the request
            });

            if (!response.ok) {
                console.error('Failed to refresh JWT:', response.statusText);
                // If refresh fails, consider logging out or handling the error appropriately
                // For now, just log. A more robust solution might dispatch an event or use a global error handler.
            } else {
                console.log('JWT refreshed successfully.');
            }
        } catch (error) {
            console.error('Error refreshing JWT:', error);
        }
    };

    // Function to start the JWT refresh interval
    const startJwtRefresh = () => {
        if (browser && jwtRefreshInterval === null) {
            // Refresh immediately on start, then every 5 minutes
            refreshJwt(); 
            jwtRefreshInterval = window.setInterval(refreshJwt, 5 * 60 * 1000); // 5 minutes
            console.log('JWT refresh interval started.');
        }
    };

    // Function to stop the JWT refresh interval
    const stopJwtRefresh = () => {
        if (browser && jwtRefreshInterval !== null) {
            window.clearInterval(jwtRefreshInterval);
            jwtRefreshInterval = null;
            console.log('JWT refresh interval stopped.');
        }
    };

    // Return the store methods along with the new refresh control functions
    return {
        subscribe,
        login: (user: DSUser) => {
            update(state => persistState({
                ...state,
                isAuthenticated: true,
                user,
                isLoading: false
            }));
        },
        logout: () => {
            if (browser) {
                localStorage.removeItem('ds_user_auth');
            }
            set({
                isAuthenticated: false,
                user: null,
                isLoading: false
            });
            // Clear tokens on logout
            tokenStore.clearTokens();
        },
        setLoading: (isLoading: boolean) => {
            update(state => persistState({
                ...state,
                isLoading
            }));
        },
        updateUser: (user: Partial<DSUser>) => {
            update(state => persistState({
                ...state,
                user: state.user ? { ...state.user, ...user } : null
            }));
        },
        updateProfile: (profileData: any) => {
            update(state => {
                if (!state.user) return state;
                
                const updatedUser = {
                    ...state.user,
                    profile: {
                        ...state.user.profilePic,
                        ...profileData
                    }
                };
                
                return persistState({
                    ...state,
                    user: updatedUser
                });
            });
        },
        // Expose these functions so they can be called from the subscription
        startJwtRefresh,
        stopJwtRefresh
    };
}

export const dSuserAuthStore = createDSUserAuthStore();

// Subscribe to the store to manage the JWT refresh interval
dSuserAuthStore.subscribe(state => {
    if (browser) {
        if (state.isAuthenticated) {
            dSuserAuthStore.startJwtRefresh();
        } else {
            dSuserAuthStore.stopJwtRefresh();
        }
    }
});

// Initial check on load if already authenticated
// This ensures the refresh starts even if the page is reloaded and user is already logged in
if (browser && dSUserInitialState.isAuthenticated) {
    dSuserAuthStore.startJwtRefresh();
}