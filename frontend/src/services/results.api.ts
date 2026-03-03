import { apiClient } from './api-client';
import { InterviewResult } from '@/features/results/types';

export const resultsApi = {
    getResults: () => apiClient.get<InterviewResult[]>('/results'),
    getResult: (id: string) => apiClient.get<InterviewResult>(`/results/${id}`),
};
