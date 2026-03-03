import { Role } from '@/types';

export const ROLE_CONFIG = {
    [Role.SUPER_ADMIN]: { allowSystemSettings: true, allowBilling: true },
    [Role.ADMIN]: { allowSystemSettings: false, allowBilling: true },
    [Role.RECRUITER]: { allowSystemSettings: false, allowBilling: false },
} as const;
