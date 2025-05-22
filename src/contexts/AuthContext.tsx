import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

interface LoginResponse {
  access_token: string;
}

interface ApiError {
  message: string;
  status?: number;
}

interface ErrorResponse {
  response?: {
    data?: ApiError;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post<LoginResponse>('https://wbtx.onrender.com/auth/login', 
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      const { access_token } = response.data;
      
      // Store token in both localStorage and cookies
      localStorage.setItem('token', access_token);
      Cookies.set('token', access_token, { 
        expires: 7, // 7 days
        secure: true,
        sameSite: 'strict'
      });
      
      // Set authentication state
      setIsAuthenticated(true);
      toast.success('Login successful!');
      
      // Use Next.js router for navigation
      router.push('/dashboard');
    } catch (err) {
      const errorResponse = err as ErrorResponse;
      const errorMessage = errorResponse?.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      throw err;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      await axios.post('https://wbtx.onrender.com/auth/register', {
        username,
        password,
      });
      toast.success('Registration successful! Please login.');
      router.push('/login');
    } catch (err) {
      const errorResponse = err as ErrorResponse;
      const errorMessage = errorResponse?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      throw err;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    
    // Clear cookies
    Cookies.remove('token');
    
    // Clear all cached queries
    queryClient.clear();
    
    // Reset authentication state
    setIsAuthenticated(false);
    
    // Show success message
    toast.success('Logged out successfully');
    
    // Redirect to login page
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
