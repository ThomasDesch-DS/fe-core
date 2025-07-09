import { dSuserAuthStore } from '../escort/store/dsUserAuthStore';

const BASE_URL = `${import.meta.env.VITE_API_URL}/users`;

export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
}

export async function userApiRequest<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
): Promise<T> {
    const {
        method = 'GET',
        body,
        headers = {},
        credentials = 'include', // This enables cookie handling
    } = options;

    const mergedHeaders = {
        'Content-Type': 'application/json',
        ...headers,
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers: mergedHeaders,
            body: body ? JSON.stringify(body) : undefined,
            credentials, // Includes cookies in requests
        });

        // Handle 401 Unauthorized errors
        if (response.status === 401) {
            console.log('401 error, attempting to refresh token...');
            const refreshed = await refreshUserToken();
            
            if (refreshed) {
                console.log('Token refreshed successfully, retrying request...');
                // Retry the original request after successful token refresh
                return userApiRequest(endpoint, options);
            } else {
                console.log('Token refresh failed, logging out...');
                dSuserAuthStore.logout();
                throw new Error('Session expired. Please log in again.');
            }
        }
        
        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } else {
            // Handle non-JSON responses (like plain text or HTML)
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `HTTP error! status: ${response.status}`);
            }
            
            return response as T;
        }
    } catch (error) {
        console.error('User API request error:', error);
        throw error;
    }
}

// Token refresh function for users API
async function refreshUserToken(): Promise<boolean> {
    try {
        const response = await fetch(`${BASE_URL}/refresh-jwt`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        return false;
    }
}

// Convenience methods
export const userApi = {
    get: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) => 
        userApiRequest<T>(endpoint, { ...options, method: 'GET' }),
    
    post: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) => 
        userApiRequest<T>(endpoint, { ...options, method: 'POST', body }),
    
    put: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) => 
        userApiRequest<T>(endpoint, { ...options, method: 'PUT', body }),
    
    delete: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) => 
        userApiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
    
    patch: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) => 
        userApiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),
};