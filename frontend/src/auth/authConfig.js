/**
 * Centralized Amazon Cognito and API Configuration
 * All values are securely read from Vite environment variables.
 */

export const authConfig = {
  region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  domain: (import.meta.env.VITE_COGNITO_DOMAIN || '').replace(/\/$/, ''),
  redirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI || window.location.origin,
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''),
};

/**
 * Validates that essential configuration is present
 */
export function validateAuthConfig() {
  const missing = [];
  if (!authConfig.userPoolId) missing.push('VITE_COGNITO_USER_POOL_ID');
  if (!authConfig.clientId) missing.push('VITE_COGNITO_CLIENT_ID');
  if (!authConfig.domain) missing.push('VITE_COGNITO_DOMAIN');
  if (!authConfig.redirectUri) missing.push('VITE_COGNITO_REDIRECT_URI');

  if (missing.length > 0) {
    console.warn(`[AgriConnect Auth] Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
}
