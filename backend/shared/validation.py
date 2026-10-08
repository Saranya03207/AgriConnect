import json
from typing import Dict, Any, List, Tuple, Optional

def parse_and_validate_body(
    event: Dict[str, Any],
    required_fields: Optional[List[str]] = None
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Parses request body as JSON and validates required fields.
    Returns (parsed_dict, None) on success or (None, error_message) on failure.
    """
    body_raw = event.get('body')
    if not body_raw:
        if required_fields:
            return None, "Request body is empty"
        return {}, None
        
    try:
        data = json.loads(body_raw)
        if not isinstance(data, dict):
            return None, "Request body must be a valid JSON object"
    except (json.JSONDecodeError, TypeError):
        return None, "Malformed JSON body"
        
    if required_fields:
        missing = [field for field in required_fields if field not in data or data[field] is None or data[field] == '']
        if missing:
            return None, f"Missing required fields: {', '.join(missing)}"
            
    return data, None

def get_query_param(event: Dict[str, Any], key: str, default: Optional[str] = None) -> Optional[str]:
    """
    Safely retrieves a query string parameter from HTTP API v2 event.
    """
    query_params = event.get('queryStringParameters') or {}
    return query_params.get(key, default)

def get_path_param(event: Dict[str, Any], key: str) -> Optional[str]:
    """
    Safely retrieves a path parameter from HTTP API v2 event.
    """
    path_params = event.get('pathParameters') or {}
    return path_params.get(key)
