import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromEvent } from '@lib/auth';
import { success, created, badRequest, forbidden, notFound, internalError, optionsResponse } from '@lib/response';
import { logger } from '@lib/logger';
import { getPresignedUploadUrl, getPublicUrl } from '@lib/s3';
import { docClient, TABLE_MAIN } from '@lib/dynamodb';
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

/**
 * Listings Lambda Handler
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  if (event.requestContext?.http?.method === 'OPTIONS') return optionsResponse();

  const { routeKey, pathParameters } = event;
  const listingId = pathParameters?.listingId;

  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden();

    // POST /listings/upload-images
    if (routeKey === 'POST /listings/upload-images' || routeKey === 'POST /listings/upload-urls') {
      const body = JSON.parse(event.body || '{}');
      const files = body.files as { name: string; type: string }[];
      
      if (!files || !Array.isArray(files) || files.length === 0) {
        return badRequest('Array of files is required');
      }
      if (files.length > 5) return badRequest('Maximum 5 images allowed');

      const urls = await Promise.all(
        files.map(async (file) => {
          const extension = file.name.split('.').pop() || 'jpg';
          const key = `listings/${user.userId}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`;
          const uploadUrl = await getPresignedUploadUrl(key, file.type);
          const publicUrl = getPublicUrl(key);
          return { uploadUrl, publicUrl, key };
        })
      );
      
      return success({ urls }, 'Upload URLs generated');
    }

    // POST /listings
    if (routeKey === 'POST /listings') {
      const body = JSON.parse(event.body || '{}');
      const { 
        title, description, category, listingType, 
        price, unit, quantity, district, state, 
        address, latitude, longitude, contactNumber, images 
      } = body;

      if (!title || !category || !price) {
        return badRequest('Missing required fields');
      }

      const newListingId = `LST-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const now = new Date().toISOString();

      const item = {
        PK: `LISTING#${newListingId}`,
        SK: 'METADATA',
        GSI1PK: `USER#${user.userId}`,
        GSI1SK: `LISTING#${newListingId}`,
        entityType: 'listing',
        listingId: newListingId,
        ownerId: user.userId,
        title,
        description: description || '',
        category,
        listingType: listingType || 'Sale',
        price: Number(price),
        unit: unit || 'kg',
        quantity: quantity ? Number(quantity) : 1,
        district: district || '',
        state: state || '',
        address: address || '',
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        contactNumber: contactNumber || '',
        images: Array.isArray(images) ? images : [],
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };

      await docClient.send(new PutCommand({
        TableName: TABLE_MAIN,
        Item: item,
      }));

      return created(item, 'Listing created successfully');
    }

    // GET /listings/{listingId}
    if (routeKey === 'GET /listings/{listingId}' && listingId) {
      const { Item } = await docClient.send(new GetCommand({
        TableName: TABLE_MAIN,
        Key: {
          PK: `LISTING#${listingId}`,
          SK: 'METADATA'
        }
      }));
      
      if (!Item) return notFound('Listing not found');
      return success(Item, 'Listing retrieved');
    }

    // PUT /listings/{listingId}
    if (routeKey === 'PUT /listings/{listingId}' && listingId) {
      const body = JSON.parse(event.body || '{}');
      const { 
        title, description, category, listingType, 
        price, unit, quantity, district, state, 
        address, latitude, longitude, contactNumber, images, status 
      } = body;

      const now = new Date().toISOString();

      // Build update expression
      let updateExpr = 'SET updatedAt = :updatedAt';
      const exprVals: Record<string, any> = {
        ':updatedAt': now,
        ':ownerId': user.userId // Used in ConditionExpression
      };
      const exprNames: Record<string, string> = {};

      if (title !== undefined) { updateExpr += ', title = :title'; exprVals[':title'] = title; }
      if (description !== undefined) { updateExpr += ', description = :desc'; exprVals[':desc'] = description; }
      if (category !== undefined) { updateExpr += ', category = :cat'; exprVals[':cat'] = category; }
      if (listingType !== undefined) { updateExpr += ', listingType = :ltype'; exprVals[':ltype'] = listingType; }
      if (price !== undefined) { updateExpr += ', price = :price'; exprVals[':price'] = Number(price); }
      if (unit !== undefined) { updateExpr += ', unit = :unit'; exprVals[':unit'] = unit; }
      if (quantity !== undefined) { updateExpr += ', quantity = :qty'; exprVals[':qty'] = Number(quantity); }
      if (district !== undefined) { updateExpr += ', district = :dist'; exprVals[':dist'] = district; }
      if (state !== undefined) { updateExpr += ', #state = :state'; exprNames['#state'] = 'state'; exprVals[':state'] = state; }
      if (address !== undefined) { updateExpr += ', address = :addr'; exprVals[':addr'] = address; }
      if (latitude !== undefined) { updateExpr += ', latitude = :lat'; exprVals[':lat'] = latitude; }
      if (longitude !== undefined) { updateExpr += ', longitude = :lon'; exprVals[':lon'] = longitude; }
      if (contactNumber !== undefined) { updateExpr += ', contactNumber = :contact'; exprVals[':contact'] = contactNumber; }
      if (images !== undefined) { updateExpr += ', images = :img'; exprVals[':img'] = images; }
      if (status !== undefined) { updateExpr += ', #status = :status'; exprNames['#status'] = 'status'; exprVals[':status'] = status; }

      try {
        const result = await docClient.send(new UpdateCommand({
          TableName: TABLE_MAIN,
          Key: {
            PK: `LISTING#${listingId}`,
            SK: 'METADATA'
          },
          UpdateExpression: updateExpr,
          ConditionExpression: 'ownerId = :ownerId',
          ExpressionAttributeValues: exprVals,
          ExpressionAttributeNames: Object.keys(exprNames).length > 0 ? exprNames : undefined,
          ReturnValues: 'ALL_NEW'
        }));

        return success(result.Attributes, 'Listing updated successfully');
      } catch (err: any) {
        if (err.name === 'ConditionalCheckFailedException') {
          return forbidden('You do not have permission to edit this listing or it does not exist');
        }
        throw err;
      }
    }

    // DELETE /listings/{listingId}
    if (routeKey === 'DELETE /listings/{listingId}' && listingId) {
      try {
        await docClient.send(new DeleteCommand({
          TableName: TABLE_MAIN,
          Key: {
            PK: `LISTING#${listingId}`,
            SK: 'METADATA'
          },
          ConditionExpression: 'ownerId = :ownerId',
          ExpressionAttributeValues: {
            ':ownerId': user.userId
          }
        }));
        
        return success({ deleted: true }, 'Listing deleted successfully');
      } catch (err: any) {
        if (err.name === 'ConditionalCheckFailedException') {
          return forbidden('You do not have permission to delete this listing or it does not exist');
        }
        throw err;
      }
    }

    // GET /listings (Marketplace & My Listings)
    if (routeKey === 'GET /listings') {
      const { queryStringParameters } = event;
      const farmerId = queryStringParameters?.farmerId;
      const ownerId = queryStringParameters?.ownerId || farmerId; // Support both for backward compatibility

      // In a real production setup, we'd use robust query building and pagination.
      // For this demo, if ownerId is provided, we scan or query based on that.
      // If no ownerId, we scan for active listings.
      
      const filterExpr: string[] = ['entityType = :entityType'];
      const exprVals: Record<string, any> = {
        ':entityType': 'listing',
      };
      const exprNames: Record<string, string> = {};

      if (ownerId) {
        filterExpr.push('ownerId = :ownerId');
        exprVals[':ownerId'] = ownerId;
      } else {
        filterExpr.push('#status = :status');
        exprNames['#status'] = 'status';
        exprVals[':status'] = 'ACTIVE';
      }

      const { Items } = await docClient.send(new ScanCommand({
        TableName: TABLE_MAIN,
        FilterExpression: filterExpr.join(' AND '),
        ExpressionAttributeValues: exprVals,
        ExpressionAttributeNames: Object.keys(exprNames).length > 0 ? exprNames : undefined,
      }));

      const results = Items || [];
      // Sort newest first
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return success({ items: results }, 'Listings retrieved');
    }

    return badRequest(`Route ${routeKey} not allowed`);
  } catch (err) {
    logger.error('Listings handler error', err);
    return internalError();
  }
}
