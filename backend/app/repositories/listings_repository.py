from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple
from app.repositories.dynamodb_repo import DynamoDBRepository, get_dynamodb_repository
from app.utils.errors import NotFoundError, ValidationError
from app.utils.logging import get_logger

logger = get_logger("listings-repo")


class ListingsRepository:
    """
    DynamoDB Repository abstraction for Agricultural Marketplace Listings.
    Single-table entity schema:
      PK: LISTING#<listingId>
      SK: METADATA
    """

    def __init__(self, repo: Optional[DynamoDBRepository] = None):
        self._repo = repo or get_dynamodb_repository()

    @property
    def repo(self) -> DynamoDBRepository:
        return self._repo

    def get_by_id(self, listing_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a listing item by listingId.
        Returns None if not found.
        """
        key = {
            "PK": f"LISTING#{listing_id}",
            "SK": "METADATA",
        }
        return self._repo.get_item(key=key)

    def save(self, listing_item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Persists a new or replaced listing item to DynamoDB.
        """
        return self._repo.put_item(item=listing_item)

    def update(self, listing_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates allowed attributes of an existing listing item.
        """
        key = {
            "PK": f"LISTING#{listing_id}",
            "SK": "METADATA",
        }

        # Map of model field name to DynamoDB attribute name
        field_mapping = {
            "title": "title",
            "description": "description",
            "category": "category",
            "subcategory": "subcategory",
            "itemType": "itemType",
            "item_type": "itemType",
            "quantity": "quantity",
            "unit": "unit",
            "price": "price",
            "currency": "currency",
            "location": "location",
            "district": "district",
            "state": "state",
            "latitude": "latitude",
            "longitude": "longitude",
            "quality": "quality",
            "availability": "availability",
            "images": "images",
            "status": "status",
            "updatedAt": "updatedAt",
            "updated_at": "updatedAt",
            # Phase 3 GSI Indexing Attributes
            "GSI1PK": "GSI1PK",
            "GSI1SK": "GSI1SK",
            "GSI2PK": "GSI2PK",
            "GSI2SK": "GSI2SK",
        }

        update_parts = []
        attr_names = {}
        attr_values = {}

        for key_name, attr_name in field_mapping.items():
            if key_name in updates and updates[key_name] is not None:
                token_name = f"#{attr_name}"
                token_val = f":{attr_name}"
                if token_name not in attr_names:
                    update_parts.append(f"{token_name} = {token_val}")
                    attr_names[token_name] = attr_name
                    attr_values[token_val] = updates[key_name]

        if not update_parts:
            raise ValidationError("No valid fields provided for listing update")

        update_expr = "SET " + ", ".join(update_parts)

        updated_attributes = self._repo.update_item(
            key=key,
            update_expression=update_expr,
            expression_attribute_names=attr_names,
            expression_attribute_values=attr_values,
            return_values="ALL_NEW",
        )
        return updated_attributes or {}

    def delete(self, listing_id: str) -> bool:
        """
        Deletes a listing item by primary key.
        """
        key = {
            "PK": f"LISTING#{listing_id}",
            "SK": "METADATA",
        }
        return self._repo.delete_item(key=key)

    def query_gsi1(
        self,
        gsi1_pk: str,
        status: Optional[str] = "ACTIVE",
        limit: int = 50,
        scan_index_forward: bool = False,
        exclusive_start_key: Optional[Dict[str, Any]] = None,
        filter_expression: Optional[Any] = None,
        expression_attribute_names: Optional[Dict[str, str]] = None,
        expression_attribute_values: Optional[Dict[str, Any]] = None,
    ) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Queries GSI1 (Marketplace Discovery).
        Key condition:
          GSI1PK = :gsi1pk
          AND begins_with(GSI1SK, :gsi1sk_prefix) (when status filter active)
        Default sort order: newest first (scan_index_forward=False).
        """
        attr_names: Dict[str, str] = {
            "#gsi1pk": "GSI1PK",
        }
        attr_values: Dict[str, Any] = {
            ":gsi1pk": gsi1_pk,
        }

        if status and status.upper() != "ALL":
            key_condition = "#gsi1pk = :gsi1pk AND begins_with(#gsi1sk, :gsi1sk_prefix)"
            attr_names["#gsi1sk"] = "GSI1SK"
            attr_values[":gsi1sk_prefix"] = f"STATUS#{status.strip().upper()}#"
        else:
            key_condition = "#gsi1pk = :gsi1pk"

        # Merge additional filter attributes if provided (e.g. district, state, sellerRole)
        if expression_attribute_names:
            attr_names.update(expression_attribute_names)
        if expression_attribute_values:
            attr_values.update(expression_attribute_values)

        return self._repo.query(
            key_condition_expression=key_condition,
            index_name="GSI1",
            expression_attribute_names=attr_names,
            expression_attribute_values=attr_values,
            filter_expression=filter_expression,
            scan_index_forward=scan_index_forward,
            limit=limit,
            exclusive_start_key=exclusive_start_key,
        )

    def query_gsi2(
        self,
        seller_id: str,
        limit: int = 50,
        scan_index_forward: bool = False,
        exclusive_start_key: Optional[Dict[str, Any]] = None,
        filter_expression: Optional[Any] = None,
        expression_attribute_names: Optional[Dict[str, str]] = None,
        expression_attribute_values: Optional[Dict[str, Any]] = None,
    ) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Queries GSI2 (Seller Ownership / My Listings).
        Key condition:
          GSI2PK = :gsi2pk (SELLER#<sellerId>)
          AND begins_with(GSI2SK, :gsi2sk_prefix) (CREATED#)
        Default sort order: newest first (scan_index_forward=False).
        """
        clean_id = seller_id.strip()
        gsi2_pk = clean_id if clean_id.startswith("SELLER#") else f"SELLER#{clean_id}"

        attr_names: Dict[str, str] = {
            "#gsi2pk": "GSI2PK",
            "#gsi2sk": "GSI2SK",
        }
        attr_values: Dict[str, Any] = {
            ":gsi2pk": gsi2_pk,
            ":gsi2sk_prefix": "CREATED#",
        }
        key_condition = "#gsi2pk = :gsi2pk AND begins_with(#gsi2sk, :gsi2sk_prefix)"

        if expression_attribute_names:
            attr_names.update(expression_attribute_names)
        if expression_attribute_values:
            attr_values.update(expression_attribute_values)

        return self._repo.query(
            key_condition_expression=key_condition,
            index_name="GSI2",
            expression_attribute_names=attr_names,
            expression_attribute_values=attr_values,
            filter_expression=filter_expression,
            scan_index_forward=scan_index_forward,
            limit=limit,
            exclusive_start_key=exclusive_start_key,
        )

    def list_listings(
        self,
        status: Optional[str] = "ACTIVE",
        category: Optional[str] = None,
        district: Optional[str] = None,
        state: Optional[str] = None,
        seller_role: Optional[str] = None,
        limit: int = 50,
        exclusive_start_key: Optional[Dict[str, Any]] = None,
    ) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Isolated listing search/scan implementation.
        Scans single-table items matching PK begins_with 'LISTING#' and SK = 'METADATA'.
        Applies optional filters on status, category, district, state, and sellerRole.

        NOTE: This scan logic is strictly isolated in the repository layer to facilitate
        seamless migration to Global Secondary Indexes (GSIs) when access patterns
        and GSI infrastructure are introduced in future phases.
        """
        filter_clauses = ["begins_with(#pk, :pk_prefix)", "#sk = :sk_val"]
        attr_names: Dict[str, str] = {
            "#pk": "PK",
            "#sk": "SK",
        }
        attr_values: Dict[str, Any] = {
            ":pk_prefix": "LISTING#",
            ":sk_val": "METADATA",
        }

        if status:
            filter_clauses.append("#status = :status_val")
            attr_names["#status"] = "status"
            attr_values[":status_val"] = status.upper()

        if category:
            filter_clauses.append("#category = :cat_val")
            attr_names["#category"] = "category"
            attr_values[":cat_val"] = category.upper()

        if district:
            filter_clauses.append("#district = :district_val")
            attr_names["#district"] = "district"
            attr_values[":district_val"] = district

        if state:
            filter_clauses.append("#state = :state_val")
            attr_names["#state"] = "state"
            attr_values[":state_val"] = state

        if seller_role:
            filter_clauses.append("#sellerRole = :role_val")
            attr_names["#sellerRole"] = "sellerRole"
            attr_values[":role_val"] = seller_role.upper()

        filter_expr = " AND ".join(filter_clauses)

        items, last_key = self._repo.scan(
            filter_expression=filter_expr,
            expression_attribute_names=attr_names,
            expression_attribute_values=attr_values,
            limit=limit,
            exclusive_start_key=exclusive_start_key,
        )

        return items, last_key


@lru_cache(maxsize=1)
def get_listings_repository() -> ListingsRepository:
    """Returns singleton instance of ListingsRepository."""
    return ListingsRepository()

