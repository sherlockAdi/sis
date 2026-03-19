import { apiFetch } from "./apiFetch";

export type JobListRow = {
  job_id: number;
  job_code: string | null;
  job_title: string;
  category_id: number | null;
  category_name?: string | null;
  country_id: number | null;
  country_name?: string | null;
  contract_duration_id: number | null;
  duration_name?: string | null;
  months?: number | null;
  vacancy: number | null;
  salary_min: string | null;
  salary_max: string | null;
  status: string | null;
  created_by: number | null;
  created_at: string;
};

export type JobDetail = {
  job: {
    job_id: number;
    job_code: string | null;
    job_title: string;
    category_id: number | null;
    country_id: number | null;
    contract_duration_id: number | null;
    vacancy: number | null;
    salary_min: string | null;
    salary_max: string | null;
    job_description: string | null;
    status: string | null;
  };
  requirements: Array<{ requirement_id: number; job_id: number; requirement: string }>;
  benefits: Array<{ benefit_id: number; job_id: number; benefit: string }>;
  documents: Array<{ id: number; job_id: number; document_type_id: number; document_name: string; is_required: number }>;
  locations: Array<{
    id: number;
    job_id: number;
    country_id: number | null;
    state_id: number | null;
    city_id: number | null;
    country_name: string | null;
    state_name: string | null;
    city_name: string | null;
    vacancy: number | null;
    salary_min: string | null;
    salary_max: string | null;
  }>;
  status_history: Array<{ id: number; job_id: number; status: string | null; remarks: string | null; changed_at: string }>;
};

export type JobUpsert = {
  job_code?: string | null;
  job_title: string;
  category_id?: number | null;
  country_id?: number | null;
  contract_duration_id?: number | null;
  vacancy?: number | null;
  salary_min?: number | null;
  salary_max?: number | null;
  job_description?: string | null;
  status?: string | null;
  requirements?: string[];
  benefits?: string[];
  documents?: Array<{ document_type_id: number; is_required?: boolean }>;
  locations?: Array<{
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    vacancy?: number | null;
    salary_min?: number | null;
    salary_max?: number | null;
    requirements?: string[];
    benefits?: string[];
  }>;
};

export const jobsApi = {
  list: () => apiFetch<JobListRow[]>(`/jobs`, { method: "GET" }),
  preview: (filters: {
    country_id?: number;
    state_id?: number;
    city_id?: number;
    category_id?: number;
    status?: string;
  }) => {
    const qs = new URLSearchParams();
    if (typeof filters.country_id === "number") qs.set("country_id", String(filters.country_id));
    if (typeof filters.state_id === "number") qs.set("state_id", String(filters.state_id));
    if (typeof filters.city_id === "number") qs.set("city_id", String(filters.city_id));
    if (typeof filters.category_id === "number") qs.set("category_id", String(filters.category_id));
    if (filters.status) qs.set("status", filters.status);
    return apiFetch<JobListRow[]>(`/jobs-preview?${qs.toString()}`, { method: "GET" });
  },
  get: (jobId: number) => apiFetch<JobDetail>(`/jobs/${jobId}`, { method: "GET" }),
  create: (input: JobUpsert) => apiFetch<{ job_id: number }>(`/jobs`, { method: "POST", body: JSON.stringify(input) }),
  update: (jobId: number, input: Partial<JobUpsert>) =>
    apiFetch<{ updated: true }>(`/jobs/${jobId}`, { method: "PUT", body: JSON.stringify(input) }),
  setStatus: (jobId: number, input: { status: string; remarks?: string | null }) =>
    apiFetch<{ updated: true }>(`/jobs/${jobId}/status`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (jobId: number) => apiFetch<{ deleted: true }>(`/jobs/${jobId}`, { method: "DELETE" }),
};
