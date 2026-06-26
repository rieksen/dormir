/**
 * Centralized API client for Dormir API.
 * Base URL from VITE_API_URL env variable.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:8000" : "");

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export default API_BASE_URL;
