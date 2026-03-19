import { apiFetch } from "./apiFetch";

export type CompanyRow = {
  company_id: number;
  company_code: string | null;
  company_name: string;
  country_id: number | null;
  country_name: string | null;
  state_id: number | null;
  state_name: string | null;
  city_id: number | null;
  city_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  user_id?: number | null;
  status: number;
  created_at: string;
};

export type CompanyContactRow = {
  contact_id: number;
  company_id: number;
  name: string | null;
  designation: string | null;
  phone: string | null;
  email: string | null;
};

export type CompanyDocumentRow = {
  id: number;
  company_id: number;
  document_name: string | null;
  file_path: string | null;
  uploaded_at: string;
};

export const companyApi = {
  companies: {
    list: (include_inactive = true) =>
      apiFetch<CompanyRow[]>(`/companies?include_inactive=${include_inactive ? "true" : "false"}`, { method: "GET" }),
    get: (company_id: number) => apiFetch<CompanyRow>(`/companies/${company_id}`, { method: "GET" }),
    create: (input: {
      company_name: string;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
      address?: string | null;
      phone?: string | null;
      email?: string | null;
      contact_person?: string | null;
      status?: boolean | null;
    }) =>
      apiFetch<{ company_id: number; user_id: number; username: string; emailed: boolean }>(`/companies`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (company_id: number, input: any) =>
      apiFetch<{ updated: true }>(`/companies/${company_id}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (company_id: number) => apiFetch<{ disabled: true }>(`/companies/${company_id}`, { method: "DELETE" }),
  },
  contacts: {
    list: (company_id: number) => apiFetch<CompanyContactRow[]>(`/companies/${company_id}/contacts`, { method: "GET" }),
    create: (company_id: number, input: { name?: string | null; designation?: string | null; phone?: string | null; email?: string | null }) =>
      apiFetch<{ contact_id: number }>(`/companies/${company_id}/contacts`, { method: "POST", body: JSON.stringify(input) }),
    update: (company_id: number, contact_id: number, input: any) =>
      apiFetch<{ updated: true }>(`/companies/${company_id}/contacts/${contact_id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (company_id: number, contact_id: number) =>
      apiFetch<{ deleted: true }>(`/companies/${company_id}/contacts/${contact_id}`, { method: "DELETE" }),
  },
  documents: {
    list: (company_id: number) => apiFetch<CompanyDocumentRow[]>(`/companies/${company_id}/documents`, { method: "GET" }),
    upsert: (company_id: number, input: { id?: number | null; document_name: string; file_path: string }) =>
      apiFetch<{ id: number }>(`/companies/${company_id}/documents`, { method: "PUT", body: JSON.stringify(input) }),
  },
};
