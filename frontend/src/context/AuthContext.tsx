import * as React from 'react';
import { Employee, UserRole } from '../types';
import { authService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password?: string) => Promise<Employee>;
  signup: (data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password?: string;
    departmentId: string;
    requestedRole: UserRole;
  }) => Promise<Employee>;
  logout: () => Promise<void>;
  resubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    departmentId: string;
    requestedRole: UserRole;
  }) => Promise<Employee>;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<Employee | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchSession = async () => {
    try {
      const active = SessionService.getActiveSession();
      if (active) {
        setUser(active);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSession();

    // Listen for storage changes across windows or dispatch events
    const handleStorageChange = () => {
      const active = SessionService.getActiveSession();
      setUser(active);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (usernameOrEmail: string, password?: string): Promise<Employee> => {
    setIsLoading(true);
    try {
      const authenticatedUser = await authService.login(usernameOrEmail, password);
      SessionService.startSession(authenticatedUser);
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password?: string;
    departmentId: string;
    requestedRole: UserRole;
  }): Promise<Employee> => {
    setIsLoading(true);
    try {
      const newUser = await authService.signup(data);
      SessionService.startSession(newUser);
      setUser(newUser);
      return newUser;
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      SessionService.endSession();
      setUser(null);
    } catch (error: any) {
      toast.error('Logout error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    departmentId: string;
    requestedRole: UserRole;
  }): Promise<Employee> => {
    if (!user) throw new Error('No user to resubmit.');
    setIsLoading(true);
    try {
      const updatedUser = await authService.resubmitApplication(user.id, data);
      SessionService.startSession(updatedUser);
      setUser(updatedUser);
      toast.success('Your resubmitted application is pending review.');
      return updatedUser;
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!user) return;
    try {
      const fresh = await authService.getUserProfile(user.id);
      SessionService.startSession(fresh);
      setUser(fresh);
    } catch {
      // ignore silently or handle
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    resubmit,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
