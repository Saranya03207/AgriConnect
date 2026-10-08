import os
import boto3
from botocore.exceptions import ClientError
from shared.logging import get_logger

logger = get_logger('s3-client')

def get_s3_client():
    return boto3.client('s3')

def get_bucket_name():
    return os.environ.get('S3_BUCKET', 'agriconnect-storage')

def generate_presigned_upload_url(key: str, content_type: str, expiration: int = 3600) -> str:
    """
    Generates a presigned URL for the client to upload an object directly to S3.
    Enforces privacy - objects are private by default.
    """
    s3_client = get_s3_client()
    bucket = get_bucket_name()
    if not bucket:
        raise ValueError("S3_BUCKET environment variable not configured")
        
    try:
        response = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket,
                'Key': key,
                'ContentType': content_type
            },
            ExpiresIn=expiration
        )
        return response
    except ClientError as e:
        logger.error(f"Failed to generate presigned upload URL for key {key}: {e}")
        raise e

def generate_presigned_download_url(key: str, expiration: int = 3600) -> str:
    """
    Generates a presigned URL for secure, temporary read access to a private S3 object.
    Bucket remains strictly private without public read policies.
    """
    s3_client = get_s3_client()
    bucket = get_bucket_name()
    if not bucket:
        raise ValueError("S3_BUCKET environment variable not configured")
        
    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': bucket,
                'Key': key
            },
            ExpiresIn=expiration
        )
        return response
    except ClientError as e:
        logger.error(f"Failed to generate presigned download URL for key {key}: {e}")
        raise e
