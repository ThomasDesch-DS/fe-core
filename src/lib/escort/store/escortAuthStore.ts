import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Extended user interface with profile data
interface Escort {
    id: string;
    email: string;
    displayName?: string;
    profile?: any; // Full escort profile data
}

interface EscortAuthState {
    isAuthenticated: boolean;
    user: Escort | null;
    isLoading: boolean;
}

// Check for stored auth data in localStorage
const getEscortStoredAuth = (): EscortAuthState => {
    if (browser) {
        const storedAuth = localStorage.getItem('escort_auth');
        if (storedAuth) {
            try {
                return JSON.parse(storedAuth);
            } catch (e) {
                console.error('Failed to parse stored auth data', e);
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
const escortInitialState: EscortAuthState = getEscortStoredAuth();

// Create the store
function createEscortAuthStore() {
    const { subscribe, set, update } = writable<EscortAuthState>(escortInitialState);

    // Helper to persist state to localStorage
    const persistState = (state: EscortAuthState) => {
        if (browser) {
            localStorage.setItem('escort_auth', JSON.stringify(state));
        }
        return state;
    };

    return {
        subscribe,
        
        // Login: Set user data and authentication state
        login: (user: Escort) => {
            update(state => persistState({
                ...state,
                isAuthenticated: true,
                user,
                isLoading: false
            }));
        },
        
        // Logout: Clear user data and reset authentication state
        logout: () => {
            if (browser) {
                localStorage.removeItem('escort_auth');
            }
            set({
                isAuthenticated: false,
                user: null,
                isLoading: false
            });
        },
        
        // Set loading state
        setLoading: (isLoading: boolean) => {
            update(state => persistState({
                ...state,
                isLoading
            }));
        },
        
        // Update user data
        updateUser: (user: Partial<Escort>) => {
            update(state => persistState({
                ...state,
                user: state.user ? { ...state.user, ...user } : null
            }));
        },
        
        // Update specific profile data
        updateProfile: (profileData: any) => {
            update(state => {
                if (!state.user) return state;
                
                const updatedUser = {
                    ...state.user,
                    profile: {
                        ...state.user.profile,
                        ...profileData
                    }
                };
                
                return persistState({
                    ...state,
                    user: updatedUser
                });
            });
        }
    };
}

export const escortAuthStore = createEscortAuthStore();