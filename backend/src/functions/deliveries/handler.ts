import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda'
import { getUserFromEvent } from '@lib/auth'
import { success, forbidden, internalError, optionsResponse } from '@lib/response'

import { logger } from '@lib/logger'

/**
 * Deliveries Lambda Handler
 * Full implementation in Phase 6.
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  if (event.requestContext?.http?.method === 'OPTIONS') return optionsResponse()

  const user = getUserFromEvent(event)
  if (!user) return forbidden()

  try {
    // TODO Phase 6: Full delivery handler
    return success({ items: [], hasMore: false }, 'Deliveries – Phase 6 pending')
  } catch (err) {
    logger.error('Deliveries handler error', err)
    return internalError()
  }
}
