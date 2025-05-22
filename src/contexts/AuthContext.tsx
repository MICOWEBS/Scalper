import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post<LoginResponse>('http://localhost:8000/auth/login', {
        username,
        password,
      });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setIsAuthenticated(true);
      toast.success('Login successful!');
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
      await axios.post('http://localhost:8000/auth/register', {
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
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    router.push('/login');
    toast.success('Logged out successfully');
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