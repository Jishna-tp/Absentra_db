import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string, employeeId: string) => Promise<boolean>;
  updateProfile: (updates: { username?: string; password?: string }) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCredentials, setUserCredentials] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('absentra_user');
    const storedCredentials = localStorage.getItem('absentra_credentials');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('absentra_user');
      }
    }
    if (storedCredentials) {
      try {
        setUserCredentials(JSON.parse(storedCredentials));
      } catch (error) {
        localStorage.removeItem('absentra_credentials');
      }
    }
    setLoading(false);
  }, []);

  // Initialize default credentials if not exists
  useEffect(() => {
    const defaultCredentials = {
      'admin': 'password',
      'hr.manager': 'password',
      'line.manager': 'password',
      'employee': 'password'
    };
    
    if (Object.keys(userCredentials).length === 0) {
      setUserCredentials(defaultCredentials);
      localStorage.setItem('absentra_credentials', JSON.stringify(defaultCredentials));
    }
  }, [userCredentials]);
  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Mock authentication - in real app, this would be an API call
      const mockUsers: User[] = [
        { id: '1', username: 'admin', employee_id: 'EMP001', role: 'admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', username: 'hr.manager', employee_id: 'EMP002', role: 'hr', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', username: 'line.manager', employee_id: 'EMP003', role: 'line_manager', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '4', username: 'employee', employee_id: 'EMP004', role: 'employee', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];

      const foundUser = mockUsers.find(u => u.username === username && password === userCredentials[username]);
      
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('absentra_user', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string, employeeId: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Mock registration - in real app, this would be an API call
      const newUser: User = {
        id: Date.now().toString(),
        username,
        employee_id: employeeId,
        role: 'employee',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setUser(newUser);
      localStorage.setItem('absentra_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('absentra_user');
  };

  const updateProfile = async (updates: { username?: string; password?: string }): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      // In a real app, this would be an API call
      // Update user data
      const updatedUser = {
        ...user,
        ...(updates.username && { username: updates.username }),
        updated_at: new Date().toISOString()
      };
      
      setUser(updatedUser);
      localStorage.setItem('absentra_user', JSON.stringify(updatedUser));
      
      // Update password in credentials if provided
      if (updates.password) {
        const updatedCredentials = {
          ...userCredentials,
          [updatedUser.username]: updates.password
        };
        setUserCredentials(updatedCredentials);
        localStorage.setItem('absentra_credentials', JSON.stringify(updatedCredentials));
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};