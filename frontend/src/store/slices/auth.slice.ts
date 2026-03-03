// Zustand Auth Slice — stub (install zustand via npm to enable)
// npm install zustand

// Placeholder export to satisfy imports until zustand is installed
export const useAuthStore = () => ({
    userId: null as string | null,
    role: null as string | null,
    isAuthenticated: false,
    setAuth: (_userId: string, _role: string) => { },
    clearAuth: () => { },
});
