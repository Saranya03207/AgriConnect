from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Union
from app.utils.errors import ForbiddenError, UnauthorizedError
from app.utils.logging import get_logger

logger = get_logger("cognito-auth")

# Six Primary Business Roles + Privileged ADMIN
VALID_ROLES: Set[str] = {
    "SEED_PRODUCER",
    "FARMER",
    "BYPRODUCT_SELLER",
    "BUYER",
    "SERVICE_PROVIDER",
    "PROCESSOR",
    "ADMIN",
}


@dataclass
class UserClaims:
    """Represents verified identity claims extracted from AWS Cognito JWT token."""
    user_id: str
    email: str
    role: str
    display_name: str
    email_verified: bool = False
    raw_claims: Dict[str, Any] = field(default_factory=dict)

    def is_admin(self) -> bool:
        return self.role.upper() == "ADMIN"

    def has_role(self, required_role: Union[str, List[str], Set[str]]) -> bool:
        if self.is_admin():
            return True

        if isinstance(required_role, str):
            required_roles = {required_role.upper()}
        else:
            required_roles = {r.upper() for r in required_role}

        return self.role.upper() in required_roles


def get_authenticated_user(event: Dict[str, Any]) -> Optional[UserClaims]:
    """
    Safely extracts authenticated user claims from API Gateway / Lambda request context.
    Supports:
      1. API Gateway HTTP API v2 ($request.authorizer.jwt.claims)
      2. API Gateway REST API ($request.authorizer.claims)
      3. Direct Lambda context with custom claims injection (for testing)

    SECURITY NOTICE:
    Never trusts role or userId provided in request body or query parameters.
    Identity and role claims MUST originate from the upstream verified JWT.
    """
    if not isinstance(event, dict):
        return None

    request_context = event.get("requestContext", {})
    if not isinstance(request_context, dict):
        return None

    authorizer = request_context.get("authorizer", {})
    if not isinstance(authorizer, dict):
        return None

    # 1. HTTP API v2 JWT Authorizer
    jwt_block = authorizer.get("jwt", {})
    if isinstance(jwt_block, dict) and "claims" in jwt_block:
        claims = jwt_block.get("claims", {})
    # 2. REST API Cognito User Pool Authorizer
    elif "claims" in authorizer:
        claims = authorizer.get("claims", {})
    else:
        # Fallback for direct testing contexts
        claims = authorizer

    if not isinstance(claims, dict) or not claims:
        return None

    # sub is the immutable Cognito User UUID
    user_id = claims.get("sub") or claims.get("userId")
    if not user_id:
        return None

    email = claims.get("email", "").strip().lower()
    raw_role = (claims.get("custom:role") or claims.get("role") or "").strip().upper()
    display_name = claims.get("custom:display_name") or claims.get("displayName") or claims.get("name") or ""

    email_verified_claim = claims.get("email_verified", False)
    if isinstance(email_verified_claim, str):
        email_verified = email_verified_claim.lower() == "true"
    else:
        email_verified = bool(email_verified_claim)

    # Normalize role against valid business roles
    role = raw_role if raw_role in VALID_ROLES else "FARMER"

    return UserClaims(
        user_id=str(user_id),
        email=email,
        role=role,
        display_name=str(display_name),
        email_verified=email_verified,
        raw_claims=claims,
    )


def require_authenticated_user(event: Dict[str, Any]) -> UserClaims:
    """
    Extracts authenticated user or raises UnauthorizedError (HTTP 401).
    """
    user = get_authenticated_user(event)
    if not user:
        logger.warning("Unauthenticated request blocked")
        raise UnauthorizedError("Authentication token is missing, invalid, or expired")
    return user


def require_role(user: UserClaims, allowed_roles: Union[str, List[str], Set[str]]) -> None:
    """
    Ensures the authenticated user has at least one of the allowed roles,
    or raises ForbiddenError (HTTP 403). ADMIN users automatically bypass role restrictions.
    """
    if not user.has_role(allowed_roles):
        logger.warning(
            f"User {user.user_id} with role '{user.role}' attempted unauthorized access to resource requiring {allowed_roles}"
        )
        raise ForbiddenError(f"Role '{user.role}' is not authorized to perform this operation")
