import { apiFetch } from "./apiFetch";

export type AssociateCandidateRow = {
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
  is_verified?: boolean | 0 | 1 | null;
  user_id: number | null;
  associate_partner_id: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export type AssociateCandidateDocumentRow = {
  id: number;
  application_id: number | null;
  candidate_id: number;
  document_type_id: number;
  document_name?: string | null;
  file_path: string | null;
  uploaded_at: string | null;
};

export type AssociateApplicationDocRow = {
  document_type_id: number | null;
  job_specific_document_id: number | null;
  document_name: string;
  job_is_required: number;
  candidate_document_id: number | null;
  file_path: string | null;
  uploaded_at: string | null;
};

export type AssociateJobDocRow = {
  id: number;
  application_id: number;
  job_specific_document_id: number;
  document_name: string;
  is_required: number;
  file_path: string | null;
  uploaded_at: string | null;
};

export type AssociateApplicationRow = {
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

export type AssociateOnboardingOfferRow = {
  deployment_id: number;
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  job_id: number;
  job_title: string;
  job_code: string | null;
  current_status: string | null;
  visa_type_id: number | null;
  visa_type_name: string | null;
  remarks: string | null;
  offer_date: string | null;
  offer_letter_file_path: string | null;
  isaccepted: number | null;
  offer_payment_received: number | null;
  offer_remarks: string | null;
  created_at: string;
  updated_at: string;
};

export const associatePortalApi = {
  applications: {
    list: (filters?: { status?: string | null; candidate_id?: number | null; job_id?: number | null }) => {
      const qs = new URLSearchParams();
      if (filters?.status) qs.set("status", filters.status);
      if (typeof filters?.candidate_id === "number") qs.set("candidate_id", String(filters.candidate_id));
      if (typeof filters?.job_id === "number") qs.set("job_id", String(filters.job_id));
      const query = qs.toString();
      return apiFetch<AssociateApplicationRow[]>(`/associate/applications${query ? `?${query}` : ""}`, { method: "GET" });
    },
  },
  candidates: {
    list: () => apiFetch<AssociateCandidateRow[]>(`/associate/candidates`, { method: "GET" }),
    get: (candidate_id: number) =>
      apiFetch<{ candidate: AssociateCandidateRow; documents: AssociateCandidateDocumentRow[] }>(
        `/associate/candidates/${candidate_id}`,
        { method: "GET" },
      ),
    documents: (candidate_id: number) =>
      apiFetch<AssociateCandidateDocumentRow[]>(`/associate/candidates/${candidate_id}/documents`, { method: "GET" }),
    create: (input: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
      email?: string | null;
      passport_number?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
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
    }) =>
      apiFetch<{
        candidate_id: number;
        username: string;
        emailed: boolean;
        user_id: number | null;
        user_created: boolean;
        existing_user_used: boolean;
        auth_error?: string | null;
      }>(`/associate/candidates`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (
      candidate_id: number,
      input: Partial<{
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        email: string | null;
        passport_number: string | null;
        country_id: number | null;
        state_id: number | null;
        city_id: number | null;
        father_name: string | null;
        address1: string | null;
        address2: string | null;
        pincode: string | null;
        dob: string | null;
        gender: string | null;
        skills: string | null;
        education: string | null;
        experience: string | null;
        industry_type: string | null;
        resume_file_path: string | null;
        passport_expiry_date: string | null;
        passport_file_path: string | null;
        aadhar_number: string | null;
        aadhar_file_path: string | null;
        pan_number: string | null;
        pan_file_path: string | null;
        voter_id_number: string | null;
        voter_id_file_path: string | null;
        profile_photo_file_path: string | null;
        languages_known: string | null;
        is_verified: boolean | null;
        status: string | null;
      }>,
    ) => apiFetch<{ updated: true }>(`/associate/candidates/${candidate_id}`, { method: "PUT", body: JSON.stringify(input) }),
    finalize: (candidate_id: number, input: { original_email: string; original_phone: string }) =>
      apiFetch<{
        candidate_id: number;
        username: string;
        emailed: boolean;
        user_id: number | null;
        user_created: boolean;
        existing_user_used: boolean;
        auth_error?: string | null;
      }>(`/associate/candidates/${candidate_id}/finalize`, { method: "PUT", body: JSON.stringify(input) }),
    startApplication: (candidate_id: number, input: { job_id: number; application_date?: string | null; status?: string | null }) =>
      apiFetch<{ application_id: number }>(`/associate/candidates/${candidate_id}/applications`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    applicationDocuments: (candidate_id: number, application_id: number) =>
      apiFetch<{
        application: { application_id: number; candidate_id: number; job_id: number; status: string | null };
        documents: AssociateApplicationDocRow[];
        job_documents: AssociateJobDocRow[];
      }>(`/associate/candidates/${candidate_id}/applications/${application_id}/documents`, { method: "GET" }),
    upsertApplicationDocument: (candidate_id: number, application_id: number, document_type_id: number, file_path: string) =>
      apiFetch<{ updated: true }>(`/associate/candidates/${candidate_id}/applications/${application_id}/documents/${document_type_id}`, {
        method: "PUT",
        body: JSON.stringify({ file_path }),
      }),
    upsertApplicationJobDocument: (candidate_id: number, application_id: number, job_specific_document_id: number, file_path: string) =>
      apiFetch<{ updated: true }>(`/associate/candidates/${candidate_id}/applications/${application_id}/job-documents/${job_specific_document_id}`, {
        method: "PUT",
        body: JSON.stringify({ file_path }),
      }),
    submitApplication: (candidate_id: number, application_id: number) =>
      apiFetch<{ submitted: true }>(`/associate/candidates/${candidate_id}/applications/${application_id}/submit`, {
        method: "POST",
      }),
  },
  onboarding: {
    offers: {
      list: (filters?: { status?: string | null }) => {
        const qs = new URLSearchParams();
        if (filters?.status) qs.set("status", filters.status);
        const query = qs.toString();
        return apiFetch<AssociateOnboardingOfferRow[]>(
          `/associate/onboarding/download-offer${query ? `?${query}` : ""}`,
          { method: "GET" },
        );
      },
    },
  },
};
