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
export declare function getUserFromEvent(event: APIGatewayProxyEventV2): AuthenticatedUser | null;
/**
 * Checks if the user has the required role.
 */
export declare function hasRole(user: AuthenticatedUser, requiredRole: string): boolean;
//# sourceMappingURL=auth.d.ts.map