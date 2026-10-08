from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional


class RFQStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
    FULFILLED = "FULFILLED"


class RFQResponseStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"


class ProductCategory(str, Enum):
    CROPS = "CROPS"
    SEEDS = "SEEDS"
    BY_PRODUCTS = "BY_PRODUCTS"
    BIOMASS = "BIOMASS"
    RAW_MATERIALS = "RAW_MATERIALS"


@dataclass
class RFQ:
    """
    Domain and DynamoDB Entity Model for PROCUREMENT REQUEST (RFQ).

    Primary Key on AgriConnect-Main:
      PK: RFQ#{rfqId}
      SK: METADATA
    
    Secondary Buyer Index Item on AgriConnect-Main:
      PK: USER#{buyerId}
      SK: RFQ#{createdAt}#{rfqId}
    """
    rfq_id: str
    buyer_id: str
    buyer_role: str
    title: str
    description: str
    product_category: str
    product_name: str
    quantity: float
    unit: str
    preferred_district: str
    preferred_state: str
    required_by_date: str
    preferred_location: Optional[str] = None
    subcategory: Optional[str] = None
    target_price: Optional[float] = None
    currency: str = "INR"
    quality_requirements: Optional[str] = None
    additional_requirements: Optional[str] = None
    status: str = RFQStatus.OPEN.value
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def pk(self) -> str:
        return f"RFQ#{self.rfq_id}"

    @property
    def sk(self) -> str:
        return "METADATA"

    @property
    def buyer_index_pk(self) -> str:
        clean_buyer = self.buyer_id.strip()
        return clean_buyer if clean_buyer.startswith("USER#") else f"USER#{clean_buyer}"

    @property
    def buyer_index_sk(self) -> str:
        return f"RFQ#{self.created_at}#{self.rfq_id}"

    @property
    def marketplace_index_pk(self) -> str:
        return "PROCUREMENT_MARKETPLACE"

    @property
    def marketplace_index_sk(self) -> str:
        return f"OPEN#{self.created_at}#{self.rfq_id}"

    def to_item(self) -> Dict[str, Any]:
        """Serializes domain model into DynamoDB primary item format."""
        item: Dict[str, Any] = {
            "PK": self.pk,
            "SK": self.sk,
            "entityType": "RFQ",
            "rfqId": self.rfq_id,
            "buyerId": self.buyer_id,
            "buyerRole": self.buyer_role,
            "title": self.title,
            "description": self.description,
            "productCategory": self.product_category.upper(),
            "productName": self.product_name,
            "quantity": Decimal(str(self.quantity)),
            "unit": self.unit.upper(),
            "preferredDistrict": self.preferred_district,
            "preferredState": self.preferred_state,
            "requiredByDate": self.required_by_date,
            "currency": self.currency.upper(),
            "status": self.status.upper(),
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }

        if self.preferred_location:
            item["preferredLocation"] = self.preferred_location
        if self.subcategory:
            item["subcategory"] = self.subcategory
        if self.target_price is not None:
            item["targetPrice"] = Decimal(str(self.target_price))
        if self.quality_requirements:
            item["qualityRequirements"] = self.quality_requirements
        if self.additional_requirements:
            item["additionalRequirements"] = self.additional_requirements

        return item

    def to_buyer_index_item(self) -> Dict[str, Any]:
        """Creates lightweight buyer index item for direct USER partition queries."""
        item: Dict[str, Any] = {
            "PK": self.buyer_index_pk,
            "SK": self.buyer_index_sk,
            "entityType": "RFQ_INDEX",
            "rfqId": self.rfq_id,
            "buyerId": self.buyer_id,
            "buyerRole": self.buyer_role,
            "title": self.title,
            "productCategory": self.product_category.upper(),
            "productName": self.product_name,
            "quantity": Decimal(str(self.quantity)),
            "unit": self.unit.upper(),
            "preferredDistrict": self.preferred_district,
            "preferredState": self.preferred_state,
            "requiredByDate": self.required_by_date,
            "status": self.status.upper(),
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
        if self.target_price is not None:
            item["targetPrice"] = Decimal(str(self.target_price))
        if self.preferred_location:
            item["preferredLocation"] = self.preferred_location
        return item

    def to_marketplace_index_item(self) -> Dict[str, Any]:
        """Creates base-table marketplace index item for OPEN RFQs."""
        item: Dict[str, Any] = {
            "PK": self.marketplace_index_pk,
            "SK": self.marketplace_index_sk,
            "entityType": "RFQ_MARKETPLACE_INDEX",
            "rfqId": self.rfq_id,
            "buyerId": self.buyer_id,
            "buyerRole": self.buyer_role,
            "title": self.title,
            "productName": self.product_name,
            "productCategory": self.product_category.upper(),
            "quantity": Decimal(str(self.quantity)),
            "unit": self.unit.upper(),
            "preferredDistrict": self.preferred_district,
            "preferredState": self.preferred_state,
            "requiredByDate": self.required_by_date,
            "currency": self.currency.upper(),
            "status": self.status.upper(),
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
        if self.preferred_location:
            item["preferredLocation"] = self.preferred_location
        if self.subcategory:
            item["subcategory"] = self.subcategory
        if self.target_price is not None:
            item["targetPrice"] = Decimal(str(self.target_price))
        if self.quality_requirements:
            item["qualityRequirements"] = self.quality_requirements
        if self.additional_requirements:
            item["additionalRequirements"] = self.additional_requirements
        return item

    @classmethod
    def from_item(cls, item: Dict[str, Any]) -> "RFQ":
        """Deserializes DynamoDB item into RFQ instance."""
        def _to_float(val: Any) -> Optional[float]:
            if val is None:
                return None
            return float(val)

        return cls(
            rfq_id=item.get("rfqId", ""),
            buyer_id=item.get("buyerId", ""),
            buyer_role=item.get("buyerRole", "BUYER"),
            title=item.get("title", ""),
            description=item.get("description", ""),
            product_category=item.get("productCategory", ""),
            product_name=item.get("productName", ""),
            subcategory=item.get("subcategory"),
            quantity=_to_float(item.get("quantity")) or 0.0,
            unit=item.get("unit", "KG"),
            preferred_location=item.get("preferredLocation"),
            preferred_district=item.get("preferredDistrict", ""),
            preferred_state=item.get("preferredState", ""),
            required_by_date=item.get("requiredByDate", ""),
            target_price=_to_float(item.get("targetPrice")),
            currency=item.get("currency", "INR"),
            quality_requirements=item.get("qualityRequirements"),
            additional_requirements=item.get("additionalRequirements"),
            status=item.get("status", RFQStatus.OPEN.value),
            created_at=item.get("createdAt", ""),
            updated_at=item.get("updatedAt", ""),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Returns clean representation for API response without internal DynamoDB persistence keys."""
        data = {
            "rfqId": self.rfq_id,
            "buyerId": self.buyer_id,
            "buyerRole": self.buyer_role,
            "title": self.title,
            "description": self.description,
            "productCategory": self.product_category,
            "productName": self.product_name,
            "subcategory": self.subcategory,
            "quantity": self.quantity,
            "unit": self.unit,
            "preferredLocation": self.preferred_location,
            "preferredDistrict": self.preferred_district,
            "preferredState": self.preferred_state,
            "requiredByDate": self.required_by_date,
            "targetPrice": self.target_price,
            "currency": self.currency,
            "qualityRequirements": self.quality_requirements,
            "additionalRequirements": self.additional_requirements,
            "status": self.status,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
        return data


@dataclass
class RFQResponse:
    """
    Domain and DynamoDB Entity Model for SELLER QUOTATION RESPONSE to an RFQ.

    Child Item on AgriConnect-Main:
      PK: RFQ#{rfqId}
      SK: RESPONSE#{createdAt}#{responseId}

    Secondary Seller Index Item on AgriConnect-Main:
      PK: USER#{sellerId}
      SK: RFQ_RESPONSE#{createdAt}#{responseId}
    """
    response_id: str
    rfq_id: str
    seller_id: str
    seller_role: str
    proposed_quantity: float
    unit: str
    unit_price: float
    available_date: str
    currency: str = "INR"
    remarks: Optional[str] = None
    status: str = RFQResponseStatus.SUBMITTED.value
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def pk(self) -> str:
        return f"RFQ#{self.rfq_id}"

    @property
    def sk(self) -> str:
        return f"RESPONSE#{self.created_at}#{self.response_id}"

    @property
    def seller_index_pk(self) -> str:
        clean_seller = self.seller_id.strip()
        return clean_seller if clean_seller.startswith("USER#") else f"USER#{clean_seller}"

    @property
    def seller_index_sk(self) -> str:
        return f"RFQ_RESPONSE#{self.created_at}#{self.response_id}"

    def to_item(self) -> Dict[str, Any]:
        """Serializes quotation into child DynamoDB item under RFQ partition."""
        item: Dict[str, Any] = {
            "PK": self.pk,
            "SK": self.sk,
            "entityType": "RFQ_RESPONSE",
            "responseId": self.response_id,
            "rfqId": self.rfq_id,
            "sellerId": self.seller_id,
            "sellerRole": self.seller_role,
            "proposedQuantity": Decimal(str(self.proposed_quantity)),
            "unit": self.unit.upper(),
            "unitPrice": Decimal(str(self.unit_price)),
            "currency": self.currency.upper(),
            "availableDate": self.available_date,
            "status": self.status.upper(),
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
        if self.remarks:
            item["remarks"] = self.remarks
        return item

    def to_seller_index_item(self) -> Dict[str, Any]:
        """Creates lightweight seller index item for direct USER partition queries."""
        item: Dict[str, Any] = {
            "PK": self.seller_index_pk,
            "SK": self.seller_index_sk,
            "entityType": "RFQ_RESPONSE_INDEX",
            "responseId": self.response_id,
            "rfqId": self.rfq_id,
            "sellerId": self.seller_id,
            "sellerRole": self.seller_role,
            "proposedQuantity": Decimal(str(self.proposed_quantity)),
            "unit": self.unit.upper(),
            "unitPrice": Decimal(str(self.unit_price)),
            "currency": self.currency.upper(),
            "availableDate": self.available_date,
            "status": self.status.upper(),
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
        if self.remarks:
            item["remarks"] = self.remarks
        return item

    def to_pointer_item(self) -> Dict[str, Any]:
        """Pointer item allowing fast direct lookup by responseId without full table scan."""
        return {
            "PK": f"RESPONSE#{self.response_id}",
            "SK": "METADATA",
            "entityType": "RFQ_RESPONSE_POINTER",
            "responseId": self.response_id,
            "rfqId": self.rfq_id,
            "sellerId": self.seller_id,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            "status": self.status.upper(),
        }

    @classmethod
    def from_item(cls, item: Dict[str, Any]) -> "RFQResponse":
        """Deserializes DynamoDB item into RFQResponse instance."""
        def _to_float(val: Any) -> float:
            if val is None:
                return 0.0
            return float(val)

        return cls(
            response_id=item.get("responseId", ""),
            rfq_id=item.get("rfqId", ""),
            seller_id=item.get("sellerId", ""),
            seller_role=item.get("sellerRole", "FARMER"),
            proposed_quantity=_to_float(item.get("proposedQuantity")),
            unit=item.get("unit", "KG"),
            unit_price=_to_float(item.get("unitPrice")),
            currency=item.get("currency", "INR"),
            available_date=item.get("availableDate", ""),
            remarks=item.get("remarks"),
            status=item.get("status", RFQResponseStatus.SUBMITTED.value),
            created_at=item.get("createdAt", ""),
            updated_at=item.get("updatedAt", ""),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Returns clean representation for API response without internal DynamoDB keys."""
        return {
            "responseId": self.response_id,
            "rfqId": self.rfq_id,
            "sellerId": self.seller_id,
            "sellerRole": self.seller_role,
            "proposedQuantity": self.proposed_quantity,
            "unit": self.unit,
            "unitPrice": self.unit_price,
            "currency": self.currency,
            "availableDate": self.available_date,
            "remarks": self.remarks,
            "status": self.status,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
