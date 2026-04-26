import { apiFetch } from "./apiFetch";

export type EmployeeRow = {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  employee_contact_number: string | null;
  address1: string | null;
  address2: string | null;
  pin_code: string | null;
  industry: string | null;
  work_location: string | null;
  employment_status: string | null;
  date_of_joining: string | null;
  date_of_confirmation: string | null;
  candidate_id: number;
  deployment_id: number | null;
  shift_timing: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  passport_number?: string | null;
};

export type EmployeeDetailRow = EmployeeRow & {
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
  candidate_address1?: string | null;
  candidate_address2?: string | null;
  candidate_pincode?: string | null;
  user_id?: number | null;
  login_username?: string | null;
  login_email?: string | null;
};

export const employeesApi = {
  list: () => apiFetch<EmployeeRow[]>(`/employees`, { method: "GET" }),
  me: () => apiFetch<EmployeeDetailRow | null>(`/employees/me`, { method: "GET" }),
  get: (employee_id: number) => apiFetch<EmployeeDetailRow | null>(`/employees/${employee_id}`, { method: "GET" }),
  disable: (employee_id: number) => apiFetch<{ disabled: true }>(`/employees/${employee_id}`, { method: "DELETE" }),
  updateCredentials: (employee_id: number, input: {
    username?: string | null;
    email?: string | null;
    password?: string | null;
  }) => apiFetch<{ updated: true }>(`/employees/${employee_id}/credentials`, {
    method: "PUT",
    body: JSON.stringify(input),
  }),
  confirmFromDeployment: (input: {
    deployment_id: number;
    employment_status?: string | null;
    date_of_joining?: string | null;
    date_of_confirmation?: string | null;
    shift_timing?: string | null;
  }) => apiFetch<{ employee_id: number }>(`/employees/from-deployment`, { method: "POST", body: JSON.stringify(input) }),
};
