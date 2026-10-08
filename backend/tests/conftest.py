import os
import sys
import pytest

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Mock AWS credentials and environment variables before any boto3 import
os.environ["AWS_ACCESS_KEY_ID"] = "testing-mock-access-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing-mock-secret-key"
os.environ["AWS_SECURITY_TOKEN"] = "testing-mock-token"
os.environ["AWS_SESSION_TOKEN"] = "testing-mock-session"
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
os.environ["AWS_REGION"] = "us-east-1"
os.environ["TABLE_NAME"] = "AgriConnect-Main"
os.environ["S3_BUCKET"] = "agriconnect-storage-2026-001"
os.environ["CORS_ORIGIN"] = "*"


@pytest.fixture
def mock_jwt_claims():
    """Returns sample Cognito JWT claims for a Farmer user."""
    return {
        "sub": "usr_test_farmer_123",
        "email": "farmer.ramesh@example.com",
        "email_verified": "true",
        "custom:role": "FARMER",
        "custom:display_name": "Ramesh Organic Farms",
    }


@pytest.fixture
def mock_http_api_v2_event(mock_jwt_claims):
    """Returns an API Gateway HTTP API v2 event matching GET /users/me."""
    return {
        "version": "2.0",
        "routeKey": "GET /users/me",
        "rawPath": "/users/me",
        "requestContext": {
            "http": {
                "method": "GET",
                "path": "/users/me",
                "protocol": "HTTP/1.1",
            },
            "authorizer": {
                "jwt": {
                    "claims": mock_jwt_claims,
                    "scopes": None,
                }
            },
        },
    }
