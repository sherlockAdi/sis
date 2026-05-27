import { apiFetch } from "./apiFetch";

export type PublicEmployerSignupResponse = {
  partner_id: number;
  partner_code: string | null;
  user_id: number | null;
  username: string;
  emailed: boolean;
  user_created: boolean;
  existing_user_used: boolean;
  auth_error?: string | null;
};

export type PublicAssociatePartnerSignupResponse = {
  associate_partner_id: number;
  associate_partner_code: string | null;
  user_id: number | null;
  username: string;
  emailed: boolean;
  user_created: boolean;
  existing_user_used: boolean;
  auth_error?: string | null;
};

export const publicRegistrationApi = {
  employerSignup: (input: {
    partner_code?: string | null;
    partner_name: string;
    contact_name?: string | null;
    phone?: string | null;
    email: string;
    address?: string | null;
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    alt_partner_name?: string | null;
    alt_phone?: string | null;
    alt_email?: string | null;
    organisation_name?: string | null;
    address2?: string | null;
    pin?: string | null;
    landline?: string | null;
    cr_licence_number?: string | null;
    website?: string | null;
    other_info?: string | null;
    status?: boolean | null;
  }) =>
    apiFetch<PublicEmployerSignupResponse>(`/public/employer-signup`, {
      method: "POST",
      auth: false,
      body: JSON.stringify(input),
    }),
  associatePartnerSignup: (input: {
    associate_partner_code?: string | null;
    associate_partner_name: string;
    alt_associate_partner_name?: string | null;
    alt_email?: string | null;
    primary_contact?: string | null;
    alternate_contact?: string | null;
    email: string;
    organisation_name?: string | null;
    other_info?: string | null;
    address1?: string | null;
    address2?: string | null;
    pin?: string | null;
    landline?: string | null;
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    status?: boolean | null;
  }) =>
    apiFetch<PublicAssociatePartnerSignupResponse>(`/public/associate-partner-signup`, {
      method: "POST",
      auth: false,
      body: JSON.stringify(input),
    }),
};
