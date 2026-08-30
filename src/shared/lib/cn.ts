import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge conditional class names, letting later Tailwind utilities win over
 * earlier ones of the same kind. This is what makes every UI primitive
 * overridable from the call site via `className`: `<Button className="w-full">`
 * replaces the variant's width instead of fighting it on specificity.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
