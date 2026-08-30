import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rj_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('rj_admin_token')
  );

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await authService.login(email, password);
      const adminUser: User = {
        id: res.user.id,
        email: res.user.email,
        role: 'admin',
        name: res.user.name,
      };
      setUser(adminUser);
      setToken(res.token);
      localStorage.setItem('rj_admin_user', JSON.stringify(adminUser));
      localStorage.setItem('rj_admin_token', res.token);
      return { success: true };
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Invalid admin credentials';
      return { success: false, message };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('rj_admin_user');
    localStorage.removeItem('rj_admin_token');
  };

  // Auto-clear stale session on mount
  useEffect(() => {
    if (!localStorage.getItem('rj_admin_token') && user) logout();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!token && !!user, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
