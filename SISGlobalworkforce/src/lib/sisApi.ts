/**
 * SIS Global – Public API Service
 * ─────────────────────────────────────────────────────────────────────────────
 * All public endpoints are centralised here.
 * To point at a different base URL, change BASE_URL only.
 * To add a new endpoint, add a typed function at the bottom.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Base configuration ────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://sisglobalapi.neuralinfo.co.in";

/** Generic fetch wrapper — throws on non-2xx responses */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Location types ────────────────────────────────────────────────────────

export interface ApiCountry {
  country_id:   number;
  country_name: string;
  country_code: string;
  iso_code:     string;
  status:       number;
  created_at:   string;
}

export interface ApiState {
  state_id:     number;
  state_name:   string;
  state_code:   string;
  country_id:   number;
  country_name: string;
  status:       number;
  created_at:   string;
}

export interface ApiCity {
  city_id:      number;
  city_name:    string;
  state_id:     number;
  state_name:   string;
  country_id:   number;
  country_name: string;
  status:       number;
  created_at:   string;
}

// ── Location endpoints ────────────────────────────────────────────────────

/** Fetch all countries */
export function fetchCountries(): Promise<ApiCountry[]> {
  return apiFetch<ApiCountry[]>("/public/location/countries");
}

/** Fetch states for a given country */
export function fetchStates(countryId: number): Promise<ApiState[]> {
  return apiFetch<ApiState[]>(`/public/location/states?country_id=${countryId}`);
}

/** Fetch cities for a given state */
export function fetchCities(stateId: number): Promise<ApiCity[]> {
  return apiFetch<ApiCity[]>(`/public/location/cities?state_id=${stateId}`);
}

// ── Employer signup ───────────────────────────────────────────────────────

export interface EmployerSignupPayload {
  status:              boolean;
  organisation_name:   string;
  contact_name:        string;
  email:               string;
  phone:               string;
  alt_phone?:          string;
  alt_email?:          string;
  address:             string;
  address2?:           string;
  city_id:             number;
  state_id:            number;
  country_id:          number;
  pin:                 string;
  website?:            string;
  landline?:           string;
  cr_licence_number?:  string; // maps to GSTIN / CIN
  partner_name?:       string;
  partner_code?:       string;
  alt_partner_name?:   string;
  other_info?:         string; // JSON-stringified extra fields (industry, company type, etc.)
}

export interface EmployerSignupResponse {
  success:  boolean;
  message?: string;
  data?:    Record<string, unknown>;
}

/** Register a new employer */
export function registerEmployer(
  payload: EmployerSignupPayload
): Promise<EmployerSignupResponse> {
  return apiFetch<EmployerSignupResponse>("/public/employer-signup", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
}

// ── Associate partner signup ──────────────────────────────────────────────

export interface AssociatePartnerSignupPayload {
  status:                     boolean;
  organisation_name:          string;
  primary_contact:            string;
  email:                      string;
  alternate_contact?:         string;
  alt_email?:                 string;
  address1:                   string;
  address2?:                  string;
  city_id:                    number;
  state_id:                   number;
  country_id:                 number;
  pin:                        string;
  landline?:                  string;
  associate_partner_name?:    string;
  associate_partner_code?:    string;
  alt_associate_partner_name?: string;
  other_info?:                string; // JSON-stringified extra fields
}

export interface AssociatePartnerSignupResponse {
  success:  boolean;
  message?: string;
  data?:    Record<string, unknown>;
}

/** Register a new associate partner */
export function registerAssociatePartner(
  payload: AssociatePartnerSignupPayload
): Promise<AssociatePartnerSignupResponse> {
  return apiFetch<AssociatePartnerSignupResponse>("/public/associate-partner-signup", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
}

// ── Future endpoints (add below) ──────────────────────────────────────────
// export function fetchJobCategories(): Promise<JobCategory[]> { ... }
// export function submitJobApplication(payload): Promise<...> { ... }