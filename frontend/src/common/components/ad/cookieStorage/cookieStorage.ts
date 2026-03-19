export type AdCookieSetOptions = {
  /** Expiry in days (default: 7). */
  days?: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
};

export type AdCookieCrypto = {
  encrypt: (plainText: string) => string;
  decrypt: (cipherText: string) => string;
};

function canUseCookies() {
  return typeof document !== "undefined" && typeof document.cookie === "string";
}

function encodeValue(value: unknown) {
  try {
    return encodeURIComponent(JSON.stringify(value));
  } catch {
    return encodeURIComponent(String(value));
  }
}

function decodeValue(raw: string) {
  const decoded = decodeURIComponent(raw);
  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(base64Url: string) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function createXorCookieCrypto(secret: string): AdCookieCrypto {
  const keyBytes = new TextEncoder().encode(secret);
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  const xor = (bytes: Uint8Array) => {
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) out[i] = bytes[i]! ^ keyBytes[i % keyBytes.length]!;
    return out;
  };

  return {
    encrypt: (plainText) => {
      if (!secret) return plainText;
      const data = textEncoder.encode(plainText);
      return `xor:v1:${toBase64Url(xor(data))}`;
    },
    decrypt: (cipherText) => {
      if (!cipherText.startsWith("xor:v1:")) return cipherText;
      const payload = cipherText.slice("xor:v1:".length);
      const data = fromBase64Url(payload);
      return textDecoder.decode(xor(data));
    },
  };
}

let cryptoAdapter: AdCookieCrypto = createXorCookieCrypto("__ad_default_secret__");

function getEnvCookieSecret(): string {
  try {
    return String((import.meta as any).env?.VITE_COOKIE_SECRET ?? "");
  } catch {
    return "";
  }
}

const envSecret = getEnvCookieSecret().trim();
if (envSecret) cryptoAdapter = createXorCookieCrypto(envSecret);

function getCookieRaw(name: string) {
  if (!canUseCookies()) return "";
  const key = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(key)) return part.slice(key.length);
  }
  return "";
}

export const adCookieStorage = {
  /** Configure a project-wide encrypter/decrypter (applied to all set/get). */
  useCrypto(adapter?: AdCookieCrypto | null) {
    cryptoAdapter = adapter ?? { encrypt: (s) => s, decrypt: (s) => s };
  },

  set(name: string, value: unknown, options: AdCookieSetOptions = {}) {
    if (!canUseCookies()) return;
    const {
      days = 7,
      path = "/",
      sameSite = "Lax",
      secure = sameSite === "None",
    } = options;

    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    const plain = encodeValue(value);
    const cipher = cryptoAdapter.encrypt(plain);
    const cookieParts = [
      `${encodeURIComponent(name)}=${encodeURIComponent(cipher)}`,
      `Expires=${expires}`,
      `Path=${path}`,
      `SameSite=${sameSite}`,
    ];
    if (secure) cookieParts.push("Secure");

    document.cookie = cookieParts.join("; ");
  },

  get<T = any>(name: string): T | null {
    const raw = getCookieRaw(name);
    if (!raw) return null;
    try {
      const decoded = decodeURIComponent(raw);
      const plain = cryptoAdapter.decrypt(decoded);
      return decodeValue(plain) as T;
    } catch {
      return null;
    }
  },

  remove(name: string, path = "/") {
    if (!canUseCookies()) return;
    document.cookie = `${encodeURIComponent(name)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}; SameSite=Lax`;
  },
};
