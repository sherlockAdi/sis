const REMEMBER_KEY = "sis_auth_remember";
const TOKEN_KEY = "sis_auth_token";

function parseBool(value: string | null): boolean {
  return value === "true";
}

export function setRememberMe(remember: boolean) {
  localStorage.setItem(REMEMBER_KEY, String(remember));
}

export function getRememberMe(): boolean {
  return parseBool(localStorage.getItem(REMEMBER_KEY));
}

export function setAuthToken(token: string, remember: boolean) {
  setRememberMe(remember);
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

