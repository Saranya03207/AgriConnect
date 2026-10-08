import json
from typing import Any, Dict, Optional
from app.auth.cognito import require_authenticated_user
from app.services.user_service import UserService
from app.utils.errors import AppError, ValidationError
from app.utils.logging import get_logger
from app.utils.response import error_response, options_response, success

logger = get_logger("users-handler")


def _get_route_info(event: Dict[str, Any]) -> tuple[str, str]:
    """
    Normalizes HTTP method and path from API Gateway HTTP API v2 or REST API events.
    Returns (method, path).
    """
    request_context = event.get("requestContext", {})
    http_block = request_context.get("http", {})

    method = (
        http_block.get("method")
        or event.get("httpMethod")
        or "GET"
    ).upper()

    path = (
        http_block.get("path")
        or event.get("rawPath")
        or event.get("path")
        or ""
    )

    route_key = event.get("routeKey", "")
    if route_key:
        parts = route_key.split(" ", 1)
        if len(parts) == 2:
            method = parts[0].upper()
            path = parts[1]

    return method, path


def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    """
    AWS Lambda entrypoint for 'agriconnect-users'.
    Handles:
      - OPTIONS /users/me (CORS Preflight)
      - GET /users/me (Retrieve authenticated user profile)
      - PUT /users/me (Update profile fields)
    """
    method, path = _get_route_info(event)
    logger.info(f"Received request: {method} {path}")

    # 1. Handle CORS preflight
    if method == "OPTIONS":
        return options_response()

    try:
        user_service = UserService()

        # 2. Route Dispatching
        # Match either exact routeKey 'GET /users/me' or normalized path ending with '/users/me'
        is_users_me = path.rstrip("/").endswith("/users/me") or path == "/users/me"

        if is_users_me:
            user_claims = require_authenticated_user(event)

            if method == "GET":
                profile = user_service.get_or_create_profile(user_claims)
                return success(data=profile, message="User profile retrieved successfully")

            elif method == "PUT":
                raw_body = event.get("body")
                if not raw_body:
                    raise ValidationError("Request body is required for profile update")

                try:
                    body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body
                except json.JSONDecodeError:
                    raise ValidationError("Malformed JSON payload in request body")

                if not isinstance(body, dict):
                    raise ValidationError("Request payload must be a JSON object")

                updated_profile = user_service.update_profile(user_claims.user_id, body)
                return success(data=updated_profile, message="User profile updated successfully")

            else:
                return error_response(
                    message=f"Method {method} not allowed for /users/me",
                    status_code=405,
                    error_code="METHOD_NOT_ALLOWED",
                )

        # Fallback for unrecognized routes
        return error_response(
            message=f"Route '{method} {path}' not found",
            status_code=404,
            error_code="NOT_FOUND",
        )

    except AppError as e:
        logger.warning(f"Application error processing {method} {path}: {e.error_code} - {e.message}")
        return error_response(
            message=e.message,
            status_code=e.status_code,
            error_code=e.error_code,
            details=e.details,
        )
    except Exception as e:
        logger.error(f"Unhandled server error processing {method} {path}: {str(e)}", exc_info=True)
        return error_response(
            message="An unexpected server error occurred",
            status_code=500,
            error_code="INTERNAL_SERVER_ERROR",
        )


# Alias for backward compatibility or alternate Lambda handler configurations
handler = lambda_handler
