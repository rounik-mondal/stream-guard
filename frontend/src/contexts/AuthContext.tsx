// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';

// This User interface should match your backend's 'User' model
interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  _count: { // Add this whole object
    stream: number;
    followers: number;
    following: number;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>; // Changed from username to email
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  createGuestSession: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Your logic here for isAuthenticated/isGuest is fine, but let's base it on email
  const isGuest = !!user && user.email.endsWith('@guest.com');
  const isAuthenticated = !!user && !isGuest;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Helper function to get user data after a token is set
   */
  const fetchUserAfterTokenSet = async (token: string) => {
    // Set token in API headers for this and all future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Verify token by getting user info
    const response = await api.get('/api/auth/me');
    setUser(response.data);
  };

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      // Fetch user data using the token
      await fetchUserAfterTokenSet(token);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // 1. Call login endpoint (sends email, expects tokens)
      const response = await api.post('/api/auth/login', {
        email, // <-- FIXED: Was 'username'
        password,
      });

      const { access_token, refresh_token } = response.data; // <-- FIXED: Backend sends two tokens
      
      // 2. Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // 3. Fetch user data
      await fetchUserAfterTokenSet(access_token);
      
      toast.success(`Welcome back!`);
      navigate('/');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      
      // 1. Register: This call ONLY creates the user
      await api.post('/api/auth/register', userData);

      // 2. Login: Now, log the new user in
      // This re-uses your login logic and fixes the "Registration failed" bug
      await login(userData.email, userData.password);

      toast.success(`Welcome to StreamGuard, ${userData.username}!`);
      // navigate('/'); // No need, login() already does this
      
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token'); // Also remove refresh token
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const createGuestSession = async () => {
    try {
      setIsLoading(true);
      
      // 1. Call guest endpoint (expects tokens)
      const response = await api.post('/api/auth/guest');
      
      const { access_token, refresh_token } = response.data; // <-- FIXED
      
      // 2. Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // 3. Fetch user data
      await fetchUserAfterTokenSet(access_token);
      
      toast.success('Guest session created');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to create guest session';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isGuest,
    login,
    register,
    logout,
    createGuestSession,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};