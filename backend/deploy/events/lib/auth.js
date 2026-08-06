"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserFromEvent = getUserFromEvent;
exports.hasRole = hasRole;
/**
 * Extract authenticated user from API Gateway HTTP API v2 event.
 * Works with Cognito JWT Authorizer claims.
 */
function getUserFromEvent(event) {
    try {
        const claims = event.requestContext.authorizer?.jwt?.claims || event.requestContext.authorizer?.claims;
        if (!claims)
            return null;
        return {
            userId: claims.sub || claims['cognito:username'] || '',
            email: claims.email || '',
            role: claims['custom:role'] || 'farmer',
            displayName: claims['custom:display_name'] || claims.email || ''
        };
    }
    catch {
        return null;
    }
}
/**
 * Checks if the user has the required role.
 */
function hasRole(user, requiredRole) {
    return user.role === requiredRole;
}
//# sourceMappingURL=auth.js.map