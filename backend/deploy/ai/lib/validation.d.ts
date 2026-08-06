import { ZodSchema } from 'zod';
/**
 * Parse and validate a JSON body against a Zod schema.
 * Returns { data } on success, { error } on failure.
 */
export declare function validateBody<T>(body: string | null, schema: ZodSchema<T>): {
    data: T;
    error: null;
} | {
    data: null;
    error: string;
};
/**
 * Parse query string parameters safely
 */
export declare function getQueryParam(params: Record<string, string | undefined> | null, key: string, defaultValue?: string): string | undefined;
//# sourceMappingURL=validation.d.ts.map