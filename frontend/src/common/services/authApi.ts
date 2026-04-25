import { apiFetch } from "./apiFetch";

export type LoginResponse = { token: string };
export type OtpRequestResponse = { sent: true };
export type RegisterResponse = { token: string; user_id: number; username: string };

export type SelfMenu = {
  menu_id: number;
  menu_name: string;
  menu_code: string | null;
  parent_menu_id: number | null;
  menu_path: string | null;
  icon: string | null;
  menu_order: number;
  status: number;
  can_view: number;
  can_add: number;
  can_edit: number;
  can_delete: number;
};

export type MeResponse = {
  user_id: number;
  role_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  email: string | null;
  phone: string | null;
  status: number;
  last_login: string | null;
  created_at: string;
  role_name: string;
  role_code: string | null;
  role_description: string | null;
  role_status: number;
  menus: SelfMenu[];
};

export async function login(identifier: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ identifier, password }),
  });
}

export async function requestLoginOtp(identifier: string): Promise<OtpRequestResponse> {
  return apiFetch<OtpRequestResponse>("/auth/otp/request", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ identifier }),
  });
}

export async function verifyLoginOtp(identifier: string, otp: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/otp/verify", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ identifier, otp }),
  });
}

export async function registerUser(body: {
  first_name?: string | null;
  last_name?: string | null;
  username: string;
  email?: string | null;
  phone?: string | null;
  password: string;
}): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify(body),
  });
}

export async function me(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/auth/me", { method: "GET" });
}
