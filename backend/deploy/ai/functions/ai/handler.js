"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const auth_1 = require("@lib/auth");
const response_1 = require("@lib/response");
const logger_1 = require("@lib/logger");
/**
 * AI Advisor Lambda Handler
 * Integrates with Google Gemini API.
 * Full implementation in Phase 7.
 */
async function handler(event) {
    if (event.requestContext?.http?.method === 'OPTIONS')
        return (0, response_1.optionsResponse)();
    const user = (0, auth_1.getUserFromEvent)(event);
    if (!user)
        return (0, response_1.forbidden)();
    const { routeKey } = event;
    try {
        if (!routeKey)
            return (0, response_1.badRequest)('Unknown AI route');
        // TODO Phase 7: Route to specific AI handlers
        // /ai/crop-advice        → cropAdviceHandler(user, body)
        // /ai/byproduct-ideas    → byproductIdeasHandler(user, body)
        // /ai/market-insights    → marketInsightsHandler(user, body)
        // /ai/pricing-estimate   → pricingEstimateHandler(user, body)
        return (0, response_1.success)({ queryId: '', response: 'AI Advisor – Phase 7 pending', createdAt: new Date().toISOString() }, 'AI query received');
    }
    catch (err) {
        logger_1.logger.error('AI handler error', err);
        return (0, response_1.internalError)();
    }
}
//# sourceMappingURL=handler.js.map