import { apiClient } from './apiClient';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validates a candidate image file before requesting an S3 presigned URL.
 * Rejects unsupported file types and files larger than 10 MB.
 */
export function validateImageFile(file) {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const fileType = (file.type || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    throw new Error(
      `Unsupported format "${file.type || 'unknown'}". Please select JPG, PNG, or WebP product photos.`
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `Photo size (${sizeMb} MB) exceeds the maximum allowed limit of 10 MB. Please choose a smaller photo.`
    );
  }

  return true;
}

/**
 * Uploads a single file directly to Amazon S3 via a presigned PUT URL.
 * Uses XMLHttpRequest for accurate byte-level upload progress tracking.
 *
 * NOTE: The Cognito JWT is NOT sent to S3; the presigned URL contains
 * its own AWS SigV4 authorization query parameters.
 */
function uploadFileToS3(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');

    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Direct S3 upload failed with status ${xhr.status} (${xhr.statusText || 'Upload Error'}).`
          )
        );
      }
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'Network connection error while uploading photo directly to secure storage. Please check your internet connection.'
        )
      );
    };

    xhr.ontimeout = () => {
      reject(
        new Error('Photo upload timed out. Please try again with a stronger connection.')
      );
    };

    xhr.send(file);
  });
}

/**
 * Service managing direct-to-S3 listing photo uploads
 */
export const listingImageService = {
  /**
   * Uploads a single agricultural product photo:
   * 1. Validates file locally.
   * 2. Requests short-lived presigned PUT URL from backend via API Gateway (with Cognito JWT).
   * 3. Uploads binary directly to S3.
   * 4. Returns the resulting S3 object key (e.g. listings/{sellerId}/{uuid}.jpg).
   *
   * @param {File} file
   * @param {Function} [onProgress] - Callback (percent: number) => void
   * @returns {Promise<{ objectKey: string, uploadUrl: string }>}
   */
  async uploadSingleImage(file, onProgress) {
    validateImageFile(file);

    // Request short-lived presigned PUT URL from authenticated endpoint
    const response = await apiClient.post('/listings/images/upload-url', {
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    });

    const data = response.data || response;
    const { uploadUrl, objectKey } = data;

    if (!uploadUrl || !objectKey) {
      throw new Error('Server response missing S3 upload URL or object key.');
    }

    // Direct binary upload to S3
    await uploadFileToS3(uploadUrl, file, onProgress);

    return { objectKey, uploadUrl };
  },

  /**
   * Uploads multiple selected photo files sequentially with progress reporting.
   *
   * @param {File[]} files
   * @param {Function} [onStatusUpdate] - Callback ({ current, total, percent, fileName }) => void
   * @returns {Promise<string[]>} Array of uploaded S3 object keys
   */
  async uploadMultipleImages(files, onStatusUpdate) {
    if (!files || files.length === 0) return [];

    const uploadedKeys = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];

      if (typeof onStatusUpdate === 'function') {
        onStatusUpdate({
          current: i + 1,
          total,
          percent: 0,
          fileName: file.name,
        });
      }

      const { objectKey } = await this.uploadSingleImage(file, (percent) => {
        if (typeof onStatusUpdate === 'function') {
          onStatusUpdate({
            current: i + 1,
            total,
            percent,
            fileName: file.name,
          });
        }
      });

      uploadedKeys.push(objectKey);
    }

    return uploadedKeys;
  },
};

export default listingImageService;
