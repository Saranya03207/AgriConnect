import type { EventBridgeEvent } from 'aws-lambda'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { docClient, TABLE_MAIN } from '@lib/dynamodb'
import { publishNotification } from '@lib/sns'
import { logger } from '@lib/logger'
import { v4 as uuid } from 'uuid'

interface NotificationDetail {
  userId:    string
  type:      string
  title:     string
  body:      string
  relatedId?: string
}

/**
 * EventBridge → Lambda → DynamoDB + SNS notification dispatcher
 * Full implementation in Phase 8.
 */
export async function handler(
  event: EventBridgeEvent<string, NotificationDetail>,
): Promise<void> {
  const { userId, type, title, body, relatedId } = event.detail

  try {
    const now            = new Date().toISOString()
    const notificationId = uuid()

    // Store in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TABLE_MAIN,
        Item: {
          PK:             `USER#${userId}`,
          SK:             `NOTIFICATION#${now}#${notificationId}`,
          entityType:     'NOTIFICATION',
          notificationId,
          userId,
          type,
          title,
          body,
          isRead:         false,
          relatedId,
          createdAt:      now,
        },
      }),
    )

    // Push via SNS
    await publishNotification({ subject: title, message: body })

    logger.info('Notification dispatched', { notificationId, userId, type })
  } catch (err) {
    logger.error('Notification dispatch failed', err)
    throw err // Let EventBridge retry
  }
}
