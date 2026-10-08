from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional


class ListingCategory(str, Enum):
    SEEDS = "SEEDS"
    CROPS = "CROPS"
    BY_PRODUCTS = "BY_PRODUCTS"
    BIOMASS = "BIOMASS"
    RAW_MATERIALS = "RAW_MATERIALS"


class ListingStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SOLD = "SOLD"
    EXPIRED = "EXPIRED"


@dataclass
class Listing:
    """
    Domain and DynamoDB Entity Model for AGRICULTURAL MARKETPLACE LISTING.
    Primary Key on AgriConnect-Main:
      PK: LISTING#<listingId>
      SK: METADATA
    """
    listing_id: str
    seller_id: str
    seller_role: str
    title: str
    description: str
    category: str
    quantity: float
    unit: str
    price: float
    location: str
    district: str
    state: str
    subcategory: Optional[str] = None
    item_type: Optional[str] = None
    currency: str = "INR"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    quality: Optional[str] = None
    availability: Optional[str] = None
    images: List[str] = field(default_factory=list)
    status: str = ListingStatus.ACTIVE.value
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    gsi1_pk: Optional[str] = None
    gsi1_sk: Optional[str] = None
    gsi2_pk: Optional[str] = None
    gsi2_sk: Optional[str] = None

    @property
    def pk(self) -> str:
        return f"LISTING#{self.listing_id}"

    @property
    def sk(self) -> str:
        return "METADATA"

    @staticmethod
    def build_gsi1_pk(category: Optional[str] = None) -> str:
        """
        Builds GSI1 Partition Key for Marketplace Discovery.
        In Phase 3 MVP, every listing MUST use:
          GSI1PK = 'MARKETPLACE'
        Do NOT use CATEGORY#<category> as GSI1PK.
        Category, state, district, sellerRole, and quality are filtered via FilterExpression.
        """
        return "MARKETPLACE"

    @staticmethod
    def build_gsi1_sk(status: Optional[str], created_at: str) -> str:
        """
        Builds GSI1 Sort Key combining Status and Creation Timestamp.
        Pattern: STATUS#<status>#CREATED#<createdAt>
        Supports prefix queries: begins_with(GSI1SK, 'STATUS#ACTIVE#')
        """
        clean_status = (status or ListingStatus.ACTIVE.value).strip().upper()
        return f"STATUS#{clean_status}#CREATED#{created_at}"

    @staticmethod
    def build_gsi2_pk(seller_id: str) -> str:
        """
        Builds GSI2 Partition Key for Seller Ownership.
        Pattern: SELLER#<sellerId>
        """
        clean_id = seller_id.strip()
        if clean_id.startswith("SELLER#"):
            return clean_id
        return f"SELLER#{clean_id}"

    @staticmethod
    def build_gsi2_sk(created_at: str) -> str:
        """
        Builds GSI2 Sort Key for chronological ordering of seller listings.
        Pattern: CREATED#<createdAt>
        """
        return f"CREATED#{created_at}"

    @property
    def computed_gsi1_pk(self) -> str:
        return "MARKETPLACE"

    @property
    def computed_gsi1_sk(self) -> str:
        return self.gsi1_sk or self.build_gsi1_sk(self.status, self.created_at)

    @property
    def computed_gsi2_pk(self) -> str:
        return self.gsi2_pk or self.build_gsi2_pk(self.seller_id)

    @property
    def computed_gsi2_sk(self) -> str:
        return self.gsi2_sk or self.build_gsi2_sk(self.created_at)

    def to_item(self) -> Dict[str, Any]:
        """Serializes domain model into DynamoDB item format."""
        item: Dict[str, Any] = {
            "PK": self.pk,
            "SK": self.sk,
            "entityType": "LISTING",
            "listingId": self.listing_id,
            "sellerId": self.seller_id,
            "sellerRole": self.seller_role,
            "title": self.title,
            "description": self.description,
            "category": self.category.upper(),
            "quantity": Decimal(str(self.quantity)),
            "unit": self.unit.upper(),
            "price": Decimal(str(self.price)),
            "currency": self.currency.upper(),
            "location": self.location,
            "district": self.district,
            "state": self.state,
            "images": self.images,
            "status": self.status.upper(),
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            # Phase 3 GSI Indexing Attributes
            "GSI1PK": self.computed_gsi1_pk,
            "GSI1SK": self.computed_gsi1_sk,
            "GSI2PK": self.computed_gsi2_pk,
            "GSI2SK": self.computed_gsi2_sk,
        }

        if self.subcategory:
            item["subcategory"] = self.subcategory
        if self.item_type:
            item["itemType"] = self.item_type
        if self.latitude is not None:
            item["latitude"] = Decimal(str(self.latitude))
        if self.longitude is not None:
            item["longitude"] = Decimal(str(self.longitude))
        if self.quality:
            item["quality"] = self.quality
        if self.availability:
            item["availability"] = self.availability

        return item

    @classmethod
    def from_item(cls, item: Dict[str, Any]) -> "Listing":
        """Deserializes DynamoDB item into Listing instance."""
        def _to_float(val: Any) -> float:
            if val is None:
                return 0.0
            return float(val)

        return cls(
            listing_id=item.get("listingId", ""),
            seller_id=item.get("sellerId", ""),
            seller_role=item.get("sellerRole", "FARMER"),
            title=item.get("title", ""),
            description=item.get("description", ""),
            category=item.get("category", ""),
            subcategory=item.get("subcategory"),
            item_type=item.get("itemType"),
            quantity=_to_float(item.get("quantity", 0)),
            unit=item.get("unit", "KG"),
            price=_to_float(item.get("price", 0)),
            currency=item.get("currency", "INR"),
            location=item.get("location", ""),
            district=item.get("district", ""),
            state=item.get("state", ""),
            latitude=float(item["latitude"]) if item.get("latitude") is not None else None,
            longitude=float(item["longitude"]) if item.get("longitude") is not None else None,
            quality=item.get("quality"),
            availability=item.get("availability"),
            images=item.get("images", []),
            status=item.get("status", ListingStatus.ACTIVE.value),
            created_at=item.get("createdAt", ""),
            updated_at=item.get("updatedAt", ""),
            gsi1_pk=item.get("GSI1PK"),
            gsi1_sk=item.get("GSI1SK"),
            gsi2_pk=item.get("GSI2PK"),
            gsi2_sk=item.get("GSI2SK"),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Returns clean representation for API responses without internal persistence/index fields."""
        data = asdict(self)
        internal_fields = {
            "pk", "sk", "entityType",
            "gsi1_pk", "gsi1_sk", "gsi2_pk", "gsi2_sk",
            "GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK",
            "gsi1Pk", "gsi1Sk", "gsi2Pk", "gsi2Sk",
        }
        for key in internal_fields:
            data.pop(key, None)
        return data

