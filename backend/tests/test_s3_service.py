import io
from unittest.mock import MagicMock
import pytest
from botocore.exceptions import ClientError
from app.services.s3_service import S3Service
from app.utils.errors import AppError, NotFoundError


@pytest.fixture
def mock_s3_client():
    return MagicMock()


@pytest.fixture
def s3_service(mock_s3_client):
    return S3Service(bucket_name="agriconnect-storage-2026-001", s3_client=mock_s3_client)


def test_upload_object_string(s3_service, mock_s3_client):
    mock_s3_client.put_object.return_value = {}

    key = s3_service.upload_object(
        key="profiles/usr_123/bio.txt",
        data="Organic farmer from Pollachi",
        content_type="text/plain",
        metadata={"user": "usr_123"},
    )
    assert key == "profiles/usr_123/bio.txt"
    mock_s3_client.put_object.assert_called_once_with(
        Bucket="agriconnect-storage-2026-001",
        Key="profiles/usr_123/bio.txt",
        Body=b"Organic farmer from Pollachi",
        ContentType="text/plain",
        Metadata={"user": "usr_123"},
    )


def test_upload_object_bytes(s3_service, mock_s3_client):
    mock_s3_client.put_object.return_value = {}
    sample_bytes = b"\x89PNG\r\n\x1a\nfakeimage"

    key = s3_service.upload_object(
        key="profiles/usr_123/avatar.png",
        data=sample_bytes,
        content_type="image/png",
    )
    assert key == "profiles/usr_123/avatar.png"
    mock_s3_client.put_object.assert_called_once_with(
        Bucket="agriconnect-storage-2026-001",
        Key="profiles/usr_123/avatar.png",
        Body=sample_bytes,
        ContentType="image/png",
    )


def test_get_object_success(s3_service, mock_s3_client):
    mock_body = MagicMock()
    mock_body.read.return_value = b"Hello AgriConnect"
    mock_s3_client.get_object.return_value = {
        "Body": mock_body,
        "ContentType": "text/plain",
    }

    content, content_type = s3_service.get_object("profiles/usr_123/bio.txt")
    assert content == b"Hello AgriConnect"
    assert content_type == "text/plain"
    mock_s3_client.get_object.assert_called_once_with(
        Bucket="agriconnect-storage-2026-001",
        Key="profiles/usr_123/bio.txt",
    )


def test_get_object_not_found(s3_service, mock_s3_client):
    mock_s3_client.get_object.side_effect = ClientError(
        {"Error": {"Code": "NoSuchKey", "Message": "The specified key does not exist."}},
        "GetObject",
    )
    with pytest.raises(NotFoundError):
        s3_service.get_object("missing/key.jpg")


def test_delete_object_success(s3_service, mock_s3_client):
    mock_s3_client.delete_object.return_value = {}
    res = s3_service.delete_object("profiles/usr_123/avatar.png")
    assert res is True
    mock_s3_client.delete_object.assert_called_once_with(
        Bucket="agriconnect-storage-2026-001",
        Key="profiles/usr_123/avatar.png",
    )


def test_generate_presigned_upload_url(s3_service, mock_s3_client):
    mock_s3_client.generate_presigned_url.return_value = "https://s3.amazonaws.com/presigned-put-url"

    url = s3_service.generate_presigned_upload_url(
        key="listings/lst_456/seed.jpg",
        content_type="image/jpeg",
        expiration=1800,
    )
    assert url == "https://s3.amazonaws.com/presigned-put-url"
    mock_s3_client.generate_presigned_url.assert_called_once_with(
        ClientMethod="put_object",
        Params={
            "Bucket": "agriconnect-storage-2026-001",
            "Key": "listings/lst_456/seed.jpg",
            "ContentType": "image/jpeg",
        },
        ExpiresIn=1800,
    )


def test_generate_presigned_download_url_with_filename(s3_service, mock_s3_client):
    mock_s3_client.generate_presigned_url.return_value = "https://s3.amazonaws.com/presigned-get-url"

    url = s3_service.generate_presigned_download_url(
        key="verification/usr_123/certificate.pdf",
        expiration=3600,
        filename="Organic_Certificate.pdf",
    )
    assert url == "https://s3.amazonaws.com/presigned-get-url"
    mock_s3_client.generate_presigned_url.assert_called_once_with(
        ClientMethod="get_object",
        Params={
            "Bucket": "agriconnect-storage-2026-001",
            "Key": "verification/usr_123/certificate.pdf",
            "ResponseContentDisposition": 'attachment; filename="Organic_Certificate.pdf"',
        },
        ExpiresIn=3600,
    )
