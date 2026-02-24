import { apiClient } from './api-client';
import { InterviewSession } from '@/features/interviews/types';

export const interviewsApi = {
    getInterviews: () => apiClient.get<InterviewSession[]>('/interviews'),
    scheduleInterview: (data: Partial<InterviewSession>) => apiClient.post<InterviewSession>('/interviews', data),
};
