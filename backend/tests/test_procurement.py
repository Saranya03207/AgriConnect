import json
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest

from app.auth.cognito import UserClaims
from app.handlers.procurement import lambda_handler
from app.models.rfq import RFQ, RFQResponse, RFQResponseStatus, RFQStatus
from app.repositories.procurement_repository import ProcurementRepository
from app.services.procurement_service import ProcurementService
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
def buyer_claims():
    return {
        "sub": "usr_buyer_111",
        "email": "buyer.agri@example.com",
        "custom:role": "BUYER",
        "custom:display_name": "Agri Global Buyer",
    }


@pytest.fixture
def processor_claims():
    return {
        "sub": "usr_processor_222",
        "email": "processor.mills@example.com",
        "custom:role": "PROCESSOR",
        "custom:display_name": "Rice Processing Mill",
    }


@pytest.fixture
def seller_claims():
    return {
        "sub": "usr_farmer_333",
        "email": "farmer.ramesh@example.com",
        "custom:role": "FARMER",
        "custom:display_name": "Ramesh Organic Farms",
    }


@pytest.fixture
def other_seller_claims():
    return {
        "sub": "usr_seller_444",
        "email": "seller.suresh@example.com",
        "custom:role": "BYPRODUCT_SELLER",
        "custom:display_name": "Suresh Biomass Supplies",
    }


@pytest.fixture
def admin_claims():
    return {
        "sub": "usr_admin_999",
        "email": "admin@agriconnect.in",
        "custom:role": "ADMIN",
        "custom:display_name": "System Admin",
    }


@pytest.fixture
def sample_rfq_payload():
    return {
        "title": "Need 5 tonnes of rice husk",
        "description": "Looking for clean rice husk for industrial biomass processing",
        "productCategory": "BY_PRODUCTS",
        "productName": "Rice Husk",
        "subcategory": "Biomass",
        "quantity": 5.0,
        "unit": "TONNE",
        "preferredLocation": "Coimbatore",
        "preferredDistrict": "Coimbatore",
        "preferredState": "Tamil Nadu",
        "requiredByDate": "2026-11-01",
        "targetPrice": 8000.0,
        "currency": "INR",
        "qualityRequirements": "Clean and dry",
        "additionalRequirements": "Supplier should arrange transport",
    }


@pytest.fixture
def sample_response_payload():
    return {
        "proposedQuantity": 5.0,
        "unit": "TONNE",
        "unitPrice": 7800.0,
        "currency": "INR",
        "availableDate": "2026-10-25",
        "remarks": "Clean dry rice husk, transport available",
    }


# =============================================================================
# 1. RFQ Creation Tests
# =============================================================================

def test_create_rfq_valid(buyer_claims, sample_rfq_payload):
    event = make_event("POST", "/procurement/requests", claims=buyer_claims, body=sample_rfq_payload)
    with patch("app.handlers.procurement.get_procurement_service") as mock_get_svc:
        mock_svc = MagicMock()
        mock_get_svc.return_value = mock_svc
        mock_svc.create_rfq.return_value = {
            "rfqId": "rfq_12345",
            "buyerId": "usr_buyer_111",
            "buyerRole": "BUYER",
            "title": sample_rfq_payload["title"],
            "status": "OPEN",
            "createdAt": "2026-10-08T10:00:00Z",
            "updatedAt": "2026-10-08T10:00:00Z",
        }

        resp = lambda_handler(event)
        assert resp["statusCode"] == 201
        body = json.loads(resp["body"])
        assert body["success"] is True
        assert body["data"]["rfqId"] == "rfq_12345"
        assert body["data"]["status"] == "OPEN"
        mock_svc.create_rfq.assert_called_once()


def test_create_rfq_unauthenticated(sample_rfq_payload):
    event = make_event("POST", "/procurement/requests", claims=None, body=sample_rfq_payload)
    resp = lambda_handler(event)
    assert resp["statusCode"] == 401
    body = json.loads(resp["body"])
    assert body["success"] is False
    assert "token is missing" in body["error"]["message"].lower()


def test_create_rfq_unauthorized_role(seller_claims, sample_rfq_payload):
    # A standard FARMER cannot create an RFQ; only BUYER, PROCESSOR, ADMIN can
    svc = ProcurementService(repo=MagicMock())
    claims = UserClaims(
        user_id="usr_farmer_333",
        email="farmer@test.com",
        role="FARMER",
        display_name="Farmer",
    )
    with pytest.raises(ForbiddenError):
        svc.create_rfq(claims, sample_rfq_payload)


def test_create_rfq_missing_required_fields(buyer_claims):
    # Missing productName, quantity, etc.
    event = make_event("POST", "/procurement/requests", claims=buyer_claims, body={"title": "Short"})
    resp = lambda_handler(event)
    assert resp["statusCode"] == 400
    body = json.loads(resp["body"])
    assert body["success"] is False
    assert "invalid" in body["error"]["message"].lower()


def test_create_rfq_invalid_quantity(buyer_claims, sample_rfq_payload):
    sample_rfq_payload["quantity"] = 0  # Must be > 0
    event = make_event("POST", "/procurement/requests", claims=buyer_claims, body=sample_rfq_payload)
    resp = lambda_handler(event)
    assert resp["statusCode"] == 400
    body = json.loads(resp["body"])
    assert body["success"] is False


def test_create_rfq_invalid_target_price(buyer_claims, sample_rfq_payload):
    sample_rfq_payload["targetPrice"] = -100  # Must be >= 0
    event = make_event("POST", "/procurement/requests", claims=buyer_claims, body=sample_rfq_payload)
    resp = lambda_handler(event)
    assert resp["statusCode"] == 400


def test_create_rfq_client_supplied_fields_ignored(buyer_claims, sample_rfq_payload):
    # Attacker tries to inject buyerId, status, and internal keys
    sample_rfq_payload["buyerId"] = "hacked_buyer"
    sample_rfq_payload["status"] = "FULFILLED"
    sample_rfq_payload["PK"] = "MALICIOUS"
    sample_rfq_payload["SK"] = "MALICIOUS"

    mock_repo = MagicMock()
    svc = ProcurementService(repo=mock_repo)
    claims = UserClaims(
        user_id="usr_buyer_111",
        email=buyer_claims["email"],
        role=buyer_claims["custom:role"],
        display_name="Buyer",
    )

    result = svc.create_rfq(claims, sample_rfq_payload)
    # Must use claims.user_id and OPEN status
    assert result["buyerId"] == "usr_buyer_111"
    assert result["status"] == "OPEN"
    assert "PK" not in result
    assert "SK" not in result

    # Check repository call
    saved_rfq = mock_repo.save_rfq.call_args[0][0]
    assert saved_rfq.buyer_id == "usr_buyer_111"
    assert saved_rfq.status == "OPEN"


# =============================================================================
# 2. RFQ Retrieval Tests
# =============================================================================

def test_get_rfq_existing_owner_sees_responses(buyer_claims):
    rfq_id = "rfq_001"
    event = make_event("GET", f"/procurement/requests/{rfq_id}", claims=buyer_claims, path_params={"rfqId": rfq_id})

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": buyer_claims["sub"],
        "buyerRole": "BUYER",
        "title": "Need Rice Husk",
        "status": "OPEN",
        "quantity": Decimal("5"),
        "unit": "TONNE",
        "preferredDistrict": "Coimbatore",
        "preferredState": "Tamil Nadu",
        "requiredByDate": "2026-11-01",
        "currency": "INR",
        "createdAt": "2026-10-08T10:00:00Z",
        "updatedAt": "2026-10-08T10:00:00Z",
    }
    mock_repo.list_responses_for_rfq.return_value = [
        {
            "PK": f"RFQ#{rfq_id}",
            "SK": "RESPONSE#2026-10-08T11:00:00Z#rfqr_01",
            "responseId": "rfqr_01",
            "rfqId": rfq_id,
            "sellerId": "usr_farmer_333",
            "proposedQuantity": Decimal("5"),
            "unit": "TONNE",
            "unitPrice": Decimal("7800"),
            "currency": "INR",
            "availableDate": "2026-10-25",
            "status": "SUBMITTED",
            "createdAt": "2026-10-08T11:00:00Z",
            "updatedAt": "2026-10-08T11:00:00Z",
        }
    ]

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body["success"] is True
        assert body["data"]["rfqId"] == rfq_id
        # Owner CAN see responses
        assert "responses" in body["data"]
        assert len(body["data"]["responses"]) == 1
        assert body["data"]["responses"][0]["responseId"] == "rfqr_01"
        # No internal persistence keys
        assert "PK" not in body["data"]
        assert "SK" not in body["data"]["responses"][0]


def test_get_rfq_seller_does_not_see_all_responses(seller_claims):
    rfq_id = "rfq_001"
    event = make_event("GET", f"/procurement/requests/{rfq_id}", claims=seller_claims, path_params={"rfqId": rfq_id})

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": "usr_buyer_111",  # Different buyer!
        "buyerRole": "BUYER",
        "title": "Need Rice Husk",
        "status": "OPEN",
        "quantity": Decimal("5"),
        "unit": "TONNE",
        "preferredDistrict": "Coimbatore",
        "preferredState": "Tamil Nadu",
        "requiredByDate": "2026-11-01",
        "currency": "INR",
        "createdAt": "2026-10-08T10:00:00Z",
        "updatedAt": "2026-10-08T10:00:00Z",
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body["success"] is True
        # Seller does NOT see responses list
        assert body["data"].get("responses") is None


def test_get_rfq_nonexistent(buyer_claims):
    rfq_id = "rfq_missing"
    event = make_event("GET", f"/procurement/requests/{rfq_id}", claims=buyer_claims, path_params={"rfqId": rfq_id})

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = None

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 404


# =============================================================================
# 3. RFQ Update Tests
# =============================================================================

def test_update_rfq_owner_success(buyer_claims):
    rfq_id = "rfq_001"
    event = make_event(
        "PUT",
        f"/procurement/requests/{rfq_id}",
        claims=buyer_claims,
        body={"title": "Updated Title", "quantity": 10.0},
        path_params={"rfqId": rfq_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": buyer_claims["sub"],
        "status": "OPEN",
        "createdAt": "2026-10-08T10:00:00Z",
    }
    mock_repo.update_rfq.return_value = {
        "title": "Updated Title",
        "quantity": Decimal("10"),
        "updatedAt": "2026-10-08T12:00:00Z",
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body["success"] is True
        assert body["data"]["title"] == "Updated Title"
        mock_repo.update_rfq.assert_called_once()


def test_update_rfq_non_owner_forbidden(seller_claims):
    rfq_id = "rfq_001"
    event = make_event(
        "PUT",
        f"/procurement/requests/{rfq_id}",
        claims=seller_claims,
        body={"title": "Hacked Title"},
        path_params={"rfqId": rfq_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": "usr_buyer_111",  # Not seller
        "status": "OPEN",
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 403


def test_update_rfq_closed_rejected(buyer_claims):
    rfq_id = "rfq_001"
    event = make_event(
        "PUT",
        f"/procurement/requests/{rfq_id}",
        claims=buyer_claims,
        body={"title": "New Title"},
        path_params={"rfqId": rfq_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": buyer_claims["sub"],
        "status": "CLOSED",
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert "only open requests can be updated" in body["error"]["message"].lower()


# =============================================================================
# 4. RFQ Cancellation Tests
# =============================================================================

def test_cancel_rfq_owner_success(buyer_claims):
    rfq_id = "rfq_001"
    event = make_event(
        "POST",
        f"/procurement/requests/{rfq_id}/cancel",
        claims=buyer_claims,
        path_params={"rfqId": rfq_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": buyer_claims["sub"],
        "status": "OPEN",
        "createdAt": "2026-10-08T10:00:00Z",
    }
    mock_repo.update_rfq.return_value = {
        "status": "CANCELLED",
        "updatedAt": "2026-10-08T12:00:00Z",
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body["data"]["status"] == "CANCELLED"


def test_cancel_rfq_non_owner_forbidden(seller_claims):
    rfq_id = "rfq_001"
    event = make_event(
        "POST",
        f"/procurement/requests/{rfq_id}/cancel",
        claims=seller_claims,
        path_params={"rfqId": rfq_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": "usr_buyer_111",
        "status": "OPEN",
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 403


def test_cancel_rfq_already_cancelled_rejected(buyer_claims):
    rfq_id = "rfq_001"
    event = make_event(
        "POST",
        f"/procurement/requests/{rfq_id}/cancel",
        claims=buyer_claims,
        path_params={"rfqId": rfq_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": buyer_claims["sub"],
        "status": "CANCELLED",
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert "only open requests can be cancelled" in body["error"]["message"].lower()


# =============================================================================
# 5. Response Creation (Quotation Submission) Tests
# =============================================================================

def test_submit_quotation_valid(seller_claims, sample_response_payload):
    rfq_id = "rfq_001"
    event = make_event(
        "POST",
        f"/procurement/requests/{rfq_id}/responses",
        claims=seller_claims,
        body=sample_response_payload,
        path_params={"rfqId": rfq_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": "usr_buyer_111",
        "status": "OPEN",
    }
    mock_repo.list_responses_for_rfq.return_value = []  # No existing responses

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 201
        body = json.loads(resp["body"])
        assert body["success"] is True
        assert body["data"]["sellerId"] == seller_claims["sub"]
        assert body["data"]["status"] == "SUBMITTED"
        assert body["data"]["unitPrice"] == 7800.0
        # No internal persistence keys
        assert "PK" not in body["data"]
        assert "SK" not in body["data"]
        mock_repo.save_response.assert_called_once()


def test_submit_quotation_owner_cannot_respond(buyer_claims, sample_response_payload):
    rfq_id = "rfq_001"
    event = make_event(
        "POST",
        f"/procurement/requests/{rfq_id}/responses",
        claims=buyer_claims,
        body=sample_response_payload,
        path_params={"rfqId": rfq_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": buyer_claims["sub"],  # Same buyer!
        "status": "OPEN",
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 403
        body = json.loads(resp["body"])
        assert "cannot submit a quotation response to your own" in body["error"]["message"].lower()


def test_submit_quotation_closed_rfq_rejected(seller_claims, sample_response_payload):
    rfq_id = "rfq_001"
    event = make_event(
        "POST",
        f"/procurement/requests/{rfq_id}/responses",
        claims=seller_claims,
        body=sample_response_payload,
        path_params={"rfqId": rfq_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": "usr_buyer_111",
        "status": "FULFILLED",  # Already fulfilled
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 400


def test_submit_quotation_duplicate_active_rejected(seller_claims, sample_response_payload):
    rfq_id = "rfq_001"
    event = make_event(
        "POST",
        f"/procurement/requests/{rfq_id}/responses",
        claims=seller_claims,
        body=sample_response_payload,
        path_params={"rfqId": rfq_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": "usr_buyer_111",
        "status": "OPEN",
    }
    mock_repo.list_responses_for_rfq.return_value = [
        {
            "responseId": "rfqr_existing",
            "sellerId": seller_claims["sub"],
            "status": "SUBMITTED",  # Already active
        }
    ]

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert "already have an active submitted quotation" in body["error"]["message"].lower()


def test_submit_quotation_invalid_fields(seller_claims, sample_response_payload):
    sample_response_payload["proposedQuantity"] = -5  # Negative
    sample_response_payload["unitPrice"] = -10  # Negative

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": "RFQ#rfq_001",
        "SK": "METADATA",
        "rfqId": "rfq_001",
        "buyerId": "usr_buyer_111",
        "status": "OPEN",
    }

    event = make_event(
        "POST",
        "/procurement/requests/rfq_001/responses",
        claims=seller_claims,
        body=sample_response_payload,
        path_params={"rfqId": "rfq_001"},
    )
    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 400


# =============================================================================
# 6. Response Retrieval Tests
# =============================================================================

def test_list_rfq_responses_owner_allowed(buyer_claims):
    rfq_id = "rfq_001"
    event = make_event(
        "GET",
        f"/procurement/requests/{rfq_id}/responses",
        claims=buyer_claims,
        path_params={"rfqId": rfq_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": buyer_claims["sub"],
        "status": "OPEN",
    }
    mock_repo.list_responses_for_rfq.return_value = [
        {
            "responseId": "rfqr_01",
            "rfqId": rfq_id,
            "sellerId": "usr_seller_1",
            "proposedQuantity": Decimal("5"),
            "unit": "TONNE",
            "unitPrice": Decimal("7500"),
            "status": "SUBMITTED",
            "createdAt": "2026-10-08T10:00:00Z",
        }
    ]

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert len(body["data"]["items"]) == 1


def test_list_rfq_responses_non_owner_forbidden(seller_claims):
    rfq_id = "rfq_001"
    event = make_event(
        "GET",
        f"/procurement/requests/{rfq_id}/responses",
        claims=seller_claims,
        path_params={"rfqId": rfq_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": "usr_buyer_111",  # Not seller
        "status": "OPEN",
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 403


# =============================================================================
# 7. Response Withdrawal Tests
# =============================================================================

def test_withdraw_response_seller_success(seller_claims):
    res_id = "rfqr_01"
    event = make_event(
        "POST",
        f"/procurement/responses/{res_id}/withdraw",
        claims=seller_claims,
        path_params={"responseId": res_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_response_by_id.return_value = {
        "responseId": res_id,
        "rfqId": "rfq_001",
        "sellerId": seller_claims["sub"],
        "status": "SUBMITTED",
        "createdAt": "2026-10-08T10:00:00Z",
    }
    mock_repo.update_response_status.return_value = {
        "status": "WITHDRAWN",
        "updatedAt": "2026-10-08T12:00:00Z",
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body["data"]["status"] == "WITHDRAWN"


def test_withdraw_response_other_seller_forbidden(other_seller_claims):
    res_id = "rfqr_01"
    event = make_event(
        "POST",
        f"/procurement/responses/{res_id}/withdraw",
        claims=other_seller_claims,
        path_params={"responseId": res_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_response_by_id.return_value = {
        "responseId": res_id,
        "rfqId": "rfq_001",
        "sellerId": "usr_farmer_333",  # Not other_seller
        "status": "SUBMITTED",
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 403


def test_withdraw_response_accepted_rejected(seller_claims):
    res_id = "rfqr_01"
    event = make_event(
        "POST",
        f"/procurement/responses/{res_id}/withdraw",
        claims=seller_claims,
        path_params={"responseId": res_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_response_by_id.return_value = {
        "responseId": res_id,
        "rfqId": "rfq_001",
        "sellerId": seller_claims["sub"],
        "status": "ACCEPTED",  # Already accepted!
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert "cannot withdraw an accepted quotation" in body["error"]["message"].lower()


# =============================================================================
# 8. Response Acceptance Tests
# =============================================================================

def test_accept_response_owner_success(buyer_claims):
    res_id = "rfqr_01"
    rfq_id = "rfq_001"
    event = make_event(
        "POST",
        f"/procurement/responses/{res_id}/accept",
        claims=buyer_claims,
        path_params={"responseId": res_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_response_by_id.return_value = {
        "responseId": res_id,
        "rfqId": rfq_id,
        "sellerId": "usr_farmer_333",
        "proposedQuantity": Decimal("5"),
        "unitPrice": Decimal("7800"),
        "status": "SUBMITTED",
        "createdAt": "2026-10-08T10:00:00Z",
    }
    mock_repo.get_rfq_by_id.return_value = {
        "PK": f"RFQ#{rfq_id}",
        "SK": "METADATA",
        "rfqId": rfq_id,
        "buyerId": buyer_claims["sub"],
        "status": "OPEN",
        "createdAt": "2026-10-08T09:00:00Z",
    }
    mock_repo.list_responses_for_rfq.return_value = [
        {
            "responseId": res_id,
            "status": "SUBMITTED",
            "sellerId": "usr_farmer_333",
            "createdAt": "2026-10-08T10:00:00Z",
        },
        {
            "responseId": "rfqr_02",
            "status": "SUBMITTED",
            "sellerId": "usr_seller_444",
            "createdAt": "2026-10-08T10:30:00Z",
        },
    ]
    mock_repo.update_response_status.return_value = {"status": "ACCEPTED"}
    mock_repo.update_rfq.return_value = {"status": "FULFILLED"}

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body["success"] is True
        assert body["data"]["acceptedResponse"]["status"] == "ACCEPTED"
        assert body["data"]["rfq"]["status"] == "FULFILLED"
        assert "Order creation will be handled in the next stage" in body["data"]["message"]

        # Verify other submitted response was rejected
        update_calls = mock_repo.update_response_status.call_args_list
        # First call is accept rfqr_01
        assert update_calls[0].kwargs["response_id"] == res_id
        assert update_calls[0].kwargs["new_status"] == "ACCEPTED"
        # Second call is reject rfqr_02
        assert update_calls[1].kwargs["response_id"] == "rfqr_02"
        assert update_calls[1].kwargs["new_status"] == "REJECTED"


def test_accept_response_non_owner_forbidden(seller_claims):
    res_id = "rfqr_01"
    event = make_event(
        "POST",
        f"/procurement/responses/{res_id}/accept",
        claims=seller_claims,
        path_params={"responseId": res_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_response_by_id.return_value = {
        "responseId": res_id,
        "rfqId": "rfq_001",
        "sellerId": "usr_farmer_333",
        "status": "SUBMITTED",
    }
    mock_repo.get_rfq_by_id.return_value = {
        "rfqId": "rfq_001",
        "buyerId": "usr_buyer_111",  # Not seller
        "status": "OPEN",
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 403


def test_accept_response_invalid_rfq_state_rejected(buyer_claims):
    res_id = "rfqr_01"
    event = make_event(
        "POST",
        f"/procurement/responses/{res_id}/accept",
        claims=buyer_claims,
        path_params={"responseId": res_id},
    )

    mock_repo = MagicMock()
    mock_repo.get_response_by_id.return_value = {
        "responseId": res_id,
        "rfqId": "rfq_001",
        "status": "SUBMITTED",
    }
    mock_repo.get_rfq_by_id.return_value = {
        "rfqId": "rfq_001",
        "buyerId": buyer_claims["sub"],
        "status": "CANCELLED",  # Already cancelled
    }

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 400


# =============================================================================
# 9. Pagination & Serialization Tests
# =============================================================================

def test_list_rfqs_pagination_cursor(buyer_claims):
    event = make_event(
        "GET",
        "/procurement/requests",
        claims=buyer_claims,
        query_params={"limit": "2", "status": "OPEN"},
    )

    mock_repo = MagicMock()
    mock_items = [
        {
            "PK": "RFQ#rfq_1",
            "SK": "METADATA",
            "rfqId": "rfq_1",
            "buyerId": "usr_1",
            "title": "RFQ 1",
            "status": "OPEN",
            "createdAt": "2026-10-08T10:00:00Z",
        },
        {
            "PK": "RFQ#rfq_2",
            "SK": "METADATA",
            "rfqId": "rfq_2",
            "buyerId": "usr_2",
            "title": "RFQ 2",
            "status": "OPEN",
            "createdAt": "2026-10-08T11:00:00Z",
        },
    ]
    last_key = {"PK": "RFQ#rfq_2", "SK": "METADATA"}
    mock_repo.list_rfqs.return_value = (mock_items, last_key)

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body["data"]["totalCount"] == 2
        assert body["data"]["hasMore"] is True
        assert body["data"]["cursor"] is not None

        # Verify serialization: No PK/SK in any item
        for item in body["data"]["items"]:
            assert "PK" not in item
            assert "SK" not in item
            assert "entityType" not in item


def test_list_my_rfqs_and_my_responses(buyer_claims, seller_claims):
    # My RFQs
    event_my_rfqs = make_event("GET", "/procurement/my-requests", claims=buyer_claims)
    mock_repo = MagicMock()
    mock_repo.list_buyer_rfqs.return_value = (
        [{"rfqId": "rfq_1", "buyerId": buyer_claims["sub"], "status": "OPEN", "title": "My RFQ"}],
        None,
    )

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp = lambda_handler(event_my_rfqs)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert len(body["data"]["items"]) == 1
        assert body["data"]["items"][0]["title"] == "My RFQ"

    # My Responses
    event_my_resp = make_event("GET", "/procurement/my-responses", claims=seller_claims)
    mock_repo.list_seller_responses.return_value = (
        [{"responseId": "rfqr_1", "sellerId": seller_claims["sub"], "status": "SUBMITTED"}],
        None,
    )

    with patch("app.handlers.procurement.get_procurement_service", return_value=ProcurementService(repo=mock_repo)):
        resp2 = lambda_handler(event_my_resp)
        assert resp2["statusCode"] == 200
        body2 = json.loads(resp2["body"])
        assert len(body2["data"]["items"]) == 1
        assert body2["data"]["items"][0]["responseId"] == "rfqr_1"


# =============================================================================
# 10. Base-Table Marketplace Index & Discovery Tests (Phase 4 Correction)
# =============================================================================

def test_marketplace_two_different_buyers_both_appear():
    """Proves two different buyers create RFQs and both are saved into the marketplace index partition."""
    mock_dynamo = MagicMock()
    repo = ProcurementRepository(repo=mock_dynamo)

    rfq1 = RFQ(
        rfq_id="rfq_buyer1",
        buyer_id="usr_buyer_1",
        buyer_role="BUYER",
        title="Need 10 Tonnes Maize",
        description="Maize for animal feed",
        product_category="CROPS",
        product_name="Maize",
        quantity=10.0,
        unit="TONNE",
        preferred_district="Madurai",
        preferred_state="Tamil Nadu",
        required_by_date="2026-11-15",
        status="OPEN",
        created_at="2026-10-08T09:00:00Z",
    )
    rfq2 = RFQ(
        rfq_id="rfq_buyer2",
        buyer_id="usr_buyer_2",
        buyer_role="BUYER",
        title="Need 5 Tonnes Wheat Seeds",
        description="Certified wheat seeds",
        product_category="SEEDS",
        product_name="Wheat Seed",
        quantity=5.0,
        unit="TONNE",
        preferred_district="Ludhiana",
        preferred_state="Punjab",
        required_by_date="2026-11-20",
        status="OPEN",
        created_at="2026-10-08T10:00:00Z",
    )

    repo.save_rfq(rfq1)
    repo.save_rfq(rfq2)

    # Inspect all put_item calls on the mock DynamoDB table
    put_items = [call.kwargs["item"] for call in mock_dynamo.put_item.call_args_list]

    # Verify Buyer 1 marketplace index item
    mkt1 = next((item for item in put_items if item.get("rfqId") == "rfq_buyer1" and item.get("PK") == "PROCUREMENT_MARKETPLACE"), None)
    assert mkt1 is not None
    assert mkt1["SK"] == "OPEN#2026-10-08T09:00:00Z#rfq_buyer1"
    assert mkt1["entityType"] == "RFQ_MARKETPLACE_INDEX"
    assert mkt1["buyerId"] == "usr_buyer_1"

    # Verify Buyer 2 marketplace index item
    mkt2 = next((item for item in put_items if item.get("rfqId") == "rfq_buyer2" and item.get("PK") == "PROCUREMENT_MARKETPLACE"), None)
    assert mkt2 is not None
    assert mkt2["SK"] == "OPEN#2026-10-08T10:00:00Z#rfq_buyer2"
    assert mkt2["entityType"] == "RFQ_MARKETPLACE_INDEX"
    assert mkt2["buyerId"] == "usr_buyer_2"


def test_marketplace_discovery_query_open_rfqs_and_no_scan():
    """Proves list_rfqs executes a Query on PROCUREMENT_MARKETPLACE with begins_with OPEN# and NO Scan."""
    mock_dynamo = MagicMock()
    mock_dynamo.query.return_value = (
        [
            {"PK": "PROCUREMENT_MARKETPLACE", "SK": "OPEN#2026-10-08T10:00:00Z#rfq_1", "rfqId": "rfq_1", "status": "OPEN"},
            {"PK": "PROCUREMENT_MARKETPLACE", "SK": "OPEN#2026-10-08T09:00:00Z#rfq_2", "rfqId": "rfq_2", "status": "OPEN"},
        ],
        None,
    )
    repo = ProcurementRepository(repo=mock_dynamo)

    items, last_key = repo.list_rfqs(status="OPEN")
    assert len(items) == 2
    assert last_key is None

    # Assert repo.query was called and repo.scan was NEVER called
    mock_dynamo.query.assert_called_once()
    mock_dynamo.scan.assert_not_called()

    # Verify query arguments
    call_kwargs = mock_dynamo.query.call_args.kwargs
    assert call_kwargs["key_condition_expression"] == "#pk = :pk_val AND begins_with(#sk, :sk_prefix)"
    assert call_kwargs["expression_attribute_values"][":pk_val"] == "PROCUREMENT_MARKETPLACE"
    assert call_kwargs["expression_attribute_values"][":sk_prefix"] == "OPEN#"
    assert call_kwargs["scan_index_forward"] is False  # Newest first


def test_marketplace_cancelled_rfq_disappears():
    """Proves when an RFQ is cancelled, delete_item is called to remove it from the marketplace index."""
    mock_dynamo = MagicMock()
    mock_dynamo.get_item.return_value = {
        "PK": "RFQ#rfq_cancel_test",
        "SK": "METADATA",
        "rfqId": "rfq_cancel_test",
        "buyerId": "usr_buyer_111",
        "status": "OPEN",
        "createdAt": "2026-10-08T08:00:00Z",
    }
    repo = ProcurementRepository(repo=mock_dynamo)
    svc = ProcurementService(repo=repo)
    claims = UserClaims(
        user_id="usr_buyer_111",
        email="buyer@test.com",
        role="BUYER",
        display_name="Buyer",
    )

    svc.cancel_rfq(claims, "rfq_cancel_test")

    # Verify delete_item was called for the marketplace index item
    delete_calls = mock_dynamo.delete_item.call_args_list
    mkt_delete = next((c.kwargs["key"] for c in delete_calls if c.kwargs.get("key", {}).get("PK") == "PROCUREMENT_MARKETPLACE"), None)
    assert mkt_delete is not None
    assert mkt_delete["SK"] == "OPEN#2026-10-08T08:00:00Z#rfq_cancel_test"


def test_marketplace_fulfilled_rfq_disappears():
    """Proves when a quotation is accepted, the fulfilled RFQ is deleted from the marketplace index."""
    mock_dynamo = MagicMock()
    mock_dynamo.get_item.side_effect = lambda key, **kwargs: (
        {
            "responseId": "rfqr_accept_test",
            "rfqId": "rfq_fulfilled_test",
            "sellerId": "usr_farmer_333",
            "status": "SUBMITTED",
            "createdAt": "2026-10-08T09:00:00Z",
        }
        if "rfqr_accept_test" in key.get("PK", "") or "rfqr_accept_test" in key.get("SK", "")
        else {
            "PK": "RFQ#rfq_fulfilled_test",
            "SK": "METADATA",
            "rfqId": "rfq_fulfilled_test",
            "buyerId": "usr_buyer_111",
            "status": "OPEN",
            "createdAt": "2026-10-08T08:30:00Z",
        }
    )
    mock_dynamo.query.return_value = ([], None)

    repo = ProcurementRepository(repo=mock_dynamo)
    svc = ProcurementService(repo=repo)
    claims = UserClaims(
        user_id="usr_buyer_111",
        email="buyer@test.com",
        role="BUYER",
        display_name="Buyer",
    )

    svc.accept_response(claims, "rfqr_accept_test")

    # Verify delete_item was called for the marketplace index item
    delete_calls = mock_dynamo.delete_item.call_args_list
    mkt_delete = next((c.kwargs["key"] for c in delete_calls if c.kwargs.get("key", {}).get("PK") == "PROCUREMENT_MARKETPLACE"), None)
    assert mkt_delete is not None
    assert mkt_delete["SK"] == "OPEN#2026-10-08T08:30:00Z#rfq_fulfilled_test"


def test_marketplace_cursor_pagination_and_filters():
    """Proves marketplace discovery applies category, state, district filter expressions and handles cursor pagination."""
    mock_dynamo = MagicMock()
    mock_dynamo.query.return_value = (
        [{"rfqId": "rfq_page1", "title": "Page 1 Item", "status": "OPEN"}],
        {"PK": "PROCUREMENT_MARKETPLACE", "SK": "OPEN#2026-10-08T10:00:00Z#rfq_page1"},
    )
    repo = ProcurementRepository(repo=mock_dynamo)

    items, last_key = repo.list_rfqs(
        product_category="BY_PRODUCTS",
        preferred_state="Tamil Nadu",
        preferred_district="Coimbatore",
        limit=10,
        exclusive_start_key={"PK": "PROCUREMENT_MARKETPLACE", "SK": "OPEN#previous_cursor"},
    )

    assert len(items) == 1
    assert last_key is not None
    mock_dynamo.scan.assert_not_called()
    mock_dynamo.query.assert_called_once()

    call_kwargs = mock_dynamo.query.call_args.kwargs
    assert call_kwargs["exclusive_start_key"] == {"PK": "PROCUREMENT_MARKETPLACE", "SK": "OPEN#previous_cursor"}
    assert call_kwargs["limit"] == 10
    assert "#cat = :cat_val" in call_kwargs["filter_expression"]
    assert "#state = :state_val" in call_kwargs["filter_expression"]
    assert "#district = :district_val" in call_kwargs["filter_expression"]
    assert call_kwargs["expression_attribute_values"][":cat_val"] == "BY_PRODUCTS"
    assert call_kwargs["expression_attribute_values"][":state_val"] == "Tamil Nadu"
    assert call_kwargs["expression_attribute_values"][":district_val"] == "Coimbatore"
