"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const auth_1 = require("@lib/auth");
const response_1 = require("@lib/response");
const logger_1 = require("@lib/logger");
const s3_1 = require("@lib/s3");
const dynamodb_1 = require("@lib/dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Listings Lambda Handler
 */
async function handler(event) {
    if (event.requestContext?.http?.method === 'OPTIONS')
        return (0, response_1.optionsResponse)();
    const { routeKey, pathParameters } = event;
    const listingId = pathParameters?.listingId;
    try {
        const user = (0, auth_1.getUserFromEvent)(event);
        if (!user)
            return (0, response_1.forbidden)();
        // POST /listings/upload-images
        if (routeKey === 'POST /listings/upload-images' || routeKey === 'POST /listings/upload-urls') {
            const body = JSON.parse(event.body || '{}');
            const files = body.files;
            if (!files || !Array.isArray(files) || files.length === 0) {
                return (0, response_1.badRequest)('Array of files is required');
            }
            if (files.length > 5)
                return (0, response_1.badRequest)('Maximum 5 images allowed');
            const urls = await Promise.all(files.map(async (file) => {
                const extension = file.name.split('.').pop() || 'jpg';
                const key = `listings/${user.userId}/${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}.${extension}`;
                const uploadUrl = await (0, s3_1.getPresignedUploadUrl)(key, file.type);
                const publicUrl = (0, s3_1.getPublicUrl)(key);
                return { uploadUrl, publicUrl, key };
            }));
            return (0, response_1.success)({ urls }, 'Upload URLs generated');
        }
        // POST /listings
        if (routeKey === 'POST /listings') {
            const body = JSON.parse(event.body || '{}');
            const { title, description, category, listingType, price, unit, quantity, district, state, address, latitude, longitude, contactNumber, images } = body;
            if (!title || !category || !price) {
                return (0, response_1.badRequest)('Missing required fields');
            }
            const newListingId = `LST-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}`;
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
            await dynamodb_1.docClient.send(new lib_dynamodb_1.PutCommand({
                TableName: dynamodb_1.TABLE_MAIN,
                Item: item,
            }));
            return (0, response_1.created)(item, 'Listing created successfully');
        }
        // GET /listings/{listingId}
        if (routeKey === 'GET /listings/{listingId}' && listingId) {
            const { Item } = await dynamodb_1.docClient.send(new lib_dynamodb_1.GetCommand({
                TableName: dynamodb_1.TABLE_MAIN,
                Key: {
                    PK: `LISTING#${listingId}`,
                    SK: 'METADATA'
                }
            }));
            if (!Item)
                return (0, response_1.notFound)('Listing not found');
            return (0, response_1.success)(Item, 'Listing retrieved');
        }
        // PUT /listings/{listingId}
        if (routeKey === 'PUT /listings/{listingId}' && listingId) {
            const body = JSON.parse(event.body || '{}');
            const { title, description, category, listingType, price, unit, quantity, district, state, address, latitude, longitude, contactNumber, images, status } = body;
            const now = new Date().toISOString();
            // Build update expression
            let updateExpr = 'SET updatedAt = :updatedAt';
            const exprVals = {
                ':updatedAt': now,
                ':ownerId': user.userId // Used in ConditionExpression
            };
            const exprNames = {};
            if (title !== undefined) {
                updateExpr += ', title = :title';
                exprVals[':title'] = title;
            }
            if (description !== undefined) {
                updateExpr += ', description = :desc';
                exprVals[':desc'] = description;
            }
            if (category !== undefined) {
                updateExpr += ', category = :cat';
                exprVals[':cat'] = category;
            }
            if (listingType !== undefined) {
                updateExpr += ', listingType = :ltype';
                exprVals[':ltype'] = listingType;
            }
            if (price !== undefined) {
                updateExpr += ', price = :price';
                exprVals[':price'] = Number(price);
            }
            if (unit !== undefined) {
                updateExpr += ', unit = :unit';
                exprVals[':unit'] = unit;
            }
            if (quantity !== undefined) {
                updateExpr += ', quantity = :qty';
                exprVals[':qty'] = Number(quantity);
            }
            if (district !== undefined) {
                updateExpr += ', district = :dist';
                exprVals[':dist'] = district;
            }
            if (state !== undefined) {
                updateExpr += ', #state = :state';
                exprNames['#state'] = 'state';
                exprVals[':state'] = state;
            }
            if (address !== undefined) {
                updateExpr += ', address = :addr';
                exprVals[':addr'] = address;
            }
            if (latitude !== undefined) {
                updateExpr += ', latitude = :lat';
                exprVals[':lat'] = latitude;
            }
            if (longitude !== undefined) {
                updateExpr += ', longitude = :lon';
                exprVals[':lon'] = longitude;
            }
            if (contactNumber !== undefined) {
                updateExpr += ', contactNumber = :contact';
                exprVals[':contact'] = contactNumber;
            }
            if (images !== undefined) {
                updateExpr += ', images = :img';
                exprVals[':img'] = images;
            }
            if (status !== undefined) {
                updateExpr += ', #status = :status';
                exprNames['#status'] = 'status';
                exprVals[':status'] = status;
            }
            try {
                const result = await dynamodb_1.docClient.send(new lib_dynamodb_1.UpdateCommand({
                    TableName: dynamodb_1.TABLE_MAIN,
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
                return (0, response_1.success)(result.Attributes, 'Listing updated successfully');
            }
            catch (err) {
                if (err.name === 'ConditionalCheckFailedException') {
                    return (0, response_1.forbidden)('You do not have permission to edit this listing or it does not exist');
                }
                throw err;
            }
        }
        // DELETE /listings/{listingId}
        if (routeKey === 'DELETE /listings/{listingId}' && listingId) {
            try {
                await dynamodb_1.docClient.send(new lib_dynamodb_1.DeleteCommand({
                    TableName: dynamodb_1.TABLE_MAIN,
                    Key: {
                        PK: `LISTING#${listingId}`,
                        SK: 'METADATA'
                    },
                    ConditionExpression: 'ownerId = :ownerId',
                    ExpressionAttributeValues: {
                        ':ownerId': user.userId
                    }
                }));
                return (0, response_1.success)({ deleted: true }, 'Listing deleted successfully');
            }
            catch (err) {
                if (err.name === 'ConditionalCheckFailedException') {
                    return (0, response_1.forbidden)('You do not have permission to delete this listing or it does not exist');
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
            const filterExpr = ['entityType = :entityType'];
            const exprVals = {
                ':entityType': 'listing',
            };
            const exprNames = {};
            if (ownerId) {
                filterExpr.push('ownerId = :ownerId');
                exprVals[':ownerId'] = ownerId;
            }
            else {
                filterExpr.push('#status = :status');
                exprNames['#status'] = 'status';
                exprVals[':status'] = 'ACTIVE';
            }
            const { Items } = await dynamodb_1.docClient.send(new lib_dynamodb_1.ScanCommand({
                TableName: dynamodb_1.TABLE_MAIN,
                FilterExpression: filterExpr.join(' AND '),
                ExpressionAttributeValues: exprVals,
                ExpressionAttributeNames: Object.keys(exprNames).length > 0 ? exprNames : undefined,
            }));
            const results = Items || [];
            // Sort newest first
            results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return (0, response_1.success)({ items: results }, 'Listings retrieved');
        }
        return (0, response_1.badRequest)(`Route ${routeKey} not allowed`);
    }
    catch (err) {
        logger_1.logger.error('Listings handler error', err);
        return (0, response_1.internalError)();
    }
}
//# sourceMappingURL=handler.js.map