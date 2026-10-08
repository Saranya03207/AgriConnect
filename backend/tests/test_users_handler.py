import json
from unittest.mock import MagicMock, patch
from app.handlers.users import lambda_handler


def test_cors_options_preflight():
    event = {
        "requestContext": {
            "http": {"method": "OPTIONS", "path": "/users/me"}
        }
    }
    response = lambda_handler(event)
    assert response["statusCode"] == 200
    assert response["headers"]["Access-Control-Allow-Origin"] == "*"
    assert response["body"] == ""


def test_get_users_me_unauthorized():
    event = {
        "routeKey": "GET /users/me",
        "rawPath": "/users/me",
        "requestContext": {
            "http": {"method": "GET", "path": "/users/me"}
        }
    }
    response = lambda_handler(event)
    assert response["statusCode"] == 401
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "UNAUTHORIZED"


@patch("app.services.user_service.get_dynamodb_repository")
def test_get_users_me_existing_profile(mock_get_repo, mock_http_api_v2_event):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo

    existing_profile = {
        "PK": "USER#usr_test_farmer_123",
        "SK": "PROFILE",
        "userId": "usr_test_farmer_123",
        "email": "farmer.ramesh@example.com",
        "role": "FARMER",
        "displayName": "Ramesh Organic Farms",
        "phone": "+919876543210",
        "isActive": True,
        "isVerified": True,
        "createdAt": "2026-10-01T00:00:00Z",
        "updatedAt": "2026-10-01T00:00:00Z",
    }
    mock_repo.get_item.return_value = existing_profile

    response = lambda_handler(mock_http_api_v2_event)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["success"] is True
    assert body["data"]["userId"] == "usr_test_farmer_123"
    assert body["data"]["phone"] == "+919876543210"
    mock_repo.get_item.assert_called_once_with(
        key={"PK": "USER#usr_test_farmer_123", "SK": "PROFILE"}
    )


@patch("app.services.user_service.get_dynamodb_repository")
def test_get_users_me_new_user_auto_create(mock_get_repo, mock_http_api_v2_event):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo

    # First call returns None (user not found in DB)
    mock_repo.get_item.return_value = None
    mock_repo.put_item.return_value = {}

    response = lambda_handler(mock_http_api_v2_event)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["success"] is True
    assert body["data"]["userId"] == "usr_test_farmer_123"
    assert body["data"]["email"] == "farmer.ramesh@example.com"
    assert body["data"]["role"] == "FARMER"
    # Verify put_item was called to create the profile
    mock_repo.put_item.assert_called_once()
    saved_item = mock_repo.put_item.call_args[1]["item"]
    assert saved_item["PK"] == "USER#usr_test_farmer_123"
    assert saved_item["SK"] == "PROFILE"


@patch("app.services.user_service.get_dynamodb_repository")
def test_put_users_me_success(mock_get_repo, mock_http_api_v2_event):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo

    updated_profile = {
        "PK": "USER#usr_test_farmer_123",
        "SK": "PROFILE",
        "userId": "usr_test_farmer_123",
        "displayName": "Ramesh Updated Name",
        "phone": "+919999988888",
    }
    mock_repo.update_item.return_value = updated_profile

    # Modify event to PUT
    event = dict(mock_http_api_v2_event)
    event["routeKey"] = "PUT /users/me"
    event["requestContext"]["http"]["method"] = "PUT"
    event["body"] = json.dumps({
        "displayName": "Ramesh Updated Name",
        "phone": "+919999988888",
    })

    response = lambda_handler(event)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["success"] is True
    assert body["data"]["displayName"] == "Ramesh Updated Name"
    mock_repo.update_item.assert_called_once()


def test_put_users_me_missing_body(mock_http_api_v2_event):
    event = dict(mock_http_api_v2_event)
    event["routeKey"] = "PUT /users/me"
    event["requestContext"]["http"]["method"] = "PUT"
    event["body"] = None

    response = lambda_handler(event)
    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_put_users_me_invalid_json(mock_http_api_v2_event):
    event = dict(mock_http_api_v2_event)
    event["routeKey"] = "PUT /users/me"
    event["requestContext"]["http"]["method"] = "PUT"
    event["body"] = "{invalid_json: true"

    response = lambda_handler(event)
    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_unsupported_route(mock_http_api_v2_event):
    event = dict(mock_http_api_v2_event)
    event["routeKey"] = "GET /unknown/route"
    event["requestContext"]["http"]["method"] = "GET"
    event["requestContext"]["http"]["path"] = "/unknown/route"
    event["rawPath"] = "/unknown/route"

    response = lambda_handler(event)
    assert response["statusCode"] == 404
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "NOT_FOUND"
