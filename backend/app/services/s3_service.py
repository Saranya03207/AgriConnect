import io
from functools import lru_cache
from typing import Any, BinaryIO, Dict, Optional, Tuple, Union
import boto3
from botocore.exceptions import ClientError
from app.config.settings import get_settings
from app.utils.errors import AppError, NotFoundError
from app.utils.logging import get_logger

logger = get_logger("s3-service")


class S3Service:
    """
    Service abstraction for Amazon S3 interactions in AgriConnect.

    Guarantees:
      - The S3 bucket is never made public.
      - All uploads are private by default.
      - Read access for private assets uses short-lived presigned URLs.
      - Supports object upload, retrieval, deletion, and presigned URLs.
    """

    def __init__(self, bucket_name: Optional[str] = None, s3_client: Optional[Any] = None):
        settings = get_settings()
        self.bucket_name = bucket_name or settings.s3_bucket

        if s3_client is not None:
            self._client = s3_client
        else:
            self._client = boto3.client("s3", region_name=settings.aws_region)

    @property
    def client(self):
        return self._client

    def upload_object(
        self,
        key: str,
        data: Union[bytes, str, BinaryIO],
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None,
    ) -> str:
        """
        Uploads an object directly to S3.
        Data can be bytes, string, or file-like object.
        Returns the object key.
        """
        body_data: Union[bytes, BinaryIO]
        if isinstance(data, str):
            body_data = data.encode("utf-8")
        elif isinstance(data, bytes):
            body_data = data
        else:
            body_data = data

        params: Dict[str, Any] = {
            "Bucket": self.bucket_name,
            "Key": key,
            "Body": body_data,
            "ContentType": content_type,
        }
        if metadata:
            params["Metadata"] = metadata

        try:
            self._client.put_object(**params)
            logger.info(f"S3 Object uploaded successfully to s3://{self.bucket_name}/{key}")
            return key
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "Unknown")
            msg = e.response.get("Error", {}).get("Message", str(e))
            logger.error(f"S3 put_object failed ({code}) for key '{key}': {msg}")
            raise AppError(f"Failed to upload object to S3: {msg}", status_code=500)

    def get_object(self, key: str) -> Tuple[bytes, str]:
        """
        Retrieves an object from S3.
        Returns a tuple of (content_bytes, content_type).
        """
        try:
            response = self._client.get_object(Bucket=self.bucket_name, Key=key)
            content = response["Body"].read()
            content_type = response.get("ContentType", "application/octet-stream")
            return content, content_type
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "Unknown")
            msg = e.response.get("Error", {}).get("Message", str(e))
            if code in {"NoSuchKey", "404"}:
                logger.warning(f"S3 key '{key}' not found in bucket '{self.bucket_name}'")
                raise NotFoundError(f"Object '{key}' does not exist")
            logger.error(f"S3 get_object failed ({code}) for key '{key}': {msg}")
            raise AppError(f"Failed to retrieve object from S3: {msg}", status_code=500)

    def delete_object(self, key: str) -> bool:
        """
        Deletes an object from S3.
        """
        try:
            self._client.delete_object(Bucket=self.bucket_name, Key=key)
            logger.info(f"S3 Object deleted: s3://{self.bucket_name}/{key}")
            return True
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "Unknown")
            msg = e.response.get("Error", {}).get("Message", str(e))
            logger.error(f"S3 delete_object failed ({code}) for key '{key}': {msg}")
            raise AppError(f"Failed to delete object from S3: {msg}", status_code=500)

    def generate_presigned_upload_url(
        self,
        key: str,
        content_type: str,
        expiration: int = 3600,
    ) -> str:
        """
        Generates a short-lived presigned URL for direct client-side upload.
        The bucket remains private; only the designated key and content_type are permitted.
        """
        try:
            url = self._client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": key,
                    "ContentType": content_type,
                },
                ExpiresIn=expiration,
            )
            return url
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "Unknown")
            msg = e.response.get("Error", {}).get("Message", str(e))
            logger.error(f"Failed to generate presigned upload URL ({code}) for key '{key}': {msg}")
            raise AppError(f"Failed to generate presigned upload URL: {msg}", status_code=500)

    def generate_presigned_download_url(
        self,
        key: str,
        expiration: int = 3600,
        filename: Optional[str] = None,
    ) -> str:
        """
        Generates a short-lived presigned URL for temporary read access to a private object.
        """
        params: Dict[str, Any] = {
            "Bucket": self.bucket_name,
            "Key": key,
        }
        if filename:
            params["ResponseContentDisposition"] = f'attachment; filename="{filename}"'

        try:
            url = self._client.generate_presigned_url(
                ClientMethod="get_object",
                Params=params,
                ExpiresIn=expiration,
            )
            return url
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "Unknown")
            msg = e.response.get("Error", {}).get("Message", str(e))
            logger.error(f"Failed to generate presigned download URL ({code}) for key '{key}': {msg}")
            raise AppError(f"Failed to generate presigned download URL: {msg}", status_code=500)


@lru_cache(maxsize=1)
def get_s3_service() -> S3Service:
    """Return a singleton instance of S3Service."""
    return S3Service()
