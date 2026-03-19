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
};

