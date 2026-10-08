import json
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest

from app.auth.cognito import UserClaims
from app.handlers.listings import lambda_handler
from app.models.listing import Listing, ListingCategory, ListingStatus
from app.repositories.listings_repository import ListingsRepository
from app.services.listings_service import ListingsService
from app.utils.errors import ForbiddenError, NotFoundError, ValidationError


# --- Helper Event Builders ---

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
def farmer_claims():
    return {
        "sub": "usr_farmer_001",
        "email": "farmer1@example.com",
        "custom:role": "FARMER",
        "custom:display_name": "Farmer Ramesh",
    }


@pytest.fixture
def other_user_claims():
    return {
        "sub": "usr_buyer_999",
        "email": "buyer1@example.com",
        "custom:role": "BUYER",
        "custom:display_name": "Buyer Suresh",
    }


@pytest.fixture
def sample_listing_data():
    return {
        "title": "Organic Basmati Paddy",
        "description": "High quality organic harvested paddy ready for sale",
        "category": "CROPS",
        "quantity": 100.5,
        "unit": "QUINTAL",
        "price": 3200.0,
        "currency": "INR",
        "location": "Karnal",
        "district": "Karnal",
        "state": "Haryana",
        "images": ["https://s3.amazonaws.com/listings/paddy1.jpg"],
    }


# =========================================================================
# 1. CREATE LISTING
# =========================================================================

@patch("app.services.listings_service.get_listings_repository")
def test_create_listing_success(mock_get_repo, farmer_claims, sample_listing_data):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo
    mock_repo.save.return_value = {}

    event = make_event("POST", "/listings", claims=farmer_claims, body=sample_listing_data)
    response = lambda_handler(event)

    assert response["statusCode"] == 201
    body = json.loads(response["body"])
    assert body["success"] is True
    assert body["message"] == "Listing created successfully"
    data = body["data"]

    # Verify server-generated fields
    assert data["listingId"].startswith("list_")
    assert data["sellerId"] == "usr_farmer_001"
    assert data["sellerRole"] == "FARMER"
    assert data["status"] == "ACTIVE"
    assert data["title"] == "Organic Basmati Paddy"
    assert data["category"] == "CROPS"
    assert "createdAt" in data
    assert "updatedAt" in data
    mock_repo.save.assert_called_once()


# =========================================================================
# 2. CREATE LISTING WITHOUT AUTHENTICATION
# =========================================================================

def test_create_listing_unauthenticated(sample_listing_data):
    # Event without authorizer claims
    event = make_event("POST", "/listings", claims=None, body=sample_listing_data)
    response = lambda_handler(event)

    assert response["statusCode"] == 401
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "UNAUTHORIZED"


# =========================================================================
# 3. CREATE LISTING WITH INVALID DATA
# =========================================================================

@pytest.mark.parametrize(
    "invalid_payload,expected_snippet",
    [
        ({"title": "ab", "description": "Valid desc", "category": "CROPS", "quantity": 10, "unit": "KG", "price": 100, "location": "Loc", "district": "Dist", "state": "St"}, "title"),
        ({"title": "Valid title", "description": "Valid description", "category": "INVALID_CAT", "quantity": 10, "unit": "KG", "price": 100, "location": "Loc", "district": "Dist", "state": "St"}, "Category"),
        ({"title": "Valid title", "description": "Valid desc", "category": "CROPS", "quantity": -5, "unit": "KG", "price": 100, "location": "Loc", "district": "Dist", "state": "St"}, "quantity"),
        ({"title": "Valid title", "description": "Valid desc", "category": "CROPS", "quantity": 10, "unit": "KG", "price": -50, "location": "Loc", "district": "Dist", "state": "St"}, "price"),
        ({"title": "Valid title", "description": "Valid desc", "category": "CROPS", "quantity": 10, "unit": "", "price": 100, "location": "Loc", "district": "Dist", "state": "St"}, "unit"),
    ],
)
def test_create_listing_invalid_data(farmer_claims, invalid_payload, expected_snippet):
    event = make_event("POST", "/listings", claims=farmer_claims, body=invalid_payload)
    response = lambda_handler(event)

    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert expected_snippet.lower() in body["error"]["message"].lower()


# =========================================================================
# 4. SELLER ID COMES FROM COGNITO SUB (NEVER TRUST CLIENT)
# =========================================================================

@patch("app.services.listings_service.get_listings_repository")
def test_seller_id_comes_from_cognito_sub(mock_get_repo, farmer_claims, sample_listing_data):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo
    mock_repo.save.return_value = {}

    # Malicious client tries to spoof sellerId
    tampered_data = dict(sample_listing_data)
    tampered_data["sellerId"] = "spoofed_admin_id"
    tampered_data["sellerRole"] = "ADMIN"

    event = make_event("POST", "/listings", claims=farmer_claims, body=tampered_data)
    response = lambda_handler(event)

    assert response["statusCode"] == 201
    body = json.loads(response["body"])
    data = body["data"]

    # Spoofed sellerId must be completely ignored and overridden
    assert data["sellerId"] == "usr_farmer_001"
    assert data["sellerRole"] == "FARMER"
    assert data["sellerId"] != "spoofed_admin_id"


# =========================================================================
# 5. GET ALL ACTIVE LISTINGS (WITH DEFAULT STATUS & LIMIT)
# =========================================================================

@patch("app.services.listings_service.get_listings_repository")
def test_get_all_active_listings(mock_get_repo):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo

    mock_items = [
        {
            "PK": "LISTING#list_001",
            "SK": "METADATA",
            "listingId": "list_001",
            "title": "Wheat Straw Biomass",
            "category": "BIOMASS",
            "status": "ACTIVE",
            "price": Decimal("1500"),
        },
        {
            "PK": "LISTING#list_002",
            "SK": "METADATA",
            "listingId": "list_002",
            "title": "Certified Mustard Seeds",
            "category": "SEEDS",
            "status": "ACTIVE",
            "price": Decimal("4500"),
        },
    ]
    mock_repo.query_gsi1.return_value = (mock_items, None)

    event = make_event("GET", "/listings")
    response = lambda_handler(event)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["success"] is True
    assert body["data"]["count"] == 2
    assert len(body["data"]["listings"]) == 2
    # Verify GSI1 query parameters
    mock_repo.query_gsi1.assert_called_once_with(
        gsi1_pk="MARKETPLACE",
        status="ACTIVE",
        category=None,
        state=None,
        district=None,
        seller_role=None,
        quality=None,
        search=None,
        limit=50,
        scan_index_forward=False,
        exclusive_start_key=None,
    )


# =========================================================================
# 6. GET LISTING BY ID
# =========================================================================

@patch("app.services.listings_service.get_listings_repository")
def test_get_listing_by_id(mock_get_repo):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo

    listing_record = {
        "PK": "LISTING#list_abc123",
        "SK": "METADATA",
        "listingId": "list_abc123",
        "sellerId": "usr_farmer_001",
        "title": "Cotton Bales",
        "category": "RAW_MATERIALS",
        "quantity": Decimal("50"),
        "unit": "TONNE",
        "price": Decimal("65000"),
        "status": "ACTIVE",
    }
    mock_repo.get_by_id.return_value = listing_record

    event = make_event("GET", "/listings/list_abc123", path_params={"listingId": "list_abc123"})
    response = lambda_handler(event)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["success"] is True
    assert body["data"]["listingId"] == "list_abc123"
    assert body["data"]["title"] == "Cotton Bales"
    mock_repo.get_by_id.assert_called_once_with("list_abc123")


# =========================================================================
# 7. LISTING NOT FOUND
# =========================================================================

@patch("app.services.listings_service.get_listings_repository")
def test_get_listing_not_found(mock_get_repo):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo
    mock_repo.get_by_id.return_value = None

    event = make_event("GET", "/listings/nonexistent_id", path_params={"listingId": "nonexistent_id"})
    response = lambda_handler(event)

    assert response["statusCode"] == 404
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "NOT_FOUND"
    assert "nonexistent_id" in body["error"]["message"]


# =========================================================================
# 8. UPDATE OWN LISTING
# =========================================================================

@patch("app.services.listings_service.get_listings_repository")
def test_update_own_listing_success(mock_get_repo, farmer_claims):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo

    existing = {
        "PK": "LISTING#list_001",
        "SK": "METADATA",
        "listingId": "list_001",
        "sellerId": "usr_farmer_001",  # Same as farmer_claims.sub
        "title": "Original Title",
        "price": Decimal("100"),
    }
    mock_repo.get_by_id.return_value = existing

    updated = {
        "listingId": "list_001",
        "sellerId": "usr_farmer_001",
        "title": "Updated Super Wheat",
        "price": Decimal("120"),
        "updatedAt": "2026-10-07T12:00:00Z",
    }
    mock_repo.update.return_value = updated

    updates = {"title": "Updated Super Wheat", "price": 120.0}
    event = make_event("PUT", "/listings/list_001", claims=farmer_claims, body=updates, path_params={"listingId": "list_001"})
    response = lambda_handler(event)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["success"] is True
    assert body["data"]["title"] == "Updated Super Wheat"
    mock_repo.update.assert_called_once()


# =========================================================================
# 9. UPDATE ANOTHER USER'S LISTING → 403 FORBIDDEN
# =========================================================================

@patch("app.services.listings_service.get_listings_repository")
def test_update_another_user_listing_forbidden(mock_get_repo, other_user_claims):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo

    existing = {
        "PK": "LISTING#list_001",
        "SK": "METADATA",
        "listingId": "list_001",
        "sellerId": "usr_farmer_001",  # Belongs to farmer, not other_user_claims (usr_buyer_999)
        "title": "Farmer's Listing",
    }
    mock_repo.get_by_id.return_value = existing

    updates = {"title": "Attempted Hijack"}
    event = make_event("PUT", "/listings/list_001", claims=other_user_claims, body=updates, path_params={"listingId": "list_001"})
    response = lambda_handler(event)

    assert response["statusCode"] == 403
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "FORBIDDEN"
    mock_repo.update.assert_not_called()


# =========================================================================
# 10. DELETE OWN LISTING
# =========================================================================

@patch("app.services.listings_service.get_listings_repository")
def test_delete_own_listing_success(mock_get_repo, farmer_claims):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo

    existing = {
        "PK": "LISTING#list_001",
        "SK": "METADATA",
        "listingId": "list_001",
        "sellerId": "usr_farmer_001",  # Same as claims sub
    }
    mock_repo.get_by_id.return_value = existing
    mock_repo.delete.return_value = True

    event = make_event("DELETE", "/listings/list_001", claims=farmer_claims, path_params={"listingId": "list_001"})
    response = lambda_handler(event)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["success"] is True
    assert body["message"] == "Listing deleted successfully"
    assert body["data"]["listingId"] == "list_001"
    mock_repo.delete.assert_called_once_with("list_001")


# =========================================================================
# 11. DELETE ANOTHER USER'S LISTING → 403 FORBIDDEN
# =========================================================================

@patch("app.services.listings_service.get_listings_repository")
def test_delete_another_user_listing_forbidden(mock_get_repo, other_user_claims):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo

    existing = {
        "PK": "LISTING#list_001",
        "SK": "METADATA",
        "listingId": "list_001",
        "sellerId": "usr_farmer_001",  # Owned by farmer_001, requester is buyer_999
    }
    mock_repo.get_by_id.return_value = existing

    event = make_event("DELETE", "/listings/list_001", claims=other_user_claims, path_params={"listingId": "list_001"})
    response = lambda_handler(event)

    assert response["statusCode"] == 403
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "FORBIDDEN"
    mock_repo.delete.assert_not_called()


# =========================================================================
# 12. INVALID LISTING ID / ROUTING
# =========================================================================

def test_delete_listing_unauthenticated():
    event = make_event("DELETE", "/listings/list_001", claims=None, path_params={"listingId": "list_001"})
    response = lambda_handler(event)

    assert response["statusCode"] == 401
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "UNAUTHORIZED"


def test_put_listing_unauthenticated():
    event = make_event("PUT", "/listings/list_001", claims=None, body={"title": "Updated"}, path_params={"listingId": "list_001"})
    response = lambda_handler(event)

    assert response["statusCode"] == 401
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "UNAUTHORIZED"


def test_unsupported_listing_method():
    event = make_event("PATCH", "/listings")
    response = lambda_handler(event)

    assert response["statusCode"] == 405
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "METHOD_NOT_ALLOWED"


# =========================================================================
# 13. QUERY / FILTER VALIDATION
# =========================================================================

@patch("app.services.listings_service.get_listings_repository")
def test_query_filter_parameters(mock_get_repo):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo
    mock_repo.query_gsi1.return_value = ([], None)

    filters = {
        "category": "BY_PRODUCTS",
        "district": "Pune",
        "state": "Maharashtra",
        "sellerRole": "BYPRODUCT_SELLER",
        "status": "ACTIVE",
        "limit": "25",
    }
    event = make_event("GET", "/listings", query_params=filters)
    response = lambda_handler(event)

    assert response["statusCode"] == 200
    mock_repo.query_gsi1.assert_called_once_with(
        gsi1_pk="MARKETPLACE",
        status="ACTIVE",
        category="BY_PRODUCTS",
        state="Maharashtra",
        district="Pune",
        seller_role="BYPRODUCT_SELLER",
        quality=None,
        search=None,
        limit=25,
        scan_index_forward=False,
        exclusive_start_key=None,
    )


# =========================================================================
# 14. DYNAMODB REPOSITORY BEHAVIOR
# =========================================================================

def test_repository_scan_filter_construction():
    mock_dynamo = MagicMock()
    mock_dynamo.scan.return_value = ([], None)
    repo = ListingsRepository(repo=mock_dynamo)

    repo.list_listings(
        status="ACTIVE",
        category="SEEDS",
        district="Ludhiana",
        state="Punjab",
        seller_role="SEED_PRODUCER",
        limit=20,
    )

    mock_dynamo.scan.assert_called_once()
    call_kwargs = mock_dynamo.scan.call_args[1]
    filter_expr = call_kwargs["filter_expression"]
    attr_names = call_kwargs["expression_attribute_names"]
    attr_values = call_kwargs["expression_attribute_values"]

    assert "begins_with(#pk, :pk_prefix)" in filter_expr
    assert "#sk = :sk_val" in filter_expr
    assert "#status = :status_val" in filter_expr
    assert "#category = :cat_val" in filter_expr
    assert "#district = :district_val" in filter_expr
    assert "#state = :state_val" in filter_expr
    assert "#sellerRole = :role_val" in filter_expr

    assert attr_values[":pk_prefix"] == "LISTING#"
    assert attr_values[":sk_val"] == "METADATA"
    assert attr_values[":cat_val"] == "SEEDS"
    assert attr_values[":status_val"] == "ACTIVE"


def test_repository_get_and_delete_keys():
    mock_dynamo = MagicMock()
    mock_dynamo.get_item.return_value = {"PK": "LISTING#123", "SK": "METADATA"}
    mock_dynamo.delete_item.return_value = True
    repo = ListingsRepository(repo=mock_dynamo)

    repo.get_by_id("123")
    mock_dynamo.get_item.assert_called_once_with(key={"PK": "LISTING#123", "SK": "METADATA"})

    repo.delete("123")
    mock_dynamo.delete_item.assert_called_once_with(key={"PK": "LISTING#123", "SK": "METADATA"})


# =========================================================================
# 15. ERROR HANDLING & CORS
# =========================================================================

def test_options_preflight():
    event = make_event("OPTIONS", "/listings")
    response = lambda_handler(event)
    assert response["statusCode"] == 200
    assert response["headers"]["Access-Control-Allow-Origin"] == "*"
    assert response["body"] == ""


def test_invalid_json_payload(farmer_claims):
    event = make_event("POST", "/listings", claims=farmer_claims)
    event["body"] = "not_valid_json{"
    response = lambda_handler(event)

    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


@patch("app.services.listings_service.get_listings_repository")
def test_internal_server_error_handled(mock_get_repo):
    mock_repo = MagicMock()
    mock_get_repo.return_value = mock_repo
    mock_repo.query_gsi1.side_effect = RuntimeError("Unexpected DynamoDB network drop")

    event = make_event("GET", "/listings")
    response = lambda_handler(event)

    assert response["statusCode"] == 500
    body = json.loads(response["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "INTERNAL_SERVER_ERROR"
