import os
from functools import lru_cache
from typing import Optional


class Settings:
    """
    Centralized configuration management for AgriConnect.
    Reads environment variables provided to AWS Lambda without requiring
    AWS_REGION to be manually set (it is either provided automatically by AWS Lambda runtime
    or falls back safely to 'us-east-1').
    """

    def __init__(self):
        self.table_name: str = os.environ.get("TABLE_NAME", "AgriConnect-Main")
        self.s3_bucket: str = os.environ.get("S3_BUCKET", "agriconnect-storage-2026-001")
        self.cors_origin: str = os.environ.get("CORS_ORIGIN", "*")
        # AWS Lambda automatically injects AWS_REGION in execution environment
        self.aws_region: str = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
        self.openai_secret_name: str = os.environ.get("OPENAI_SECRET_NAME", "AgriConnect/OpenAI")

    def to_dict(self) -> dict:
        return {
            "table_name": self.table_name,
            "s3_bucket": self.s3_bucket,
            "cors_origin": self.cors_origin,
            "aws_region": self.aws_region,
            "openai_secret_name": self.openai_secret_name,
        }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton instance of Settings."""
    return Settings()
