
import { Role, User, Company, Agent, Interview, JD, Resume } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Super User', email: 'super@hiresphere.com', role: Role.SUPER_ADMIN, status: 'active' },
  { id: '2', name: 'TechCorp Admin', email: 'admin@techcorp.com', role: Role.ADMIN, companyId: 'c1', companyName: 'TechCorp', status: 'active' },
  { id: '3', name: 'HR Recruiter', email: 'recruiter@techcorp.com', role: Role.RECRUITER, companyId: 'c1', companyName: 'TechCorp', status: 'active' },
  { id: '4', name: 'Dev Solutions Admin', email: 'admin@devsol.com', role: Role.ADMIN, companyId: 'c2', companyName: 'Dev Solutions', status: 'active' },
];

export const MOCK_COMPANIES: Company[] = [
  { id: 'c1', name: 'TechCorp', adminCount: 2, agentCount: 5, interviewsCount: 1250, aiUsage: '85%', plan: 'Enterprise', status: 'active', createdAt: '2024-01-15' },
  { id: 'c2', name: 'Dev Solutions', adminCount: 1, agentCount: 2, interviewsCount: 450, aiUsage: '45%', plan: 'Pro', status: 'active', createdAt: '2024-03-10' },
  { id: 'c3', name: 'BioGen', adminCount: 3, agentCount: 4, interviewsCount: 2100, aiUsage: '92%', plan: 'Enterprise', status: 'active', createdAt: '2023-11-20' },
  { id: 'c4', name: 'RetailX', adminCount: 1, agentCount: 1, interviewsCount: 120, aiUsage: '12%', plan: 'Basic', status: 'suspended', createdAt: '2024-05-02' },
];

export const MOCK_AGENTS: Agent[] = [
  { id: 'a1', name: 'Aurora AI', type: 'Voice', assignedCompanies: 12, totalInterviews: 4500, failureRate: '0.2%', avgDuration: '24m', status: 'online' },
  { id: 'a2', name: 'Zenith Bot', type: 'Chat', assignedCompanies: 8, totalInterviews: 2100, failureRate: '1.5%', avgDuration: '18m', status: 'online' },
  { id: 'a3', name: 'Vision Pro', type: 'Video', assignedCompanies: 5, totalInterviews: 890, failureRate: '2.1%', avgDuration: '35m', status: 'maintenance' },
];

export const MOCK_INTERVIEWS: Interview[] = [
  { id: 'i1', candidateName: 'John Doe', companyId: 'c1', companyName: 'TechCorp', agentId: 'a1', agentName: 'Aurora AI', jobRole: 'Senior React Developer', recruiterId: '3', recruiterName: 'HR Recruiter', duration: '28m', aiScore: 88, status: 'completed', date: '2024-05-20' },
  { id: 'i2', candidateName: 'Jane Smith', companyId: 'c1', companyName: 'TechCorp', agentId: 'a1', agentName: 'Aurora AI', jobRole: 'Senior React Developer', recruiterId: '3', recruiterName: 'HR Recruiter', duration: '32m', aiScore: 94, status: 'completed', date: '2024-05-21' },
  { id: 'i3', candidateName: 'Bob Wilson', companyId: 'c2', companyName: 'Dev Solutions', agentId: 'a2', agentName: 'Zenith Bot', jobRole: 'Project Manager', recruiterId: '3', recruiterName: 'Jane Recruiter', duration: '15m', aiScore: 45, status: 'failed', date: '2024-05-22' },
  { id: 'i4', candidateName: 'Alice Brown', companyId: 'c3', companyName: 'BioGen', agentId: 'a3', agentName: 'Vision Pro', jobRole: 'Data Scientist', recruiterId: '5', recruiterName: 'Tom Admin', duration: '0m', aiScore: 0, status: 'scheduled', date: '2024-05-25' },
];

export const MOCK_JDS: JD[] = [
  { id: 'j1', title: 'Frontend Lead', companyId: 'c1', skills: ['React', 'TypeScript', 'Tailwind'], status: 'active' },
  { id: 'j2', title: 'Backend Architect', companyId: 'c1', skills: ['Node.js', 'PostgreSQL', 'Redis'], status: 'active' },
];

export const MOCK_RESUMES: Resume[] = [
  { id: 'r1', candidateName: 'Mark Spencer', skills: ['React', 'Next.js', 'AWS'], experience: '5 years', status: 'parsed' },
  { id: 'r2', candidateName: 'Sarah Jenkins', skills: ['Python', 'Django', 'React'], experience: '3 years', status: 'parsed' },
];
