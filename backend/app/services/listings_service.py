import base64
from datetime import datetime, timezone
from decimal import Decimal
import json
from typing import Any, Dict, List, Optional
import uuid
from pydantic import ValidationError as PydanticValidationError

from app.auth.cognito import UserClaims
from app.models.listing import Listing, ListingStatus
from app.repositories.listings_repository import ListingsRepository, get_listings_repository
from app.schemas.listing import CreateListingRequest, GenerateUploadUrlRequest, UpdateListingRequest
from app.services.s3_service import S3Service, get_s3_service
from app.utils.errors import ForbiddenError, NotFoundError, ValidationError
from app.utils.logging import get_logger

logger = get_logger("listings-service")


class ListingsService:
    """
    Business service layer managing agricultural marketplace listings.
    Enforces business validation, Cognito identity ownership, DynamoDB persistence,
    and secure S3 image presigned upload and temporary download URLs.
    """

    def __init__(self, repo: Optional[ListingsRepository] = None, s3_service: Optional[S3Service] = None):
        self.repo = repo or get_listings_repository()
        self.s3_service = s3_service or get_s3_service()


    def create_listing(self, user_claims: UserClaims, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a new listing in AgriConnect marketplace.
        SECURITY:
          - sellerId is strictly populated from authenticated user's Cognito 'sub'.
          - sellerRole is populated from verified user role.
          - Never trusts sellerId passed from client payload.
        """
        try:
            req = CreateListingRequest(**payload)
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
            if errors:
                first_err = errors[0]
                field_name = ".".join(str(x) for x in first_err.get("loc", []))
                err_msg = first_err.get("msg", "Validation failed")
                msg = f"Field '{field_name}' invalid: {err_msg}" if field_name else err_msg
            else:
                msg = "Validation failed"
            raise ValidationError(f"Invalid listing data: {msg}", details={"validation_errors": clean_errors})

        listing_id = f"list_{uuid.uuid4().hex[:16]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        listing = Listing(
            listing_id=listing_id,
            seller_id=user_claims.user_id,
            seller_role=user_claims.role,
            title=req.title,
            description=req.description,
            category=req.category,
            subcategory=req.subcategory,
            item_type=req.item_type,
            quantity=req.quantity,
            unit=req.unit,
            price=req.price,
            currency=req.currency,
            location=req.location,
            district=req.district,
            state=req.state,
            latitude=req.latitude,
            longitude=req.longitude,
            quality=req.quality,
            availability=req.availability,
            images=req.images,
            status=req.status or ListingStatus.ACTIVE.value,
            created_at=now_iso,
            updated_at=now_iso,
        )

        item = listing.to_item()
        self.repo.save(item)
        logger.info(f"Created listing {listing_id} for seller {user_claims.user_id} ({user_claims.role})")
        return self._enrich_listing_images(item)

    def generate_image_upload_url(self, user_claims: UserClaims, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a secure presigned S3 PUT URL for uploading listing photos.
        SECURITY:
          - Requires authenticated Cognito user.
          - Seller ID is strictly extracted from user_claims.user_id (Cognito 'sub').
          - Never trusts client-supplied sellerId or arbitrary S3 paths.
          - Object key follows strict structure: listings/{sellerId}/{uuid}.{ext}.
          - Presigned PUT URL expires in 300 seconds (5 minutes).
        """
        try:
            req = GenerateUploadUrlRequest(**payload)
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
            if errors:
                first_err = errors[0]
                field_name = ".".join(str(x) for x in first_err.get("loc", []))
                err_msg = first_err.get("msg", "Validation failed")
                msg = f"Field '{field_name}' invalid: {err_msg}" if field_name else err_msg
            else:
                msg = "Validation failed"
            raise ValidationError(f"Invalid upload request: {msg}", details={"validation_errors": clean_errors})

        seller_id = user_claims.user_id
        file_uuid = uuid.uuid4().hex
        ext = req.normalized_extension
        object_key = f"listings/{seller_id}/{file_uuid}{ext}"

        # Presigned PUT URL expires in 300 seconds (5 minutes)
        upload_url = self.s3_service.generate_presigned_upload_url(
            key=object_key,
            content_type=req.content_type,
            expiration=300,
        )

        logger.info(f"Generated presigned upload URL for seller {seller_id}: {object_key}")
        return {
            "uploadUrl": upload_url,
            "objectKey": object_key,
            "expiresIn": 300,
        }

    def _enrich_listing_images(self, item: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Enriches listing items with short-lived presigned GET URLs for image display.
        Maintains private S3 bucket security:
          - DynamoDB holds the permanent S3 object keys (listings/{sellerId}/{uuid}.{ext}).
          - Presigned download URLs are generated on read (valid for 3600 seconds).
          - Returns 'images' with displayable URLs for immediate UI consumption.
          - Returns 'imageKeys' with raw S3 keys for edit/update workflows.
          - Returns 'imageUrls' with displayable URLs.
          - Returns 'imageDetails' with both key and url for structured access.
        """
        if not item:
            return item

        enriched = dict(item)
        raw_images = item.get("images") or []

        image_keys = []
        display_urls = []
        image_details = []

        for img_ref in raw_images:
            if not isinstance(img_ref, str) or not img_ref.strip():
                continue
            img_ref = img_ref.strip()
            image_keys.append(img_ref)

            if img_ref.startswith("http://") or img_ref.startswith("https://"):
                # External or legacy test fixture URL
                display_urls.append(img_ref)
                image_details.append({"key": img_ref, "url": img_ref})
            else:
                # Private S3 object key - generate temporary presigned download URL
                try:
                    download_url = self.s3_service.generate_presigned_download_url(
                        key=img_ref,
                        expiration=3600,
                    )
                    display_urls.append(download_url)
                    image_details.append({"key": img_ref, "url": download_url})
                except Exception as e:
                    logger.warning(f"Could not generate presigned download URL for '{img_ref}': {e}")
                    display_urls.append(img_ref)
                    image_details.append({"key": img_ref, "url": img_ref})

        enriched["images"] = display_urls
        enriched["imageUrls"] = display_urls
        enriched["imageKeys"] = image_keys
        enriched["imageDetails"] = image_details

        # Exclude DynamoDB internal persistence and index keys from serialized client responses
        internal_fields = {
            "PK", "SK", "entityType",
            "GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK",
            "gsi1_pk", "gsi1_sk", "gsi2_pk", "gsi2_sk",
            "gsi1Pk", "gsi1Sk", "gsi2Pk", "gsi2Sk",
        }
        for f in internal_fields:
            enriched.pop(f, None)

        return enriched

    def get_listing_by_id(self, listing_id: str) -> Dict[str, Any]:
        """
        Retrieves a single listing by listing ID.
        Raises NotFoundError (404) if the listing does not exist.
        """
        if not listing_id or not listing_id.strip():
            raise ValidationError("Listing ID must not be empty")

        clean_id = listing_id.strip()
        item = self.repo.get_by_id(clean_id)
        if not item:
            logger.warning(f"Listing not found: {clean_id}")
            raise NotFoundError(f"Listing '{clean_id}' does not exist")

        return self._enrich_listing_images(item)

    @staticmethod
    def _parse_cursor(cursor_val: Any) -> Optional[Dict[str, Any]]:
        """
        Parses pagination cursor into a DynamoDB ExclusiveStartKey dict.
        Supports:
          - Dict (direct DynamoDB key structure)
          - JSON string (e.g. '{"GSI1PK": "MARKETPLACE", ...}')
          - URL-safe Base64 encoded JSON string
          - Standard Base64 encoded JSON string
        """
        if not cursor_val:
            return None
        if isinstance(cursor_val, dict):
            return cursor_val
        if isinstance(cursor_val, str):
            cursor_str = cursor_val.strip()
            if not cursor_str:
                return None
            # 1. Try direct JSON parsing
            try:
                parsed = json.loads(cursor_str)
                if isinstance(parsed, dict):
                    return parsed
            except (json.JSONDecodeError, TypeError):
                pass
            # 2. Try URL-safe Base64 decode
            try:
                decoded_bytes = base64.urlsafe_b64decode(cursor_str.encode("utf-8"))
                parsed = json.loads(decoded_bytes.decode("utf-8"))
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                pass
            # 3. Try standard Base64 decode
            try:
                decoded_bytes = base64.b64decode(cursor_str.encode("utf-8"))
                parsed = json.loads(decoded_bytes.decode("utf-8"))
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                pass
        return None

    @staticmethod
    def _encode_cursor(key_dict: Optional[Dict[str, Any]]) -> Optional[str]:
        """
        Encodes a DynamoDB LastEvaluatedKey dict into a URL-safe Base64 cursor string.
        Handles Decimal numbers if present.
        """
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

    def list_listings(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Lists marketplace listings using GSI1 marketplace discovery query.
        GSI1 key condition:
          GSI1PK = 'MARKETPLACE'
          GSI1SK begins_with 'STATUS#<status>#' (defaults to ACTIVE)
        Applies optional FilterExpressions for:
          category, state, district, sellerRole, quality, search.
        Preserves DynamoDB pagination through LastEvaluatedKey and cursor.
        """
        params = params or {}

        # 1. Status handling (defaults to ACTIVE unless explicitly requested)
        raw_status = params.get("status")
        if raw_status is None or raw_status == "":
            status = ListingStatus.ACTIVE.value
        elif raw_status.upper() == "ALL":
            status = None
        else:
            status = raw_status.upper()

        # 2. Extract filter parameters
        category = params.get("category")
        district = params.get("district")
        state = params.get("state")
        seller_role = params.get("sellerRole") or params.get("seller_role")
        quality = params.get("quality")
        search = params.get("search") or params.get("q")

        # 3. Limit validation (1 to 100, default 50)
        try:
            limit = int(params.get("limit", 50))
            if limit < 1 or limit > 100:
                limit = 50
        except (ValueError, TypeError):
            limit = 50

        # 4. Pagination cursor handling
        cursor_input = (
            params.get("cursor")
            or params.get("lastEvaluatedKey")
            or params.get("exclusiveStartKey")
            or params.get("nextCursor")
        )
        exclusive_start_key = self._parse_cursor(cursor_input)

        # 5. Query GSI1 on AgriConnect-Main
        items, last_key = self.repo.query_gsi1(
            gsi1_pk="MARKETPLACE",
            status=status,
            category=category,
            state=state,
            district=district,
            seller_role=seller_role,
            quality=quality,
            search=search,
            limit=limit,
            scan_index_forward=False,  # newest listings first
            exclusive_start_key=exclusive_start_key,
        )

        # 6. Enrich private S3 image object keys with temporary presigned download URLs
        enriched_items = [self._enrich_listing_images(it) for it in items]

        # 7. Construct response preserving existing format and adding cursor
        result: Dict[str, Any] = {
            "listings": enriched_items,
            "count": len(enriched_items),
            "lastEvaluatedKey": last_key,
        }
        if last_key:
            result["cursor"] = self._encode_cursor(last_key)

        return result


    def update_listing(self, listing_id: str, user_claims: UserClaims, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates an existing listing.
        SECURITY:
          - Enforces ownership: only the listing owner (sellerId matching user_claims.user_id) can update.
          - Never allows changing listingId, sellerId, sellerRole, or createdAt.
        """
        if not listing_id or not listing_id.strip():
            raise ValidationError("Listing ID must not be empty")

        clean_id = listing_id.strip()
        existing = self.repo.get_by_id(clean_id)
        if not existing:
            raise NotFoundError(f"Listing '{clean_id}' does not exist")

        # Ownership validation
        existing_seller_id = existing.get("sellerId")
        if existing_seller_id != user_claims.user_id:
            logger.warning(
                f"Unauthorized update attempt on listing {clean_id}: requester={user_claims.user_id}, owner={existing_seller_id}"
            )
            raise ForbiddenError("You are not authorized to update this listing")

        # Schema validation
        try:
            req = UpdateListingRequest(**updates)
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
            if errors:
                first_err = errors[0]
                field_name = ".".join(str(x) for x in first_err.get("loc", []))
                err_msg = first_err.get("msg", "Validation failed")
                msg = f"Field '{field_name}' invalid: {err_msg}" if field_name else err_msg
            else:
                msg = "Validation failed"
            raise ValidationError(f"Invalid listing update: {msg}", details={"validation_errors": clean_errors})

        # Sanitize updates - exclude immutable fields
        update_data = req.model_dump(exclude_unset=True)

        immutable_fields = {
            "listingId", "sellerId", "sellerRole", "createdAt", "PK", "SK", "entityType",
            "GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK", "gsi1Pk", "gsi1Sk", "gsi2Pk", "gsi2Sk"
        }
        for f in immutable_fields:
            update_data.pop(f, None)

        if not update_data:
            raise ValidationError("No updatable fields provided in request")

        # Convert numeric float fields to Decimal for DynamoDB compatibility
        for field in ("quantity", "price", "latitude", "longitude"):
            if field in update_data and update_data[field] is not None:
                update_data[field] = Decimal(str(update_data[field]))

        # Refresh updatedAt timestamp
        now_iso = datetime.now(timezone.utc).isoformat()
        update_data["updatedAt"] = now_iso

        # Synchronize Phase 3 GSI indexing attributes
        # createdAt and sellerId remain strictly immutable
        existing_created_at = existing.get("createdAt") or now_iso
        new_status = update_data.get("status", existing.get("status", ListingStatus.ACTIVE.value))
        new_category = update_data.get("category", existing.get("category", ""))
        update_data["GSI1PK"] = Listing.build_gsi1_pk()
        update_data["GSI1SK"] = Listing.build_gsi1_sk(new_status, existing_created_at)
        update_data["GSI2PK"] = Listing.build_gsi2_pk(existing_seller_id)
        update_data["GSI2SK"] = Listing.build_gsi2_sk(existing_created_at)

        updated_item = self.repo.update(clean_id, update_data)
        logger.info(f"Listing {clean_id} updated by seller {user_claims.user_id}")
        return self._enrich_listing_images(updated_item)

    def delete_listing(self, listing_id: str, user_claims: UserClaims) -> bool:
        """
        Deletes a listing from marketplace.
        SECURITY:
          - Enforces ownership: only the listing owner can delete.
        """
        if not listing_id or not listing_id.strip():
            raise ValidationError("Listing ID must not be empty")

        clean_id = listing_id.strip()
        existing = self.repo.get_by_id(clean_id)
        if not existing:
            raise NotFoundError(f"Listing '{clean_id}' does not exist")

        # Ownership validation
        existing_seller_id = existing.get("sellerId")
        if existing_seller_id != user_claims.user_id:
            logger.warning(
                f"Unauthorized delete attempt on listing {clean_id}: requester={user_claims.user_id}, owner={existing_seller_id}"
            )
            raise ForbiddenError("You are not authorized to delete this listing")

        self.repo.delete(clean_id)
        logger.info(f"Listing {clean_id} deleted by seller {user_claims.user_id}")
        return True

    def query_listings_by_category(
        self,
        category: Optional[str] = None,
        status: Optional[str] = "ACTIVE",
        state: Optional[str] = None,
        district: Optional[str] = None,
        seller_role: Optional[str] = None,
        quality: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        scan_index_forward: bool = False,
        exclusive_start_key: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        GSI1 Query helper for marketplace discovery with GSI1PK = 'MARKETPLACE'.
        Queries GSI1PK = 'MARKETPLACE' and applies status prefix on GSI1SK.
        Category, state, district, sellerRole, quality, and search are filtered via FilterExpression.
        """
        items, last_key = self.repo.query_gsi1(
            gsi1_pk="MARKETPLACE",
            status=status,
            category=category,
            state=state,
            district=district,
            seller_role=seller_role,
            quality=quality,
            search=search,
            limit=limit,
            scan_index_forward=scan_index_forward,
            exclusive_start_key=exclusive_start_key,
        )
        enriched_items = [self._enrich_listing_images(it) for it in items]
        res: Dict[str, Any] = {
            "listings": enriched_items,
            "count": len(enriched_items),
            "lastEvaluatedKey": last_key,
        }
        if last_key:
            res["cursor"] = self._encode_cursor(last_key)
        return res

    # Alias for general marketplace browsing
    query_marketplace = query_listings_by_category

    def query_listings_by_seller(
        self,
        seller_id: str,
        limit: int = 50,
        scan_index_forward: bool = False,
        exclusive_start_key: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        GSI2 Query helper for seller ownership / My Listings.
        """
        items, last_key = self.repo.query_gsi2(
            seller_id=seller_id,
            limit=limit,
            scan_index_forward=scan_index_forward,
            exclusive_start_key=exclusive_start_key,
        )
        enriched_items = [self._enrich_listing_images(it) for it in items]
        res: Dict[str, Any] = {
            "listings": enriched_items,
            "count": len(enriched_items),
            "lastEvaluatedKey": last_key,
        }
        if last_key:
            res["cursor"] = self._encode_cursor(last_key)
        return res
