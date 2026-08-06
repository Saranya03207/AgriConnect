import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  displayName: string;
}

/**
 * Extract authenticated user from API Gateway HTTP API v2 event.
 * Works with Cognito JWT Authorizer claims.
 */
export function getUserFromEvent(event: APIGatewayProxyEventV2): AuthenticatedUser | null {
  try {
    const claims = (event.requestContext as any).authorizer?.jwt?.claims || (event.requestContext as any).authorizer?.claims;
    if (!claims) return null;
    return {
      userId: claims.sub || claims['cognito:username'] || '',
      email: claims.email || '',
      role: claims['custom:role'] || 'farmer',
      displayName: claims['custom:display_name'] || claims.email || ''
    };
  } catch {
    return null;
  }
}

/**
 * Checks if the user has the required role.
 */
export function hasRole(user: AuthenticatedUser, requiredRole: string): boolean {
  return user.role === requiredRole;
}
