export function parseJsonList(value?: string | null): string[] {
  const raw = String(value ?? "").trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // fall through to plain-text parsing
  }

  return raw
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeJsonList(values: string[]): string {
  return JSON.stringify(values.map((item) => String(item).trim()).filter(Boolean));
}

export function formatJsonList(value?: string | null): string {
  const items = parseJsonList(value);
  return items.length ? items.join(", ") : "—";
}
