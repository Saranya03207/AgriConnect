import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { getUserFromEvent, hasRole } from '@lib/auth';
import { success, created, badRequest, forbidden, notFound, internalError, optionsResponse } from '@lib/response';
import { logger } from '@lib/logger';
import { docClient, TABLE_MAIN } from '@lib/dynamodb';
import { PutCommand, UpdateCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

/**
 * Transactions (Purchase Requests) Lambda Handler
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  if (event.requestContext?.http?.method === 'OPTIONS') return optionsResponse();

  const user = getUserFromEvent(event);
  if (!user) return forbidden();

  const { routeKey, pathParameters } = event as any;
  const transactionId = pathParameters?.transactionId;

  try {
    // POST /transactions — industry user sends a purchase request
    if (routeKey === 'POST /transactions') {
      if (!hasRole(user, 'industry')) return forbidden('Only industry users can send purchase requests');

      const body = JSON.parse(event.body || '{}');
      const { listingId, farmerId, quantity, offerPrice, message } = body;

      if (!listingId || !farmerId || !quantity || !offerPrice) {
        return badRequest('Missing required fields: listingId, farmerId, quantity, offerPrice');
      }

      // Verify listing exists
      const getResult = await docClient.send(new GetCommand({
        TableName: TABLE_MAIN,
        Key: { PK: `LISTING#${listingId}`, SK: `LISTING#${listingId}` },
      }));

      if (!getResult.Item) return notFound('Listing not found');

      const newId = `REQ-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
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

      await docClient.send(new PutCommand({
        TableName: TABLE_MAIN,
        Item: item,
      }));

      return created(item, 'Purchase request sent successfully');
    }

    // GET /transactions — fetch transactions for the current user
    if (routeKey === 'GET /transactions') {
      const isFarmer = hasRole(user, 'farmer');
      const filterField = isFarmer ? 'farmerId' : 'buyerId';

      const scanResult = await docClient.send(new ScanCommand({
        TableName: TABLE_MAIN,
        FilterExpression: `${filterField} = :uid AND entityType = :type`,
        ExpressionAttributeValues: {
          ':uid': user.userId,
          ':type': 'transaction',
        },
      }));

      const items = scanResult.Items ?? [];
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return success({ items }, 'Transactions retrieved');
    }

    // PUT /transactions/{transactionId}/status — farmer accepts or rejects
    if (routeKey === 'PUT /transactions/{transactionId}/status') {
      if (!hasRole(user, 'farmer')) return forbidden('Only farmers can accept/reject requests');

      const body = JSON.parse(event.body || '{}');
      const { status } = body;
      if (!['ACCEPTED', 'REJECTED'].includes(status)) return badRequest('Invalid status');

      const updateResult = await docClient.send(new UpdateCommand({
        TableName: TABLE_MAIN,
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

      return success(updateResult.Attributes, `Request ${status.toLowerCase()}`);
    }

    return badRequest(`Route ${routeKey} not allowed`);
  } catch (err) {
    logger.error('Transactions handler error', err);
    return internalError();
  }
}
