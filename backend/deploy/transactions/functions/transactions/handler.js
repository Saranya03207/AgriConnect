"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const auth_1 = require("@lib/auth");
const response_1 = require("@lib/response");
const logger_1 = require("@lib/logger");
const dynamodb_1 = require("@lib/dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Transactions (Purchase Requests) Lambda Handler
 */
async function handler(event) {
    if (event.requestContext?.http?.method === 'OPTIONS')
        return (0, response_1.optionsResponse)();
    const user = (0, auth_1.getUserFromEvent)(event);
    if (!user)
        return (0, response_1.forbidden)();
    const { routeKey, pathParameters } = event;
    const transactionId = pathParameters?.transactionId;
    try {
        // POST /transactions — industry user sends a purchase request
        if (routeKey === 'POST /transactions') {
            if (!(0, auth_1.hasRole)(user, 'industry'))
                return (0, response_1.forbidden)('Only industry users can send purchase requests');
            const body = JSON.parse(event.body || '{}');
            const { listingId, farmerId, quantity, offerPrice, message } = body;
            if (!listingId || !farmerId || !quantity || !offerPrice) {
                return (0, response_1.badRequest)('Missing required fields: listingId, farmerId, quantity, offerPrice');
            }
            // Verify listing exists
            const getResult = await dynamodb_1.docClient.send(new lib_dynamodb_1.GetCommand({
                TableName: dynamodb_1.TABLE_MAIN,
                Key: { PK: `LISTING#${listingId}`, SK: `LISTING#${listingId}` },
            }));
            if (!getResult.Item)
                return (0, response_1.notFound)('Listing not found');
            const newId = `REQ-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}`;
            const now = new Date().toISOString();
            const item = {
                PK: `TRANSACTION#${newId}`,
                SK: `TRANSACTION#${newId}`,
                GSI1PK: `BUYER#${user.userId}`,
                GSI1SK: `TRANSACTION#${newId}`,
                entityType: 'transaction',
                transactionId: newId,
                listingId,
                listingTitle: getResult.Item.title ?? '',
                farmerId,
                buyerId: user.userId,
                buyerName: user.displayName,
                quantity: Number(quantity),
                offerPrice: Number(offerPrice),
                message: message ?? '',
                status: 'PENDING',
                createdAt: now,
                updatedAt: now,
            };
            await dynamodb_1.docClient.send(new lib_dynamodb_1.PutCommand({
                TableName: dynamodb_1.TABLE_MAIN,
                Item: item,
            }));
            return (0, response_1.created)(item, 'Purchase request sent successfully');
        }
        // GET /transactions — fetch transactions for the current user
        if (routeKey === 'GET /transactions') {
            const isFarmer = (0, auth_1.hasRole)(user, 'farmer');
            const filterField = isFarmer ? 'farmerId' : 'buyerId';
            const scanResult = await dynamodb_1.docClient.send(new lib_dynamodb_1.ScanCommand({
                TableName: dynamodb_1.TABLE_MAIN,
                FilterExpression: `${filterField} = :uid AND entityType = :type`,
                ExpressionAttributeValues: {
                    ':uid': user.userId,
                    ':type': 'transaction',
                },
            }));
            const items = scanResult.Items ?? [];
            items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return (0, response_1.success)({ items }, 'Transactions retrieved');
        }
        // PUT /transactions/{transactionId}/status — farmer accepts or rejects
        if (routeKey === 'PUT /transactions/{transactionId}/status') {
            if (!(0, auth_1.hasRole)(user, 'farmer'))
                return (0, response_1.forbidden)('Only farmers can accept/reject requests');
            const body = JSON.parse(event.body || '{}');
            const { status } = body;
            if (!['ACCEPTED', 'REJECTED'].includes(status))
                return (0, response_1.badRequest)('Invalid status');
            const updateResult = await dynamodb_1.docClient.send(new lib_dynamodb_1.UpdateCommand({
                TableName: dynamodb_1.TABLE_MAIN,
                Key: { PK: `TRANSACTION#${transactionId}`, SK: `TRANSACTION#${transactionId}` },
                UpdateExpression: 'SET #st = :status, updatedAt = :now',
                ConditionExpression: 'farmerId = :fid AND #st = :pending',
                ExpressionAttributeNames: { '#st': 'status' },
                ExpressionAttributeValues: {
                    ':status': status,
                    ':now': new Date().toISOString(),
                    ':fid': user.userId,
                    ':pending': 'PENDING',
                },
                ReturnValues: 'ALL_NEW',
            }));
            return (0, response_1.success)(updateResult.Attributes, `Request ${status.toLowerCase()}`);
        }
        return (0, response_1.badRequest)(`Route ${routeKey} not allowed`);
    }
    catch (err) {
        logger_1.logger.error('Transactions handler error', err);
        return (0, response_1.internalError)();
    }
}
//# sourceMappingURL=handler.js.map