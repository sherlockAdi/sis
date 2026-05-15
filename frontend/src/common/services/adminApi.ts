import { apiFetch } from "./apiFetch";

export type Role = {
  role_id: number;
  role_name: string;
  role_code: string | null;
  description: string | null;
  status: boolean;
  created_at: string;
};

export type Menu = {
  menu_id: number;
  menu_name: string;
  menu_code: string | null;
  parent_menu_id: number | null;
  menu_path: string | null;
  icon: string | null;
  menu_order: number;
  status: boolean;
  created_at: string;
};

export type Permission = {
  permission_id: number;
  role_id: number;
  menu_id: number;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
};

export type NotificationTemplate = {
  template_id: number;
  template_code: string;
  template_name: string;
  category: string;
  channel: string;
  recipient_type: string;
  subject_template: string | null;
  text_template: string | null;
  html_template: string | null;
  signature_name: string | null;
  signature_title: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
};

export const adminApi = {
  roles: {
    list: () => apiFetch<Role[]>(`/roles`, { method: "GET" }),
    create: (input: { role_name: string; role_code?: string | null; description?: string | null; status?: boolean }) =>
      apiFetch<{ role_id: number }>(`/roles`, { method: "POST", body: JSON.stringify(input) }),
    update: (
      roleId: number,
      input: Partial<{ role_name: string; role_code: string | null; description: string | null; status: boolean }>,
    ) => apiFetch<{ updated: true }>(`/roles/${roleId}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (roleId: number) => apiFetch<{ disabled: true }>(`/roles/${roleId}`, { method: "DELETE" }),
  },
  menus: {
    list: () => apiFetch<Menu[]>(`/menus`, { method: "GET" }),
    create: (input: {
      menu_name: string;
      menu_code?: string | null;
      parent_menu_id?: number | null;
      menu_path?: string | null;
      icon?: string | null;
      menu_order?: number;
      status?: boolean;
    }) => apiFetch<{ menu_id: number }>(`/menus`, { method: "POST", body: JSON.stringify(input) }),
    update: (
      menuId: number,
      input: Partial<{
        menu_name: string;
        menu_code: string | null;
        parent_menu_id: number | null;
        menu_path: string | null;
        icon: string | null;
        menu_order: number;
        status: boolean;
      }>,
    ) => apiFetch<{ updated: true }>(`/menus/${menuId}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (menuId: number) => apiFetch<{ disabled: true }>(`/menus/${menuId}`, { method: "DELETE" }),
  },
  permissions: {
    list: (filters: { role_id?: number; menu_id?: number }) => {
      const params = new URLSearchParams();
      if (typeof filters.role_id === "number") params.set("role_id", String(filters.role_id));
      if (typeof filters.menu_id === "number") params.set("menu_id", String(filters.menu_id));
      const q = params.toString();
      return apiFetch<Permission[]>(`/permissions${q ? `?${q}` : ""}`, { method: "GET" });
    },
    create: (input: {
      role_id: number;
      menu_id: number;
      can_view?: boolean;
      can_add?: boolean;
      can_edit?: boolean;
      can_delete?: boolean;
    }) => apiFetch<{ permission_id: number }>(`/permissions`, { method: "POST", body: JSON.stringify(input) }),
    update: (
      permissionId: number,
      input: Partial<{ can_view: boolean; can_add: boolean; can_edit: boolean; can_delete: boolean }>,
    ) => apiFetch<{ updated: true }>(`/permissions/${permissionId}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (permissionId: number) => apiFetch<{ deleted: true }>(`/permissions/${permissionId}`, { method: "DELETE" }),
  },
  notificationTemplates: {
    list: () => apiFetch<NotificationTemplate[]>(`/notification-templates`, { method: "GET" }),
    get: (templateId: number) => apiFetch<NotificationTemplate>(`/notification-templates/${templateId}`, { method: "GET" }),
    create: (input: Partial<Omit<NotificationTemplate, "template_id" | "created_at" | "updated_at" | "status">> & {
      template_code: string;
      template_name: string;
      category?: string;
      channel?: string;
      recipient_type?: string;
      subject_template?: string | null;
      text_template?: string | null;
      html_template?: string | null;
      signature_name?: string | null;
      signature_title?: string | null;
      status?: boolean;
    }) => apiFetch<{ template_id: number }>(`/notification-templates`, { method: "POST", body: JSON.stringify(input) }),
    update: (
      templateId: number,
      input: Partial<{
        template_code: string;
        template_name: string;
        category: string;
        channel: string;
        recipient_type: string;
        subject_template: string | null;
        text_template: string | null;
        html_template: string | null;
        signature_name: string | null;
        signature_title: string | null;
        status: boolean;
      }>,
    ) => apiFetch<{ updated: true }>(`/notification-templates/${templateId}`, { method: "PUT", body: JSON.stringify(input) }),
    disable: (templateId: number) => apiFetch<{ disabled: true }>(`/notification-templates/${templateId}`, { method: "DELETE" }),
  },
  users: {
    create: (input: {
      role_id: number;
      first_name?: string | null;
      last_name?: string | null;
      username: string;
      email?: string | null;
      phone?: string | null;
      password?: string | null;
      status?: boolean;
    }) => apiFetch<{ user_id: number }>(`/users`, { method: "POST", body: JSON.stringify(input) }),
    update: (
      userId: number,
      input: Partial<{
        role_id: number;
        first_name: string | null;
        last_name: string | null;
        username: string;
        email: string | null;
        phone: string | null;
        password: string | null;
        status: boolean;
      }>,
    ) => apiFetch<{ updated: true }>(`/users/${userId}`, { method: "PUT", body: JSON.stringify(input) }),
  },
};
