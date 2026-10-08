import base64
from datetime import datetime, timezone
from decimal import Decimal
import json
from typing import Any, Dict, List, Optional
import uuid
from pydantic import ValidationError as PydanticValidationError

from app.auth.cognito import UserClaims
from app.models.rfq import RFQ, RFQResponse, RFQResponseStatus, RFQStatus
from app.repositories.procurement_repository import ProcurementRepository, get_procurement_repository
from app.schemas.procurement import (
    CreateRFQRequest,
    CreateRFQResponseRequest,
    UpdateRFQRequest,
)
from app.utils.errors import ForbiddenError, NotFoundError, ValidationError
from app.utils.logging import get_logger

logger = get_logger("procurement-service")

# Roles eligible to create RFQs
BUYER_ROLES = {"BUYER", "PROCESSOR", "ADMIN"}

# Roles eligible to submit quotations
SELLER_ROLES = {
    "FARMER",
    "SEED_PRODUCER",
    "BYPRODUCT_SELLER",
    "BY_PRODUCT_SELLER",
    "PROCESSOR",
    "SERVICE_PROVIDER",
    "ADMIN",
}


class ProcurementService:
    """
    Business service layer managing procurement requests (RFQs) and quotation responses.
    Enforces business validation, Cognito identity ownership, DynamoDB persistence,
    and role authorization.
    """

    def __init__(self, repo: Optional[ProcurementRepository] = None):
        self.repo = repo or get_procurement_repository()

    # -------------------------------------------------------------------------
    # Cursor Pagination Helpers
    # -------------------------------------------------------------------------

    @staticmethod
    def _parse_cursor(cursor_str: Optional[str]) -> Optional[Dict[str, Any]]:
        if not cursor_str or not isinstance(cursor_str, str):
            return None
        cursor_str = cursor_str.strip()
        if not cursor_str:
            return None

        # 1. Direct JSON parse
        try:
            parsed = json.loads(cursor_str)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

        # 2. URL-safe Base64 decode
        try:
            padded = cursor_str + "=" * ((4 - len(cursor_str) % 4) % 4)
            decoded_bytes = base64.urlsafe_b64decode(padded.encode("utf-8"))
            parsed = json.loads(decoded_bytes.decode("utf-8"))
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

        # 3. Standard Base64 decode
        try:
            padded = cursor_str + "=" * ((4 - len(cursor_str) % 4) % 4)
            decoded_bytes = base64.b64decode(padded.encode("utf-8"))
            parsed = json.loads(decoded_bytes.decode("utf-8"))
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

        return None

    @staticmethod
    def _encode_cursor(key_dict: Optional[Dict[str, Any]]) -> Optional[str]:
        if not key_dict or not isinstance(key_dict, dict):
            return None

        def _json_default(obj: Any) -> Any:
            if isinstance(obj, Decimal):
                return int(obj) if obj % 1 == 0 else float(obj)
            raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

        try:
            json_bytes = json.dumps(key_dict, default=_json_default).encode("utf-8")
            return base64.urlsafe_b64encode(json_bytes).decode("utf-8")
        except Exception as e:
            logger.warning(f"Failed to encode pagination cursor: {e}")
            return None

    # -------------------------------------------------------------------------
    # Sanitization Helpers (Strip DynamoDB internal keys from API response)
    # -------------------------------------------------------------------------

    @staticmethod
    def _sanitize_rfq(item: Dict[str, Any]) -> Dict[str, Any]:
        """Converts raw DynamoDB item to public API dictionary without internal keys."""
        def _to_float(v: Any) -> Optional[float]:
            if v is None:
                return None
            return float(v)

        return {
            "rfqId": item.get("rfqId", ""),
            "buyerId": item.get("buyerId", ""),
            "buyerRole": item.get("buyerRole", "BUYER"),
            "title": item.get("title", ""),
            "description": item.get("description", ""),
            "productCategory": item.get("productCategory", ""),
            "productName": item.get("productName", ""),
            "subcategory": item.get("subcategory"),
            "quantity": _to_float(item.get("quantity")) or 0.0,
            "unit": item.get("unit", "KG"),
            "preferredLocation": item.get("preferredLocation"),
            "preferredDistrict": item.get("preferredDistrict", ""),
            "preferredState": item.get("preferredState", ""),
            "requiredByDate": item.get("requiredByDate", ""),
            "targetPrice": _to_float(item.get("targetPrice")),
            "currency": item.get("currency", "INR"),
            "qualityRequirements": item.get("qualityRequirements"),
            "additionalRequirements": item.get("additionalRequirements"),
            "status": item.get("status", RFQStatus.OPEN.value),
            "createdAt": item.get("createdAt", ""),
            "updatedAt": item.get("updatedAt", ""),
        }

    @staticmethod
    def _sanitize_response(item: Dict[str, Any]) -> Dict[str, Any]:
        """Converts raw quotation item to public API dictionary without internal keys."""
        def _to_float(v: Any) -> float:
            if v is None:
                return 0.0
            return float(v)

        return {
            "responseId": item.get("responseId", ""),
            "rfqId": item.get("rfqId", ""),
            "sellerId": item.get("sellerId", ""),
            "sellerRole": item.get("sellerRole", "FARMER"),
            "proposedQuantity": _to_float(item.get("proposedQuantity")),
            "unit": item.get("unit", "KG"),
            "unitPrice": _to_float(item.get("unitPrice")),
            "currency": item.get("currency", "INR"),
            "availableDate": item.get("availableDate", ""),
            "remarks": item.get("remarks"),
            "status": item.get("status", RFQResponseStatus.SUBMITTED.value),
            "createdAt": item.get("createdAt", ""),
            "updatedAt": item.get("updatedAt", ""),
        }

    # -------------------------------------------------------------------------
    # RFQ Operations
    # -------------------------------------------------------------------------

    def create_rfq(self, user_claims: UserClaims, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a new RFQ.
        SECURITY:
          - buyerId is strictly populated from authenticated user's Cognito sub.
          - buyerRole is populated from verified user role.
          - Status is strictly initialized to OPEN.
          - Client-supplied IDs, PK, SK, or status are discarded.
        """
        user_role = user_claims.role.upper()
        if user_role not in BUYER_ROLES and not user_claims.is_admin():
            raise ForbiddenError(f"Role '{user_claims.role}' is not authorized to create procurement requests")

        try:
            req = CreateRFQRequest(**payload)
        except PydanticValidationError as e:
            errors = e.errors()
            clean_errors = [
                {
                    "field": ".".join(str(x) for x in err.get("loc", [])),
                    "message": str(err.get("msg", "")),
                    "type": str(err.get("type", "")),
                }
                for err in errors
            ]
            first_err = errors[0] if errors else {}
            field_name = ".".join(str(x) for x in first_err.get("loc", []))
            err_msg = first_err.get("msg", "Validation failed")
            msg = f"Field '{field_name}' invalid: {err_msg}" if field_name else err_msg
            raise ValidationError(f"Invalid procurement request data: {msg}", details={"validation_errors": clean_errors})

        rfq_id = f"rfq_{uuid.uuid4().hex[:16]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        rfq = RFQ(
            rfq_id=rfq_id,
            buyer_id=user_claims.user_id,
            buyer_role=user_claims.role,
            title=req.title,
            description=req.description,
            product_category=req.product_category,
            product_name=req.product_name,
            subcategory=req.subcategory,
            quantity=req.quantity,
            unit=req.unit,
            preferred_location=req.preferred_location,
            preferred_district=req.preferred_district,
            preferred_state=req.preferred_state,
            required_by_date=req.required_by_date,
            target_price=req.target_price,
            currency=req.currency,
            quality_requirements=req.quality_requirements,
            additional_requirements=req.additional_requirements,
            status=RFQStatus.OPEN.value,
            created_at=now_iso,
            updated_at=now_iso,
        )

        self.repo.save_rfq(rfq)
        logger.info(f"Created RFQ {rfq_id} for buyer {user_claims.user_id}")
        return self._sanitize_rfq(rfq.to_item())

    def list_rfqs(self, user_claims: UserClaims, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Lists procurement requests for marketplace discovery.
        Defaults to status=OPEN.
        Supports filtering by status, productCategory, preferredState, preferredDistrict.
        """
        params = params or {}
        raw_status = params.get("status")
        if raw_status is None or raw_status == "":
            status = RFQStatus.OPEN.value
        elif raw_status.upper() == "ALL":
            status = None
        else:
            status = raw_status.upper()

        product_category = params.get("productCategory") or params.get("product_category")
        preferred_state = params.get("preferredState") or params.get("preferred_state") or params.get("state")
        preferred_district = params.get("preferredDistrict") or params.get("preferred_district") or params.get("district")

        try:
            limit = int(params.get("limit", 50))
            if limit < 1 or limit > 100:
                limit = 50
        except (ValueError, TypeError):
            limit = 50

        cursor_input = params.get("cursor") or params.get("lastEvaluatedKey")
        exclusive_start_key = self._parse_cursor(cursor_input)

        items, last_key = self.repo.list_rfqs(
            status=status,
            product_category=product_category,
            preferred_state=preferred_state,
            preferred_district=preferred_district,
            limit=limit,
            exclusive_start_key=exclusive_start_key,
        )

        sanitized_items = [self._sanitize_rfq(it) for it in items]
        next_cursor = self._encode_cursor(last_key)

        return {
            "items": sanitized_items,
            "cursor": next_cursor,
            "hasMore": bool(next_cursor),
            "totalCount": len(sanitized_items),
        }

    def get_rfq(self, user_claims: UserClaims, rfq_id: str) -> Dict[str, Any]:
        """
        Retrieves RFQ details.
        If current user is RFQ owner or ADMIN, attaches all quotation responses.
        """
        item = self.repo.get_rfq_by_id(rfq_id)
        if not item:
            raise NotFoundError(f"Procurement request '{rfq_id}' not found")

        rfq_data = self._sanitize_rfq(item)

        # Check authorization to see responses
        is_owner = (item.get("buyerId") == user_claims.user_id)
        is_admin = user_claims.is_admin()

        if is_owner or is_admin:
            responses = self.repo.list_responses_for_rfq(rfq_id)
            rfq_data["responses"] = [self._sanitize_response(r) for r in responses]

        return rfq_data

    def list_my_rfqs(self, user_claims: UserClaims, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Lists RFQs created by the authenticated buyer using the user-partition index.
        """
        params = params or {}
        try:
            limit = int(params.get("limit", 50))
            if limit < 1 or limit > 100:
                limit = 50
        except (ValueError, TypeError):
            limit = 50

        cursor_input = params.get("cursor") or params.get("lastEvaluatedKey")
        exclusive_start_key = self._parse_cursor(cursor_input)

        items, last_key = self.repo.list_buyer_rfqs(
            buyer_id=user_claims.user_id,
            limit=limit,
            exclusive_start_key=exclusive_start_key,
        )

        sanitized_items = [self._sanitize_rfq(it) for it in items]
        next_cursor = self._encode_cursor(last_key)

        return {
            "items": sanitized_items,
            "cursor": next_cursor,
            "hasMore": bool(next_cursor),
            "totalCount": len(sanitized_items),
        }

    def update_rfq(self, user_claims: UserClaims, rfq_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates editable fields of an OPEN RFQ.
        Only RFQ owner or ADMIN can update.
        """
        item = self.repo.get_rfq_by_id(rfq_id)
        if not item:
            raise NotFoundError(f"Procurement request '{rfq_id}' not found")

        is_owner = (item.get("buyerId") == user_claims.user_id)
        if not is_owner and not user_claims.is_admin():
            raise ForbiddenError("You are not authorized to update this procurement request")

        current_status = item.get("status", "").upper()
        if current_status != RFQStatus.OPEN.value:
            raise ValidationError(
                f"Cannot update procurement request with status '{current_status}'. "
                f"Only OPEN requests can be updated."
            )

        try:
            req = UpdateRFQRequest(**payload)
        except PydanticValidationError as e:
            errors = e.errors()
            clean_errors = [
                {
                    "field": ".".join(str(x) for x in err.get("loc", [])),
                    "message": str(err.get("msg", "")),
                    "type": str(err.get("type", "")),
                }
                for err in errors
            ]
            first_err = errors[0] if errors else {}
            field_name = ".".join(str(x) for x in first_err.get("loc", []))
            err_msg = first_err.get("msg", "Validation failed")
            msg = f"Field '{field_name}' invalid: {err_msg}" if field_name else err_msg
            raise ValidationError(f"Invalid update data: {msg}", details={"validation_errors": clean_errors})

        updates = req.model_dump(exclude_unset=True, by_alias=True)
        # Protect immutable attributes
        updates.pop("rfqId", None)
        updates.pop("buyerId", None)
        updates.pop("createdAt", None)
        updates.pop("status", None)

        if not updates:
            raise ValidationError("No updatable fields provided in request")

        now_iso = datetime.now(timezone.utc).isoformat()
        updates["updatedAt"] = now_iso

        updated_item = self.repo.update_rfq(
            rfq_id=rfq_id,
            buyer_id=item.get("buyerId", user_claims.user_id),
            created_at=item.get("createdAt", now_iso),
            updates=updates,
        )

        merged = {**item, **updated_item}
        logger.info(f"Updated RFQ {rfq_id} by user {user_claims.user_id}")
        return self._sanitize_rfq(merged)

    def cancel_rfq(self, user_claims: UserClaims, rfq_id: str) -> Dict[str, Any]:
        """
        Cancels an OPEN RFQ.
        Only RFQ owner or ADMIN can cancel.
        """
        item = self.repo.get_rfq_by_id(rfq_id)
        if not item:
            raise NotFoundError(f"Procurement request '{rfq_id}' not found")

        is_owner = (item.get("buyerId") == user_claims.user_id)
        if not is_owner and not user_claims.is_admin():
            raise ForbiddenError("You are not authorized to cancel this procurement request")

        current_status = item.get("status", "").upper()
        if current_status != RFQStatus.OPEN.value:
            raise ValidationError(
                f"Cannot cancel procurement request with status '{current_status}'. "
                f"Only OPEN requests can be cancelled."
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        updates = {
            "status": RFQStatus.CANCELLED.value,
            "updatedAt": now_iso,
        }

        updated_item = self.repo.update_rfq(
            rfq_id=rfq_id,
            buyer_id=item.get("buyerId", user_claims.user_id),
            created_at=item.get("createdAt", now_iso),
            updates=updates,
        )

        merged = {**item, **updated_item, "status": RFQStatus.CANCELLED.value}
        logger.info(f"Cancelled RFQ {rfq_id} by user {user_claims.user_id}")
        return self._sanitize_rfq(merged)

    # -------------------------------------------------------------------------
    # Response (Quotation) Operations
    # -------------------------------------------------------------------------

    def create_response(self, user_claims: UserClaims, rfq_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submits a seller quotation response for an OPEN RFQ.
        SECURITY:
          - sellerId strictly from Cognito JWT sub.
          - sellerRole from verified role claims.
          - Owner cannot respond to own RFQ.
          - RFQ must be OPEN.
          - Prevents duplicate active SUBMITTED responses from the same seller.
        """
        rfq_item = self.repo.get_rfq_by_id(rfq_id)
        if not rfq_item:
            raise NotFoundError(f"Procurement request '{rfq_id}' not found")

        # RFQ owner cannot respond to own RFQ
        if rfq_item.get("buyerId") == user_claims.user_id:
            raise ForbiddenError("You cannot submit a quotation response to your own procurement request")

        user_role = user_claims.role.upper()
        if user_role not in SELLER_ROLES and not user_claims.is_admin():
            raise ForbiddenError(f"Role '{user_claims.role}' is not authorized to submit quotations")

        rfq_status = rfq_item.get("status", "").upper()
        if rfq_status != RFQStatus.OPEN.value:
            raise ValidationError(
                f"Cannot submit quotation for procurement request with status '{rfq_status}'. "
                f"Quotations can only be submitted for OPEN requests."
            )

        try:
            req = CreateRFQResponseRequest(**payload)
        except PydanticValidationError as e:
            errors = e.errors()
            clean_errors = [
                {
                    "field": ".".join(str(x) for x in err.get("loc", [])),
                    "message": str(err.get("msg", "")),
                    "type": str(err.get("type", "")),
                }
                for err in errors
            ]
            first_err = errors[0] if errors else {}
            field_name = ".".join(str(x) for x in first_err.get("loc", []))
            err_msg = first_err.get("msg", "Validation failed")
            msg = f"Field '{field_name}' invalid: {err_msg}" if field_name else err_msg
            raise ValidationError(f"Invalid quotation data: {msg}", details={"validation_errors": clean_errors})

        # Check duplicate active responses from this seller
        existing_responses = self.repo.list_responses_for_rfq(rfq_id)
        for resp in existing_responses:
            if resp.get("sellerId") == user_claims.user_id:
                resp_status = resp.get("status", "").upper()
                if resp_status == RFQResponseStatus.SUBMITTED.value:
                    raise ValidationError(
                        "You already have an active submitted quotation for this procurement request. "
                        "Please withdraw it before submitting a new one."
                    )

        response_id = f"rfqr_{uuid.uuid4().hex[:16]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        response = RFQResponse(
            response_id=response_id,
            rfq_id=rfq_id,
            seller_id=user_claims.user_id,
            seller_role=user_claims.role,
            proposed_quantity=req.proposed_quantity,
            unit=req.unit,
            unit_price=req.unit_price,
            currency=req.currency,
            available_date=req.available_date,
            remarks=req.remarks,
            status=RFQResponseStatus.SUBMITTED.value,
            created_at=now_iso,
            updated_at=now_iso,
        )

        self.repo.save_response(response)
        logger.info(f"Submitted quotation {response_id} for RFQ {rfq_id} by seller {user_claims.user_id}")
        return self._sanitize_response(response.to_item())

    def list_rfq_responses(self, user_claims: UserClaims, rfq_id: str) -> Dict[str, Any]:
        """
        Retrieves all quotation responses for an RFQ.
        Restricted strictly to the RFQ owner or ADMIN.
        """
        rfq_item = self.repo.get_rfq_by_id(rfq_id)
        if not rfq_item:
            raise NotFoundError(f"Procurement request '{rfq_id}' not found")

        is_owner = (rfq_item.get("buyerId") == user_claims.user_id)
        if not is_owner and not user_claims.is_admin():
            raise ForbiddenError("Only the procurement request owner or administrator can view all quotations")

        responses = self.repo.list_responses_for_rfq(rfq_id)
        sanitized = [self._sanitize_response(r) for r in responses]

        return {
            "items": sanitized,
            "totalCount": len(sanitized),
        }

    def list_my_responses(self, user_claims: UserClaims, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Retrieves responses submitted by the authenticated seller using user-partition index.
        """
        params = params or {}
        try:
            limit = int(params.get("limit", 50))
            if limit < 1 or limit > 100:
                limit = 50
        except (ValueError, TypeError):
            limit = 50

        cursor_input = params.get("cursor") or params.get("lastEvaluatedKey")
        exclusive_start_key = self._parse_cursor(cursor_input)

        items, last_key = self.repo.list_seller_responses(
            seller_id=user_claims.user_id,
            limit=limit,
            exclusive_start_key=exclusive_start_key,
        )

        sanitized_items = [self._sanitize_response(it) for it in items]
        next_cursor = self._encode_cursor(last_key)

        return {
            "items": sanitized_items,
            "cursor": next_cursor,
            "hasMore": bool(next_cursor),
            "totalCount": len(sanitized_items),
        }

    def withdraw_response(self, user_claims: UserClaims, response_id: str) -> Dict[str, Any]:
        """
        Withdraws a previously submitted quotation.
        Only the quotation seller or ADMIN can withdraw.
        Only SUBMITTED quotations can be withdrawn.
        """
        response_item = self.repo.get_response_by_id(response_id)
        if not response_item:
            raise NotFoundError(f"Quotation response '{response_id}' not found")

        is_seller = (response_item.get("sellerId") == user_claims.user_id)
        if not is_seller and not user_claims.is_admin():
            raise ForbiddenError("You are not authorized to withdraw this quotation")

        current_status = response_item.get("status", "").upper()
        if current_status == RFQResponseStatus.ACCEPTED.value:
            raise ValidationError("Cannot withdraw an ACCEPTED quotation")
        if current_status == RFQResponseStatus.WITHDRAWN.value:
            raise ValidationError("Quotation is already WITHDRAWN")
        if current_status != RFQResponseStatus.SUBMITTED.value:
            raise ValidationError(f"Cannot withdraw quotation with status '{current_status}'. Only SUBMITTED quotations can be withdrawn.")

        now_iso = datetime.now(timezone.utc).isoformat()
        updated = self.repo.update_response_status(
            rfq_id=response_item.get("rfqId"),
            response_id=response_id,
            created_at=response_item.get("createdAt"),
            seller_id=response_item.get("sellerId"),
            new_status=RFQResponseStatus.WITHDRAWN.value,
            updated_at=now_iso,
        )

        merged = {**response_item, **updated, "status": RFQResponseStatus.WITHDRAWN.value, "updatedAt": now_iso}
        logger.info(f"Withdrawn quotation {response_id} by user {user_claims.user_id}")
        return self._sanitize_response(merged)

    def accept_response(self, user_claims: UserClaims, response_id: str) -> Dict[str, Any]:
        """
        Accepts a quotation response for an OPEN RFQ.
        RULES:
          - Only RFQ owner or ADMIN can accept.
          - RFQ must be OPEN.
          - Response must be SUBMITTED.
          - Accepted response becomes ACCEPTED.
          - Other SUBMITTED responses for the same RFQ become REJECTED.
          - RFQ status becomes FULFILLED.
          - IMPORTANT: NO Order is created in Phase 4.
        """
        response_item = self.repo.get_response_by_id(response_id)
        if not response_item:
            raise NotFoundError(f"Quotation response '{response_id}' not found")

        rfq_id = response_item.get("rfqId")
        rfq_item = self.repo.get_rfq_by_id(rfq_id)
        if not rfq_item:
            raise NotFoundError(f"Procurement request '{rfq_id}' not found")

        # Authorization: Only RFQ owner or ADMIN
        is_owner = (rfq_item.get("buyerId") == user_claims.user_id)
        if not is_owner and not user_claims.is_admin():
            raise ForbiddenError("Only the procurement request owner or administrator can accept a quotation")

        # RFQ must be OPEN
        rfq_status = rfq_item.get("status", "").upper()
        if rfq_status != RFQStatus.OPEN.value:
            raise ValidationError(
                f"Cannot accept quotation on procurement request with status '{rfq_status}'. "
                f"RFQ must be OPEN."
            )

        # Response must be SUBMITTED
        res_status = response_item.get("status", "").upper()
        if res_status != RFQResponseStatus.SUBMITTED.value:
            raise ValidationError(
                f"Cannot accept quotation with status '{res_status}'. "
                f"Only SUBMITTED quotations can be accepted."
            )

        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Update accepted response to ACCEPTED
        updated_accepted = self.repo.update_response_status(
            rfq_id=rfq_id,
            response_id=response_id,
            created_at=response_item.get("createdAt"),
            seller_id=response_item.get("sellerId"),
            new_status=RFQResponseStatus.ACCEPTED.value,
            updated_at=now_iso,
        )

        # 2. Reject other SUBMITTED responses for this RFQ
        all_responses = self.repo.list_responses_for_rfq(rfq_id)
        for other in all_responses:
            other_id = other.get("responseId")
            if other_id != response_id and other.get("status", "").upper() == RFQResponseStatus.SUBMITTED.value:
                try:
                    self.repo.update_response_status(
                        rfq_id=rfq_id,
                        response_id=other_id,
                        created_at=other.get("createdAt"),
                        seller_id=other.get("sellerId"),
                        new_status=RFQResponseStatus.REJECTED.value,
                        updated_at=now_iso,
                    )
                except Exception as e:
                    logger.warning(f"Failed to set response {other_id} to REJECTED: {e}")

        # 3. Update RFQ status to FULFILLED
        updated_rfq = self.repo.update_rfq(
            rfq_id=rfq_id,
            buyer_id=rfq_item.get("buyerId"),
            created_at=rfq_item.get("createdAt"),
            updates={"status": RFQStatus.FULFILLED.value, "updatedAt": now_iso},
        )

        merged_response = {**response_item, **updated_accepted, "status": RFQResponseStatus.ACCEPTED.value, "updatedAt": now_iso}
        merged_rfq = {**rfq_item, **updated_rfq, "status": RFQStatus.FULFILLED.value, "updatedAt": now_iso}

        logger.info(f"Accepted quotation {response_id} for RFQ {rfq_id}; RFQ fulfilled")

        return {
            "acceptedResponse": self._sanitize_response(merged_response),
            "rfq": self._sanitize_rfq(merged_rfq),
            "message": "Quotation accepted. Order creation will be handled in the next stage.",
        }


def get_procurement_service() -> ProcurementService:
    """Returns a new or singleton ProcurementService instance."""
    return ProcurementService()
