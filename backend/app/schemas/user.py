from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(alias="userId")
    email: str
    role: str
    display_name: str = Field(alias="displayName")
    phone: Optional[str] = None
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    bio: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    role_details: Optional[Dict[str, Any]] = Field(None, alias="roleDetails")
    is_active: bool = Field(True, alias="isActive")
    is_verified: bool = Field(False, alias="isVerified")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")


class UpdateUserProfileRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    display_name: Optional[str] = Field(None, alias="displayName")
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    location: Optional[Dict[str, Any]] = None
    role_details: Optional[Dict[str, Any]] = Field(None, alias="roleDetails")
