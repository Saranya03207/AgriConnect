import type { APIGatewayProxyResult } from 'aws-lambda';
export declare function success<T>(data: T, message?: string, statusCode?: number): APIGatewayProxyResult;
export declare function created<T>(data: T, message?: string): APIGatewayProxyResult;
export declare function noContent(): APIGatewayProxyResult;
export declare function badRequest(message: string, details?: Record<string, string>): APIGatewayProxyResult;
export declare function unauthorized(message?: string): APIGatewayProxyResult;
export declare function forbidden(message?: string): APIGatewayProxyResult;
export declare function notFound(message?: string): APIGatewayProxyResult;
export declare function internalError(message?: string): APIGatewayProxyResult;
export declare function optionsResponse(): APIGatewayProxyResult;
//# sourceMappingURL=response.d.ts.map