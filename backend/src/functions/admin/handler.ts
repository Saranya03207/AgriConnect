import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda'
import { getUserFromEvent, hasRole } from '@lib/auth'
import { success, forbidden, internalError, optionsResponse } from '@lib/response'
import { logger } from '@lib/logger'

/**
 * Admin Lambda Handler
 * Full implementation in Phase 10.
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  if (event.requestContext?.http?.method === 'OPTIONS') return optionsResponse()

  const user = getUserFromEvent(event)
  if (!user) return forbidden()
  if (!hasRole(user, 'admin')) return forbidden('Admin access only')

  try {
    // TODO Phase 10: Full admin handler
    return success({}, 'Admin – Phase 10 pending')
  } catch (err) {
    logger.error('Admin handler error', err)
    return internalError()
  }
}
