import React, { createContext, useContext, useState, useEffect } from 'react';
// // import { AuthState, AuthUser, AuthTokens, SignUpFormData, LoginFormData, ForgotPasswordFormData, ResetPasswordFormData, VerifyEmailFormData } from '@/types/auth.types';
import { authService } from '@/services/auth.service';











const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await authService.getCurrentSession();
        const idToken = session.getIdToken().getJwtToken();
        const accessToken = session.getAccessToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();

        const payload = authService.parseIdToken(idToken);
        if (payload) {
          const authUser = {
            userId: payload.sub,
            email: payload.email,
            displayName: payload['custom:display_name'] || '',
            role: payload['custom:role'],
            isVerified: payload.email_verified === true || payload.email_verified === 'true'
          };

          const authTokens = {
            accessToken,
            idToken,
            refreshToken,
            expiresIn: session.getIdToken().getExpiration()
          };

          setUser(authUser);
          setTokens(authTokens);
          setIsAuthenticated(true);

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('idToken', idToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('authUser', JSON.stringify(authUser));
        }
      } catch (error) {
        // No valid session
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authUser');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data) => {
    const { accessToken, idToken, refreshToken } = await authService.signIn(data.email, data.password);

    const payload = authService.parseIdToken(idToken);
    if (!payload) throw new Error('Invalid token payload');

    const authUser = {
      userId: payload.sub,
      email: payload.email,
      displayName: payload['custom:display_name'] || '',
      role: payload['custom:role'],
      isVerified: payload.email_verified === true || payload.email_verified === 'true'
    };

    const authTokens = {
      accessToken,
      idToken,
      refreshToken,
      expiresIn: Math.floor(Date.now() / 1000) + 3600 // rough estimate
    };

    setUser(authUser);
    setTokens(authTokens);
    setIsAuthenticated(true);

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('authUser', JSON.stringify(authUser));
  };

  const signUp = async (data) => {
    await authService.signUp(data.email, data.password, data.displayName, data.role);
  };

  const confirmEmail = async (data) => {
    await authService.confirmSignUp(data.email, data.code);
  };

  const forgotPassword = async (data) => {
    await authService.forgotPassword(data.email);
  };

  const resetPassword = async (data) => {
    await authService.confirmForgotPassword(data.email, data.code, data.newPassword);
  };

  const logout = () => {
    authService.signOut();
    setUser(null);
    setTokens(null);
    setIsAuthenticated(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
  };

  const updateUser = (updates) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      tokens,
      isAuthenticated,
      isLoading,
      login,
      signUp,
      confirmEmail,
      forgotPassword,
      resetPassword,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>);

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};