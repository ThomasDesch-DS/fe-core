// Hidden Profiles Store for tracking profiles that should be hidden from main listing
// Profiles are hidden when user visits preview page, shown again after validation

import { writable } from 'svelte/store';

const HIDDEN_PROFILES_KEY = 'hiddenProfiles';

interface HiddenProfile {
    id: string;
    slug: string;
    displayName: string;
    hiddenAt: number; // timestamp
}

function createHiddenProfilesStore() {
    // Load from localStorage
    function loadFromStorage(): HiddenProfile[] {
        try {
            const stored = localStorage.getItem(HIDDEN_PROFILES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    // Save to localStorage
    function saveToStorage(profiles: HiddenProfile[]) {
        try {
            localStorage.setItem(HIDDEN_PROFILES_KEY, JSON.stringify(profiles));
        } catch (error) {
            console.warn('Failed to save hidden profiles to localStorage:', error);
        }
    }

    const { subscribe, set, update } = writable<HiddenProfile[]>(loadFromStorage());

    return {
        subscribe,
        
        // Hide a profile (when user visits preview)
        hide: (id: string, slug: string, displayName: string) => {
            update(profiles => {
                const existing = profiles.find(p => p.id === id || p.slug === slug);
                if (existing) return profiles; // Already hidden
                
                const newProfile: HiddenProfile = {
                    id,
                    slug,
                    displayName,
                    hiddenAt: Date.now()
                };
                
                const updated = [...profiles, newProfile];
                saveToStorage(updated);
                return updated;
            });
        },
        
        // Show a profile (when user validates in preview)
        show: (identifier: string) => {
            update(profiles => {
                const filtered = profiles.filter(p => 
                    p.id !== identifier && 
                    p.slug !== identifier && 
                    p.displayName !== identifier
                );
                saveToStorage(filtered);
                return filtered;
            });
        },
        
        // Check if profile is hidden
        isHidden: (id?: string, slug?: string, displayName?: string): boolean => {
            const profiles = loadFromStorage();
            return profiles.some(p => 
                (id && p.id === id) ||
                (slug && p.slug === slug) ||
                (displayName && p.displayName === displayName)
            );
        },
        
        // Get all hidden profiles
        getAll: (): HiddenProfile[] => {
            return loadFromStorage();
        },
        
        // Clear all hidden profiles (admin use)
        clear: () => {
            set([]);
            saveToStorage([]);
        }
    };
}

export const hiddenProfilesStore = createHiddenProfilesStore();