import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda'
import { getUserFromEvent } from '@lib/auth'
import { success, forbidden, internalError, optionsResponse } from '@lib/response'
import { logger } from '@lib/logger'

/**
 * Notifications Lambda Handler
 * Full implementation in Phase 8.
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  if (event.requestContext?.http?.method === 'OPTIONS') return optionsResponse()

  const user = getUserFromEvent(event)
  if (!user) return forbidden()

  try {
    // TODO Phase 8: Full notifications handler
    return success({ items: [], unreadCount: 0 }, 'Notifications – Phase 8 pending')
  } catch (err) {
    logger.error('Notifications handler error', err)
    return internalError()
  }
}
