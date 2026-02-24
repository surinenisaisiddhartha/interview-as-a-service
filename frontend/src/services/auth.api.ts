import { apiClient } from './api-client';
import { LoginCredentials, AuthUser } from '@/types/auth.types';

export const authApi = {
    login: (data: LoginCredentials) => apiClient.post<{ user: AuthUser; token: string }>('/auth/login', data),
    logout: () => apiClient.post('/auth/logout', {}),
    refreshToken: () => apiClient.post<{ token: string }>('/auth/refresh', {}),
};
