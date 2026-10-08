from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional


class UserRole(str, Enum):
    SEED_PRODUCER = "SEED_PRODUCER"
    FARMER = "FARMER"
    BYPRODUCT_SELLER = "BYPRODUCT_SELLER"
    BUYER = "BUYER"
    SERVICE_PROVIDER = "SERVICE_PROVIDER"
    PROCESSOR = "PROCESSOR"
    ADMIN = "ADMIN"


@dataclass
class UserProfile:
    """
    DynamoDB Entity Model for USER PROFILE
    Primary Key:
      PK: USER#<userId>
      SK: PROFILE
    """
    user_id: str
    email: str
    role: str
    display_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    role_details: Optional[Dict[str, Any]] = None
    is_active: bool = True
    is_verified: bool = False
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def pk(self) -> str:
        return f"USER#{self.user_id}"

    @property
    def sk(self) -> str:
        return "PROFILE"

    def to_item(self) -> Dict[str, Any]:
        """Serializes domain model into DynamoDB item format."""
        item: Dict[str, Any] = {
            "PK": self.pk,
            "SK": self.sk,
            "entityType": "USER_PROFILE",
            "userId": self.user_id,
            "email": self.email,
            "role": self.role,
            "displayName": self.display_name,
            "isActive": self.is_active,
            "isVerified": self.is_verified,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
        if self.phone:
            item["phone"] = self.phone
        if self.avatar_url:
            item["avatarUrl"] = self.avatar_url
        if self.bio:
            item["bio"] = self.bio
        if self.location:
            item["location"] = self.location
        if self.role_details:
            item["roleDetails"] = self.role_details

        return item

    @classmethod
    def from_item(cls, item: Dict[str, Any]) -> "UserProfile":
        """Deserializes DynamoDB item into UserProfile instance."""
        return cls(
            user_id=item.get("userId", ""),
            email=item.get("email", ""),
            role=item.get("role", "FARMER"),
            display_name=item.get("displayName", ""),
            phone=item.get("phone"),
            avatar_url=item.get("avatarUrl"),
            bio=item.get("bio"),
            location=item.get("location"),
            role_details=item.get("roleDetails"),
            is_active=item.get("isActive", True),
            is_verified=item.get("isVerified", False),
            created_at=item.get("createdAt", ""),
            updated_at=item.get("updatedAt", ""),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Returns clean representation for API response."""
        data = asdict(self)
        data.pop("pk", None)
        data.pop("sk", None)
        return data
