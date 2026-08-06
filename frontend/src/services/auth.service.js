import {
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession } from
'amazon-cognito-identity-js';
import { userPool } from '@/lib/cognito';
import { UserRole } from '@/types/auth.types';

export const authService = {
  signUp(email, password, displayName, role) {
    return new Promise((resolve, reject) => {
      const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'custom:role', Value: role }),
      new CognitoUserAttribute({ Name: 'custom:display_name', Value: displayName })];


      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  confirmSignUp(email, code) {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: email, Pool: userPool });
      user.confirmRegistration(code, true, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  signIn(email, password) {
    return new Promise((resolve, reject) => {
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });
      const user = new CognitoUser({ Username: email, Pool: userPool });

      user.authenticateUser(authDetails, {
        onSuccess: (session) => {
          resolve({
            accessToken: session.getAccessToken().getJwtToken(),
            idToken: session.getIdToken().getJwtToken(),
            refreshToken: session.getRefreshToken().getToken()
          });
        },
        onFailure: (err) => reject(err)
      });
    });
  },

  forgotPassword(email) {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: email, Pool: userPool });
      user.forgotPassword({
        onSuccess: (data) => resolve(data),
        onFailure: (err) => reject(err),
        inputVerificationCode: (data) => resolve(data)
      });
    });
  },

  confirmForgotPassword(email, code, newPassword) {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: email, Pool: userPool });
      user.confirmPassword(code, newPassword, {
        onSuccess: () => resolve('Success'),
        onFailure: (err) => reject(err)
      });
    });
  },

  signOut() {
    const user = userPool.getCurrentUser();
    if (user) {
      user.signOut();
    }
  },

  getCurrentSession() {
    return new Promise((resolve, reject) => {
      const user = userPool.getCurrentUser();
      if (!user) {
        return reject(new Error('No current user'));
      }
      user.getSession((err, session) => {
        if (err) return reject(err);
        if (!session.isValid()) {
          return reject(new Error('Session invalid'));
        }
        resolve(session);
      });
    });
  },

  resendConfirmationCode(email) {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: email, Pool: userPool });
      user.resendConfirmationCode((err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  parseIdToken(idToken) {
    try {
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).
        split('').
        map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).
        join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Invalid ID token', e);
      return null;
    }
  }
};