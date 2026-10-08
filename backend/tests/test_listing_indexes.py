"""
Tests for AgriConnect Phase 3 DynamoDB Indexing Architecture:
- GSI1: Partition key GSI1PK = 'MARKETPLACE', Sort key GSI1SK (STATUS#<status>#CREATED#<createdAt>)
  Do NOT use CATEGORY#<category> as GSI1PK. Category, state, district, sellerRole, quality
  are handled via FilterExpression.
- GSI2: Partition key GSI2PK (SELLER#<sellerId>), Sort key GSI2SK (CREATED#<createdAt>)
- Immutable timestamps (createdAt) and immutable ownership (sellerId)
- Safe backward compatibility for existing DynamoDB items without GSI keys
- GSI query helper methods with FilterExpressions and pagination (LastEvaluatedKey)
"""
import base64
from decimal import Decimal
import json
from unittest.mock import MagicMock, patch
import pytest

from app.auth.cognito import UserClaims
from app.handlers.listings import lambda_handler
from app.models.listing import Listing, ListingCategory, ListingStatus
from app.repositories.listings_repository import ListingsRepository
from app.schemas.listing import ListingResponse
from app.services.listings_service import ListingsService
from app.utils.errors import ForbiddenError, ValidationError


# ==============================================================================
# 1. Unit Tests for GSI Key Generation Functions & Model Properties
# ==============================================================================

class TestGSIKeyGeneration:
    """Tests static and dynamic generation of GSI keys on the Listing model."""

    def test_gsi1_pk_always_marketplace(self):
        """
        Phase 3 MVP requirement:
        Every listing MUST use GSI1PK = 'MARKETPLACE'.
        Do NOT use CATEGORY#<category> as GSI1PK.
        """
        assert Listing.build_gsi1_pk() == "MARKETPLACE"
        assert Listing.build_gsi1_pk(None) == "MARKETPLACE"
        assert Listing.build_gsi1_pk("CROPS") == "MARKETPLACE"
        assert Listing.build_gsi1_pk("seeds") == "MARKETPLACE"
        assert Listing.build_gsi1_pk("BY_PRODUCTS") == "MARKETPLACE"

    def test_gsi1_sk_generation(self):
        """GSI1SK format: STATUS#<status>#CREATED#<createdAt>."""
        created_at = "2026-10-08T12:00:00.000000+00:00"
        sk = Listing.build_gsi1_sk("ACTIVE", created_at)
        assert sk == f"STATUS#ACTIVE#CREATED#{created_at}"

        # Status normalization to uppercase
        sk_lower = Listing.build_gsi1_sk("sold", created_at)
        assert sk_lower == f"STATUS#SOLD#CREATED#{created_at}"

        # Default status fallback to ACTIVE if None
        sk_none = Listing.build_gsi1_sk(None, created_at)
        assert sk_none == f"STATUS#ACTIVE#CREATED#{created_at}"

    def test_gsi2_pk_generation(self):
        """GSI2PK format: SELLER#<sellerId>."""
        cognito_sub = "usr_cognito_abc123"
        assert Listing.build_gsi2_pk(cognito_sub) == f"SELLER#{cognito_sub}"

        # Handles already prefixed sellerId safely without double-prefixing
        already_prefixed = "SELLER#usr_cognito_abc123"
        assert Listing.build_gsi2_pk(already_prefixed) == already_prefixed

    def test_gsi2_sk_generation(self):
        """GSI2SK format: CREATED#<createdAt>."""
        created_at = "2026-10-08T12:00:00.000000+00:00"
        assert Listing.build_gsi2_sk(created_at) == f"CREATED#{created_at}"


# ==============================================================================
# 2. Model Serialization & Backward Compatibility Tests
# ==============================================================================

class TestListingModelSerialization:
    """Verifies that to_item includes all 4 GSI keys and from_item handles legacy data."""

    def test_to_item_includes_all_gsi_keys(self):
        created_at = "2026-10-08T12:00:00+00:00"
        listing = Listing(
            listing_id="list_001",
            seller_id="sub_seller_1",
            seller_role="FARMER",
            title="Fresh Wheat",
            description="Organic wheat harvest",
            category="CROPS",
            quantity=100.0,
            unit="KG",
            price=2500.0,
            location="Mandya, Karnataka",
            district="Mandya",
            state="Karnataka",
            status="ACTIVE",
            created_at=created_at,
            updated_at=created_at,
        )

        item = listing.to_item()
        assert item["GSI1PK"] == "MARKETPLACE"
        assert item["GSI1SK"] == f"STATUS#ACTIVE#CREATED#{created_at}"
        assert item["GSI2PK"] == "SELLER#sub_seller_1"
        assert item["GSI2SK"] == f"CREATED#{created_at}"

    def test_from_item_backward_compatibility_with_legacy_items(self):
        """
        Legacy DynamoDB items in AgriConnect-Main may not have GSI1PK, GSI1SK,
        GSI2PK, GSI2SK populated. Verifies from_item does not throw and computes them.
        """
        legacy_item = {
            "PK": "LISTING#list_legacy_001",
            "SK": "METADATA",
            "entityType": "LISTING",
            "listingId": "list_legacy_001",
            "sellerId": "sub_legacy_farmer",
            "sellerRole": "FARMER",
            "title": "Legacy Rice",
            "description": "Stored from Phase 2 without GSIs",
            "category": "CROPS",
            "quantity": Decimal("500"),
            "unit": "KG",
            "price": Decimal("12000"),
            "currency": "INR",
            "location": "Thanjavur, Tamil Nadu",
            "district": "Thanjavur",
            "state": "Tamil Nadu",
            "status": "ACTIVE",
            "createdAt": "2026-10-01T08:00:00+00:00",
            "updatedAt": "2026-10-01T08:00:00+00:00",
            # Notice GSI keys are completely absent
        }

        listing = Listing.from_item(legacy_item)
        assert listing.listing_id == "list_legacy_001"
        assert listing.seller_id == "sub_legacy_farmer"
        # Computed properties fall back cleanly
        assert listing.computed_gsi1_pk == "MARKETPLACE"
        assert listing.computed_gsi1_sk == "STATUS#ACTIVE#CREATED#2026-10-01T08:00:00+00:00"
        assert listing.computed_gsi2_pk == "SELLER#sub_legacy_farmer"
        assert listing.computed_gsi2_sk == "CREATED#2026-10-01T08:00:00+00:00"

        # Re-saving backfills GSI keys into the item dict
        new_item = listing.to_item()
        assert new_item["GSI1PK"] == "MARKETPLACE"
        assert new_item["GSI1SK"] == "STATUS#ACTIVE#CREATED#2026-10-01T08:00:00+00:00"
        assert new_item["GSI2PK"] == "SELLER#sub_legacy_farmer"
        assert new_item["GSI2SK"] == "CREATED#2026-10-01T08:00:00+00:00"


# ==============================================================================
# 3. Service Layer Listing Creation & Update Tests
# ==============================================================================

class TestListingsServiceGSIs:
    """Tests ListingsService GSI key generation and immutability invariants."""

    @pytest.fixture
    def mock_repo(self):
        repo = MagicMock(spec=ListingsRepository)
        return repo

    @pytest.fixture
    def mock_s3(self):
        s3 = MagicMock()
        s3.generate_presigned_download_url.side_effect = lambda key, expiration: f"https://s3.example.com/{key}?signed=true"
        return s3

    @pytest.fixture
    def service(self, mock_repo, mock_s3):
        return ListingsService(repo=mock_repo, s3_service=mock_s3)

    @pytest.fixture
    def farmer_claims(self):
        return UserClaims(
            user_id="usr_cognito_farmer_999",
            email="farmer999@agriconnect.org",
            role="FARMER",
            display_name="Ramesh Kumar",
        )

    def test_create_listing_populates_all_four_gsi_keys(self, service, mock_repo, farmer_claims):
        """Ensures create_listing saves GSI1PK, GSI1SK, GSI2PK, GSI2SK to DynamoDB."""
        payload = {
            "title": "High Yield Basmati Seeds",
            "description": "Certified basmati seed paddy",
            "category": "SEEDS",
            "quantity": 50,
            "unit": "KG",
            "price": 3500,
            "location": "Karnal, Haryana",
            "district": "Karnal",
            "state": "Haryana",
            "status": "ACTIVE",
        }

        created = service.create_listing(farmer_claims, payload)

        # Inspect item passed to repo.save
        assert mock_repo.save.called
        saved_item = mock_repo.save.call_args[0][0]

        assert saved_item["GSI1PK"] == "MARKETPLACE"
        assert saved_item["GSI1SK"].startswith("STATUS#ACTIVE#CREATED#")
        assert saved_item["GSI2PK"] == f"SELLER#{farmer_claims.user_id}"
        assert saved_item["GSI2SK"].startswith("CREATED#")
        assert saved_item["createdAt"] in saved_item["GSI1SK"]
        assert saved_item["createdAt"] in saved_item["GSI2SK"]

    def test_client_cannot_spoof_seller_id_or_gsi2_pk(self, service, mock_repo, farmer_claims):
        """Clients cannot inject arbitrary sellerId or GSI keys in payload."""
        malicious_payload = {
            "title": "Spoofed Organic Cotton",
            "description": "Trying to spoof another seller",
            "category": "CROPS",
            "quantity": 100,
            "unit": "KG",
            "price": 5000,
            "location": "Surat, Gujarat",
            "district": "Surat",
            "state": "Gujarat",
            "sellerId": "attacker_fake_seller_id",
            "GSI2PK": "SELLER#attacker_fake_seller_id",
        }

        service.create_listing(farmer_claims, malicious_payload)

        saved_item = mock_repo.save.call_args[0][0]
        # Strictly uses authenticated user's Cognito 'sub'
        assert saved_item["sellerId"] == farmer_claims.user_id
        assert saved_item["GSI2PK"] == f"SELLER#{farmer_claims.user_id}"

    def test_status_update_modifies_gsi1_sk_while_preserving_created_at_and_gsi2_sk(
        self, service, mock_repo, farmer_claims
    ):
        """
        When status updates (e.g. ACTIVE -> SOLD), GSI1SK must update to reflect
        the new status, while createdAt and GSI2SK remain strictly immutable.
        """
        created_at = "2026-10-05T10:00:00+00:00"
        listing_id = "list_status_test_001"

        existing_item = {
            "PK": f"LISTING#{listing_id}",
            "SK": "METADATA",
            "listingId": listing_id,
            "sellerId": farmer_claims.user_id,
            "sellerRole": "FARMER",
            "title": "Fresh Tomatoes",
            "description": "Ripe organic tomatoes",
            "category": "CROPS",
            "quantity": Decimal("200"),
            "unit": "KG",
            "price": Decimal("4000"),
            "location": "Kolar, Karnataka",
            "district": "Kolar",
            "state": "Karnataka",
            "status": "ACTIVE",
            "createdAt": created_at,
            "updatedAt": created_at,
            "GSI1PK": "MARKETPLACE",
            "GSI1SK": f"STATUS#ACTIVE#CREATED#{created_at}",
            "GSI2PK": f"SELLER#{farmer_claims.user_id}",
            "GSI2SK": f"CREATED#{created_at}",
        }
        mock_repo.get_by_id.return_value = existing_item
        mock_repo.update.side_effect = lambda lid, upd: {**existing_item, **upd}

        # Update status to SOLD
        updates = {"status": "SOLD"}
        updated = service.update_listing(listing_id, farmer_claims, updates)

        assert mock_repo.update.called
        passed_updates = mock_repo.update.call_args[0][1]

        # Verify GSI1SK changed to reflect SOLD
        assert passed_updates["GSI1SK"] == f"STATUS#SOLD#CREATED#{created_at}"
        # Verify GSI1PK is always MARKETPLACE
        assert passed_updates["GSI1PK"] == "MARKETPLACE"
        # Verify GSI2SK remained CREATED#<created_at>
        assert passed_updates["GSI2SK"] == f"CREATED#{created_at}"
        # Verify GSI2PK remained seller's Cognito sub
        assert passed_updates["GSI2PK"] == f"SELLER#{farmer_claims.user_id}"
        # Verify createdAt was not in updates
        assert "createdAt" not in passed_updates

    def test_category_update_maintains_gsi1_pk_as_marketplace(self, service, mock_repo, farmer_claims):
        """Updating category keeps GSI1PK = 'MARKETPLACE' while preserving sort keys."""
        created_at = "2026-10-05T10:00:00+00:00"
        listing_id = "list_cat_test_001"

        existing_item = {
            "PK": f"LISTING#{listing_id}",
            "SK": "METADATA",
            "listingId": listing_id,
            "sellerId": farmer_claims.user_id,
            "sellerRole": "FARMER",
            "title": "Corn Husks",
            "description": "Agricultural by-product",
            "category": "CROPS",
            "quantity": Decimal("500"),
            "unit": "KG",
            "price": Decimal("1500"),
            "location": "Hassan, Karnataka",
            "district": "Hassan",
            "state": "Karnataka",
            "status": "ACTIVE",
            "createdAt": created_at,
            "updatedAt": created_at,
        }
        mock_repo.get_by_id.return_value = existing_item
        mock_repo.update.side_effect = lambda lid, upd: {**existing_item, **upd}

        # Reclassify to BY_PRODUCTS
        updates = {"category": "BY_PRODUCTS"}
        service.update_listing(listing_id, farmer_claims, updates)

        passed_updates = mock_repo.update.call_args[0][1]
        assert passed_updates["GSI1PK"] == "MARKETPLACE"
        assert passed_updates["GSI1SK"] == f"STATUS#ACTIVE#CREATED#{created_at}"
        assert passed_updates["category"] == "BY_PRODUCTS"

    def test_legacy_item_heals_gsi_keys_on_update(self, service, mock_repo, farmer_claims):
        """
        When a legacy item (created before Phase 3 with no GSI keys) is updated,
        ListingsService automatically populates all 4 GSI keys without breaking.
        """
        created_at = "2026-09-20T10:00:00+00:00"
        listing_id = "list_legacy_002"

        legacy_existing = {
            "PK": f"LISTING#{listing_id}",
            "SK": "METADATA",
            "listingId": listing_id,
            "sellerId": farmer_claims.user_id,
            "sellerRole": "FARMER",
            "title": "Legacy Item",
            "description": "Phase 2 item missing GSI keys",
            "category": "SEEDS",
            "quantity": Decimal("10"),
            "unit": "KG",
            "price": Decimal("500"),
            "location": "Mysuru, Karnataka",
            "district": "Mysuru",
            "state": "Karnataka",
            "status": "ACTIVE",
            "createdAt": created_at,
            "updatedAt": created_at,
            # GSI1PK, GSI1SK, GSI2PK, GSI2SK NOT present
        }
        mock_repo.get_by_id.return_value = legacy_existing
        mock_repo.update.side_effect = lambda lid, upd: {**legacy_existing, **upd}

        updates = {"price": 550}
        service.update_listing(listing_id, farmer_claims, updates)

        passed_updates = mock_repo.update.call_args[0][1]
        assert passed_updates["GSI1PK"] == "MARKETPLACE"
        assert passed_updates["GSI1SK"] == f"STATUS#ACTIVE#CREATED#{created_at}"
        assert passed_updates["GSI2PK"] == f"SELLER#{farmer_claims.user_id}"
        assert passed_updates["GSI2SK"] == f"CREATED#{created_at}"

    def test_client_cannot_override_gsi_keys_in_update(self, service, mock_repo, farmer_claims):
        """Even if client sends GSI1PK or GSI2PK in update payload, service strips them."""
        created_at = "2026-10-01T10:00:00+00:00"
        listing_id = "list_test_strip_001"

        existing_item = {
            "PK": f"LISTING#{listing_id}",
            "SK": "METADATA",
            "listingId": listing_id,
            "sellerId": farmer_claims.user_id,
            "sellerRole": "FARMER",
            "title": "Sugarcane",
            "description": "Sweet sugarcane",
            "category": "CROPS",
            "quantity": Decimal("1000"),
            "unit": "KG",
            "price": Decimal("3000"),
            "location": "Mandya, Karnataka",
            "district": "Mandya",
            "state": "Karnataka",
            "status": "ACTIVE",
            "createdAt": created_at,
            "updatedAt": created_at,
        }
        mock_repo.get_by_id.return_value = existing_item
        mock_repo.update.side_effect = lambda lid, upd: {**existing_item, **upd}

        malicious_updates = {
            "title": "Updated Sugarcane",
            "GSI1PK": "CATEGORY#ILLEGAL",
            "GSI2PK": "SELLER#victim_seller",
            "createdAt": "2020-01-01T00:00:00+00:00",
        }
        service.update_listing(listing_id, farmer_claims, malicious_updates)

        passed_updates = mock_repo.update.call_args[0][1]
        assert passed_updates["GSI1PK"] == "MARKETPLACE"
        assert passed_updates["GSI2PK"] == f"SELLER#{farmer_claims.user_id}"
        assert passed_updates["GSI2SK"] == f"CREATED#{created_at}"
        assert "createdAt" not in passed_updates


# ==============================================================================
# 4. Repository GSI Query Tests
# ==============================================================================

class TestListingsRepositoryGSIQueries:
    """Verifies ListingsRepository.query_gsi1 and query_gsi2 parameters and FilterExpressions."""

    @pytest.fixture
    def mock_dynamodb_repo(self):
        repo = MagicMock()
        return repo

    @pytest.fixture
    def repository(self, mock_dynamodb_repo):
        return ListingsRepository(repo=mock_dynamodb_repo)

    def test_query_gsi1_marketplace_browsing(self, repository, mock_dynamodb_repo):
        """Verifies GSI1PK = 'MARKETPLACE' and status begins_with on GSI1SK."""
        mock_dynamodb_repo.query.return_value = ([], None)

        repository.query_gsi1(
            gsi1_pk="MARKETPLACE",
            status="ACTIVE",
            limit=25,
        )

        assert mock_dynamodb_repo.query.called
        kwargs = mock_dynamodb_repo.query.call_args[1]
        assert kwargs["index_name"] == "GSI1"
        assert kwargs["limit"] == 25
        assert kwargs["key_condition_expression"] == "#gsi1pk = :gsi1pk AND begins_with(#gsi1sk, :gsi1sk_prefix)"
        assert kwargs["expression_attribute_names"]["#gsi1pk"] == "GSI1PK"
        assert kwargs["expression_attribute_names"]["#gsi1sk"] == "GSI1SK"
        assert kwargs["expression_attribute_values"][":gsi1pk"] == "MARKETPLACE"
        assert kwargs["expression_attribute_values"][":gsi1sk_prefix"] == "STATUS#ACTIVE#"
        assert kwargs["filter_expression"] is None
        assert kwargs["scan_index_forward"] is False  # Newest first

    def test_query_gsi1_with_optional_filter_expressions(self, repository, mock_dynamodb_repo):
        """
        Verifies category, state, district, sellerRole, and quality are passed
        as optional FilterExpressions while querying GSI1PK = 'MARKETPLACE'.
        """
        mock_dynamodb_repo.query.return_value = ([], None)

        repository.query_gsi1(
            gsi1_pk="MARKETPLACE",
            status="ACTIVE",
            category="CROPS",
            state="Karnataka",
            district="Mandya",
            seller_role="FARMER",
            quality="Grade A",
            limit=50,
        )

        assert mock_dynamodb_repo.query.called
        kwargs = mock_dynamodb_repo.query.call_args[1]
        assert kwargs["index_name"] == "GSI1"
        assert kwargs["key_condition_expression"] == "#gsi1pk = :gsi1pk AND begins_with(#gsi1sk, :gsi1sk_prefix)"
        assert kwargs["expression_attribute_values"][":gsi1pk"] == "MARKETPLACE"
        assert kwargs["expression_attribute_values"][":gsi1sk_prefix"] == "STATUS#ACTIVE#"

        # Check FilterExpression clauses
        filter_expr = kwargs["filter_expression"]
        assert "#category = :cat_val" in filter_expr
        assert "#state = :state_val" in filter_expr
        assert "#district = :district_val" in filter_expr
        assert "#sellerRole = :role_val" in filter_expr
        assert "#quality = :quality_val" in filter_expr

        # Check attribute names and values
        names = kwargs["expression_attribute_names"]
        values = kwargs["expression_attribute_values"]
        assert names["#category"] == "category"
        assert values[":cat_val"] == "CROPS"
        assert names["#state"] == "state"
        assert values[":state_val"] == "Karnataka"
        assert names["#district"] == "district"
        assert values[":district_val"] == "Mandya"
        assert names["#sellerRole"] == "sellerRole"
        assert values[":role_val"] == "FARMER"
        assert names["#quality"] == "quality"
        assert values[":quality_val"] == "Grade A"

    def test_query_gsi1_pagination_preserves_last_evaluated_key(self, repository, mock_dynamodb_repo):
        """Verifies that query_gsi1 forwards ExclusiveStartKey and returns LastEvaluatedKey."""
        start_key = {"GSI1PK": "MARKETPLACE", "GSI1SK": "STATUS#ACTIVE#CREATED#2026-10-01", "PK": "LISTING#123", "SK": "METADATA"}
        next_key = {"GSI1PK": "MARKETPLACE", "GSI1SK": "STATUS#ACTIVE#CREATED#2026-10-02", "PK": "LISTING#456", "SK": "METADATA"}
        mock_dynamodb_repo.query.return_value = ([{"listingId": "list_999"}], next_key)

        items, last_key = repository.query_gsi1(
            gsi1_pk="MARKETPLACE",
            status="ACTIVE",
            limit=10,
            exclusive_start_key=start_key,
        )

        assert mock_dynamodb_repo.query.called
        kwargs = mock_dynamodb_repo.query.call_args[1]
        assert kwargs["exclusive_start_key"] == start_key
        assert items == [{"listingId": "list_999"}]
        assert last_key == next_key

    def test_query_gsi1_without_status_filter(self, repository, mock_dynamodb_repo):
        """When status is None or ALL, queries GSI1PK only without sort key restriction."""
        mock_dynamodb_repo.query.return_value = ([], None)

        repository.query_gsi1(
            gsi1_pk="MARKETPLACE",
            status=None,
        )

        kwargs = mock_dynamodb_repo.query.call_args[1]
        assert kwargs["index_name"] == "GSI1"
        assert kwargs["key_condition_expression"] == "#gsi1pk = :gsi1pk"
        assert kwargs["expression_attribute_values"][":gsi1pk"] == "MARKETPLACE"
        assert ":gsi1sk_prefix" not in kwargs["expression_attribute_values"]

    def test_query_gsi1_search_filter_expression(self, repository, mock_dynamodb_repo):
        """Verifies that search keyword builds contains() clauses for title, description, and location."""
        mock_dynamodb_repo.query.return_value = ([], None)

        repository.query_gsi1(
            gsi1_pk="MARKETPLACE",
            status="ACTIVE",
            search="Organic Wheat",
        )

        assert mock_dynamodb_repo.query.called
        kwargs = mock_dynamodb_repo.query.call_args[1]
        filter_expr = kwargs["filter_expression"]
        assert "contains(#search_title" in filter_expr
        assert "contains(#search_desc" in filter_expr
        assert "contains(#search_loc" in filter_expr
        names = kwargs["expression_attribute_names"]
        assert names["#search_title"] == "title"
        assert names["#search_desc"] == "description"
        assert names["#search_loc"] == "location"

    def test_query_gsi2_by_seller(self, repository, mock_dynamodb_repo):
        mock_dynamodb_repo.query.return_value = ([], None)

        repository.query_gsi2(
            seller_id="usr_farmer_42",
            limit=15,
        )

        assert mock_dynamodb_repo.query.called
        kwargs = mock_dynamodb_repo.query.call_args[1]
        assert kwargs["index_name"] == "GSI2"
        assert kwargs["limit"] == 15
        assert kwargs["key_condition_expression"] == "#gsi2pk = :gsi2pk AND begins_with(#gsi2sk, :gsi2sk_prefix)"
        assert kwargs["expression_attribute_names"]["#gsi2pk"] == "GSI2PK"
        assert kwargs["expression_attribute_names"]["#gsi2sk"] == "GSI2SK"
        assert kwargs["expression_attribute_values"][":gsi2pk"] == "SELLER#usr_farmer_42"
        assert kwargs["expression_attribute_values"][":gsi2sk_prefix"] == "CREATED#"
        assert kwargs["scan_index_forward"] is False


# ==============================================================================
# 5. Service Layer GSI Query Helpers Tests
# ==============================================================================

class TestListingsServiceQueryHelpers:
    """Verifies that ListingsService query helpers route correctly and enrich images."""

    def test_query_listings_by_category_helper(self):
        mock_repo = MagicMock(spec=ListingsRepository)
        mock_s3 = MagicMock()
        mock_s3.generate_presigned_download_url.return_value = "https://s3.example.com/photo.jpg"

        mock_item = {
            "listingId": "list_101",
            "title": "Wheat",
            "category": "CROPS",
            "images": ["listings/seller1/photo.jpg"],
        }
        mock_repo.query_gsi1.return_value = ([mock_item], {"GSI1PK": "MARKETPLACE", "PK": "LISTING#101"})

        service = ListingsService(repo=mock_repo, s3_service=mock_s3)
        res = service.query_listings_by_category(category="CROPS", status="ACTIVE", state="Karnataka", limit=20)

        assert mock_repo.query_gsi1.called
        args, kwargs = mock_repo.query_gsi1.call_args
        assert kwargs["gsi1_pk"] == "MARKETPLACE"
        assert kwargs["status"] == "ACTIVE"
        assert kwargs["category"] == "CROPS"
        assert kwargs["state"] == "Karnataka"
        assert kwargs["limit"] == 20
        assert res["count"] == 1
        assert res["lastEvaluatedKey"] == {"GSI1PK": "MARKETPLACE", "PK": "LISTING#101"}
        # Images enriched
        assert res["listings"][0]["images"] == ["https://s3.example.com/photo.jpg"]

    def test_query_listings_by_seller_helper(self):
        mock_repo = MagicMock(spec=ListingsRepository)
        mock_s3 = MagicMock()

        mock_repo.query_gsi2.return_value = ([], None)

        service = ListingsService(repo=mock_repo, s3_service=mock_s3)
        res = service.query_listings_by_seller(seller_id="usr_seller_007", limit=30)

        assert mock_repo.query_gsi2.called
        args, kwargs = mock_repo.query_gsi2.call_args
        assert kwargs["seller_id"] == "usr_seller_007"
        assert kwargs["limit"] == 30
        assert res["count"] == 0
        assert res["listings"] == []


# ==============================================================================
# 6. GET /listings GSI1 Query Path Tests
# ==============================================================================

class TestGetListingsGSI1QueryPath:
    """Verifies that GET /listings uses GSI1 query with all filters, pagination, and cursor."""

    @pytest.fixture
    def mock_repo(self):
        return MagicMock(spec=ListingsRepository)

    @pytest.fixture
    def mock_s3(self):
        s3 = MagicMock()
        s3.generate_presigned_download_url.side_effect = lambda key, expiration: f"https://s3.example.com/{key}"
        return s3

    @pytest.fixture
    def service(self, mock_repo, mock_s3):
        return ListingsService(repo=mock_repo, s3_service=mock_s3)

    def test_list_listings_default_gsi1_query(self, service, mock_repo):
        """GET /listings defaults to status=ACTIVE, GSI1PK='MARKETPLACE', limit=50, newest first."""
        mock_repo.query_gsi1.return_value = ([], None)

        res = service.list_listings()

        assert mock_repo.query_gsi1.called
        kwargs = mock_repo.query_gsi1.call_args[1]
        assert kwargs["gsi1_pk"] == "MARKETPLACE"
        assert kwargs["status"] == "ACTIVE"
        assert kwargs["limit"] == 50
        assert kwargs["scan_index_forward"] is False
        assert kwargs["category"] is None
        assert kwargs["state"] is None
        assert kwargs["district"] is None
        assert kwargs["seller_role"] is None
        assert kwargs["quality"] is None
        assert kwargs["search"] is None
        assert kwargs["exclusive_start_key"] is None
        assert res["listings"] == []
        assert res["count"] == 0
        assert res["lastEvaluatedKey"] is None
        assert "cursor" not in res

    def test_list_listings_status_all(self, service, mock_repo):
        """When status='ALL', passes status=None to query_gsi1 (no sort key prefix filter)."""
        mock_repo.query_gsi1.return_value = ([], None)

        service.list_listings({"status": "ALL"})

        kwargs = mock_repo.query_gsi1.call_args[1]
        assert kwargs["status"] is None

    def test_list_listings_all_filters_forwarded(self, service, mock_repo):
        """Verifies category, state, district, sellerRole, quality, search, limit are passed."""
        mock_repo.query_gsi1.return_value = ([], None)

        params = {
            "category": "CROPS",
            "state": "Punjab",
            "district": "Ludhiana",
            "sellerRole": "FARMER",
            "quality": "Grade 1",
            "search": "Basmati",
            "limit": "25",
        }
        res = service.list_listings(params)

        kwargs = mock_repo.query_gsi1.call_args[1]
        assert kwargs["gsi1_pk"] == "MARKETPLACE"
        assert kwargs["status"] == "ACTIVE"
        assert kwargs["category"] == "CROPS"
        assert kwargs["state"] == "Punjab"
        assert kwargs["district"] == "Ludhiana"
        assert kwargs["seller_role"] == "FARMER"
        assert kwargs["quality"] == "Grade 1"
        assert kwargs["search"] == "Basmati"
        assert kwargs["limit"] == 25

    def test_list_listings_pagination_cursor_roundtrip(self, service, mock_repo):
        """Verifies that LastEvaluatedKey produces a cursor string and that passing it decodes it."""
        db_last_key = {
            "GSI1PK": "MARKETPLACE",
            "GSI1SK": "STATUS#ACTIVE#CREATED#2026-10-05T12:00:00+00:00",
            "PK": "LISTING#list_123",
            "SK": "METADATA",
        }
        mock_item = {"listingId": "list_123", "title": "Wheat", "images": []}
        mock_repo.query_gsi1.return_value = ([mock_item], db_last_key)

        first_page = service.list_listings({"limit": 1})

        assert first_page["count"] == 1
        assert first_page["lastEvaluatedKey"] == db_last_key
        assert "cursor" in first_page
        cursor_token = first_page["cursor"]
        assert isinstance(cursor_token, str)
        assert len(cursor_token) > 0

        # Now pass cursor_token as the next request's cursor
        mock_repo.query_gsi1.return_value = ([], None)
        second_page = service.list_listings({"cursor": cursor_token})

        kwargs = mock_repo.query_gsi1.call_args[1]
        assert kwargs["exclusive_start_key"] == db_last_key

    def test_list_listings_json_cursor_supported(self, service, mock_repo):
        """Verifies that raw JSON string cursor is also accepted."""
        raw_key = {"GSI1PK": "MARKETPLACE", "PK": "LISTING#999"}
        mock_repo.query_gsi1.return_value = ([], None)

        service.list_listings({"cursor": json.dumps(raw_key)})

        kwargs = mock_repo.query_gsi1.call_args[1]
        assert kwargs["exclusive_start_key"] == raw_key

    def test_list_listings_malformed_cursor_handled_gracefully(self, service, mock_repo):
        """Malformed cursor does not crash the server; falls back to exclusive_start_key=None."""
        mock_repo.query_gsi1.return_value = ([], None)

        res = service.list_listings({"cursor": "invalid_not_base64_or_json!!!"})

        kwargs = mock_repo.query_gsi1.call_args[1]
        assert kwargs["exclusive_start_key"] is None
        assert res["count"] == 0

    @patch("app.services.listings_service.get_listings_repository")
    def test_lambda_handler_get_listings_e2e_format(self, mock_get_repo):
        """Verifies API Gateway lambda_handler response structure with GSI1 query."""
        mock_repo = MagicMock()
        mock_get_repo.return_value = mock_repo
        mock_item = {
            "PK": "LISTING#list_test_01",
            "SK": "METADATA",
            "listingId": "list_test_01",
            "title": "Fresh Apples",
            "category": "CROPS",
            "status": "ACTIVE",
            "images": ["listings/seller1/photo.jpg"],
        }
        last_eval_key = {"GSI1PK": "MARKETPLACE", "PK": "LISTING#list_test_01"}
        mock_repo.query_gsi1.return_value = ([mock_item], last_eval_key)

        event = {
            "version": "2.0",
            "routeKey": "GET /listings",
            "rawPath": "/listings",
            "requestContext": {"http": {"method": "GET", "path": "/listings"}},
            "queryStringParameters": {
                "category": "CROPS",
                "state": "Himachal Pradesh",
                "quality": "Premium",
                "search": "Apples",
                "limit": "10",
            },
        }

        resp = lambda_handler(event)

        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body["success"] is True
        assert body["message"] == "Listings retrieved successfully"
        data = body["data"]
        assert data["count"] == 1
        assert len(data["listings"]) == 1
        listing_item = data["listings"][0]
        assert listing_item["listingId"] == "list_test_01"
        assert data["lastEvaluatedKey"] == last_eval_key
        assert "cursor" in data

        # Verify DynamoDB internal persistence and index keys are excluded from API client response
        internal_keys = ["PK", "SK", "entityType", "GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK", "gsi1Pk", "gsi1Sk", "gsi2Pk", "gsi2Sk"]
        for key in internal_keys:
            assert key not in listing_item, f"Internal field '{key}' should not be exposed in listing response"


# ==============================================================================
# 7. Serialization Tests: Exclusion of DynamoDB Persistence & Index Fields
# ==============================================================================

class TestListingSerializationInternalFieldsExclusion:
    """
    Verifies that DynamoDB internal persistence/index fields:
      - PK, SK, entityType
      - GSI1PK, GSI1SK
      - GSI2PK, GSI2SK
    are NEVER exposed to API clients in ListingResponse or serialized service responses,
    while all business fields, image attributes, and pagination envelopes remain intact.
    """

    @pytest.fixture
    def mock_repo(self):
        return MagicMock(spec=ListingsRepository)

    @pytest.fixture
    def mock_s3(self):
        s3 = MagicMock()
        s3.generate_presigned_download_url.side_effect = lambda key, expiration: f"https://s3.example.com/{key}"
        return s3

    @pytest.fixture
    def service(self, mock_repo, mock_s3):
        return ListingsService(repo=mock_repo, s3_service=mock_s3)

    def test_listing_response_pydantic_schema_excludes_persistence_fields(self):
        """ListingResponse Pydantic model ignores/excludes PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK."""
        full_raw_item = {
            "PK": "LISTING#list_schema_test",
            "SK": "METADATA",
            "entityType": "LISTING",
            "listingId": "list_schema_test",
            "sellerId": "usr_schema_farmer",
            "sellerRole": "FARMER",
            "title": "Alphonso Mangoes",
            "description": "Sweet Ratnagiri Alphonso mangoes",
            "category": "CROPS",
            "quantity": 50.0,
            "unit": "BOX",
            "price": 1200.0,
            "currency": "INR",
            "location": "Ratnagiri, Maharashtra",
            "district": "Ratnagiri",
            "state": "Maharashtra",
            "status": "ACTIVE",
            "createdAt": "2026-10-08T10:00:00+00:00",
            "updatedAt": "2026-10-08T10:00:00+00:00",
            "images": ["listings/seller1/mango.jpg"],
            "imageKeys": ["listings/seller1/mango.jpg"],
            "imageUrls": ["https://s3.example.com/mango.jpg"],
            "GSI1PK": "MARKETPLACE",
            "GSI1SK": "STATUS#ACTIVE#CREATED#2026-10-08T10:00:00+00:00",
            "GSI2PK": "SELLER#usr_schema_farmer",
            "GSI2SK": "CREATED#2026-10-08T10:00:00+00:00",
            "gsi1_pk": "MARKETPLACE",
            "gsi1_sk": "STATUS#ACTIVE#CREATED#2026-10-08T10:00:00+00:00",
            "gsi2_pk": "SELLER#usr_schema_farmer",
            "gsi2_sk": "CREATED#2026-10-08T10:00:00+00:00",
        }

        response_model = ListingResponse(**full_raw_item)
        dump = response_model.model_dump(by_alias=True)

        # Internal persistence and index fields must be absent
        assert "PK" not in dump
        assert "SK" not in dump
        assert "entityType" not in dump
        assert "GSI1PK" not in dump
        assert "GSI1SK" not in dump
        assert "GSI2PK" not in dump
        assert "GSI2SK" not in dump
        assert "gsi1_pk" not in dump
        assert "gsi1_sk" not in dump
        assert "gsi2_pk" not in dump
        assert "gsi2_sk" not in dump

        # Business fields must be present
        assert dump["listingId"] == "list_schema_test"
        assert dump["sellerId"] == "usr_schema_farmer"
        assert dump["sellerRole"] == "FARMER"
        assert dump["title"] == "Alphonso Mangoes"
        assert dump["price"] == 1200.0
        assert dump["unit"] == "BOX"
        assert dump["images"] == ["listings/seller1/mango.jpg"]
        assert dump["imageKeys"] == ["listings/seller1/mango.jpg"]
        assert dump["imageUrls"] == ["https://s3.example.com/mango.jpg"]

    def test_listing_model_to_dict_excludes_persistence_fields(self):
        """Listing.to_dict() strips pk, sk, entityType, and all GSI keys."""
        listing = Listing(
            listing_id="list_model_test",
            seller_id="usr_model_farmer",
            seller_role="FARMER",
            title="Sona Masoori Rice",
            description="Premium raw rice",
            category="CROPS",
            quantity=100.0,
            unit="BAG",
            price=2400.0,
            location="Raichur, Karnataka",
            district="Raichur",
            state="Karnataka",
            status="ACTIVE",
            created_at="2026-10-08T09:00:00+00:00",
            updated_at="2026-10-08T09:00:00+00:00",
            gsi1_pk="MARKETPLACE",
            gsi1_sk="STATUS#ACTIVE#CREATED#2026-10-08T09:00:00+00:00",
            gsi2_pk="SELLER#usr_model_farmer",
            gsi2_sk="CREATED#2026-10-08T09:00:00+00:00",
        )

        d = listing.to_dict()
        assert "pk" not in d
        assert "sk" not in d
        assert "entityType" not in d
        assert "GSI1PK" not in d
        assert "GSI1SK" not in d
        assert "GSI2PK" not in d
        assert "GSI2SK" not in d
        assert "gsi1_pk" not in d
        assert "gsi1_sk" not in d
        assert "gsi2_pk" not in d
        assert "gsi2_sk" not in d
        assert d["listing_id"] == "list_model_test"
        assert d["title"] == "Sona Masoori Rice"

    def test_list_listings_excludes_internal_fields_from_all_returned_items(self, service, mock_repo):
        """GET /listings response data.listings must not contain any internal DynamoDB fields."""
        mock_raw_items = [
            {
                "PK": "LISTING#list_001",
                "SK": "METADATA",
                "entityType": "LISTING",
                "listingId": "list_001",
                "sellerId": "usr_farmer_1",
                "sellerRole": "FARMER",
                "title": "Fresh Wheat",
                "category": "CROPS",
                "quantity": Decimal("100"),
                "unit": "KG",
                "price": Decimal("2500"),
                "currency": "INR",
                "location": "Mandya, Karnataka",
                "district": "Mandya",
                "state": "Karnataka",
                "status": "ACTIVE",
                "images": ["listings/usr_farmer_1/wheat.jpg"],
                "createdAt": "2026-10-08T12:00:00+00:00",
                "updatedAt": "2026-10-08T12:00:00+00:00",
                "GSI1PK": "MARKETPLACE",
                "GSI1SK": "STATUS#ACTIVE#CREATED#2026-10-08T12:00:00+00:00",
                "GSI2PK": "SELLER#usr_farmer_1",
                "GSI2SK": "CREATED#2026-10-08T12:00:00+00:00",
            },
            {
                "PK": "LISTING#list_002",
                "SK": "METADATA",
                "entityType": "LISTING",
                "listingId": "list_002",
                "sellerId": "usr_farmer_2",
                "sellerRole": "FARMER",
                "title": "Organic Mustard",
                "category": "CROPS",
                "quantity": Decimal("50"),
                "unit": "KG",
                "price": Decimal("3000"),
                "currency": "INR",
                "location": "Alwar, Rajasthan",
                "district": "Alwar",
                "state": "Rajasthan",
                "status": "ACTIVE",
                "images": [],
                "createdAt": "2026-10-08T11:00:00+00:00",
                "updatedAt": "2026-10-08T11:00:00+00:00",
                "GSI1PK": "MARKETPLACE",
                "GSI1SK": "STATUS#ACTIVE#CREATED#2026-10-08T11:00:00+00:00",
                "GSI2PK": "SELLER#usr_farmer_2",
                "GSI2SK": "CREATED#2026-10-08T11:00:00+00:00",
            },
        ]
        last_eval_key = {
            "GSI1PK": "MARKETPLACE",
            "GSI1SK": "STATUS#ACTIVE#CREATED#2026-10-08T11:00:00+00:00",
            "PK": "LISTING#list_002",
            "SK": "METADATA",
        }
        mock_repo.query_gsi1.return_value = (mock_raw_items, last_eval_key)

        res = service.list_listings({"category": "CROPS"})

        # Pagination envelope preserves LastEvaluatedKey for DynamoDB continuation
        assert res["lastEvaluatedKey"] == last_eval_key
        assert "cursor" in res

        # Each listing item in the collection must be free of internal persistence/index fields
        for item in res["listings"]:
            for forbidden_field in ("PK", "SK", "entityType", "GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK", "gsi1Pk", "gsi1Sk", "gsi2Pk", "gsi2Sk"):
                assert forbidden_field not in item, f"Found forbidden internal field '{forbidden_field}' in serialized listing {item.get('listingId')}"

            # Verify business fields are preserved
            assert "listingId" in item
            assert "title" in item
            assert "price" in item
            assert "images" in item
            assert "imageUrls" in item
            assert "imageKeys" in item
            assert "imageDetails" in item

    def test_get_listing_by_id_excludes_internal_fields(self, service, mock_repo):
        """GET /listings/{id} response item does not contain PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK."""
        mock_db_item = {
            "PK": "LISTING#list_single_test",
            "SK": "METADATA",
            "entityType": "LISTING",
            "listingId": "list_single_test",
            "sellerId": "usr_seller_single",
            "sellerRole": "FARMER",
            "title": "Fresh Tomatoes",
            "description": "Vine ripened tomatoes",
            "category": "CROPS",
            "quantity": Decimal("200"),
            "unit": "KG",
            "price": Decimal("3500"),
            "currency": "INR",
            "location": "Kolar, Karnataka",
            "district": "Kolar",
            "state": "Karnataka",
            "status": "ACTIVE",
            "images": ["listings/usr_seller_single/tomato.jpg"],
            "createdAt": "2026-10-08T08:00:00+00:00",
            "updatedAt": "2026-10-08T08:00:00+00:00",
            "GSI1PK": "MARKETPLACE",
            "GSI1SK": "STATUS#ACTIVE#CREATED#2026-10-08T08:00:00+00:00",
            "GSI2PK": "SELLER#usr_seller_single",
            "GSI2SK": "CREATED#2026-10-08T08:00:00+00:00",
        }
        mock_repo.get_by_id.return_value = mock_db_item

        result = service.get_listing_by_id("list_single_test")

        for forbidden in ("PK", "SK", "entityType", "GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK", "gsi1Pk", "gsi1Sk", "gsi2Pk", "gsi2Sk"):
            assert forbidden not in result, f"Field '{forbidden}' should not be in get_listing_by_id result"

        assert result["listingId"] == "list_single_test"
        assert result["title"] == "Fresh Tomatoes"
        assert result["images"] == ["https://s3.example.com/listings/usr_seller_single/tomato.jpg"]
