import { S3Client } from '@aws-sdk/client-s3';
export declare const s3Client: S3Client;
export declare const S3_BUCKET: string;
/**
 * Generate a presigned PUT URL for direct browser upload
 */
export declare function getPresignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
/**
 * Generate a presigned GET URL for private objects
 */
export declare function getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
/**
 * Delete an object from S3
 */
export declare function deleteS3Object(key: string): Promise<void>;
/**
 * Build the public URL for a public S3 object
 */
export declare function getPublicUrl(key: string): string;
//# sourceMappingURL=s3.d.ts.map