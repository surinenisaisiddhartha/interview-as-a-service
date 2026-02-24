export interface AnalyticsMetric {
    id: string;
    label: string;
    value: number;
    trend: number;
    timeframe: 'daily' | 'weekly' | 'monthly';
}
