"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.getQueryParam = getQueryParam;
/**
 * Parse and validate a JSON body against a Zod schema.
 * Returns { data } on success, { error } on failure.
 */
function validateBody(body, schema) {
    if (!body) {
        return { data: null, error: 'Request body is required' };
    }
    try {
        const parsed = JSON.parse(body);
        const result = schema.safeParse(parsed);
        if (!result.success) {
            const messages = result.error.errors
                .map((e) => `${e.path.join('.')}: ${e.message}`)
                .join(', ');
            return { data: null, error: messages };
        }
        return { data: result.data, error: null };
    }
    catch {
        return { data: null, error: 'Invalid JSON body' };
    }
}
/**
 * Parse query string parameters safely
 */
function getQueryParam(params, key, defaultValue) {
    return params?.[key] ?? defaultValue;
}
//# sourceMappingURL=validation.js.map