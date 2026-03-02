import { apiClient } from './api-client';
import { AnalyticsMetric } from '@/features/analytics/types';

export const analyticsApi = {
    getOverview: () => apiClient.get<AnalyticsMetric[]>('/analytics/overview'),
    getTrends: (timeframe: string) => apiClient.get<AnalyticsMetric[]>(`/analytics/trends?timeframe=${timeframe}`),
};
