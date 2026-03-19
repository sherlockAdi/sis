import { apiFetch } from "./apiFetch";

export type CandidateRow = {
  candidate_id: number;
  candidate_code: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  created_at: string;
};

export type ApplicationRow = {
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

export type ApplicationDocRow = {
  document_type_id: number;
  document_name: string;
  job_is_required: number;
  candidate_document_id: number | null;
  file_path: string | null;
  uploaded_at: string | null;
};

export type ApplicationInterviewRow = {
  interview_id: number;
  application_id: number;
  interview_mode_id: number | null;
  mode_name: string | null;
  interview_date: string | null;
  result: string | null;
  remarks: string | null;
};

export const recruitmentApi = {
  candidates: {
    list: () => apiFetch<CandidateRow[]>(`/recruitment/candidates`, { method: "GET" }),
    create: (input: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
      email?: string | null;
      passport_number?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
      status?: string | null;
    }) =>
      apiFetch<{ candidate_id: number; user_id: number; username: string; emailed: boolean }>(
        `/recruitment/candidates`,
        { method: "POST", body: JSON.stringify(input) },
      ),
  },
  public: {
    candidateSignup: (input: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
      email: string;
      passport_number?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
    }) =>
      apiFetch<{ candidate_id: number; username: string; emailed: boolean }>(`/public/candidate-signup`, {
        method: "POST",
        body: JSON.stringify(input),
        auth: false,
      }),
  },
  applications: {
    list: () => apiFetch<ApplicationRow[]>(`/recruitment/applications`, { method: "GET" }),
    create: (input: { candidate_id: number; job_id: number; application_date?: string | null; status?: string | null }) =>
      apiFetch<{ application_id: number }>(`/recruitment/applications`, { method: "POST", body: JSON.stringify(input) }),
    documents: (application_id: number) =>
      apiFetch<ApplicationDocRow[]>(`/recruitment/applications/${application_id}/documents`, { method: "GET" }),
    upsertDocument: (application_id: number, document_type_id: number, file_path: string) =>
      apiFetch<{ updated: true }>(`/recruitment/applications/${application_id}/documents/${document_type_id}`, {
        method: "PUT",
        body: JSON.stringify({ file_path }),
      }),
    interviews: (application_id: number) =>
      apiFetch<ApplicationInterviewRow[]>(`/recruitment/applications/${application_id}/interviews`, { method: "GET" }),
    scheduleInterview: (application_id: number, input: { interview_mode_id: number; interview_date: string; remarks?: string | null }) =>
      apiFetch<{ interview_id: number }>(`/recruitment/applications/${application_id}/interviews`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
  files: {
    presignUpload: (object_key: string) =>
      apiFetch<{ url: string; bucket: string; object_key: string }>(
        `/files/presign-upload?object_key=${encodeURIComponent(object_key)}`,
        { method: "GET" },
      ),
    presignDownload: (object_key: string) =>
      apiFetch<{ url: string; bucket: string; object_key: string }>(
        `/files/presign-download?object_key=${encodeURIComponent(object_key)}`,
        { method: "GET" },
      ),
  },
};
