from datetime import datetime, timezone
from typing import Any, Dict, Optional
from app.auth.cognito import UserClaims
from app.models.user import UserProfile
from app.repositories.dynamodb_repo import DynamoDBRepository, get_dynamodb_repository
from app.utils.errors import NotFoundError, ValidationError
from app.utils.logging import get_logger

logger = get_logger("user-service")


class UserService:
    """Service layer managing user profile retrieval and updates."""

    def __init__(self, repo: Optional[DynamoDBRepository] = None):
        self.repo = repo or get_dynamodb_repository()

    def get_or_create_profile(self, user_claims: UserClaims) -> Dict[str, Any]:
        """
        Retrieves user profile. If user is authenticating for the first time,
        auto-initializes the profile in DynamoDB from trusted Cognito claims.
        """
        key = {"PK": f"USER#{user_claims.user_id}", "SK": "PROFILE"}
        item = self.repo.get_item(key=key)

        if item:
            return item

        logger.info(f"Creating new user profile for user_id={user_claims.user_id}, role={user_claims.role}")
        now_iso = datetime.now(timezone.utc).isoformat()
        new_profile = UserProfile(
            user_id=user_claims.user_id,
            email=user_claims.email,
            role=user_claims.role,
            display_name=user_claims.display_name or user_claims.email.split("@")[0],
            is_active=True,
            is_verified=user_claims.email_verified,
            created_at=now_iso,
            updated_at=now_iso,
        )

        item_data = new_profile.to_item()
        self.repo.put_item(item=item_data)
        return item_data

    def get_profile_by_id(self, user_id: str) -> Dict[str, Any]:
        """Fetches profile by user ID or raises NotFoundError."""
        key = {"PK": f"USER#{user_id}", "SK": "PROFILE"}
        item = self.repo.get_item(key=key)
        if not item:
            raise NotFoundError(f"User with ID '{user_id}' does not exist")
        return item

    def update_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates allowed fields of the user profile.
        Allowed fields: displayName, phone, bio, avatarUrl, location, roleDetails
        """
        key = {"PK": f"USER#{user_id}", "SK": "PROFILE"}

        allowed_fields = {
            "displayName": "displayName",
            "phone": "phone",
            "bio": "bio",
            "avatarUrl": "avatarUrl",
            "location": "location",
            "roleDetails": "roleDetails",
        }

        update_parts = []
        attr_names = {}
        attr_values = {}

        for input_key, dynamo_attr in allowed_fields.items():
            if input_key in updates and updates[input_key] is not None:
                token_name = f"#{dynamo_attr}"
                token_val = f":{dynamo_attr}"
                update_parts.append(f"{token_name} = {token_val}")
                attr_names[token_name] = dynamo_attr
                attr_values[token_val] = updates[input_key]

        if not update_parts:
            raise ValidationError("No valid profile fields provided for update")

        # Always update timestamp
        now_iso = datetime.now(timezone.utc).isoformat()
        update_parts.append("#updatedAt = :updatedAt")
        attr_names["#updatedAt"] = "updatedAt"
        attr_values[":updatedAt"] = now_iso

        update_expr = "SET " + ", ".join(update_parts)

        updated_attributes = self.repo.update_item(
            key=key,
            update_expression=update_expr,
            expression_attribute_names=attr_names,
            expression_attribute_values=attr_values,
            return_values="ALL_NEW",
        )
        return updated_attributes or {}
