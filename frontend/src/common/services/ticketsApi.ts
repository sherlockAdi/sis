import { apiFetch } from "./apiFetch";

export type TicketTypeRow = {
  ticket_type_id: number;
  ticket_type_code: string;
  ticket_type_name: string;
  description: string | null;
  status: number;
  can_view: number;
  can_create: number;
  can_assign: number;
  can_resolve: number;
  can_escalate: number;
  can_close: number;
};

export type TicketStatusRow = {
  ticket_status_id: number;
  ticket_status_code: string;
  ticket_status_name: string;
  sort_order: number;
  status: number;
};

export type TicketMeta = {
  role_code: string;
  role_group: string;
  types: TicketTypeRow[];
  statuses: TicketStatusRow[];
};

export type TicketRow = {
  ticket_id: number;
  ticket_code: string;
  ticket_type_id: number;
  ticket_type_code: string;
  ticket_type_name: string;
  ticket_status_id: number;
  ticket_status_code: string;
  ticket_status_name: string;
  raised_by_user_id: number;
  raised_by_role_code: string;
  subject: string;
  description: string | null;
  related_job_id: number | null;
  related_job_title: string | null;
  related_deployment_id: number | null;
  related_candidate_id: number | null;
  related_candidate_name: string | null;
  related_employee_id: number | null;
  related_employee_name: string | null;
  priority: string | null;
  visibility_scope: string;
  assigned_to_user_id: number | null;
  assigned_to_username: string | null;
  assigned_to_role_code: string | null;
  resolved_by_user_id: number | null;
  resolved_at: string | null;
  closed_at: string | null;
  reopened_at: string | null;
  created_at: string;
  updated_at: string;
  comments_count: number;
  attachments_count: number;
};

export type TicketCommentRow = {
  ticket_comment_id: number;
  ticket_id: number;
  user_id: number;
  username: string | null;
  role_code: string | null;
  comment: string;
  created_at: string;
  updated_at: string;
};

export type TicketAttachmentRow = {
  ticket_attachment_id: number;
  ticket_id: number;
  file_path: string;
  file_name: string | null;
  uploaded_by_user_id: number;
  uploaded_by_username: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketDetail = TicketRow & {
  comments: TicketCommentRow[];
  attachments: TicketAttachmentRow[];
};

export const ticketsApi = {
  meta: () => apiFetch<TicketMeta>("/tickets/meta", { method: "GET" }),
  list: (ticket_status_code?: string) =>
    apiFetch<TicketRow[]>(`/tickets${ticket_status_code ? `?ticket_status_code=${encodeURIComponent(ticket_status_code)}` : ""}`, {
      method: "GET",
    }),
  get: (ticketId: number) => apiFetch<TicketDetail>(`/tickets/${ticketId}`, { method: "GET" }),
  create: (input: {
    ticket_type_id: number;
    subject: string;
    description?: string | null;
    priority?: string | null;
    related_job_id?: number | null;
    related_deployment_id?: number | null;
    related_candidate_id?: number | null;
    related_employee_id?: number | null;
    attachment_file_path?: string | null;
    attachment_file_name?: string | null;
  }) => apiFetch<{ ticket_id: number; ticket_code: string }>("/tickets", { method: "POST", body: JSON.stringify(input) }),
  update: (ticketId: number, input: {
    subject?: string | null;
    description?: string | null;
    priority?: string | null;
    related_job_id?: number | null;
    related_deployment_id?: number | null;
    related_candidate_id?: number | null;
    related_employee_id?: number | null;
  }) => apiFetch<{ updated: true }>(`/tickets/${ticketId}`, { method: "PUT", body: JSON.stringify(input) }),
  updateStatus: (ticketId: number, input: { ticket_status_code: string; remarks?: string | null }) =>
    apiFetch<{ updated: true }>(`/tickets/${ticketId}/status`, { method: "PUT", body: JSON.stringify(input) }),
  comments: {
    list: (ticketId: number) => apiFetch<TicketCommentRow[]>(`/tickets/${ticketId}/comments`, { method: "GET" }),
    add: (ticketId: number, comment: string) =>
      apiFetch<{ ticket_comment_id: number }>(`/tickets/${ticketId}/comments`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      }),
  },
  attachments: {
    add: (ticketId: number, input: { file_path: string; file_name?: string | null }) =>
      apiFetch<{ ticket_attachment_id: number }>(`/tickets/${ticketId}/attachments`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
};
