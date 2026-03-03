// Tenant slice for tracking current organization context
export const useTenantStore = () => ({
    companyId: null as string | null,
    setCompanyId: (_id: string) => { },
});
