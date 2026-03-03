
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  RECRUITER = 'RECRUITER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId?: string;
  companyName?: string;
  status: 'active' | 'inactive';
  lastActive?: string;
}

export interface Company {
  id: string;
  name: string;
  adminCount: number;
  agentCount: number;
  interviewsCount: number;
  aiUsage: string;
  plan: 'Basic' | 'Pro' | 'Enterprise';
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  type: 'Voice' | 'Chat' | 'Video';
  assignedCompanies: number;
  totalInterviews: number;
  failureRate: string;
  avgDuration: string;
  status: 'online' | 'offline' | 'maintenance';
}

export interface Interview {
  id: string;
  candidateName: string;
  companyId: string;
  companyName: string;
  agentId: string;
  agentName: string;
  jobRole: string;
  recruiterId: string;
  recruiterName: string;
  duration: string;
  aiScore: number;
  status: 'completed' | 'failed' | 'in-progress' | 'scheduled';
  date: string;
}

export interface JD {
  id: string;
  title: string;
  companyId: string;
  skills: string[];
  status: 'active' | 'draft';
}

export interface Resume {
  id: string;
  candidateName: string;
  skills: string[];
  experience: string;
  status: 'parsed' | 'pending';
}
