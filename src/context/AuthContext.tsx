import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

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
    const savedUser = localStorage.getItem('rj_admin_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('rj_admin_token');
  });

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    // Check admin credentials (supports rjpaintsandhardwares@gmail.com and Admin@123 / admin123)
    const validEmail = email.trim().toLowerCase() === 'rjpaintsandhardwares@gmail.com' || email.trim().toLowerCase() === 'admin@rjpaints.com';
    const validPassword = password === 'Admin@123' || password === 'admin123' || password === 'madasamy123';

    if (validEmail && validPassword) {
      const adminUser: User = {
        id: 'admin-01',
        email: 'rjpaintsandhardwares@gmail.com',
        role: 'admin',
        name: 'S. Madasamy'
      };
      
      // Generate a mock JWT token signature
      const mockJwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(adminUser))}.signature_rj_paints`;
      
      setUser(adminUser);
      setToken(mockJwtToken);
      
      localStorage.setItem('rj_admin_user', JSON.stringify(adminUser));
      localStorage.setItem('rj_admin_token', mockJwtToken);

      return { success: true };
    }

    return { success: false, message: 'Invalid Admin Email or Password. Please check credentials.' };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('rj_admin_user');
    localStorage.removeItem('rj_admin_token');
  };

  useEffect(() => {
    // Session auto-cleanup if token invalid
    const tokenExp = localStorage.getItem('rj_admin_token');
    if (!tokenExp && user) {
      logout();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
