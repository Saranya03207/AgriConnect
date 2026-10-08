import os
from unittest.mock import patch
from app.config.settings import Settings, get_settings


def test_default_settings():
    settings = Settings()
    assert settings.table_name == "AgriConnect-Main"
    assert settings.s3_bucket == "agriconnect-storage-2026-001"
    assert settings.cors_origin == "*"
    assert settings.aws_region == "us-east-1"
    assert settings.openai_secret_name == "AgriConnect/OpenAI"


def test_custom_environment_settings():
    with patch.dict(os.environ, {
        "TABLE_NAME": "Custom-Table",
        "S3_BUCKET": "custom-bucket-test",
        "CORS_ORIGIN": "https://agriconnect.in",
        "AWS_REGION": "ap-south-1",
        "OPENAI_SECRET_NAME": "Custom/OpenAI",
    }):
        settings = Settings()
        assert settings.table_name == "Custom-Table"
        assert settings.s3_bucket == "custom-bucket-test"
        assert settings.cors_origin == "https://agriconnect.in"
        assert settings.aws_region == "ap-south-1"
        assert settings.openai_secret_name == "Custom/OpenAI"


def test_settings_to_dict():
    settings = Settings()
    d = settings.to_dict()
    assert "table_name" in d
    assert "s3_bucket" in d
    assert "cors_origin" in d
    assert "aws_region" in d


def test_get_settings_singleton():
    s1 = get_settings()
    s2 = get_settings()
    assert s1 is s2
