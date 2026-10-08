import { authConfig } from './authConfig';
import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce';

const STORAGE_KEYS = {
  ID_TOKEN: 'agriconnect_id_token',
  ACCESS_TOKEN: 'agriconnect_access_token',
  REFRESH_TOKEN: 'agriconnect_refresh_token',
  EXPIRES_AT: 'agriconnect_expires_at',
  USER: 'agriconnect_user',
  PKCE_VERIFIER: 'agriconnect_pkce_verifier',
  AUTH_STATE: 'agriconnect_auth_state',
};

/**
 * Parses JWT token payload safely without external dependencies
 */
function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const authService = {
  /**
   * Generates PKCE parameters and constructs the Cognito Hosted UI Login URL
   */
  async getLoginUrl() {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateState();

    // Store verifier and state in sessionStorage for verification on redirect
    sessionStorage.setItem(STORAGE_KEYS.PKCE_VERIFIER, verifier);
    sessionStorage.setItem(STORAGE_KEYS.AUTH_STATE, state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: authConfig.clientId,
      redirect_uri: authConfig.redirectUri,
      scope: 'openid email phone',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: state,
    });

    return `${authConfig.domain}/oauth2/authorize?${params.toString()}`;
  },

  /**
   * Redirects browser to Cognito Managed Login
   */
  async redirectToLogin() {
    const loginUrl = await this.getLoginUrl();
    window.location.assign(loginUrl);
  },

  /**
   * Exchanges authorization code for Cognito tokens (OIDC Token Endpoint)
   */
  async handleCallback(code, returnedState) {
    const savedState = sessionStorage.getItem(STORAGE_KEYS.AUTH_STATE);
    const verifier = sessionStorage.getItem(STORAGE_KEYS.PKCE_VERIFIER);

    // CSRF verification
    if (savedState && returnedState && savedState !== returnedState) {
      throw new Error('Authentication state mismatch. Possible CSRF attack.');
    }

    if (!verifier) {
      throw new Error('PKCE verifier missing in session storage. Please retry login.');
    }

    const tokenEndpoint = `${authConfig.domain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: authConfig.clientId,
      code: code,
      redirect_uri: authConfig.redirectUri,
      code_verifier: verifier,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error_description || errorData.error || 'Failed to exchange authorization code for tokens');
    }

    const data = await response.json();

    // Tokens received - store securely
    const idToken = data.id_token;
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const expiresIn = data.expires_in || 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    localStorage.setItem(STORAGE_KEYS.ID_TOKEN, idToken);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

    // Clean up temporary PKCE keys
    sessionStorage.removeItem(STORAGE_KEYS.PKCE_VERIFIER);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);

    // Parse user attributes from ID Token claims
    const claims = parseJwtPayload(idToken) || {};
    const user = {
      userId: claims.sub || '',
      email: claims.email || '',
      role: (claims['custom:role'] || 'FARMER').toUpperCase(),
      displayName: claims['custom:display_name'] || claims.name || claims.email?.split('@')[0] || 'User',
      emailVerified: Boolean(claims.email_verified),
    };

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  },

  /**
   * Refreshes tokens using the refresh token if available
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return null;

    try {
      const tokenEndpoint = `${authConfig.domain}/oauth2/token`;
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: authConfig.clientId,
        refresh_token: refreshToken,
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();
      const idToken = data.id_token;
      const accessToken = data.access_token;
      const expiresIn = data.expires_in || 3600;
      const expiresAt = Date.now() + expiresIn * 1000;

      if (idToken) localStorage.setItem(STORAGE_KEYS.ID_TOKEN, idToken);
      if (accessToken) localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

      return idToken || accessToken;
    } catch {
      this.logout();
      return null;
    }
  },

  /**
   * Retrieves current valid authorization token for API requests.
   * Prefers ID Token (which contains audience, custom claims, and is verified by API Gateway JWT Authorizer),
   * falls back to Access Token.
   */
  async getToken() {
    const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || 0);
    // If token expires in less than 60 seconds, attempt refresh
    if (Date.now() > expiresAt - 60000) {
      const refreshedToken = await this.refreshToken();
      if (refreshedToken) return refreshedToken;
    }

    return localStorage.getItem(STORAGE_KEYS.ID_TOKEN) || localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || null;
  },

  /**
   * Synchronously returns the stored user profile
   */
  getUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Checks if user has an active, non-expired session
   */
  isAuthenticated() {
    const token = localStorage.getItem(STORAGE_KEYS.ID_TOKEN) || localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || 0);
    return Boolean(token && Date.now() < expiresAt);
  },

  /**
   * Clears local authentication state and redirects to Cognito logout
   */
  logout() {
    localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.PKCE_VERIFIER);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);

    if (authConfig.domain && authConfig.clientId) {
      const params = new URLSearchParams({
        client_id: authConfig.clientId,
        logout_uri: authConfig.redirectUri,
      });
      window.location.assign(`${authConfig.domain}/logout?${params.toString()}`);
    } else {
      window.location.assign('/');
    }
  },
};
