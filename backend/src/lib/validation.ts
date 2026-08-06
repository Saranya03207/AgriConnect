import { ZodSchema, ZodError } from 'zod'

/**
 * Parse and validate a JSON body against a Zod schema.
 * Returns { data } on success, { error } on failure.
 */
export function validateBody<T>(
  body: string | null,
  schema: ZodSchema<T>,
): { data: T; error: null } | { data: null; error: string } {
  if (!body) {
    return { data: null, error: 'Request body is required' }
  }

  try {
    const parsed = JSON.parse(body)
    const result = schema.safeParse(parsed)

    if (!result.success) {
      const messages = (result.error as ZodError).errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      return { data: null, error: messages }
    }

    return { data: result.data, error: null }
  } catch {
    return { data: null, error: 'Invalid JSON body' }
  }
}

/**
 * Parse query string parameters safely
 */
export function getQueryParam(
  params: Record<string, string | undefined> | null,
  key: string,
  defaultValue?: string,
): string | undefined {
  return params?.[key] ?? defaultValue
}
