import json
from decimal import Decimal
from typing import Any, Dict, Optional
from app.config.settings import get_settings


class DecimalEncoder(json.JSONEncoder):
    """Encodes Python Decimal objects (returned by boto3 DynamoDB) into JSON int or float."""

    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super().default(obj)


def get_cors_headers() -> Dict[str, str]:
    """Generates standard CORS headers using configured CORS_ORIGIN."""
    settings = get_settings()
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": settings.cors_origin,
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    }


def build_response(status_code: int, body: Any = None, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Constructs an API Gateway HTTP API v2 / REST compatible response payload.
    """
    response_headers = get_cors_headers()
    if headers:
        response_headers.update(headers)

    response: Dict[str, Any] = {
        "statusCode": status_code,
        "headers": response_headers,
    }

    if body is not None:
        if isinstance(body, (dict, list)):
            response["body"] = json.dumps(body, cls=DecimalEncoder)
        elif isinstance(body, str):
            response["body"] = body
        else:
            response["body"] = json.dumps(body, cls=DecimalEncoder)
    else:
        response["body"] = json.dumps({"statusCode": status_code})

    return response


def success(data: Any = None, message: str = "Success", status_code: int = 200, meta: Optional[Dict] = None) -> Dict[str, Any]:
    """Standard success response payload."""
    payload: Dict[str, Any] = {
        "success": True,
        "message": message,
    }
    if data is not None:
        payload["data"] = data
    if meta is not None:
        payload["meta"] = meta

    return build_response(status_code, payload)


def created(data: Any = None, message: str = "Created", meta: Optional[Dict] = None) -> Dict[str, Any]:
    """Standard HTTP 201 Created response."""
    return success(data=data, message=message, status_code=201, meta=meta)


def error_response(
    message: str = "An error occurred",
    status_code: int = 500,
    error_code: str = "INTERNAL_ERROR",
    details: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Standard error response payload."""
    payload: Dict[str, Any] = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
        }
    }
    if details:
        payload["error"]["details"] = details

    return build_response(status_code, payload)


def options_response() -> Dict[str, Any]:
    """Standard HTTP 200/204 response for CORS preflight OPTIONS requests."""
    return {
        "statusCode": 200,
        "headers": get_cors_headers(),
        "body": "",
    }
