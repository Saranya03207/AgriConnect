import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from './authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Check if the URL contains an authorization code from Cognito
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (code) {
          setIsLoading(true);
          try {
            const loggedInUser = await authService.handleCallback(code, state);
            setUser(loggedInUser);
            setIsAuthenticated(true);
            setAuthError(null);

            // Clean query parameters from URL without reloading
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          } catch (err) {
            console.error('[AgriConnect Auth] Authentication callback failed:', err.message);
            setAuthError(err.message || 'Failed to complete login');
          } finally {
            setIsLoading(false);
          }
          return;
        }

        // 2. Check existing session in localStorage
        if (authService.isAuthenticated()) {
          const storedUser = authService.getUser();
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        setAuthError(err.message);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = () => {
    setAuthError(null);
    authService.redirectToLogin();
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    authService.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        authError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
