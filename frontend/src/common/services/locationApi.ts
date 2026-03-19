import { apiFetch } from "./apiFetch";

export type Country = {
  country_id: number;
  country_name: string;
  country_code: string | null;
  iso_code: string | null;
  status: number;
  created_at: string;
};

export type StateRow = {
  state_id: number;
  country_id: number;
  country_name: string;
  state_name: string;
  state_code: string | null;
  status: number;
  created_at: string;
};

export type CityRow = {
  city_id: number;
  state_id: number;
  state_name: string;
  country_id: number;
  country_name: string;
  city_name: string;
  status: number;
  created_at: string;
};

export async function listCountries(include_inactive = false): Promise<Country[]> {
  return apiFetch(`/location/countries?include_inactive=${include_inactive ? "true" : "false"}`, { method: "GET" });
}

export async function listPublicCountries(): Promise<Country[]> {
  return apiFetch(`/public/location/countries`, { method: "GET", auth: false });
}

export async function createCountry(input: {
  country_name: string;
  country_code?: string | null;
  iso_code?: string | null;
  status?: boolean;
}) {
  return apiFetch(`/location/countries`, { method: "POST", body: JSON.stringify(input) });
}

export async function updateCountry(country_id: number, input: Partial<{ country_name: string; country_code: string | null; iso_code: string | null; status: boolean }>) {
  return apiFetch(`/location/countries/${country_id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function disableCountry(country_id: number) {
  return apiFetch(`/location/countries/${country_id}`, { method: "DELETE" });
}

export async function listStates(country_id?: number, include_inactive = false): Promise<StateRow[]> {
  const qs = new URLSearchParams();
  if (country_id) qs.set("country_id", String(country_id));
  qs.set("include_inactive", include_inactive ? "true" : "false");
  return apiFetch(`/location/states?${qs.toString()}`, { method: "GET" });
}

export async function listPublicStates(country_id?: number): Promise<StateRow[]> {
  const qs = new URLSearchParams();
  if (country_id) qs.set("country_id", String(country_id));
  return apiFetch(`/public/location/states?${qs.toString()}`, { method: "GET", auth: false });
}

export async function createState(input: { country_id: number; state_name: string; state_code?: string | null; status?: boolean }) {
  return apiFetch(`/location/states`, { method: "POST", body: JSON.stringify(input) });
}

export async function updateState(state_id: number, input: Partial<{ country_id: number; state_name: string; state_code: string | null; status: boolean }>) {
  return apiFetch(`/location/states/${state_id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function disableState(state_id: number) {
  return apiFetch(`/location/states/${state_id}`, { method: "DELETE" });
}

export async function listCities(state_id?: number, include_inactive = false): Promise<CityRow[]> {
  const qs = new URLSearchParams();
  if (state_id) qs.set("state_id", String(state_id));
  qs.set("include_inactive", include_inactive ? "true" : "false");
  return apiFetch(`/location/cities?${qs.toString()}`, { method: "GET" });
}

export async function listPublicCities(state_id?: number): Promise<CityRow[]> {
  const qs = new URLSearchParams();
  if (state_id) qs.set("state_id", String(state_id));
  return apiFetch(`/public/location/cities?${qs.toString()}`, { method: "GET", auth: false });
}

export async function createCity(input: { state_id: number; city_name: string; status?: boolean }) {
  return apiFetch(`/location/cities`, { method: "POST", body: JSON.stringify(input) });
}

export async function updateCity(city_id: number, input: Partial<{ state_id: number; city_name: string; status: boolean }>) {
  return apiFetch(`/location/cities/${city_id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function disableCity(city_id: number) {
  return apiFetch(`/location/cities/${city_id}`, { method: "DELETE" });
}
