import { apiFetch } from "./apiFetch";

export type PartnerRow = {
  partner_id: number;
  partner_code: string | null;
  partner_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  country_id?: number | null;
  country_name?: string | null;
  state_id?: number | null;
  state_name?: string | null;
  city_id?: number | null;
  city_name?: string | null;
  alt_partner_name?: string | null;
  alt_phone?: string | null;
  organisation_name?: string | null;
  address2?: string | null;
  pin?: string | null;
  landline?: string | null;
  cr_licence_number?: string | null;
  website?: string | null;
  other_info?: string | null;
  user_id: number | null;
  username?: string | null;
  status: number;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export type PartnerApplicationRow = {
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  job_id: number;
  job_title: string;
  job_code: string | null;
  application_date: string | null;
  status: string | null;
};

export type PartnerCandidateRow = {
  candidate_id: number;
  candidate_code: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  passport_number: string | null;
  country_id: number | null;
  country_name?: string | null;
  state_id: number | null;
  state_name?: string | null;
  city_id: number | null;
  city_name?: string | null;
  father_name?: string | null;
  address1?: string | null;
  address2?: string | null;
  pincode?: string | null;
  dob?: string | null;
  gender?: string | null;
  skills?: string | null;
  education?: string | null;
  experience?: string | null;
  industry_type?: string | null;
  resume_file_path?: string | null;
  passport_expiry_date?: string | null;
  passport_file_path?: string | null;
  aadhar_number?: string | null;
  aadhar_file_path?: string | null;
  pan_number?: string | null;
  pan_file_path?: string | null;
  voter_id_number?: string | null;
  voter_id_file_path?: string | null;
  profile_photo_file_path?: string | null;
  languages_known?: string | null;
  status: string | null;
  user_id: number | null;
  created_at: string;
  updated_at?: string | null;
};

export type PartnerCandidateDocumentRow = {
  id: number;
  application_id: number | null;
  candidate_id: number;
  document_type_id: number;
  file_path: string | null;
  uploaded_at: string | null;
};

export const partnersApi = {
  list: (include_inactive = true) =>
    apiFetch<PartnerRow[]>(`/partners?include_inactive=${include_inactive ? "true" : "false"}`, { method: "GET" }),
  get: (partner_id: number) => apiFetch<PartnerRow>(`/partners/${partner_id}`, { method: "GET" }),
  create: (input: {
    partner_code?: string | null;
    partner_name: string;
    contact_name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    alt_partner_name?: string | null;
    alt_phone?: string | null;
    organisation_name?: string | null;
    address2?: string | null;
    pin?: string | null;
    landline?: string | null;
    cr_licence_number?: string | null;
    website?: string | null;
    other_info?: string | null;
    status?: boolean | null;
  }) =>
    apiFetch<{ partner_id: number; user_id: number | null; username: string; emailed: boolean; user_created: boolean; existing_user_used: boolean; auth_error?: string | null }>(`/partners`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (partner_id: number, input: any) =>
    apiFetch<{ updated: true }>(`/partners/${partner_id}`, { method: "PUT", body: JSON.stringify(input) }),
  disable: (partner_id: number) => apiFetch<{ disabled: true }>(`/partners/${partner_id}`, { method: "DELETE" }),
};

export const partnerPortalApi = {
  applications: {
    list: () => apiFetch<PartnerApplicationRow[]>(`/partner/applications`, { method: "GET" }),
  },
  interviews: {
    list: () =>
      apiFetch<
        {
          interview_id: number;
          application_id: number;
          candidate_id: number;
          candidate_name: string;
          job_id: number;
          job_title: string;
          mode_name: string | null;
          interview_date: string | null;
          result: string | null;
          remarks: string | null;
        }[]
      >(`/partner/interviews`, { method: "GET" }),
    create: (input: { application_id: number; interview_mode_id: number; interview_date: string; remarks?: string | null }) =>
      apiFetch<{ interview_id: number }>(`/partner/interviews`, { method: "POST", body: JSON.stringify(input) }),
  },
  candidates: {
    get: (candidate_id: number) =>
      apiFetch<{ candidate: PartnerCandidateRow; documents: PartnerCandidateDocumentRow[] }>(
        `/partner/candidates/${candidate_id}`,
        { method: "GET" },
      ),
  },
};
