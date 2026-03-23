export const PORTAL_BASE = "/portal";

export function withPortalBase(path: string): string {
  const trimmed = String(path ?? "").trim();
  if (!trimmed) return PORTAL_BASE;
  if (trimmed.startsWith(PORTAL_BASE)) return trimmed;
  if (trimmed.startsWith("/")) return `${PORTAL_BASE}${trimmed}`;
  return `${PORTAL_BASE}/${trimmed}`;
}

