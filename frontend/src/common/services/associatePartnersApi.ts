import { apiFetch } from "./apiFetch";

export type AssociatePartnerRow = {
  associate_partner_id: number;
  associate_partner_code: string | null;
  associate_partner_name: string;
  alt_associate_partner_name: string | null;
  primary_contact: string | null;
  alternate_contact: string | null;
  email: string | null;
  organisation_name: string | null;
  address1: string | null;
  address2: string | null;
  pin: string | null;
  landline: string | null;
  country_id?: number | null;
  country_name?: string | null;
  state_id?: number | null;
  state_name?: string | null;
  city_id?: number | null;
  city_name?: string | null;
  user_id: number | null;
  username?: string | null;
  status: number;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export const associatePartnersApi = {
  list: (include_inactive = true) =>
    apiFetch<AssociatePartnerRow[]>(`/associate-partners?include_inactive=${include_inactive ? "true" : "false"}`, { method: "GET" }),
  get: (associate_partner_id: number) => apiFetch<AssociatePartnerRow>(`/associate-partners/${associate_partner_id}`, { method: "GET" }),
  create: (input: {
    associate_partner_code?: string | null;
    associate_partner_name: string;
    alt_associate_partner_name?: string | null;
    primary_contact?: string | null;
    alternate_contact?: string | null;
    email?: string | null;
    organisation_name?: string | null;
    address1?: string | null;
    address2?: string | null;
    pin?: string | null;
    landline?: string | null;
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    status?: boolean | null;
  }) =>
    apiFetch<{
      associate_partner_id: number;
      user_id: number | null;
      username: string;
      emailed: boolean;
      user_created: boolean;
      existing_user_used: boolean;
      auth_error?: string | null;
    }>(`/associate-partners`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (
    associate_partner_id: number,
    input: Partial<{
      associate_partner_code: string | null;
      associate_partner_name: string;
      alt_associate_partner_name: string | null;
      primary_contact: string | null;
      alternate_contact: string | null;
      email: string | null;
      organisation_name: string | null;
      address1: string | null;
      address2: string | null;
      pin: string | null;
      landline: string | null;
      country_id: number | null;
      state_id: number | null;
      city_id: number | null;
      status: boolean;
    }>,
  ) => apiFetch<{ updated: true }>(`/associate-partners/${associate_partner_id}`, { method: "PUT", body: JSON.stringify(input) }),
  disable: (associate_partner_id: number) => apiFetch<{ disabled: true }>(`/associate-partners/${associate_partner_id}`, { method: "DELETE" }),
};
