import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda'
import { getUserFromEvent } from '@lib/auth'
import { success, forbidden, badRequest, internalError, optionsResponse } from '@lib/response'
import { logger } from '@lib/logger'

/**
 * AI Advisor Lambda Handler
 * Integrates with Google Gemini API.
 * Full implementation in Phase 7.
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  if (event.requestContext?.http?.method === 'OPTIONS') return optionsResponse()

  const user = getUserFromEvent(event)
  if (!user) return forbidden()

  const { routeKey } = event

  try {
    if (!routeKey) return badRequest('Unknown AI route')

    // TODO Phase 7: Route to specific AI handlers
    // /ai/crop-advice        → cropAdviceHandler(user, body)
    // /ai/byproduct-ideas    → byproductIdeasHandler(user, body)
    // /ai/market-insights    → marketInsightsHandler(user, body)
    // /ai/pricing-estimate   → pricingEstimateHandler(user, body)

    return success(
      { queryId: '', response: 'AI Advisor – Phase 7 pending', createdAt: new Date().toISOString() },
      'AI query received',
    )
  } catch (err) {
    logger.error('AI handler error', err)
    return internalError()
  }
}
