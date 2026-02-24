// UI slice for global toggle states (sidebar, modals, themes)
export const useUiStore = () => ({
    sidebarOpen: false,
    toggleSidebar: () => { },
    theme: 'light',
    setTheme: (_t: string) => { },
});
