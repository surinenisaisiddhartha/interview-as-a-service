'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '@/types';
import { MOCK_USERS } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, role: Role) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('hireSphere_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, role: Role) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUser = MOCK_USERS.find(u => u.email === email && u.role === role) || {
      id: Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0].toUpperCase(),
      email,
      role,
      status: 'active' as const,
      companyId: role !== Role.SUPER_ADMIN ? 'c1' : undefined,
      companyName: role !== Role.SUPER_ADMIN ? 'TechCorp' : undefined,
    };

    setUser(foundUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hireSphere_user', JSON.stringify(foundUser));
      // Set cookie for middleware route protection
      document.cookie = `hireSphere_role=${role}; path=/; max-age=86400; SameSite=Lax`;
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hireSphere_user');
      document.cookie = 'hireSphere_role=; path=/; max-age=0';
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
