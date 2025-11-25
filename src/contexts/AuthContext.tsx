import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin credentials (In production, this should be handled server-side with proper hashing)
// Credentials are loaded from environment variables (.env file)
const ADMIN_CREDENTIALS = {
  username: import.meta.env.VITE_DEMO_USERNAME,
  password: import.meta.env.VITE_DEMO_PASSWORD,
  role: 'admin'
};

// Session timeout: 2 hours
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('cry_user');
    const storedTimestamp = sessionStorage.getItem('cry_timestamp');
    const storedToken = sessionStorage.getItem('cry_token');
    
    if (storedUser && storedTimestamp && storedToken) {
      const timestamp = parseInt(storedTimestamp, 10);
      const now = Date.now();
      
      // Verify token integrity (simple check)
      const expectedToken = btoa(`${storedUser}:${timestamp}:cry_secret_key`);
      
      if (now - timestamp < SESSION_TIMEOUT && storedToken === expectedToken) {
        setUser(JSON.parse(storedUser));
        setLastActivity(timestamp);
      } else {
        // Session expired or invalid token
        clearSession();
      }
    }
  }, []);

  // Auto-logout on inactivity
  useEffect(() => {
    if (!user) return;

    const checkActivity = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > SESSION_TIMEOUT) {
        logout();
        alert('Session expired due to inactivity. Please login again.');
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkActivity);
  }, [user, lastActivity]);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      const now = Date.now();
      setLastActivity(now);
      sessionStorage.setItem('cry_timestamp', now.toString());
    };

    // Track mouse movements, clicks, and keyboard events
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('keypress', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keypress', updateActivity);
    };
  }, [user]);

  const clearSession = () => {
    sessionStorage.removeItem('cry_user');
    sessionStorage.removeItem('cry_timestamp');
    sessionStorage.removeItem('cry_token');
    setUser(null);
  };

  const login = (username: string, password: string): boolean => {
    // Simulate rate limiting (in production, handle server-side)
    const loginAttempts = sessionStorage.getItem('cry_login_attempts');
    const attemptsCount = loginAttempts ? parseInt(loginAttempts, 10) : 0;
    
    if (attemptsCount >= 5) {
      const lastAttempt = sessionStorage.getItem('cry_last_attempt');
      if (lastAttempt) {
        const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt, 10);
        if (timeSinceLastAttempt < 15 * 60 * 1000) { // 15 minutes lockout
          alert('Too many failed attempts. Please try again in 15 minutes.');
          return false;
        } else {
          // Reset after lockout period
          sessionStorage.removeItem('cry_login_attempts');
          sessionStorage.removeItem('cry_last_attempt');
        }
      }
    }

    // Verify credentials
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const userData: User = {
        username: ADMIN_CREDENTIALS.username,
        role: ADMIN_CREDENTIALS.role
      };
      
      const timestamp = Date.now();
      const token = btoa(`${JSON.stringify(userData)}:${timestamp}:cry_secret_key`);
      
      setUser(userData);
      setLastActivity(timestamp);
      
      sessionStorage.setItem('cry_user', JSON.stringify(userData));
      sessionStorage.setItem('cry_timestamp', timestamp.toString());
      sessionStorage.setItem('cry_token', token);
      sessionStorage.removeItem('cry_login_attempts');
      sessionStorage.removeItem('cry_last_attempt');
      
      return true;
    } else {
      // Failed login attempt
      const newAttempts = attemptsCount + 1;
      sessionStorage.setItem('cry_login_attempts', newAttempts.toString());
      sessionStorage.setItem('cry_last_attempt', Date.now().toString());
      return false;
    }
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
