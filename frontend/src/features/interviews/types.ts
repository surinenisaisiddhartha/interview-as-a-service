export interface InterviewSession {
    id: string;
    candidateId: string;
    jobId: string;
    scheduledAt: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}
