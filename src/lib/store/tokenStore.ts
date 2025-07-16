import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface TokenState {
    tokens: number;
    isLoading: boolean;
}

// Check for stored token data in localStorage
const getStoredTokens = (): TokenState => {
    if (browser) {
        const storedTokens = localStorage.getItem('user_tokens');
        if (storedTokens) {
            try {
                return JSON.parse(storedTokens);
            } catch (e) {
                console.error('Failed to parse stored token data', e);
            }
        }
    }
    
    // Default initial state if nothing stored
    return {
        tokens: 0,
        isLoading: false
    };
};

// Initial state (try to load from localStorage if in browser)
const initialState: TokenState = getStoredTokens();

// Create the token store
function createTokenStore() {
    const { subscribe, set, update } = writable<TokenState>(initialState);

    // Helper to persist state to localStorage
    const persistState = (state: TokenState) => {
        if (browser) {
            localStorage.setItem('user_tokens', JSON.stringify(state));
        }
        return state;
    };

    return {
        subscribe,
        
        // Set tokens directly
        setTokens: (tokens: number) => {
            update(state => persistState({
                ...state,
                tokens
            }));
        },
        
        // Add tokens
        addTokens: (amount: number) => {
            update(state => persistState({
                ...state,
                tokens: state.tokens + amount
            }));
        },
        
        // Deduct tokens
        deductTokens: (amount: number) => {
            update(state => persistState({
                ...state,
                tokens: Math.max(0, state.tokens - amount)
            }));
        },
        
        // Update tokens (can be positive or negative)
        updateTokens: (amount: number) => {
            update(state => persistState({
                ...state,
                tokens: Math.max(0, state.tokens + amount)
            }));
        },
        
        // Set loading state
        setLoading: (isLoading: boolean) => {
            update(state => persistState({
                ...state,
                isLoading
            }));
        },
        
        // Clear tokens (for logout)
        clearTokens: () => {
            if (browser) {
                localStorage.removeItem('user_tokens');
            }
            set({
                tokens: 0,
                isLoading: false
            });
        }
    };
}

export const tokenStore = createTokenStore();