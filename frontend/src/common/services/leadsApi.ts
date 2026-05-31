import { apiFetch } from "./apiFetch";

export type LeadType = "EMPLOYER" | "ASSOCIATE" | "UNDECIDED";
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "CLOSED";

export type LeadRow = {
  lead_id: number;
  lead_code: string | null;
  lead_type: LeadType;
  organisation_name: string | null;
  contact_name: string;
  phone: string | null;
  email: string | null;
  country_id: number | null;
  country_name?: string | null;
  state_id: number | null;
  state_name?: string | null;
  city_id: number | null;
  city_name?: string | null;
  address: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  converted_to_type: "EMPLOYER" | "ASSOCIATE" | null;
  converted_partner_id: number | null;
  converted_associate_partner_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type LeadInput = {
  lead_type?: LeadType | null;
  organisation_name?: string | null;
  contact_name: string;
  phone?: string | null;
  email?: string | null;
  country_id?: number | null;
  state_id?: number | null;
  city_id?: number | null;
  address?: string | null;
  source?: string | null;
  status?: LeadStatus | null;
  notes?: string | null;
};

export const leadsApi = {
  list: (filters?: { include_closed?: boolean; lead_type?: LeadType | null; status?: LeadStatus | null }) => {
    const qs = new URLSearchParams();
    if (filters?.include_closed) qs.set("include_closed", "true");
    if (filters?.lead_type) qs.set("lead_type", filters.lead_type);
    if (filters?.status) qs.set("status", filters.status);
    const query = qs.toString();
    return apiFetch<LeadRow[]>(`/leads${query ? `?${query}` : ""}`, { method: "GET" });
  },
  get: (lead_id: number) => apiFetch<LeadRow>(`/leads/${lead_id}`, { method: "GET" }),
  create: (input: LeadInput) => apiFetch<LeadRow>(`/leads`, { method: "POST", body: JSON.stringify(input) }),
  update: (lead_id: number, input: Partial<LeadInput>) =>
    apiFetch<{ updated: true }>(`/leads/${lead_id}`, { method: "PUT", body: JSON.stringify(input) }),
  close: (lead_id: number) => apiFetch<{ updated: true }>(`/leads/${lead_id}/close`, { method: "PUT" }),
};

export const publicLeadsApi = {
  create: (input: LeadInput) =>
    apiFetch<{ lead_id: number; lead_code: string | null }>(`/public/leads`, {
      method: "POST",
      auth: false,
      body: JSON.stringify(input),
    }),
};
