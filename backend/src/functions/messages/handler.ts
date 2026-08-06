import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda'
import { getUserFromEvent } from '@lib/auth'
import { success, forbidden, internalError, optionsResponse } from '@lib/response'
import { logger } from '@lib/logger'

/**
 * Messages Lambda Handler
 * Full implementation in Phase 5.
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  if (event.requestContext?.http?.method === 'OPTIONS') return optionsResponse()

  const user = getUserFromEvent(event)
  if (!user) return forbidden()

  try {
    // TODO Phase 5: Full messaging handler
    return success({ items: [] }, 'Messages – Phase 5 pending')
  } catch (err) {
    logger.error('Messages handler error', err)
    return internalError()
  }
}
