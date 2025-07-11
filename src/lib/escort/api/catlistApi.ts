// src/lib/api/catlistApi.ts
const API_URL = import.meta.env.VITE_API_URL;

export interface CatlistItemDTO {
    id: string;       // your catlist entry ID
    escortId: string; // the user/escort’s ID
    visited: boolean;
}

export const addToCatlist = async (
    escortId: string
): Promise<void> => {
    const res = await fetch(`${API_URL}/users/catlist`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escortId, visited: false }),
    });
    if (!res.ok) throw new Error('Failed to add to catlist');
};

export const removeFromCatlist = async (
    catListItemId: string
): Promise<void> => {
    const res = await fetch(
        `${API_URL}/users/catlist/${catListItemId}`,
        {
            method: 'DELETE',
            credentials: 'include',
        }
    );
    if (!res.ok) throw new Error('Failed to remove from catlist');
};

export const updateCatlistVisited = async (
    catListItemId: string,
    visited: boolean
): Promise<void> => {
    const res = await fetch(
        `${API_URL}/users/catlist/${catListItemId}`,
        {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visited })
        }
    );
    if (!res.ok) {
        throw new Error('Failed to update visited');
    }
};
