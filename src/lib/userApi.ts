import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

export const registerUser = async (userData) => {
    const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        if (response.status === 400) {
            const errorData = await response.json();
            if (errorData.error === 'Username already exists') {
                throw new Error('Username already exists');
            }
        } else if (response.status === 429) {
            throw new Error('Too many requests');
        }
        throw new Error('Registration failed');
    }

    return await response.json();
};

export const verifyOtp = async (otp) => {
    const response = await fetch(`${API_URL}/users/otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
    });

    if (!response.ok) {
        throw new Error('OTP verification failed');
    }

    return response.status === 200;
};

export const addToCatlist = async (displayName: string) => {
    const response = await fetch(`${API_URL}/users/catlist`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName, visited: false }),
    });
    if (!response.ok) throw new Error('Failed to add to catlist');
    return await response.json();
};

export const updateCatlistVisited = async (displayName: string, visited: boolean) => {
    const response = await fetch(`${API_URL}/users/catlist/${displayName}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visited }),
    });
    if (!response.ok) throw new Error('Failed to update catlist');
    return await response.json();
};
