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

export function getIndiaCountryId(countries: Country[]): number | undefined {
  return countries.find((country) => {
    const name = String(country.country_name ?? "").trim().toLowerCase();
    const code = String(country.country_code ?? "").trim().toUpperCase();
    const iso = String(country.iso_code ?? "").trim().toUpperCase();
    return name === "india" || code === "IN" || iso === "IN";
  })?.country_id;
}

export type IndianPincodeLookup = {
  pincode: string;
  country: string;
  state: string;
  district: string;
  officeName: string;
};

export async function lookupIndianPincode(pincode: string): Promise<IndianPincodeLookup | null> {
  const pin = String(pincode ?? "").trim();
  if (!/^\d{6}$/.test(pin)) return null;

  const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
  if (!response.ok) return null;

  const payload = await response.json().catch(() => null);
  const entry = Array.isArray(payload) ? payload[0] : payload;
  const office = Array.isArray(entry?.PostOffice) ? entry.PostOffice[0] : null;
  const status = String(entry?.Status ?? "").trim().toLowerCase();
  if (!office || status !== "success") return null;

  return {
    pincode: pin,
    country: String(office.Country ?? "India").trim() || "India",
    state: String(office.State ?? "").trim(),
    district: String(office.District ?? "").trim(),
    officeName: String(office.Name ?? "").trim(),
  };
}
