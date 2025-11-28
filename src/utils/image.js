import { API_BASE } from '../api'

/**
 * Normalize image URLs returned by the backend.
 * - If `src` is falsy, returns null.
 * - If `src` is absolute (starts with http/https) returns as-is.
 * - If `src` is a root-relative path (starts with '/') it prefixes API_BASE.
 * - Otherwise returns the original string (useful for data already normalized).
 */
export function getFullImageUrl(src) {
  if (!src) return null
  if (typeof src !== 'string') return null
  const trimmed = src.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/')) {
    // Ensure API_BASE does not contain trailing slash
    return `${API_BASE.replace(/\/$/, '')}${trimmed}`
  }
  return trimmed
}

export default getFullImageUrl
