import { apiClient } from './api-client';

export type OnboardCompanyRequest = {
  company_name: string;
};

export type CreateCompanyUserRequest = {
  email: string;
  role: string;
};

export type OnboardCompanyResponse = {
  id: string;
  name: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type CreateCompanyUserResponse = {
  id: string;
  email: string;
  role: string;
  companyId?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type UploadJdResponse = {
  id: string;
  [key: string]: unknown;
};

export type UploadResumesResponse = {
  id?: string;
  [key: string]: unknown;
};

export const onboardingApi = {
  onboardCompany: (companyName: string) =>
    apiClient.post<OnboardCompanyResponse>('/companies', { company_name: companyName } satisfies OnboardCompanyRequest),

  createUser: (companyId: string, data: CreateCompanyUserRequest) =>
    apiClient.post<CreateCompanyUserResponse>(`/companies/${companyId}/users`, data),

  uploadJd: (companyId: string, userId: string, file: File, extra?: Record<string, string>) => {
    const formData = new FormData();
    formData.append('file', file);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) formData.append(k, v);
    }
    return apiClient.postForm<UploadJdResponse>(`/companies/${companyId}/users/${userId}/jds/upload`, formData);
  },

  uploadResumes: (
    companyId: string,
    userId: string,
    jdId: string,
    files: File[],
    extra?: Record<string, string>
  ) => {
    const formData = new FormData();
    for (const f of files) formData.append('files', f);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) formData.append(k, v);
    }
    return apiClient.postForm<UploadResumesResponse>(
      `/companies/${companyId}/users/${userId}/jds/${jdId}/resumes`,
      formData
    );
  },
};
