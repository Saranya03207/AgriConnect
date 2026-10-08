import json
from unittest.mock import MagicMock, patch
import pytest
from botocore.exceptions import ClientError

from app.handlers.listings import lambda_handler
from app.utils.errors import AppError


def make_event(
    method: str,
    path: str,
    claims: dict = None,
    body: dict = None,
    query_params: dict = None,
    path_params: dict = None,
) -> dict:
    """Builds a standardized API Gateway HTTP API v2 event."""
    route_key = f"{method} {path}"
    event = {
        "version": "2.0",
        "routeKey": route_key,
        "rawPath": path,
        "requestContext": {
            "http": {
                "method": method,
                "path": path,
                "protocol": "HTTP/1.1",
            }
        },
    }

    if claims is not None:
        event["requestContext"]["authorizer"] = {
            "jwt": {
                "claims": claims,
                "scopes": None,
            }
        }

    if body is not None:
        event["body"] = json.dumps(body)

    if query_params:
        event["queryStringParameters"] = query_params

    if path_params:
        event["pathParameters"] = path_params

    return event


@pytest.fixture
def authenticated_claims():
    return {
        "sub": "c84138e0-40e1-705c-d7f4-d56127e7d01a",
        "email": "farmer.ramesh@example.com",
        "custom:role": "FARMER",
        "custom:display_name": "Farmer Ramesh",
    }


# =========================================================================
# PART 11 TEST 1: Authenticated upload URL request succeeds
# =========================================================================
@patch("app.services.listings_service.get_s3_service")
def test_authenticated_upload_url_request_succeeds(mock_get_s3, authenticated_claims):
    mock_s3 = MagicMock()
    mock_get_s3.return_value = mock_s3
    mock_s3.generate_presigned_upload_url.return_value = "https://agriconnect-storage-2026-001.s3.amazonaws.com/listings/presigned-put-url"

    payload = {
        "fileName": "mangoes.jpg",
        "contentType": "image/jpeg",
        "fileSize": 1048576,
    }
    event = make_event("POST", "/listings/images/upload-url", claims=authenticated_claims, body=payload)
    response = lambda_handler(event)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["success"] is True
    assert body["message"] == "Upload URL generated successfully"

    data = body["data"]
    assert "uploadUrl" in data
    assert "objectKey" in data
    assert data["uploadUrl"] == "https://agriconnect-storage-2026-001.s3.amazonaws.com/listings/presigned-put-url"
    assert data["expiresIn"] == 300
    assert data["objectKey"].startswith(f"listings/{authenticated_claims['sub']}/")
    assert data["objectKey"].endswith(".jpg")


# =========================================================================
# PART 11 TEST 2: Unauthenticated upload URL request returns 401
# =========================================================================
def test_unauthenticated_upload_url_request_returns_401():
    payload = {
        "fileName": "mangoes.jpg",
        "contentType": "image/jpeg",
    }
    event = make_event("POST", "/listings/images/upload-url", claims=None, body=payload)
    response = lambda_handler(event)

    assert response["statusCode"] == 401
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "UNAUTHORIZED"


# =========================================================================
# PART 11 TEST 3: Invalid content type rejected
# =========================================================================
@pytest.mark.parametrize(
    "invalid_type,file_name",
    [
        ("application/pdf", "document.pdf"),
        ("text/html", "index.html"),
        ("image/svg+xml", "vector.svg"),
        ("application/x-executable", "script.sh"),
        ("application/octet-stream", "binary.bin"),
        ("image/gif", "animation.gif"),
    ],
)
def test_invalid_content_type_rejected(authenticated_claims, invalid_type, file_name):
    payload = {
        "fileName": file_name,
        "contentType": invalid_type,
    }
    event = make_event("POST", "/listings/images/upload-url", claims=authenticated_claims, body=payload)
    response = lambda_handler(event)

    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "content type" in body["error"]["message"].lower() or "not supported" in body["error"]["message"].lower()


# =========================================================================
# PART 11 TEST 4: Missing filename rejected
# =========================================================================
@pytest.mark.parametrize(
    "missing_filename_payload",
    [
        {"contentType": "image/jpeg"},
        {"fileName": "", "contentType": "image/jpeg"},
        {"fileName": "   ", "contentType": "image/jpeg"},
    ],
)
def test_missing_filename_rejected(authenticated_claims, missing_filename_payload):
    event = make_event("POST", "/listings/images/upload-url", claims=authenticated_claims, body=missing_filename_payload)
    response = lambda_handler(event)

    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


# =========================================================================
# PART 11 TEST 5: Invalid filename rejected
# =========================================================================
@pytest.mark.parametrize(
    "bad_filename,content_type",
    [
        ("../../evil.jpg", "image/jpeg"),
        ("..\\windows_evil.jpg", "image/jpeg"),
        ("null\x00byte.jpg", "image/jpeg"),
        ("no_extension", "image/jpeg"),
        ("mismatch_exec.exe", "image/jpeg"),
        ("mangoes.png", "image/jpeg"),  # Extension mismatch with content type
        ("photo.jpg", "image/png"),    # Extension mismatch with content type
    ],
)
def test_invalid_filename_rejected(authenticated_claims, bad_filename, content_type):
    payload = {
        "fileName": bad_filename,
        "contentType": content_type,
    }
    event = make_event("POST", "/listings/images/upload-url", claims=authenticated_claims, body=payload)
    response = lambda_handler(event)

    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


# =========================================================================
# PART 11 TEST 6: Seller ID comes from Cognito sub (client spoofing ignored)
# =========================================================================
@patch("app.services.listings_service.get_s3_service")
def test_seller_id_comes_from_cognito_sub(mock_get_s3, authenticated_claims):
    mock_s3 = MagicMock()
    mock_get_s3.return_value = mock_s3
    mock_s3.generate_presigned_upload_url.return_value = "https://s3.amazonaws.com/put-url"

    # Malicious client attempts to inject another sellerId
    tampered_payload = {
        "fileName": "harvest.png",
        "contentType": "image/png",
        "sellerId": "attacker_fake_seller_id",
        "userId": "another_user_id",
    }
    event = make_event("POST", "/listings/images/upload-url", claims=authenticated_claims, body=tampered_payload)
    response = lambda_handler(event)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    data = body["data"]

    # Must strictly contain authenticated claims sub, NOT the spoofed sellerId
    assert authenticated_claims["sub"] in data["objectKey"]
    assert "attacker_fake_seller_id" not in data["objectKey"]


# =========================================================================
# PART 11 TEST 7: Generated S3 key belongs to the authenticated seller
# =========================================================================
@patch("app.services.listings_service.get_s3_service")
def test_generated_s3_key_belongs_to_authenticated_seller(mock_get_s3, authenticated_claims):
    mock_s3 = MagicMock()
    mock_get_s3.return_value = mock_s3
    mock_s3.generate_presigned_upload_url.return_value = "https://s3.amazonaws.com/put-url"

    payload = {
        "fileName": "field.webp",
        "contentType": "image/webp",
    }
    event = make_event("POST", "/listings/images/upload-url", claims=authenticated_claims, body=payload)
    response = lambda_handler(event)

    assert response["statusCode"] == 200
    data = json.loads(response["body"])["data"]
    object_key = data["objectKey"]

    parts = object_key.split("/")
    assert len(parts) == 3
    assert parts[0] == "listings"
    assert parts[1] == authenticated_claims["sub"]
    assert parts[2].endswith(".webp")
    # File uuid must be 32 hex chars + extension
    file_part = parts[2].replace(".webp", "")
    assert len(file_part) == 32


# =========================================================================
# PART 11 TEST 8: Presigned URL is generated with correct parameters
# =========================================================================
@patch("app.services.listings_service.get_s3_service")
def test_presigned_url_is_generated_with_correct_parameters(mock_get_s3, authenticated_claims):
    mock_s3 = MagicMock()
    mock_get_s3.return_value = mock_s3
    mock_s3.generate_presigned_upload_url.return_value = "https://s3.amazonaws.com/upload-target"

    payload = {
        "fileName": "crop.jpg",
        "contentType": "image/jpeg",
    }
    event = make_event("POST", "/listings/images/upload-url", claims=authenticated_claims, body=payload)
    response = lambda_handler(event)

    assert response["statusCode"] == 200
    mock_s3.generate_presigned_upload_url.assert_called_once()
    call_kwargs = mock_s3.generate_presigned_upload_url.call_args.kwargs
    assert call_kwargs["key"].startswith(f"listings/{authenticated_claims['sub']}/")
    assert call_kwargs["content_type"] == "image/jpeg"
    assert call_kwargs["expiration"] == 300


# =========================================================================
# PART 11 TEST 9: Unexpected S3 errors return controlled 500 response
# =========================================================================
@patch("app.services.listings_service.get_s3_service")
def test_unexpected_s3_error_returns_controlled_500(mock_get_s3, authenticated_claims):
    mock_s3 = MagicMock()
    mock_get_s3.return_value = mock_s3
    mock_s3.generate_presigned_upload_url.side_effect = AppError("Failed to generate presigned upload URL: Service Unavailable", status_code=500)

    payload = {
        "fileName": "crop.jpg",
        "contentType": "image/jpeg",
    }
    event = make_event("POST", "/listings/images/upload-url", claims=authenticated_claims, body=payload)
    response = lambda_handler(event)

    assert response["statusCode"] == 500
    body = json.loads(response["body"])
    assert body["success"] is False
    assert "error" in body
    assert "Service Unavailable" in body["error"]["message"]


# =========================================================================
# ADDITIONAL TEST: CORS preflight for upload URL
# =========================================================================
def test_cors_preflight_for_upload_url():
    event = make_event("OPTIONS", "/listings/images/upload-url")
    response = lambda_handler(event)

    assert response["statusCode"] == 200
    assert response["headers"]["Access-Control-Allow-Origin"] == "*"
    assert "POST" in response["headers"]["Access-Control-Allow-Methods"]


# =========================================================================
# ADDITIONAL TEST: Reject blob: and fake URLs in listing creation
# =========================================================================
def test_create_listing_rejects_blob_urls(authenticated_claims):
    payload = {
        "title": "Organic Tomatoes",
        "description": "Fresh farm harvested tomatoes ready for wholesale dispatch",
        "category": "CROPS",
        "quantity": 50,
        "unit": "KG",
        "price": 25,
        "location": "Madanapalle",
        "district": "Annamayya",
        "state": "Andhra Pradesh",
        "images": ["blob:http://localhost:5173/1234-5678-9012"],
    }
    event = make_event("POST", "/listings", claims=authenticated_claims, body=payload)
    response = lambda_handler(event)

    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["success"] is False
    assert "blob:" in body["error"]["message"].lower() or "not allowed" in body["error"]["message"].lower()


# =========================================================================
# ADDITIONAL TEST: Reject more than 5 images in listing creation
# =========================================================================
def test_create_listing_rejects_more_than_five_images(authenticated_claims):
    payload = {
        "title": "Organic Tomatoes",
        "description": "Fresh farm harvested tomatoes ready for wholesale dispatch",
        "category": "CROPS",
        "quantity": 50,
        "unit": "KG",
        "price": 25,
        "location": "Madanapalle",
        "district": "Annamayya",
        "state": "Andhra Pradesh",
        "images": [f"listings/user/img_{i}.jpg" for i in range(6)],
    }
    event = make_event("POST", "/listings", claims=authenticated_claims, body=payload)
    response = lambda_handler(event)

    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["success"] is False
    assert "5" in body["error"]["message"]


# =========================================================================
# ADDITIONAL TEST: Enriches listing GET with presigned download URLs
# =========================================================================
@patch("app.services.listings_service.get_s3_service")
@patch("app.services.listings_service.get_listings_repository")
def test_listing_get_enriches_images_with_presigned_download_urls(mock_get_repo, mock_get_s3):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo
    mock_s3 = MagicMock()
    mock_get_s3.return_value = mock_s3

    mock_s3.generate_presigned_download_url.return_value = "https://agriconnect-storage-2026-001.s3.amazonaws.com/listings/presigned-get-url"

    stored_item = {
        "PK": "LISTING#list_img_test",
        "SK": "METADATA",
        "listingId": "list_img_test",
        "sellerId": "usr_123",
        "title": "Fresh Apples",
        "category": "CROPS",
        "quantity": 100,
        "unit": "BOX",
        "price": 1200,
        "status": "ACTIVE",
        "images": ["listings/usr_123/photo1.jpg"],
    }
    mock_repo.get_by_id.return_value = stored_item

    event = make_event("GET", "/listings/list_img_test", path_params={"listingId": "list_img_test"})
    response = lambda_handler(event)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    data = body["data"]

    # Verify display URLs
    assert data["images"] == ["https://agriconnect-storage-2026-001.s3.amazonaws.com/listings/presigned-get-url"]
    assert data["imageUrls"] == ["https://agriconnect-storage-2026-001.s3.amazonaws.com/listings/presigned-get-url"]
    # Verify raw keys
    assert data["imageKeys"] == ["listings/usr_123/photo1.jpg"]
    # Verify imageDetails
    assert data["imageDetails"][0]["key"] == "listings/usr_123/photo1.jpg"
    assert data["imageDetails"][0]["url"] == "https://agriconnect-storage-2026-001.s3.amazonaws.com/listings/presigned-get-url"
