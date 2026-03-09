import { apiClient } from './api-client';

export interface RetellAgentResponse {
    status: string;
    agent_id: string;
    message: string;
}

export interface RetellLlmResponse {
    status: string;
    llm_id: string;
    message: string;
}

export interface CallResponse {
    call_id: string;
    agent_id: string;
    call_status: string;
    to_number?: string;
    from_number?: string;
    metadata?: any;
    transcript?: string;
    recording_url?: string;
    public_log_url?: string;
}

export interface BatchCallResponse {
    status: string;
    batch_id: string;
    message: string;
}

export const retellApi = {
    /**
     * Creates a Retell LLM (Brain)
     */
    createLLM: () =>
        apiClient.post<RetellLlmResponse>('/retell/create-llm', {}),

    /**
     * Creates a Retell Agent linked to an LLM
     */
    createAgent: (llmId: string) =>
        apiClient.post<RetellAgentResponse>(`/retell/create-agent?llm_id=${llmId}`, {}),

    /**
     * Triggers a single phone call
     */
    createCall: (candidateId: string, jobId: string, toNumber?: string) =>
        apiClient.post<CallResponse>('/retell/create-phone-call', {
            candidate_id: candidateId,
            job_id: jobId,
            to_number: toNumber
        }),

    /**
     * Triggers multiple phone calls for a list of candidates
     */
    createBatchCall: (jobId: string, candidateIds: string[]) =>
        apiClient.post<BatchCallResponse>('/retell/create-batch-call', {
            job_id: jobId,
            candidate_ids: candidateIds
        }),

    /**
     * Retrieves call details
     */
    getCall: (callId: string) =>
        apiClient.get<any>(`/retell/get-call/${callId}`),

    /**
     * Deletes a call record
     */
    deleteCall: (callId: string) =>
        apiClient.delete<{ status: string; call_id: string }>(`/retell/delete-call/${callId}`),

    /**
     * Lists all Retell agents stored in the database.
     */
    getAgents: () =>
        apiClient.get<any[]>('/retell/agents'),

    /**
     * Fetches all registered companies for assignment.
     */
    getCompanies: () =>
        apiClient.get<{ id: string, name: string }[]>('/companies'),

    /**
     * Assigns an agent to a specific company.
     */
    assignAgent: (agentId: string, companyId: string) =>
        apiClient.post('/retell/assign-agent', {
            agent_id: agentId,
            company_id: companyId
        }),

    /**
     * Lists all interview calls.
     */
    getCalls: (candidateId?: string, jobId?: string) => {
        let url = '/retell/calls?';
        if (candidateId) url += `candidate_id=${candidateId}&`;
        if (jobId) url += `job_id=${jobId}&`;
        return apiClient.get<any[]>(url);
    },

    /**
     * Lists interview calls for a candidate.
     */
    getCallsForCandidate: (candidateId: string) =>
        apiClient.get<any[]>(`/retell/calls?candidate_id=${candidateId}`),

    /**
     * Lists interview calls for a job.
     */
    getCallsForJob: (jobId: string) =>
        apiClient.get<any[]>(`/retell/calls?job_id=${jobId}`)
};
