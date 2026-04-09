import { apiFetch } from "./apiFetch";

export type InterviewMode = {
  interview_mode_id: number;
  mode_name: string;
  description: string | null;
  status: number;
  created_at: string;
};

export type VisaType = {
  visa_type_id: number;
  visa_type_name: string;
  description: string | null;
  status: number;
  created_at: string;
};

export type JobCategory = {
  category_id: number;
  category_name: string;
  description: string | null;
  status: number;
  created_at: string;
};

export type ContractDuration = {
  duration_id: number;
  duration_name: string | null;
  months: number | null;
  status: number;
  created_at: string;
};

export type EmploymentType = {
  employment_type_id: number;
  type_name: string;
  description: string | null;
  status: number;
  created_at: string;
};

export type WorkMode = {
  work_mode_id: number;
  mode_name: string;
  description: string | null;
  status: number;
  created_at: string;
};

export type Language = {
  language_id: number;
  language_name: string;
  status: number;
  created_at: string;
};

export type DocumentType = {
  document_type_id: number;
  document_name: string;
  is_required: number;
  status: number;
  created_at: string;
};

export type PaymentCategory = {
  payment_category_id: number;
  category_name: string;
  description: string | null;
  status: number;
  created_at: string;
};

export type Currency = {
  currency_id: number;
  currency_code: string;
  currency_name: string;
  symbol: string | null;
  country_id: number | null;
  status: number;
  created_at: string;
};

export const mastersApi = {
  interviewModes: {
    list: (include_inactive = true) =>
      apiFetch<InterviewMode[]>(
        `/masters/recruitment/interview-modes?include_inactive=${include_inactive ? "true" : "false"}`,
        { method: "GET" },
      ),
    create: (input: { mode_name: string; description?: string | null; status?: boolean }) =>
      apiFetch(`/masters/recruitment/interview-modes`, { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: Partial<{ mode_name: string; description: string | null; status: boolean }>) =>
      apiFetch(`/masters/recruitment/interview-modes/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (id: number) => apiFetch(`/masters/recruitment/interview-modes/${id}`, { method: "DELETE" }),
  },
  visaTypes: {
    list: (include_inactive = true) =>
      apiFetch<VisaType[]>(
        `/masters/recruitment/visa-types?include_inactive=${include_inactive ? "true" : "false"}`,
        { method: "GET" },
      ),
    create: (input: { visa_type_name: string; description?: string | null; status?: boolean }) =>
      apiFetch(`/masters/recruitment/visa-types`, { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: Partial<{ visa_type_name: string; description: string | null; status: boolean }>) =>
      apiFetch(`/masters/recruitment/visa-types/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (id: number) => apiFetch(`/masters/recruitment/visa-types/${id}`, { method: "DELETE" }),
  },
  languages: {
    list: (include_inactive = true) =>
      apiFetch<Language[]>(
        `/masters/recruitment/languages?include_inactive=${include_inactive ? "true" : "false"}`,
        { method: "GET" },
      ),
    create: (input: { language_name: string; status?: boolean }) =>
      apiFetch(`/masters/recruitment/languages`, { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: Partial<{ language_name: string; status: boolean }>) =>
      apiFetch(`/masters/recruitment/languages/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (id: number) => apiFetch(`/masters/recruitment/languages/${id}`, { method: "DELETE" }),
  },
  jobCategories: {
    list: (include_inactive = true) =>
      apiFetch<JobCategory[]>(
        `/masters/job/categories?include_inactive=${include_inactive ? "true" : "false"}`,
        { method: "GET" },
      ),
    create: (input: { category_name: string; description?: string | null; status?: boolean }) =>
      apiFetch(`/masters/job/categories`, { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: Partial<{ category_name: string; description: string | null; status: boolean }>) =>
      apiFetch(`/masters/job/categories/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (id: number) => apiFetch(`/masters/job/categories/${id}`, { method: "DELETE" }),
  },
  contractDurations: {
    list: (include_inactive = true) =>
      apiFetch<ContractDuration[]>(
        `/masters/job/contract-durations?include_inactive=${include_inactive ? "true" : "false"}`,
        { method: "GET" },
      ),
    create: (input: { duration_name?: string | null; months?: number | null; status?: boolean }) =>
      apiFetch(`/masters/job/contract-durations`, { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: Partial<{ duration_name: string | null; months: number | null; status: boolean }>) =>
      apiFetch(`/masters/job/contract-durations/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (id: number) => apiFetch(`/masters/job/contract-durations/${id}`, { method: "DELETE" }),
  },
  employmentTypes: {
    list: (include_inactive = true) =>
      apiFetch<EmploymentType[]>(
        `/masters/job/employment-types?include_inactive=${include_inactive ? "true" : "false"}`,
        { method: "GET" },
      ),
    create: (input: { type_name: string; description?: string | null; status?: boolean }) =>
      apiFetch(`/masters/job/employment-types`, { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: Partial<{ type_name: string; description: string | null; status: boolean }>) =>
      apiFetch(`/masters/job/employment-types/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (id: number) => apiFetch(`/masters/job/employment-types/${id}`, { method: "DELETE" }),
  },
  workModes: {
    list: (include_inactive = true) =>
      apiFetch<WorkMode[]>(
        `/masters/job/work-modes?include_inactive=${include_inactive ? "true" : "false"}`,
        { method: "GET" },
      ),
    create: (input: { mode_name: string; description?: string | null; status?: boolean }) =>
      apiFetch(`/masters/job/work-modes`, { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: Partial<{ mode_name: string; description: string | null; status: boolean }>) =>
      apiFetch(`/masters/job/work-modes/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (id: number) => apiFetch(`/masters/job/work-modes/${id}`, { method: "DELETE" }),
  },
  documentTypes: {
    list: (include_inactive = true) =>
      apiFetch<DocumentType[]>(
        `/masters/documents/types?include_inactive=${include_inactive ? "true" : "false"}`,
        { method: "GET" },
      ),
    create: (input: { document_name: string; is_required?: boolean; status?: boolean }) =>
      apiFetch(`/masters/documents/types`, { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: Partial<{ document_name: string; is_required: boolean; status: boolean }>) =>
      apiFetch(`/masters/documents/types/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (id: number) => apiFetch(`/masters/documents/types/${id}`, { method: "DELETE" }),
  },
  paymentCategories: {
    list: (include_inactive = true) =>
      apiFetch<PaymentCategory[]>(
        `/masters/payments/categories?include_inactive=${include_inactive ? "true" : "false"}`,
        { method: "GET" },
      ),
    create: (input: { category_name: string; description?: string | null; status?: boolean }) =>
      apiFetch(`/masters/payments/categories`, { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: Partial<{ category_name: string; description: string | null; status: boolean }>) =>
      apiFetch(`/masters/payments/categories/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (id: number) => apiFetch(`/masters/payments/categories/${id}`, { method: "DELETE" }),
  },
  currencies: {
    list: (include_inactive = true) =>
      apiFetch<Currency[]>(
        `/masters/payments/currencies?include_inactive=${include_inactive ? "true" : "false"}`,
        { method: "GET" },
      ),
    create: (input: { currency_code: string; currency_name: string; symbol?: string | null; country_id?: number | null; status?: boolean }) =>
      apiFetch(`/masters/payments/currencies`, { method: "POST", body: JSON.stringify(input) }),
    update: (
      id: number,
      input: Partial<{ currency_code: string; currency_name: string; symbol: string | null; country_id: number | null; status: boolean }>,
    ) => apiFetch(`/masters/payments/currencies/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (id: number) => apiFetch(`/masters/payments/currencies/${id}`, { method: "DELETE" }),
  },
};
