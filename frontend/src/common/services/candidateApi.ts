import { apiFetch } from "./apiFetch";

export type CandidateApplicationRow = {
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

export type CandidateApplicationDocRow = {
  document_type_id: number;
  document_name: string;
  job_is_required: number;
  candidate_document_id: number | null;
  file_path: string | null;
  uploaded_at: string | null;
  is_reused?: number;
  reused_from_application_id?: number | null;
  reused_from_uploaded_at?: string | null;
};

export const candidateApi = {
  applications: {
    list: () => apiFetch<CandidateApplicationRow[]>(`/candidate/applications`, { method: "GET" }),
    get: (application_id: number) =>
      apiFetch<CandidateApplicationRow>(`/candidate/applications/${application_id}`, { method: "GET" }),
    start: (job_id: number) =>
      apiFetch<{ application_id: number }>(`/candidate/applications/start`, {
        method: "POST",
        body: JSON.stringify({ job_id }),
      }),
    apply: (job_id: number) =>
      apiFetch<{ application_id: number }>(`/candidate/applications/apply`, {
        method: "POST",
        body: JSON.stringify({ job_id }),
      }),
    submit: (application_id: number) =>
      apiFetch<{ submitted: true }>(`/candidate/applications/${application_id}/submit`, {
        method: "POST",
        body: JSON.stringify({ consent: true }),
      }),
    documents: (application_id: number) =>
      apiFetch<CandidateApplicationDocRow[]>(`/candidate/applications/${application_id}/documents`, { method: "GET" }),
    upsertDocument: (application_id: number, document_type_id: number, file_path: string) =>
      apiFetch<{ updated: true }>(`/candidate/applications/${application_id}/documents/${document_type_id}`, {
        method: "PUT",
        body: JSON.stringify({ file_path }),
      }),
  },
};
