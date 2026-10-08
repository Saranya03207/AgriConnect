import json
from typing import Any, Dict, Optional, Tuple
from app.auth.cognito import require_authenticated_user
from app.services.listings_service import ListingsService
from app.utils.errors import AppError, ValidationError
from app.utils.logging import get_logger
from app.utils.response import created, error_response, options_response, success

logger = get_logger("listings-handler")


def _get_route_info(event: Dict[str, Any]) -> Tuple[str, str]:
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
            # If path was empty, use route_key path
            if not path:
                path = parts[1]

    return method, path


def _extract_listing_id(event: Dict[str, Any], path: str) -> Optional[str]:
    """
    Extracts listingId from pathParameters or the raw URL path.
    """
    path_parameters = event.get("pathParameters") or {}
    if "listingId" in path_parameters and path_parameters["listingId"]:
        return path_parameters["listingId"].strip()

    parts = [p for p in path.strip("/").split("/") if p]
    if "listings" in parts:
        idx = parts.index("listings")
        if idx + 1 < len(parts):
            val = parts[idx + 1].strip()
            # Do not treat subroutes (such as /listings/images/...) as listingId
            if val.lower() == "images":
                return None
            # If template parameter '{listingId}' was not substituted, ignore
            if val and not val.startswith("{"):
                return val

    return None


def _parse_body(event: Dict[str, Any]) -> Dict[str, Any]:
    """Parses and validates JSON request payload."""
    raw_body = event.get("body")
    if not raw_body:
        raise ValidationError("Request body is required")
    if isinstance(raw_body, dict):
        return raw_body
    if isinstance(raw_body, str):
        try:
            parsed = json.loads(raw_body)
            if not isinstance(parsed, dict):
                raise ValidationError("Request payload must be a JSON object")
            return parsed
        except json.JSONDecodeError:
            raise ValidationError("Malformed JSON payload in request body")
    raise ValidationError("Invalid request body format")


def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    """
    AWS Lambda entrypoint for 'agriconnect-listings'.
    Handles:
      - OPTIONS /listings & /listings/{listingId} & /listings/images/upload-url (CORS Preflight)
      - POST /listings/images/upload-url (Generate S3 presigned PUT URL - authenticated)
      - GET /listings (List active listings with filters)
      - GET /listings/{listingId} (Get single listing)
      - POST /listings (Create new listing - authenticated)
      - PUT /listings/{listingId} (Update own listing - authenticated)
      - DELETE /listings/{listingId} (Delete own listing - authenticated)
    """
    method, path = _get_route_info(event)
    logger.info(f"Received listings request: {method} {path}")

    # 1. Handle CORS preflight
    if method == "OPTIONS":
        return options_response()

    try:
        listings_service = ListingsService()
        query_params = event.get("queryStringParameters") or {}

        # 2. Check S3 Presigned Upload URL route: POST /listings/images/upload-url
        is_upload_url = (
            path.rstrip("/").endswith("/listings/images/upload-url")
            or event.get("routeKey", "") == "POST /listings/images/upload-url"
        )
        if is_upload_url:
            if method == "POST":
                user = require_authenticated_user(event)
                body = _parse_body(event)
                result = listings_service.generate_image_upload_url(user, body)
                return success(data=result, message="Upload URL generated successfully")
            else:
                return error_response(
                    message=f"Method {method} not allowed for /listings/images/upload-url",
                    status_code=405,
                    error_code="METHOD_NOT_ALLOWED",
                )

        # 3. Route Dispatching
        listing_id = _extract_listing_id(event, path)
        # Single item routes: /listings/{listingId}
        if listing_id:

            if method == "GET":
                listing = listings_service.get_listing_by_id(listing_id)
                return success(data=listing, message="Listing retrieved successfully")

            elif method == "PUT":
                user = require_authenticated_user(event)
                body = _parse_body(event)
                updated_listing = listings_service.update_listing(listing_id, user, body)
                return success(data=updated_listing, message="Listing updated successfully")

            elif method == "DELETE":
                user = require_authenticated_user(event)
                listings_service.delete_listing(listing_id, user)
                return success(data={"listingId": listing_id}, message="Listing deleted successfully")

            else:
                return error_response(
                    message=f"Method {method} not allowed for /listings/{listing_id}",
                    status_code=405,
                    error_code="METHOD_NOT_ALLOWED",
                )

        # Collection routes: /listings
        is_listings_collection = path.rstrip("/").endswith("/listings") or path == "/listings"
        if is_listings_collection or event.get("routeKey", "").endswith("/listings"):
            if method == "GET":
                result = listings_service.list_listings(query_params)
                return success(data=result, message="Listings retrieved successfully")

            elif method == "POST":
                user = require_authenticated_user(event)
                body = _parse_body(event)
                created_listing = listings_service.create_listing(user, body)
                return created(data=created_listing, message="Listing created successfully")

            else:
                return error_response(
                    message=f"Method {method} not allowed for /listings",
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
