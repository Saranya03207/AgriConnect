import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.models.rfq import ProductCategory, RFQResponseStatus, RFQStatus

VALID_PRODUCT_CATEGORIES = {c.value for c in ProductCategory}
VALID_RFQ_STATUSES = {s.value for s in RFQStatus}
VALID_RESPONSE_STATUSES = {s.value for s in RFQResponseStatus}


def _validate_date_string(v: str) -> str:
    """Validates that a string is a recognizable date (e.g., YYYY-MM-DD)."""
    clean = v.strip()
    if not clean:
        raise ValueError("Date cannot be empty")
    
    # Check format YYYY-MM-DD or ISO
    date_part = clean.split("T")[0]
    try:
        datetime.strptime(date_part, "%Y-%m-%d")
    except ValueError:
        raise ValueError(f"Invalid date format '{v}'. Expected YYYY-MM-DD format.")
    return clean


class CreateRFQRequest(BaseModel):
    """
    Schema for buyer creating a Request for Quotation (RFQ).
    Strictly validates business parameters and rejects client injection of IDs or status.
    """
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    title: str = Field(..., min_length=3, max_length=200, description="Procurement request title")
    description: str = Field(..., min_length=5, max_length=5000, description="Detailed requirements")
    product_category: str = Field(..., alias="productCategory", min_length=2, max_length=100)
    product_name: str = Field(..., alias="productName", min_length=2, max_length=200)
    subcategory: Optional[str] = Field(None, max_length=100)
    quantity: float = Field(..., gt=0, description="Quantity must be strictly positive (> 0)")
    unit: str = Field(..., min_length=1, max_length=30, description="Unit of measurement")
    preferred_location: Optional[str] = Field(None, alias="preferredLocation", max_length=200)
    preferred_district: str = Field(..., alias="preferredDistrict", min_length=2, max_length=100)
    preferred_state: str = Field(..., alias="preferredState", min_length=2, max_length=100)
    required_by_date: str = Field(..., alias="requiredByDate", description="Date by when items are required (YYYY-MM-DD)")
    target_price: Optional[float] = Field(None, alias="targetPrice", ge=0, description="Optional target price (>= 0)")
    currency: str = Field("INR", min_length=2, max_length=10)
    quality_requirements: Optional[str] = Field(None, alias="qualityRequirements", max_length=1000)
    additional_requirements: Optional[str] = Field(None, alias="additionalRequirements", max_length=1000)

    @field_validator("product_category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        clean = v.strip().upper().replace("-", "_").replace(" ", "_")
        if not clean:
            raise ValueError("Product category cannot be empty")
        return clean

    @field_validator("product_name", "title", "preferred_district", "preferred_state")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Field cannot be empty")
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

    @field_validator("required_by_date")
    @classmethod
    def validate_required_date(cls, v: str) -> str:
        return _validate_date_string(v)


class UpdateRFQRequest(BaseModel):
    """Schema for updating an editable OPEN RFQ."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=5, max_length=5000)
    product_category: Optional[str] = Field(None, alias="productCategory", min_length=2, max_length=100)
    product_name: Optional[str] = Field(None, alias="productName", min_length=2, max_length=200)
    subcategory: Optional[str] = Field(None, max_length=100)
    quantity: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = Field(None, min_length=1, max_length=30)
    preferred_location: Optional[str] = Field(None, alias="preferredLocation", max_length=200)
    preferred_district: Optional[str] = Field(None, alias="preferredDistrict", min_length=2, max_length=100)
    preferred_state: Optional[str] = Field(None, alias="preferredState", min_length=2, max_length=100)
    required_by_date: Optional[str] = Field(None, alias="requiredByDate")
    target_price: Optional[float] = Field(None, alias="targetPrice", ge=0)
    currency: Optional[str] = Field(None, min_length=2, max_length=10)
    quality_requirements: Optional[str] = Field(None, alias="qualityRequirements", max_length=1000)
    additional_requirements: Optional[str] = Field(None, alias="additionalRequirements", max_length=1000)

    @field_validator("product_category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.strip().upper().replace("-", "_").replace(" ", "_")

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().upper()
        if not clean:
            raise ValueError("Unit cannot be empty")
        return clean

    @field_validator("required_by_date")
    @classmethod
    def validate_required_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return _validate_date_string(v)


class CreateRFQResponseRequest(BaseModel):
    """
    Schema for seller submitting a quotation response to an RFQ.
    """
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    proposed_quantity: float = Field(..., alias="proposedQuantity", gt=0, description="Proposed quantity must be > 0")
    unit: str = Field(..., min_length=1, max_length=30, description="Unit of measurement")
    unit_price: float = Field(..., alias="unitPrice", ge=0, description="Unit price must be non-negative (>= 0)")
    currency: str = Field("INR", min_length=2, max_length=10)
    available_date: str = Field(..., alias="availableDate", description="Date by when goods are available (YYYY-MM-DD)")
    remarks: Optional[str] = Field(None, max_length=2000, description="Remarks or terms")

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

    @field_validator("available_date")
    @classmethod
    def validate_available_date(cls, v: str) -> str:
        return _validate_date_string(v)


class RFQResponseDto(BaseModel):
    """Clean serialization schema for RFQ."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    rfq_id: str = Field(alias="rfqId")
    buyer_id: str = Field(alias="buyerId")
    buyer_role: str = Field(alias="buyerRole")
    title: str
    description: str
    product_category: str = Field(alias="productCategory")
    product_name: str = Field(alias="productName")
    subcategory: Optional[str] = None
    quantity: float
    unit: str
    preferred_location: Optional[str] = Field(None, alias="preferredLocation")
    preferred_district: str = Field(alias="preferredDistrict")
    preferred_state: str = Field(alias="preferredState")
    required_by_date: str = Field(alias="requiredByDate")
    target_price: Optional[float] = Field(None, alias="targetPrice")
    currency: str
    quality_requirements: Optional[str] = Field(None, alias="qualityRequirements")
    additional_requirements: Optional[str] = Field(None, alias="additionalRequirements")
    status: str
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")
    responses: Optional[List[Dict[str, Any]]] = None


class RFQQuotationResponseDto(BaseModel):
    """Clean serialization schema for RFQResponse."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    response_id: str = Field(alias="responseId")
    rfq_id: str = Field(alias="rfqId")
    seller_id: str = Field(alias="sellerId")
    seller_role: str = Field(alias="sellerRole")
    proposed_quantity: float = Field(alias="proposedQuantity")
    unit: str
    unit_price: float = Field(alias="unitPrice")
    currency: str
    available_date: str = Field(alias="availableDate")
    remarks: Optional[str] = None
    status: str
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")
