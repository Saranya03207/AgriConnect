"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const auth_1 = require("@lib/auth");
const response_1 = require("@lib/response");
const logger_1 = require("@lib/logger");
/**
 * Admin Lambda Handler
 * Full implementation in Phase 10.
 */
async function handler(event) {
    if (event.requestContext?.http?.method === 'OPTIONS')
        return (0, response_1.optionsResponse)();
    const user = (0, auth_1.getUserFromEvent)(event);
    if (!user)
        return (0, response_1.forbidden)();
    if (!(0, auth_1.hasRole)(user, 'admin'))
        return (0, response_1.forbidden)('Admin access only');
    try {
        // TODO Phase 10: Full admin handler
        return (0, response_1.success)({}, 'Admin – Phase 10 pending');
    }
    catch (err) {
        logger_1.logger.error('Admin handler error', err);
        return (0, response_1.internalError)();
    }
}
//# sourceMappingURL=handler.js.map