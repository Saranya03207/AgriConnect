import { S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export const s3Client = new S3Client({
  region: process.env.S3_REGION ?? 'us-east-1',
})

export const S3_BUCKET = process.env.S3_BUCKET ?? 'agriconnect-media-dev'

/**
 * Generate a presigned PUT URL for direct browser upload
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket:      S3_BUCKET,
    Key:         key,
    ContentType: contentType,
  })
  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Generate a presigned GET URL for private objects
 */
export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Delete an object from S3
 */
export async function deleteS3Object(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }))
}

/**
 * Build the public URL for a public S3 object
 */
export function getPublicUrl(key: string): string {
  return `https://${S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`
}
