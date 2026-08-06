import type { APIGatewayProxyResult } from 'aws-lambda'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  process.env.CORS_ORIGIN ?? '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type':                 'application/json',
}

export function success<T>(data: T, message = 'Success', statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body:    JSON.stringify({ success: true, message, data }),
  }
}

export function created<T>(data: T, message = 'Created'): APIGatewayProxyResult {
  return success(data, message, 201)
}

export function noContent(): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers:    CORS_HEADERS,
    body:       '',
  }
}

export function badRequest(message: string, details?: Record<string, string>): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers:    CORS_HEADERS,
    body:       JSON.stringify({ success: false, message, code: 'BAD_REQUEST', details }),
  }
}

export function unauthorized(message = 'Unauthorized'): APIGatewayProxyResult {
  return {
    statusCode: 401,
    headers:    CORS_HEADERS,
    body:       JSON.stringify({ success: false, message, code: 'UNAUTHORIZED' }),
  }
}

export function forbidden(message = 'Forbidden'): APIGatewayProxyResult {
  return {
    statusCode: 403,
    headers:    CORS_HEADERS,
    body:       JSON.stringify({ success: false, message, code: 'FORBIDDEN' }),
  }
}

export function notFound(message = 'Not found'): APIGatewayProxyResult {
  return {
    statusCode: 404,
    headers:    CORS_HEADERS,
    body:       JSON.stringify({ success: false, message, code: 'NOT_FOUND' }),
  }
}

export function internalError(message = 'Internal server error'): APIGatewayProxyResult {
  return {
    statusCode: 500,
    headers:    CORS_HEADERS,
    body:       JSON.stringify({ success: false, message, code: 'INTERNAL_ERROR' }),
  }
}

export function optionsResponse(): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers:    CORS_HEADERS,
    body:       '',
  }
}
