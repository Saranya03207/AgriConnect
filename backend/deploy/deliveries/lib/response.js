"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.created = created;
exports.noContent = noContent;
exports.badRequest = badRequest;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.notFound = notFound;
exports.internalError = internalError;
exports.optionsResponse = optionsResponse;
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json',
};
function success(data, message = 'Success', statusCode = 200) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, message, data }),
    };
}
function created(data, message = 'Created') {
    return success(data, message, 201);
}
function noContent() {
    return {
        statusCode: 204,
        headers: CORS_HEADERS,
        body: '',
    };
}
function badRequest(message, details) {
    return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message, code: 'BAD_REQUEST', details }),
    };
}
function unauthorized(message = 'Unauthorized') {
    return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message, code: 'UNAUTHORIZED' }),
    };
}
function forbidden(message = 'Forbidden') {
    return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message, code: 'FORBIDDEN' }),
    };
}
function notFound(message = 'Not found') {
    return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message, code: 'NOT_FOUND' }),
    };
}
function internalError(message = 'Internal server error') {
    return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message, code: 'INTERNAL_ERROR' }),
    };
}
function optionsResponse() {
    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: '',
    };
}
//# sourceMappingURL=response.js.map