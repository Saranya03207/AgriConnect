import apiClient from '@/lib/axios';
import { usersService } from './users.service';

/**
 * Get S3 presigned URLs for multi-image upload
 * @param {Array<{name: string, type: string}>} files
 */
export const getListingUploadUrls = async (files) => {
  const { data } = await apiClient.post('/listings/upload-urls', { files });
  return data.data; // { urls: [{ uploadUrl, publicUrl, key }] }
};

/**
 * Upload multiple images directly to S3
 * @param {File[]} files
 */
export const uploadListingImages = async (files) => {
  if (!files || files.length === 0) return [];

  const fileInfos = files.map(f => ({ name: f.name, type: f.type }));
  const { urls } = await getListingUploadUrls(fileInfos);

  const uploadPromises = files.map(async (file, index) => {
    const urlInfo = urls[index];
    await usersService.uploadToS3(urlInfo.uploadUrl, file, file.type);
    return urlInfo.publicUrl;
  });

  return Promise.all(uploadPromises);
};

/**
 * Create a new listing
 * @param {Object} listingData
 */
export const createListing = async (listingData) => {
  const { data } = await apiClient.post('/listings', listingData);
  return data.data;
};

export const getAllListings = async (params = {}) => {
  const { data } = await apiClient.get('/listings', { params });
  return data.data; // { items, nextCursor }
};

export const getMyListings = async (farmerId, cursor) => {
  const { data } = await apiClient.get('/listings', { 
    params: { farmerId, cursor } 
  });
  return data?.data?.items || [];
};

export const getListingById = async (id) => {
  const { data } = await apiClient.get(`/listings/${id}`);
  return data.data;
};

export const updateListing = async (id, updateData) => {
  const { data } = await apiClient.put(`/listings/${id}`, updateData);
  return data.data;
};

export const deleteListing = async (id) => {
  const { data } = await apiClient.delete(`/listings/${id}`);
  return data;
};