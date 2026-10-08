import os
import re
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.models.listing import ListingCategory, ListingStatus

VALID_CATEGORIES = {c.value for c in ListingCategory}
VALID_STATUSES = {s.value for s in ListingStatus}
VALID_UNITS = {
    "KG", "KILOGRAM", "TON", "TONNE", "METRIC_TONNE", "QUINTAL",
    "BAG", "LITRE", "LITER", "PIECE", "BOX", "BUNDLE", "CRATE", "GRAM", "ACRE"
}

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": {".jpg", ".jpeg"},
    "image/png": {".png"},
    "image/webp": {".webp"},
}
MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_LISTING_IMAGES = 5


class GenerateUploadUrlRequest(BaseModel):
    """
    Schema for requesting a secure S3 presigned PUT URL for listing images.
    Enforces strict MIME type, file extension, and file size limits.
    """
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    file_name: str = Field(..., alias="fileName", min_length=1, max_length=255, description="Image file name with extension")
    content_type: str = Field(..., alias="contentType", min_length=3, max_length=100, description="MIME content type")
    file_size: Optional[int] = Field(None, alias="fileSize", gt=0, le=MAX_IMAGE_FILE_SIZE, description="File size in bytes (max 10MB)")

    @field_validator("file_name")
    @classmethod
    def validate_file_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("File name cannot be empty")

        if "/" in clean or "\\" in clean or ".." in clean or "\x00" in clean:
            raise ValueError("File name contains invalid path traversal characters")

        _, ext = os.path.splitext(clean)
        if not ext:
            raise ValueError("File name must include a valid image extension (e.g., .jpg, .png, .webp)")

        ext_lower = ext.lower()
        valid_extensions = {ext for exts in ALLOWED_IMAGE_TYPES.values() for ext in exts}
        if ext_lower not in valid_extensions:
            allowed_str = ", ".join(sorted(valid_extensions))
            raise ValueError(f"Extension '{ext}' is not supported. Allowed extensions: {allowed_str}")

        return clean

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ALLOWED_IMAGE_TYPES:
            allowed_types = ", ".join(sorted(ALLOWED_IMAGE_TYPES.keys()))
            raise ValueError(f"Content type '{v}' is not supported. Allowed types: {allowed_types}")
        return clean

    @model_validator(mode="after")
    def validate_extension_matches_content_type(self) -> "GenerateUploadUrlRequest":
        _, ext = os.path.splitext(self.file_name)
        ext_lower = ext.lower()
        allowed_exts_for_type = ALLOWED_IMAGE_TYPES.get(self.content_type, set())
        if ext_lower not in allowed_exts_for_type:
            allowed_str = ", ".join(sorted(allowed_exts_for_type))
            raise ValueError(
                f"File extension '{ext}' does not match content type '{self.content_type}'. "
                f"Expected extension(s): {allowed_str}"
            )
        return self

    @property
    def normalized_extension(self) -> str:
        _, ext = os.path.splitext(self.file_name)
        ext_lower = ext.lower()
        if ext_lower == ".jpeg":
            return ".jpg"
        return ext_lower


class UploadUrlResponse(BaseModel):
    """Response containing short-lived presigned PUT URL and generated S3 object key."""
    model_config = ConfigDict(populate_by_name=True)

    upload_url: str = Field(alias="uploadUrl")
    object_key: str = Field(alias="objectKey")
    expires_in: int = Field(default=300, alias="expiresIn")



class CreateListingRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    title: str = Field(..., min_length=3, max_length=200, description="Listing title")
    description: str = Field(..., min_length=5, max_length=5000, description="Detailed description")
    category: str = Field(..., description="Category (SEEDS, CROPS, BY_PRODUCTS, BIOMASS, RAW_MATERIALS)")
    subcategory: Optional[str] = Field(None, max_length=100)
    item_type: Optional[str] = Field(None, alias="itemType", max_length=100)
    quantity: float = Field(..., gt=0, description="Quantity must be strictly positive (> 0)")
    unit: str = Field(..., min_length=1, max_length=30, description="Unit of measurement (e.g., KG, TONNE, QUINTAL)")
    price: float = Field(..., ge=0, description="Price per unit must be non-negative (>= 0)")
    currency: str = Field("INR", min_length=2, max_length=10)
    location: str = Field(..., min_length=2, max_length=200, description="Village / Town / Location")
    district: str = Field(..., min_length=2, max_length=100, description="District name")
    state: str = Field(..., min_length=2, max_length=100, description="State / Province")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    quality: Optional[str] = Field(None, max_length=100)
    availability: Optional[str] = Field(None, max_length=100)
    images: List[str] = Field(default_factory=list)
    status: Optional[str] = Field(ListingStatus.ACTIVE.value)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        clean = v.strip().upper().replace("-", "_").replace(" ", "_")
        if clean not in VALID_CATEGORIES:
            allowed = ", ".join(sorted(VALID_CATEGORIES))
            raise ValueError(f"Category '{v}' is invalid. Supported categories: {allowed}")
        return clean

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> str:
        if not v:
            return ListingStatus.ACTIVE.value
        clean = v.strip().upper()
        if clean not in VALID_STATUSES:
            allowed = ", ".join(sorted(VALID_STATUSES))
            raise ValueError(f"Status '{v}' is invalid. Supported statuses: {allowed}")
        return clean

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: str) -> str:
        clean = v.strip().upper()
        if not clean:
            raise ValueError("Unit cannot be empty")
        return clean

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("images")
    @classmethod
    def validate_images(cls, v: Optional[List[str]]) -> List[str]:
        if v is None:
            return []
        if len(v) > MAX_LISTING_IMAGES:
            raise ValueError(f"A listing may not contain more than {MAX_LISTING_IMAGES} photos")
        cleaned = []
        for img in v:
            if not isinstance(img, str):
                continue
            s = img.strip()
            if not s:
                continue
            if s.startswith("blob:") or s.startswith("data:"):
                raise ValueError("Browser object URLs (blob:) and base64 data URIs are not allowed. Please upload images directly to S3.")
            if ".." in s or "\\" in s or "\x00" in s:
                raise ValueError("Image reference contains invalid path characters")
            cleaned.append(s)
        return cleaned


class UpdateListingRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=5, max_length=5000)
    category: Optional[str] = None
    subcategory: Optional[str] = None
    item_type: Optional[str] = Field(None, alias="itemType")
    quantity: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    quality: Optional[str] = None
    availability: Optional[str] = None
    images: Optional[List[str]] = None
    status: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().upper().replace("-", "_").replace(" ", "_")
        if clean not in VALID_CATEGORIES:
            allowed = ", ".join(sorted(VALID_CATEGORIES))
            raise ValueError(f"Category '{v}' is invalid. Supported categories: {allowed}")
        return clean

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().upper()
        if clean not in VALID_STATUSES:
            allowed = ", ".join(sorted(VALID_STATUSES))
            raise ValueError(f"Status '{v}' is invalid. Supported statuses: {allowed}")
        return clean

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().upper()
        if not clean:
            raise ValueError("Unit cannot be empty")
        return clean

    @field_validator("images")
    @classmethod
    def validate_images(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return None
        if len(v) > MAX_LISTING_IMAGES:
            raise ValueError(f"A listing may not contain more than {MAX_LISTING_IMAGES} photos")
        cleaned = []
        for img in v:
            if not isinstance(img, str):
                continue
            s = img.strip()
            if not s:
                continue
            if s.startswith("blob:") or s.startswith("data:"):
                raise ValueError("Browser object URLs (blob:) and base64 data URIs are not allowed. Please upload images directly to S3.")
            if ".." in s or "\\" in s or "\x00" in s:
                raise ValueError("Image reference contains invalid path characters")
            cleaned.append(s)
        return cleaned


class ListingResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    listing_id: str = Field(alias="listingId")
    seller_id: str = Field(alias="sellerId")
    seller_role: str = Field(alias="sellerRole")
    title: str
    description: str
    category: str
    subcategory: Optional[str] = None
    item_type: Optional[str] = Field(None, alias="itemType")
    quantity: float
    unit: str
    price: float
    currency: str
    location: str
    district: str
    state: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    quality: Optional[str] = None
    availability: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    image_keys: Optional[List[str]] = Field(default=None, alias="imageKeys")
    image_urls: Optional[List[str]] = Field(default=None, alias="imageUrls")
    image_details: Optional[List[Dict[str, str]]] = Field(default=None, alias="imageDetails")
    status: str
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")

