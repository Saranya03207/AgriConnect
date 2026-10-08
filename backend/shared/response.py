import json
import os
from decimal import Decimal

# Custom JSON encoder to handle DynamoDB Decimal types
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': os.environ.get('CORS_ORIGIN', '*'),
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }

def build_response(status_code: int, body: dict = None) -> dict:
    response = {
        'statusCode': status_code,
        'headers': get_cors_headers()
    }
    if body is not None:
        response['body'] = json.dumps(body, cls=DecimalEncoder)
    return response

def success(data=None, message="Success") -> dict:
    body = {"message": message}
    if data is not None:
        body["data"] = data
    return build_response(200, body)

def created(data=None, message="Created") -> dict:
    body = {"message": message}
    if data is not None:
        body["data"] = data
    return build_response(201, body)

def bad_request(message="Bad Request") -> dict:
    return build_response(400, {"message": message})

def forbidden(message="Forbidden") -> dict:
    return build_response(403, {"message": message})

def not_found(message="Not Found") -> dict:
    return build_response(404, {"message": message})

def internal_error(message="Internal Server Error") -> dict:
    return build_response(500, {"message": message})

def options_response() -> dict:
    return build_response(200)
