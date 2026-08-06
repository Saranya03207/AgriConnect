"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const auth_1 = require("@lib/auth");
const response_1 = require("@lib/response");
const logger_1 = require("@lib/logger");
/**
 * Notifications Lambda Handler
 * Full implementation in Phase 8.
 */
async function handler(event) {
    if (event.requestContext?.http?.method === 'OPTIONS')
        return (0, response_1.optionsResponse)();
    const user = (0, auth_1.getUserFromEvent)(event);
    if (!user)
        return (0, response_1.forbidden)();
    try {
        // TODO Phase 8: Full notifications handler
        return (0, response_1.success)({ items: [], unreadCount: 0 }, 'Notifications – Phase 8 pending');
    }
    catch (err) {
        logger_1.logger.error('Notifications handler error', err);
        return (0, response_1.internalError)();
    }
}
//# sourceMappingURL=handler.js.map