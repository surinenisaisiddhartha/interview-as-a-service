// Global TypeScript Types — Auth
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    companyId?: string;
    companyName?: string;
}

export type UserRole = 'super_admin' | 'admin' | 'recruiter';

export interface LoginCredentials {
    email: string;
    password: string;
    role: UserRole;
}

export interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
