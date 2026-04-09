import { getAuthToken } from "./tokenStorage";

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

function getBaseUrl(): string {
  const base = String((import.meta as any).env?.VITE_API_BASE_URL ?? "").trim();
  if (base) return base.replace(/\/+$/, "");
  return "https://sisglobalapi.neuralinfo.co.in";
  // return "http://localhost:3000"
}

async function readErrorBody(res: Response): Promise<{ message: string; details?: unknown }> {
  try {
    const data = await res.json();
    const message = String((data as any)?.error ?? (data as any)?.message ?? res.statusText ?? "Request failed");
    const details = (data as any)?.details;
    return { message, details };
  } catch {
    const text = await res.text().catch(() => "");
    return { message: text || res.statusText || "Request failed" };
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");

  const auth = options.auth !== false;
  if (auth) {
    const token = getAuthToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await readErrorBody(res);
    const err: ApiError = { status: res.status, message: body.message, details: body.details };
    throw err;
  }

  // No content
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}
