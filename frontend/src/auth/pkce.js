/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * Implemented using browser native Web Crypto API (RFC 7636)
 */

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates a cryptographically random code_verifier string (43 - 128 characters)
 */
export function generateCodeVerifier(length = 64) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  let verifier = '';
  for (let i = 0; i < length; i++) {
    verifier += charset[randomValues[i] % charset.length];
  }
  return verifier;
}

/**
 * Derives the SHA-256 code_challenge from code_verifier
 */
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

/**
 * Generates a random state string to mitigate CSRF attacks
 */
export function generateState(length = 32) {
  return generateCodeVerifier(length);
}
