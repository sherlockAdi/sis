import { apiFetch } from "./apiFetch";
import type { CandidateRow } from "./recruitmentApi";

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
  document_type_id: number | null;
  job_specific_document_id: number | null;
  document_name: string;
  job_is_required: number;
  candidate_document_id: number | null;
  file_path: string | null;
  uploaded_at: string | null;
};

export type CandidateDocumentRow = {
  id: number;
  application_id: number | null;
  candidate_id: number;
  document_type_id: number;
  document_name: string | null;
  file_path: string | null;
  uploaded_at: string | null;
};

export type CandidateTradeLinkRow = {
  id: string;
  title: string;
  url: string;
};

export type CandidateTradeTestRow = {
  candidate_id: number;
  trade_video_file_path: string | null;
  trade_video_file_name: string | null;
  trade_video_file_size: number | null;
  trade_video_uploaded_at: string | null;
  trade_video_source: string | null;
  trade_video_external_file_id: string | null;
  trade_video_external_file_url: string | null;
  trade_video_links: CandidateTradeLinkRow[];
  created_at: string;
  updated_at: string;
};

export const candidateApi = {
  profile: {
    me: () =>
      apiFetch<CandidateRow & { profile_complete: boolean; missing_fields: string[] }>(`/candidate/profile`, {
        method: "GET",
      }),
    update: (
      input: Partial<
        Omit<
          CandidateRow,
          "candidate_id" | "candidate_code" | "created_at" | "updated_at" | "deleted_at" | "country_name" | "state_name" | "city_name"
        >
      >,
    ) => apiFetch<{ updated: true }>(`/candidate/profile`, { method: "PUT", body: JSON.stringify(input) }),
  },
    tradeTest: {
    get: () => apiFetch<CandidateTradeTestRow>(`/candidate/profile/trade-test`, { method: "GET" }),
    update: (input: {
      trade_video_file_path?: string | null;
      trade_video_file_name?: string | null;
      trade_video_file_size?: number | null;
      trade_video_uploaded_at?: string | null;
      trade_video_source?: string | null;
      trade_video_external_file_id?: string | null;
      trade_video_external_file_url?: string | null;
      trade_video_links?: CandidateTradeLinkRow[];
    }) =>
      apiFetch<{ updated: true }>(`/candidate/profile/trade-test`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
  },
  documents: {
    list: () => apiFetch<CandidateDocumentRow[]>(`/candidate/documents`, { method: "GET" }),
  },
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
    upsertJobSpecificDocument: (application_id: number, job_specific_document_id: number, file_path: string) =>
      apiFetch<{ updated: true }>(`/candidate/applications/${application_id}/job-documents/${job_specific_document_id}`, {
        method: "PUT",
        body: JSON.stringify({ file_path }),
      }),
  },
};
