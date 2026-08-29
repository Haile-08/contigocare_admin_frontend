import type { z } from 'zod'

/**
 * Flattens a Zod error into `{ fieldName: message }`, which is the same shape
 * the API returns for 422s — so client-side and server-side validation land in
 * the identical piece of component state.
 */
export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}

  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field !== 'string' || field in result) continue
    result[field] = issue.message
  }

  return result
}
