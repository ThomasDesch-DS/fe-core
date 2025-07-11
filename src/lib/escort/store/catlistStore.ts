// src/lib/stores/catlist.ts
import { writable } from 'svelte/store';
import {
    addToCatlist as apiAdd,
    removeFromCatlist as apiRemove,
    updateCatlistVisited as apiPatch
} from '$lib/escort/api/catlistApi';

const STORAGE_KEY = 'catlist';

export interface CatlistItem {
    id: string;
    escortId: string;
    slug: string;
    visited: boolean;
    displayName: string;
    profilePic: string;
}

const getStorage = () =>
    typeof localStorage !== 'undefined' ? localStorage : null;

function createCatlistStore() {
    const storage = getStorage();
    const initial: CatlistItem[] = storage
        ? JSON.parse(storage.getItem(STORAGE_KEY) || '[]')
        : [];

    const { subscribe, update, set } = writable<CatlistItem[]>(initial);

    // Persist whenever cambie el store
    if (storage) {
        subscribe(list => {
            console.log('Catlist store updated:', list);
            storage.setItem(STORAGE_KEY, JSON.stringify(list));
        });
    }

    return {
        subscribe,

        add: async (escortId: string, additionalData?: { slug: string; displayName: string; profilePic: string }) => {
            try {
                await apiAdd(escortId);
                // Create the catlist item locally since server only returns 200
                const newItem: CatlistItem = {
                    id: crypto.randomUUID(),
                    escortId: escortId,
                    visited: false,
                    slug: additionalData?.slug || '',
                    displayName: additionalData?.displayName || '',
                    profilePic: additionalData?.profilePic || ''
                };
                update(list => [...list, newItem]);
            } catch (e) {
                console.error('catlist add error:', e);
                throw e;
            }
        },

        remove: async (catListItemId: string) => {
            try {
                await apiRemove(catListItemId);
                update(list => list.filter(i => i.id !== catListItemId));
            } catch (e) {
                console.error('catlist remove error:', e);
                throw e;
            }
        },

        setVisited: async (catListItemId: string, visited = true) => {
            // 1) Optimistic update
            update(list =>
                list.map(i =>
                    i.id === catListItemId ? { ...i, visited } : i
                )
            );

            try {
                // 2) Aviso al backend (no JSON.parse)
                await apiPatch(catListItemId, visited);
            } catch (e) {
                console.error('catlist patch error:', e);
                // 3) Revertir cambio si falla
                update(list =>
                    list.map(i =>
                        i.id === catListItemId ? { ...i, visited: !visited } : i
                    )
                );
            }
        },

        // Para reset completo si hace falta
        set
    };
}

export const catlist = createCatlistStore();
