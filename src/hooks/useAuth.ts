import { useState, useEffect } from 'react';
import { AuthCredentials, LoginRequest } from '../types';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(authService.isAuthenticated());
  const [credentials, setCredentials] = useState<AuthCredentials>({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);

      const loginRequest: LoginRequest = {
        username: username.trim(),
        password: password.trim()
      };

      await authService.login(loginRequest);
      setIsLoggedIn(true);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError(error instanceof Error ? error.message : 'Login failed');
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    authService.clearToken();
    setIsLoggedIn(false);
    setCredentials({ username: '', password: '' });
    setLoginError(null);
  };

  // Listen for unauthorized events from API client
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  return {
    isLoggedIn,
    credentials,
    setCredentials,
    login,
    logout,
    isLoggingIn,
    loginError
  };
};