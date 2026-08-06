"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const auth_1 = require("@lib/auth");
const response_1 = require("@lib/response");
const logger_1 = require("@lib/logger");
/**
 * Messages Lambda Handler
 * Full implementation in Phase 5.
 */
async function handler(event) {
    if (event.requestContext?.http?.method === 'OPTIONS')
        return (0, response_1.optionsResponse)();
    const user = (0, auth_1.getUserFromEvent)(event);
    if (!user)
        return (0, response_1.forbidden)();
    try {
        // TODO Phase 5: Full messaging handler
        return (0, response_1.success)({ items: [] }, 'Messages – Phase 5 pending');
    }
    catch (err) {
        logger_1.logger.error('Messages handler error', err);
        return (0, response_1.internalError)();
    }
}
//# sourceMappingURL=handler.js.map