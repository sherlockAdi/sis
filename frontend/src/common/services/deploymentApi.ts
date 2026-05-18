import { apiFetch } from "./apiFetch";

export type DeploymentRow = {
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
  created_at: string;
  updated_at: string;
};

export type DeploymentHistoryRow = {
  id: number;
  deployment_id: number;
  status: string;
  remarks: string | null;
  changed_by: number | null;
  changed_at: string;
};

export type VisaDetailRow = {
  offer_detail_id?: number | null;
  visa_processing_id?: number | null;
  ticket_booking_id?: number | null;
  deployment_id: number;
  offer_date?: string | null;
  offer_letter_file_path: string | null;
  isaccepted?: number | null;
  offer_payment_received?: number | null;
  offer_remarks?: string | null;
  visa_type_id: number | null;
  visa_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  passport_number: string | null;
  passport_issue_date: string | null;
  passport_expiry_date: string | null;
  sponsor_id: string | null;
  sponsor_contact: string | null;
  passport_file_path: string | null;
  visa_file_path: string | null;
  visa_payment_received?: number | null;
  visa_remarks?: string | null;
  checklist_complete?: number | null;
  ticket_number?: string | null;
  booked_date?: string | null;
  travel_date?: string | null;
  ticket_file_path?: string | null;
  ticket_remarks?: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type VisaChecklistMasterRow = {
  checklist_item_id: number;
  checklist_item_code: string;
  checklist_item_name: string;
  sort_order: number;
  is_required: number;
  status: number;
  created_at: string;
  updated_at: string;
};

export type VisaChecklistStatusRow = {
  checklist_item_id: number;
  checklist_item_code: string;
  checklist_item_name: string;
  sort_order: number;
  is_required: number;
  is_checked: number;
  visa_checklist_status_id: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CandidateVisaDetailsUpsertInput = {
  deployment_id: number;
  isaccepted?: boolean | null;
} & Omit<Partial<VisaDetailRow>, "isaccepted">;

export const deploymentApi = {
  list: (status?: string) =>
    apiFetch<DeploymentRow[]>(`/deployment${status ? `?status=${encodeURIComponent(status)}` : ""}`, { method: "GET" }),
  getByApplication: (application_id: number) =>
    apiFetch<{ deployment_id: number } | null>(`/deployment/by-application/${application_id}`, { method: "GET" }),
  create: (input: { application_id: number; status?: string | null; visa_type_id?: number | null; remarks?: string | null }) =>
    apiFetch<{ deployment_id: number }>(`/deployment`, { method: "POST", body: JSON.stringify(input) }),
  setStatus: (deployment_id: number, input: { status: string; visa_type_id?: number | null; remarks?: string | null }) =>
    apiFetch<{ updated: true }>(`/deployment/${deployment_id}/status`, { method: "PUT", body: JSON.stringify(input) }),
  history: (deployment_id: number) =>
    apiFetch<DeploymentHistoryRow[]>(`/deployment/${deployment_id}/history`, { method: "GET" }),
  visaChecklist: {
    master: () => apiFetch<VisaChecklistMasterRow[]>(`/deployment/visa-checklist/master`, { method: "GET" }),
    list: (deployment_id: number) =>
      apiFetch<VisaChecklistStatusRow[]>(`/deployment/${deployment_id}/visa-checklist`, { method: "GET" }),
    upsertMany: (
      deployment_id: number,
      items: Array<{ checklist_item_id: number; is_checked: boolean }>
    ) =>
      apiFetch<{ updated: true }>(`/deployment/${deployment_id}/visa-checklist`, {
        method: "PUT",
        body: JSON.stringify({ items }),
      }),
  },
  visaDetails: {
    get: (deployment_id: number) =>
      apiFetch<VisaDetailRow | null>(`/deployment/${deployment_id}/visa-details`, { method: "GET" }),
    upsert: (deployment_id: number, input: Partial<VisaDetailRow>) =>
      apiFetch<{ visa_detail_id: number }>(`/deployment/${deployment_id}/visa-details`, { method: "PUT", body: JSON.stringify(input) }),
  },
  candidate: {
    list: () => apiFetch<DeploymentRow[]>(`/candidate/deployment`, { method: "GET" }),
    upsertVisaDetails: (input: CandidateVisaDetailsUpsertInput) =>
      apiFetch<{ visa_detail_id: number }>(`/candidate/deployment/visa-details`, { method: "PUT", body: JSON.stringify(input) }),
  },
};
