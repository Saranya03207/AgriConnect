"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_BUCKET = exports.s3Client = void 0;
exports.getPresignedUploadUrl = getPresignedUploadUrl;
exports.getPresignedDownloadUrl = getPresignedDownloadUrl;
exports.deleteS3Object = deleteS3Object;
exports.getPublicUrl = getPublicUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_2 = require("@aws-sdk/client-s3");
exports.s3Client = new client_s3_1.S3Client({
    region: process.env.S3_REGION ?? 'us-east-1',
});
exports.S3_BUCKET = process.env.S3_BUCKET ?? 'agriconnect-media-dev';
/**
 * Generate a presigned PUT URL for direct browser upload
 */
async function getPresignedUploadUrl(key, contentType, expiresIn = 300) {
    const command = new client_s3_2.PutObjectCommand({
        Bucket: exports.S3_BUCKET,
        Key: key,
        ContentType: contentType,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(exports.s3Client, command, { expiresIn });
}
/**
 * Generate a presigned GET URL for private objects
 */
async function getPresignedDownloadUrl(key, expiresIn = 3600) {
    const command = new client_s3_2.GetObjectCommand({ Bucket: exports.S3_BUCKET, Key: key });
    return (0, s3_request_presigner_1.getSignedUrl)(exports.s3Client, command, { expiresIn });
}
/**
 * Delete an object from S3
 */
async function deleteS3Object(key) {
    await exports.s3Client.send(new client_s3_2.DeleteObjectCommand({ Bucket: exports.S3_BUCKET, Key: key }));
}
/**
 * Build the public URL for a public S3 object
 */
function getPublicUrl(key) {
    return `https://${exports.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}
//# sourceMappingURL=s3.js.map