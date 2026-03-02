export const APP_CONFIG = {
    name: 'HireSphere',
    version: '1.0.0',
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    defaultLanguage: 'en-US',
    metrics: {
        refreshInterval: 30000,
    }
} as const;
