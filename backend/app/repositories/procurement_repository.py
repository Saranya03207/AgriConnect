from decimal import Decimal
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple
from app.models.rfq import RFQ, RFQResponse, RFQResponseStatus, RFQStatus
from app.repositories.dynamodb_repo import DynamoDBRepository, get_dynamodb_repository
from app.utils.errors import NotFoundError, ValidationError
from app.utils.logging import get_logger

logger = get_logger("procurement-repo")


class ProcurementRepository:
    """
    DynamoDB Repository for AgriConnect Procurement / Request for Quotation (RFQ).
    Uses single-table design on 'AgriConnect-Main'.

    Primary RFQ Item:
      PK: RFQ#{rfqId}
      SK: METADATA

    Buyer Index Item:
      PK: USER#{buyerId}
      SK: RFQ#{createdAt}#{rfqId}

    RFQ Response Child Item:
      PK: RFQ#{rfqId}
      SK: RESPONSE#{createdAt}#{responseId}

    Seller Index Item:
      PK: USER#{sellerId}
      SK: RFQ_RESPONSE#{createdAt}#{responseId}

    Response Pointer Item:
      PK: RESPONSE#{responseId}
      SK: METADATA
    """

    def __init__(self, repo: Optional[DynamoDBRepository] = None):
        self._repo = repo or get_dynamodb_repository()

    @property
    def repo(self) -> DynamoDBRepository:
        return self._repo

    # -------------------------------------------------------------------------
    # RFQ Operations
    # -------------------------------------------------------------------------

    def save_rfq(self, rfq: RFQ) -> Dict[str, Any]:
        """
        Saves the primary RFQ item, the buyer's index item, and the base-table marketplace index item (if OPEN).
        """
        primary_item = rfq.to_item()
        buyer_index_item = rfq.to_buyer_index_item()

        self._repo.put_item(item=primary_item)
        self._repo.put_item(item=buyer_index_item)

        # Base-table marketplace index for OPEN RFQs
        if rfq.status.upper() == RFQStatus.OPEN.value:
            marketplace_item = rfq.to_marketplace_index_item()
            self._repo.put_item(item=marketplace_item)

        return primary_item

    def remove_marketplace_index(self, rfq_id: str, created_at: str) -> None:
        """
        Removes the RFQ from the OPEN marketplace discovery partition:
          PK = PROCUREMENT_MARKETPLACE
          SK = OPEN#{createdAt}#{rfqId}
        """
        clean_id = rfq_id.strip()
        key = {
            "PK": "PROCUREMENT_MARKETPLACE",
            "SK": f"OPEN#{created_at}#{clean_id}",
        }
        try:
            self._repo.delete_item(key=key)
        except Exception as e:
            logger.warning(f"Could not remove marketplace index for RFQ {rfq_id}: {e}")

    def get_rfq_by_id(self, rfq_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves primary RFQ item by rfqId.
        """
        clean_id = rfq_id.strip()
        key = {
            "PK": f"RFQ#{clean_id}" if not clean_id.startswith("RFQ#") else clean_id,
            "SK": "METADATA",
        }
        return self._repo.get_item(key=key)

    def update_rfq(
        self,
        rfq_id: str,
        buyer_id: str,
        created_at: str,
        updates: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Updates an editable RFQ item and synchronously keeps the buyer index item and
        base-table marketplace index item aligned.
        """
        clean_id = rfq_id.strip()
        primary_key = {
            "PK": f"RFQ#{clean_id}" if not clean_id.startswith("RFQ#") else clean_id,
            "SK": "METADATA",
        }

        clean_buyer = buyer_id.strip()
        buyer_pk = clean_buyer if clean_buyer.startswith("USER#") else f"USER#{clean_buyer}"
        index_key = {
            "PK": buyer_pk,
            "SK": f"RFQ#{created_at}#{clean_id}",
        }
        marketplace_key = {
            "PK": "PROCUREMENT_MARKETPLACE",
            "SK": f"OPEN#{created_at}#{clean_id}",
        }

        field_mapping = {
            "title": "title",
            "description": "description",
            "productCategory": "productCategory",
            "product_category": "productCategory",
            "productName": "productName",
            "product_name": "productName",
            "subcategory": "subcategory",
            "quantity": "quantity",
            "unit": "unit",
            "preferredLocation": "preferredLocation",
            "preferred_location": "preferredLocation",
            "preferredDistrict": "preferredDistrict",
            "preferred_district": "preferredDistrict",
            "preferredState": "preferredState",
            "preferred_state": "preferredState",
            "requiredByDate": "requiredByDate",
            "required_by_date": "requiredByDate",
            "targetPrice": "targetPrice",
            "target_price": "targetPrice",
            "currency": "currency",
            "qualityRequirements": "qualityRequirements",
            "quality_requirements": "qualityRequirements",
            "additionalRequirements": "additionalRequirements",
            "additional_requirements": "additionalRequirements",
            "status": "status",
            "updatedAt": "updatedAt",
            "updated_at": "updatedAt",
        }

        update_parts = []
        attr_names = {}
        attr_values = {}

        for key_name, attr_name in field_mapping.items():
            if key_name in updates and updates[key_name] is not None:
                token_name = f"#{attr_name}"
                token_val = f":{attr_name}"
                if token_name not in attr_names:
                    val = updates[key_name]
                    if attr_name in ("quantity", "targetPrice") and isinstance(val, (int, float)):
                        val = Decimal(str(val))
                    elif attr_name in ("unit", "productCategory", "status", "currency") and isinstance(val, str):
                        val = val.upper()
                    update_parts.append(f"{token_name} = {token_val}")
                    attr_names[token_name] = attr_name
                    attr_values[token_val] = val

        if not update_parts:
            raise ValidationError("No valid fields provided for RFQ update")

        update_expr = "SET " + ", ".join(update_parts)

        # Update primary item
        updated_attributes = self._repo.update_item(
            key=primary_key,
            update_expression=update_expr,
            expression_attribute_names=attr_names,
            expression_attribute_values=attr_values,
            return_values="ALL_NEW",
        )

        # Update buyer index item
        try:
            self._repo.update_item(
                key=index_key,
                update_expression=update_expr,
                expression_attribute_names=attr_names,
                expression_attribute_values=attr_values,
                return_values="NONE",
            )
        except Exception as e:
            logger.warning(f"Buyer index item update encountered non-critical error: {e}")

        # Marketplace index lifecycle:
        # If status is updated to non-OPEN (e.g. CANCELLED, CLOSED, FULFILLED), delete from marketplace index
        new_status = updates.get("status")
        if new_status and str(new_status).upper() != "OPEN":
            self.remove_marketplace_index(rfq_id, created_at)
        else:
            # If still OPEN (or reopened), keep marketplace index item in sync
            try:
                self._repo.update_item(
                    key=marketplace_key,
                    update_expression=update_expr,
                    expression_attribute_names=attr_names,
                    expression_attribute_values=attr_values,
                    return_values="NONE",
                )
            except Exception as e:
                logger.warning(f"Marketplace index item update non-critical warning: {e}")

        return updated_attributes or {}

    def list_rfqs(
        self,
        status: Optional[str] = "OPEN",
        product_category: Optional[str] = None,
        preferred_state: Optional[str] = None,
        preferred_district: Optional[str] = None,
        limit: int = 50,
        exclusive_start_key: Optional[Dict[str, Any]] = None,
    ) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Queries marketplace RFQs using the base-table marketplace partition:
          PK = PROCUREMENT_MARKETPLACE
          SK begins_with OPEN#
        Applies optional FilterExpressions for:
          productCategory, preferredState, preferredDistrict, status.
        Preserves cursor pagination using LastEvaluatedKey.
        NO DynamoDB Scan is used!
        """
        sk_prefix = "OPEN#"
        key_condition = "#pk = :pk_val AND begins_with(#sk, :sk_prefix)"
        attr_names: Dict[str, str] = {
            "#pk": "PK",
            "#sk": "SK",
        }
        attr_values: Dict[str, Any] = {
            ":pk_val": "PROCUREMENT_MARKETPLACE",
            ":sk_prefix": sk_prefix,
        }

        filter_clauses = []
        if product_category and product_category.strip():
            filter_clauses.append("#cat = :cat_val")
            attr_names["#cat"] = "productCategory"
            attr_values[":cat_val"] = product_category.strip().upper()

        if preferred_state and preferred_state.strip():
            filter_clauses.append("#state = :state_val")
            attr_names["#state"] = "preferredState"
            attr_values[":state_val"] = preferred_state.strip()

        if preferred_district and preferred_district.strip():
            filter_clauses.append("#district = :district_val")
            attr_names["#district"] = "preferredDistrict"
            attr_values[":district_val"] = preferred_district.strip()

        if status and status.strip() and status.strip().upper() not in ("ALL", "OPEN"):
            filter_clauses.append("#status = :status_val")
            attr_names["#status"] = "status"
            attr_values[":status_val"] = status.strip().upper()

        filter_expr = " AND ".join(filter_clauses) if filter_clauses else None

        return self._repo.query(
            key_condition_expression=key_condition,
            expression_attribute_names=attr_names,
            expression_attribute_values=attr_values,
            filter_expression=filter_expr,
            scan_index_forward=False,  # Newest first
            limit=limit,
            exclusive_start_key=exclusive_start_key,
        )

    def list_buyer_rfqs(
        self,
        buyer_id: str,
        limit: int = 50,
        exclusive_start_key: Optional[Dict[str, Any]] = None,
    ) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Queries buyer partition directly (PK = USER#{buyerId} AND SK begins_with 'RFQ#').
        Provides efficient, scan-free listing of user's own RFQs ordered newest first.
        """
        clean_buyer = buyer_id.strip()
        user_pk = clean_buyer if clean_buyer.startswith("USER#") else f"USER#{clean_buyer}"

        key_condition = "#pk = :user_pk AND begins_with(#sk, :sk_prefix)"
        attr_names = {
            "#pk": "PK",
            "#sk": "SK",
        }
        attr_values = {
            ":user_pk": user_pk,
            ":sk_prefix": "RFQ#",
        }

        return self._repo.query(
            key_condition_expression=key_condition,
            expression_attribute_names=attr_names,
            expression_attribute_values=attr_values,
            scan_index_forward=False,  # Newest first
            limit=limit,
            exclusive_start_key=exclusive_start_key,
        )

    # -------------------------------------------------------------------------
    # Response (Quotation) Operations
    # -------------------------------------------------------------------------

    def save_response(self, response: RFQResponse) -> Dict[str, Any]:
        """
        Saves the quotation response child item, seller index item, and fast-lookup pointer item.
        """
        child_item = response.to_item()
        seller_index_item = response.to_seller_index_item()
        pointer_item = response.to_pointer_item()

        self._repo.put_item(item=child_item)
        self._repo.put_item(item=seller_index_item)
        self._repo.put_item(item=pointer_item)
        return child_item

    def get_response_by_id(self, response_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches an RFQ response using pointer item followed by child item lookup.
        Fast O(1) GetItem without full-table scan.
        """
        clean_res_id = response_id.strip()
        pointer = self._repo.get_item(key={"PK": f"RESPONSE#{clean_res_id}", "SK": "METADATA"})
        if not pointer:
            return None

        rfq_id = pointer.get("rfqId")
        created_at = pointer.get("createdAt")
        if not rfq_id or not created_at:
            return pointer

        # Fetch authoritative child item
        child_key = {
            "PK": f"RFQ#{rfq_id}",
            "SK": f"RESPONSE#{created_at}#{clean_res_id}",
        }
        child = self._repo.get_item(key=child_key)
        return child or pointer

    def list_responses_for_rfq(self, rfq_id: str) -> List[Dict[str, Any]]:
        """
        Queries all quotation responses for an RFQ partition:
        PK = RFQ#{rfqId} AND begins_with(SK, 'RESPONSE#').
        """
        clean_id = rfq_id.strip()
        rfq_pk = clean_id if clean_id.startswith("RFQ#") else f"RFQ#{clean_id}"

        key_condition = "#pk = :rfq_pk AND begins_with(#sk, :sk_prefix)"
        attr_names = {
            "#pk": "PK",
            "#sk": "SK",
        }
        attr_values = {
            ":rfq_pk": rfq_pk,
            ":sk_prefix": "RESPONSE#",
        }

        items, _ = self._repo.query(
            key_condition_expression=key_condition,
            expression_attribute_names=attr_names,
            expression_attribute_values=attr_values,
            scan_index_forward=False,  # Newest first
            limit=100,
        )
        return items

    def list_seller_responses(
        self,
        seller_id: str,
        limit: int = 50,
        exclusive_start_key: Optional[Dict[str, Any]] = None,
    ) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Queries seller partition directly (PK = USER#{sellerId} AND SK begins_with 'RFQ_RESPONSE#').
        """
        clean_seller = seller_id.strip()
        user_pk = clean_seller if clean_seller.startswith("USER#") else f"USER#{clean_seller}"

        key_condition = "#pk = :user_pk AND begins_with(#sk, :sk_prefix)"
        attr_names = {
            "#pk": "PK",
            "#sk": "SK",
        }
        attr_values = {
            ":user_pk": user_pk,
            ":sk_prefix": "RFQ_RESPONSE#",
        }

        return self._repo.query(
            key_condition_expression=key_condition,
            expression_attribute_names=attr_names,
            expression_attribute_values=attr_values,
            scan_index_forward=False,
            limit=limit,
            exclusive_start_key=exclusive_start_key,
        )

    def update_response_status(
        self,
        rfq_id: str,
        response_id: str,
        created_at: str,
        seller_id: str,
        new_status: str,
        updated_at: str,
    ) -> Dict[str, Any]:
        """
        Updates the status of a response across its child item, seller index item, and pointer item.
        """
        clean_rfq = rfq_id.strip()
        clean_res = response_id.strip()
        clean_seller = seller_id.strip()

        child_key = {
            "PK": f"RFQ#{clean_rfq}" if not clean_rfq.startswith("RFQ#") else clean_rfq,
            "SK": f"RESPONSE#{created_at}#{clean_res}",
        }
        seller_pk = clean_seller if clean_seller.startswith("USER#") else f"USER#{clean_seller}"
        index_key = {
            "PK": seller_pk,
            "SK": f"RFQ_RESPONSE#{created_at}#{clean_res}",
        }
        pointer_key = {
            "PK": f"RESPONSE#{clean_res}",
            "SK": "METADATA",
        }

        update_expr = "SET #status = :status_val, #updated = :updated_val"
        attr_names = {
            "#status": "status",
            "#updated": "updatedAt",
        }
        attr_values = {
            ":status_val": new_status.upper(),
            ":updated_val": updated_at,
        }

        updated = self._repo.update_item(
            key=child_key,
            update_expression=update_expr,
            expression_attribute_names=attr_names,
            expression_attribute_values=attr_values,
            return_values="ALL_NEW",
        )

        try:
            self._repo.update_item(
                key=index_key,
                update_expression=update_expr,
                expression_attribute_names=attr_names,
                expression_attribute_values=attr_values,
                return_values="NONE",
            )
        except Exception as e:
            logger.warning(f"Seller index update non-critical warning: {e}")

        try:
            self._repo.update_item(
                key=pointer_key,
                update_expression=update_expr,
                expression_attribute_names=attr_names,
                expression_attribute_values=attr_values,
                return_values="NONE",
            )
        except Exception as e:
            logger.warning(f"Pointer update non-critical warning: {e}")

        return updated or {}


@lru_cache(maxsize=1)
def get_procurement_repository() -> ProcurementRepository:
    """Returns singleton instance of ProcurementRepository."""
    return ProcurementRepository()
