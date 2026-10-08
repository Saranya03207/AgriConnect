from datetime import datetime, timezone
from decimal import Decimal
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

    def list_listings(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Lists marketplace listings with optional query filtering.
        Defaults status to ACTIVE.
        Supported filter params:
          - category
          - district
          - state
          - sellerRole
          - status (defaults to ACTIVE)
          - limit (1 to 100, default 50)
        """
        params = params or {}

        # Status defaults to ACTIVE unless explicitly requested
        raw_status = params.get("status")
        if raw_status is None or raw_status == "":
            status = ListingStatus.ACTIVE.value
        elif raw_status.upper() == "ALL":
            status = None
        else:
            status = raw_status.upper()

        category = params.get("category")
        district = params.get("district")
        state = params.get("state")
        seller_role = params.get("sellerRole")

        try:
            limit = int(params.get("limit", 50))
            if limit < 1 or limit > 100:
                limit = 50
        except (ValueError, TypeError):
            limit = 50

        items, last_key = self.repo.list_listings(
            status=status,
            category=category,
            district=district,
            state=state,
            seller_role=seller_role,
            limit=limit,
        )

        enriched_items = [self._enrich_listing_images(it) for it in items]

        return {
            "listings": enriched_items,
            "count": len(enriched_items),
            "lastEvaluatedKey": last_key,
        }


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

        immutable_fields = {"listingId", "sellerId", "sellerRole", "createdAt", "PK", "SK", "entityType"}
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
