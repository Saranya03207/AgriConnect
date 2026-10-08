import json
from typing import Any, Dict, Optional, Tuple
from app.auth.cognito import require_authenticated_user
from app.services.procurement_service import ProcurementService, get_procurement_service
from app.utils.errors import AppError, NotFoundError, ValidationError
from app.utils.logging import get_logger
from app.utils.response import created, error_response, options_response, success

logger = get_logger("procurement-handler")


def _get_route_info(event: Dict[str, Any]) -> Tuple[str, str]:
    """
    Normalizes HTTP method and path from API Gateway HTTP API v2 or REST API events.
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
            if not path:
                path = parts[1]

    return method, path


def _parse_body(event: Dict[str, Any]) -> Dict[str, Any]:
    """Parses JSON request body."""
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
    AWS Lambda entrypoint for 'agriconnect-procurement'.
    Handles:
      - OPTIONS /procurement/* (CORS Preflight)
      - POST /procurement/requests (Create RFQ)
      - GET /procurement/requests (Browse RFQs)
      - GET /procurement/my-requests (Buyer's own RFQs)
      - GET /procurement/my-responses (Seller's own quotations)
      - GET /procurement/requests/{rfqId} (Get single RFQ)
      - PUT /procurement/requests/{rfqId} (Update RFQ)
      - POST /procurement/requests/{rfqId}/cancel (Cancel RFQ)
      - POST /procurement/requests/{rfqId}/responses (Submit quotation)
      - GET /procurement/requests/{rfqId}/responses (Get all quotations for RFQ)
      - POST /procurement/responses/{responseId}/withdraw (Withdraw quotation)
      - POST /procurement/responses/{responseId}/accept (Accept quotation)
    """
    method, path = _get_route_info(event)
    logger.info(f"Received procurement request: {method} {path}")

    # 1. CORS Preflight
    if method == "OPTIONS":
        return options_response()

    service = get_procurement_service()

    try:
        # Normalize path parts
        path_segments = [p.strip() for p in path.strip("/").split("/") if p.strip()]
        path_params = event.get("pathParameters") or {}
        query_params = event.get("queryStringParameters") or {}

        # ---------------------------------------------------------------------
        # 1. /procurement/my-requests
        # ---------------------------------------------------------------------
        if len(path_segments) >= 2 and path_segments[0] == "procurement" and path_segments[1] == "my-requests":
            if method == "GET":
                user = require_authenticated_user(event)
                result = service.list_my_rfqs(user_claims=user, params=query_params)
                return success(data=result, message="User procurement requests retrieved successfully")

        # ---------------------------------------------------------------------
        # 2. /procurement/my-responses
        # ---------------------------------------------------------------------
        if len(path_segments) >= 2 and path_segments[0] == "procurement" and path_segments[1] == "my-responses":
            if method == "GET":
                user = require_authenticated_user(event)
                result = service.list_my_responses(user_claims=user, params=query_params)
                return success(data=result, message="User quotations retrieved successfully")

        # ---------------------------------------------------------------------
        # 3. /procurement/responses/{responseId}/withdraw & /accept
        # ---------------------------------------------------------------------
        if len(path_segments) >= 3 and path_segments[0] == "procurement" and path_segments[1] == "responses":
            response_id = path_params.get("responseId") or path_segments[2]
            action = path_segments[3].lower() if len(path_segments) > 3 else ""

            if action == "withdraw" and method == "POST":
                user = require_authenticated_user(event)
                result = service.withdraw_response(user_claims=user, response_id=response_id)
                return success(data=result, message="Quotation withdrawn successfully")

            if action == "accept" and method == "POST":
                user = require_authenticated_user(event)
                result = service.accept_response(user_claims=user, response_id=response_id)
                return success(data=result, message="Quotation accepted successfully")

        # ---------------------------------------------------------------------
        # 4. /procurement/requests & /procurement/requests/{rfqId}/*
        # ---------------------------------------------------------------------
        if len(path_segments) >= 2 and path_segments[0] == "procurement" and path_segments[1] == "requests":
            # 4a. Base /procurement/requests
            if len(path_segments) == 2:
                if method == "GET":
                    user = require_authenticated_user(event)
                    result = service.list_rfqs(user_claims=user, params=query_params)
                    return success(data=result, message="Procurement requests retrieved successfully")

                if method == "POST":
                    user = require_authenticated_user(event)
                    payload = _parse_body(event)
                    result = service.create_rfq(user_claims=user, payload=payload)
                    return created(data=result, message="Procurement request created successfully")

            # 4b. Subpaths under /procurement/requests/{rfqId}
            if len(path_segments) >= 3:
                rfq_id = path_params.get("rfqId") or path_segments[2]
                sub_action = path_segments[3].lower() if len(path_segments) > 3 else ""

                if sub_action == "cancel" and method == "POST":
                    user = require_authenticated_user(event)
                    result = service.cancel_rfq(user_claims=user, rfq_id=rfq_id)
                    return success(data=result, message="Procurement request cancelled successfully")

                if sub_action == "responses":
                    if method == "POST":
                        user = require_authenticated_user(event)
                        payload = _parse_body(event)
                        result = service.create_response(user_claims=user, rfq_id=rfq_id, payload=payload)
                        return created(data=result, message="Quotation submitted successfully")

                    if method == "GET":
                        user = require_authenticated_user(event)
                        result = service.list_rfq_responses(user_claims=user, rfq_id=rfq_id)
                        return success(data=result, message="Quotation responses retrieved successfully")

                if not sub_action:
                    if method == "GET":
                        user = require_authenticated_user(event)
                        result = service.get_rfq(user_claims=user, rfq_id=rfq_id)
                        return success(data=result, message="Procurement request details retrieved successfully")

                    if method == "PUT":
                        user = require_authenticated_user(event)
                        payload = _parse_body(event)
                        result = service.update_rfq(user_claims=user, rfq_id=rfq_id, payload=payload)
                        return success(data=result, message="Procurement request updated successfully")

        # Unknown route
        logger.warning(f"Route not found: {method} {path}")
        return error_response(
            message=f"Route '{method} {path}' not found",
            status_code=404,
            error_code="NOT_FOUND",
        )

    except AppError as e:
        logger.warning(f"Business logic error in procurement handler: {e.message}")
        return error_response(
            message=e.message,
            status_code=e.status_code,
            error_code=e.error_code,
            details=e.details,
        )
    except Exception as e:
        logger.error(f"Unhandled exception in procurement handler: {str(e)}", exc_info=True)
        return error_response(
            message="Internal server error occurred",
            status_code=500,
            error_code="INTERNAL_SERVER_ERROR",
        )


handler = lambda_handler
