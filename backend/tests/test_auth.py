import pytest
from app.auth.cognito import (
    UserClaims,
    VALID_ROLES,
    get_authenticated_user,
    require_authenticated_user,
    require_role,
)
from app.utils.errors import ForbiddenError, UnauthorizedError


def test_valid_roles_coverage():
    expected = {
        "SEED_PRODUCER",
        "FARMER",
        "BYPRODUCT_SELLER",
        "BUYER",
        "SERVICE_PROVIDER",
        "PROCESSOR",
        "ADMIN",
    }
    assert VALID_ROLES == expected


def test_extract_user_claims_http_api_v2(mock_http_api_v2_event):
    user = get_authenticated_user(mock_http_api_v2_event)
    assert user is not None
    assert user.user_id == "usr_test_farmer_123"
    assert user.email == "farmer.ramesh@example.com"
    assert user.role == "FARMER"
    assert user.display_name == "Ramesh Organic Farms"
    assert user.email_verified is True


def test_extract_user_claims_rest_api():
    event = {
        "httpMethod": "GET",
        "path": "/users/me",
        "requestContext": {
            "authorizer": {
                "claims": {
                    "sub": "usr_rest_456",
                    "email": "buyer.trade@example.com",
                    "custom:role": "BUYER",
                    "custom:display_name": "Agro Agro Wholesalers",
                    "email_verified": True,
                }
            }
        },
    }
    user = get_authenticated_user(event)
    assert user is not None
    assert user.user_id == "usr_rest_456"
    assert user.email == "buyer.trade@example.com"
    assert user.role == "BUYER"
    assert user.display_name == "Agro Agro Wholesalers"


def test_extract_user_claims_unauthenticated():
    # Empty event
    assert get_authenticated_user({}) is None
    # No authorizer block
    assert get_authenticated_user({"requestContext": {}}) is None
    # Claims missing sub
    assert get_authenticated_user({
        "requestContext": {
            "authorizer": {
                "jwt": {"claims": {"email": "no_sub@example.com"}}
            }
        }
    }) is None


def test_require_authenticated_user_success(mock_http_api_v2_event):
    user = require_authenticated_user(mock_http_api_v2_event)
    assert isinstance(user, UserClaims)
    assert user.user_id == "usr_test_farmer_123"


def test_require_authenticated_user_failure():
    with pytest.raises(UnauthorizedError) as exc_info:
        require_authenticated_user({})
    assert exc_info.value.status_code == 401


def test_require_role_matching():
    user = UserClaims(
        user_id="u1",
        email="farmer@test.com",
        role="FARMER",
        display_name="Farmer",
    )
    # Should not raise
    require_role(user, "FARMER")
    require_role(user, ["FARMER", "BUYER"])


def test_require_role_mismatch():
    user = UserClaims(
        user_id="u1",
        email="farmer@test.com",
        role="FARMER",
        display_name="Farmer",
    )
    with pytest.raises(ForbiddenError) as exc_info:
        require_role(user, "BUYER")
    assert exc_info.value.status_code == 403


def test_admin_bypasses_role_restriction():
    admin = UserClaims(
        user_id="adm_001",
        email="admin@agriconnect.in",
        role="ADMIN",
        display_name="Super Admin",
    )
    # Admin can access any role-protected resource
    require_role(admin, "FARMER")
    require_role(admin, "SEED_PRODUCER")
    require_role(admin, "BUYER")
    assert admin.is_admin() is True


def test_role_case_insensitivity_and_fallback():
    event = {
        "requestContext": {
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": "u99",
                        "email": "test@test.com",
                        "custom:role": "seed_producer",  # lower case
                    }
                }
            }
        }
    }
    user = get_authenticated_user(event)
    assert user.role == "SEED_PRODUCER"

    # Invalid role falls back to FARMER
    event_invalid = {
        "requestContext": {
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": "u99",
                        "email": "test@test.com",
                        "custom:role": "HACKER",
                    }
                }
            }
        }
    }
    user_fallback = get_authenticated_user(event_invalid)
    assert user_fallback.role == "FARMER"
