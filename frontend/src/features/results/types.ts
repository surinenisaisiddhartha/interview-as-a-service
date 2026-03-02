export interface InterviewResult {
    id: string;
    interviewId: string;
    overallScore: number;
    skillScores: Record<string, number>;
    aiFeedback: string;
}
