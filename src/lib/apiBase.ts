/**
 * Split deploy (e.g. Vercel + Render): set VITE_API_URL=https://your-api.onrender.com (no trailing slash).
 * Same-origin (single Node server): leave unset — requests use relative /api paths.
 */
export function getApiOrigin(): string {
  const v = import.meta.env.VITE_API_URL as string | undefined;
  if (!v?.trim()) return "";
  return v.trim().replace(/\/$/, "");
}

export function apiUrl(apiPath: string): string {
  const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  const origin = getApiOrigin();
  if (!origin) return path;
  return `${origin}${path}`;
}
