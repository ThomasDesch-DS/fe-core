import { escortAuthStore } from '../store/escortAuthStore';
import { refreshToken } from './authApi';

const BASE_URL = import.meta.env.VITE_API_URL + '/escort';

// Type for request options
interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
}

/**
 * Handles API requests with authentication
 * 
 * @param endpoint The API endpoint (without the base URL)
 * @param options Request options
 * @returns The API response
 */
export async function apiRequest<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
): Promise<T> {
    const {
        method = 'GET',
        body,
        headers = {},
        credentials = 'include',
    } = options;

    // Default headers
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    // Merge headers
    const mergedHeaders = {
        ...defaultHeaders,
        ...headers,
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers: mergedHeaders,
            body: body ? JSON.stringify(body) : undefined,
            credentials,
        });

        // Handle 401 Unauthorized errors
        if (response.status === 401) {
            // Try to refresh the token
            const refreshed = await refreshToken();
            
            if (refreshed) {
                // Retry the original request after successful token refresh
                return apiRequest(endpoint, options);
            } else {
                // If refresh failed, logout and throw error
                escortAuthStore.logout();
                throw new Error('Session expired. Please log in again.');
            }
        }

        // For successful responses, parse JSON
        if (response.ok) {
            // Check if response is empty
            const text = await response.text();
            return text ? JSON.parse(text) : {} as T;
        }

        // Handle other errors
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.message || `API request failed with status ${response.status}`
        );
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Helper methods for common HTTP methods
export const api = {
    get: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) => 
        apiRequest<T>(endpoint, { ...options, method: 'GET' }),
        
    post: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) => 
        apiRequest<T>(endpoint, { ...options, method: 'POST', body }),
        
    put: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) => 
        apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),
        
    patch: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) => 
        apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),
        
    delete: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) => 
        apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};