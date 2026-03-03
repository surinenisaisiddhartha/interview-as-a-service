import { apiClient } from './api-client';
import { CompanySettings } from '@/features/companies/types';

export const companiesApi = {
    getCompanies: () => apiClient.get<CompanySettings[]>('/companies'),
    getCompany: (id: string) => apiClient.get<CompanySettings>(`/companies/${id}`),
};
