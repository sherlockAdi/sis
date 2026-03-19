import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import SaveIcon from "@mui/icons-material/Save";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { adminApi, type Menu, type Permission, type Role } from "../../common/services/adminApi";

type RoleForm = {
  role_id?: number;
  role_name: string;
  role_code: string;
  description: string;
  status: boolean;
};

type MenuForm = {
  menu_id?: number;
  menu_name: string;
  menu_code: string;
  parent_menu_id: number | null;
  menu_path: string;
  icon: string;
  menu_order: number;
  status: boolean;
};

type PermState = {
  permission_id?: number;
  menu_id: number;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  dirty?: boolean;
};

function bool(v: unknown): boolean {
  return Boolean(v) && String(v) !== "0";
}

function safeNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function MenuManagementPage() {
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshRoles = async () => {
    setLoadingRoles(true);
    try {
      setRoles(await adminApi.roles.list());
    } finally {
      setLoadingRoles(false);
    }
  };

  const refreshMenus = async () => {
    setLoadingMenus(true);
    try {
      setMenus(await adminApi.menus.list());
    } finally {
      setLoadingMenus(false);
    }
  };

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        await Promise.all([refreshRoles(), refreshMenus()]);
      } catch (e: any) {
        const apiErr = e as ApiError;
        setError(apiErr?.message ?? "Failed to load master data");
      }
    })();
  }, []);

  const menuNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of menus) map.set(m.menu_id, m.menu_name);
    return map;
  }, [menus]);

  // -------------------------
  // Roles (CRUD)
  // -------------------------
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState<RoleForm>({
    role_name: "",
    role_code: "",
    description: "",
    status: true,
  });

  const roleCols = useMemo(
    () => [
      { field: "role_name", headerName: "Role", flex: 1, minWidth: 220 },
      { field: "role_code", headerName: "Code", width: 160 },
      { field: "description", headerName: "Description", flex: 1, minWidth: 260 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p: any) => (
          <Chip size="small" label={p.value ? "Active" : "Disabled"} color={p.value ? "success" : "default"} />
        ),
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as Role;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => {
                  setRoleForm({
                    role_id: r.role_id,
                    role_name: r.role_name,
                    role_code: r.role_code ?? "",
                    description: r.description ?? "",
                    status: Boolean(r.status),
                  });
                  setRoleModalOpen(true);
                }}
              >
                Edit
              </AdButton>
              <AdButton
                variant="text"
                startIcon={<BlockIcon fontSize="small" />}
                onClick={async () => {
                  await adminApi.roles.disable(r.role_id);
                  setToast({ open: true, message: "Role disabled", severity: "success" });
                  refreshRoles();
                }}
              >
                Disable
              </AdButton>
            </Stack>
          );
        },
      },
    ],
    [],
  );

  const saveRole = async () => {
    try {
      if (!roleForm.role_name.trim()) throw new Error("Role name is required");
      if (roleForm.role_id) {
        await adminApi.roles.update(roleForm.role_id, {
          role_name: roleForm.role_name.trim(),
          role_code: roleForm.role_code.trim() || null,
          description: roleForm.description.trim() || null,
          status: roleForm.status,
        });
      } else {
        await adminApi.roles.create({
          role_name: roleForm.role_name.trim(),
          role_code: roleForm.role_code.trim() || null,
          description: roleForm.description.trim() || null,
          status: roleForm.status,
        });
      }
      setToast({ open: true, message: "Role saved", severity: "success" });
      setRoleModalOpen(false);
      setRoleForm({ role_name: "", role_code: "", description: "", status: true });
      refreshRoles();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Save failed", severity: "error" });
    }
  };

  // -------------------------
  // Menus (CRUD)
  // -------------------------
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState<MenuForm>({
    menu_name: "",
    menu_code: "",
    parent_menu_id: null,
    menu_path: "",
    icon: "",
    menu_order: 0,
    status: true,
  });

  const parentOptions = useMemo(() => {
    const opts = menus
      .slice()
      .sort((a, b) => a.menu_name.localeCompare(b.menu_name))
      .map((m) => ({ label: `${m.menu_name} (${m.menu_id})`, value: String(m.menu_id) }));
    return [{ label: "— None —", value: "" }, ...opts];
  }, [menus]);

  const menuCols = useMemo(
    () => [
      { field: "menu_name", headerName: "Menu", flex: 1, minWidth: 220 },
      { field: "menu_code", headerName: "Code", width: 190 },
      {
        field: "parent_menu_id",
        headerName: "Parent",
        width: 220,
        valueGetter: (p: any) => {
          const raw = p?.value ?? p?.row?.parent_menu_id ?? null;
          const v = typeof raw === "number" ? raw : raw ? Number(raw) : null;
          if (!v) return "";
          return menuNameById.get(v) ?? `#${v}`;
        },
      },
      { field: "menu_path", headerName: "Path", flex: 1, minWidth: 240 },
      { field: "icon", headerName: "Icon", width: 160 },
      { field: "menu_order", headerName: "Order", width: 110 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p: any) => (
          <Chip size="small" label={p.value ? "Active" : "Disabled"} color={p.value ? "success" : "default"} />
        ),
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const m = p.row as Menu;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => {
                  setMenuForm({
                    menu_id: m.menu_id,
                    menu_name: m.menu_name,
                    menu_code: m.menu_code ?? "",
                    parent_menu_id: m.parent_menu_id ?? null,
                    menu_path: m.menu_path ?? "",
                    icon: m.icon ?? "",
                    menu_order: safeNumber(m.menu_order, 0),
                    status: Boolean(m.status),
                  });
                  setMenuModalOpen(true);
                }}
              >
                Edit
              </AdButton>
              <AdButton
                variant="text"
                startIcon={<BlockIcon fontSize="small" />}
                onClick={async () => {
                  await adminApi.menus.disable(m.menu_id);
                  setToast({ open: true, message: "Menu disabled", severity: "success" });
                  refreshMenus();
                }}
              >
                Disable
              </AdButton>
            </Stack>
          );
        },
      },
    ],
    [menuNameById],
  );

  const saveMenu = async () => {
    try {
      if (!menuForm.menu_name.trim()) throw new Error("Menu name is required");
      const payload = {
        menu_name: menuForm.menu_name.trim(),
        menu_code: menuForm.menu_code.trim() || null,
        parent_menu_id: menuForm.parent_menu_id,
        menu_path: menuForm.menu_path.trim() || null,
        icon: menuForm.icon.trim() || null,
        menu_order: safeNumber(menuForm.menu_order, 0),
        status: menuForm.status,
      };
      if (menuForm.menu_id) await adminApi.menus.update(menuForm.menu_id, payload);
      else await adminApi.menus.create(payload);

      setToast({ open: true, message: "Menu saved", severity: "success" });
      setMenuModalOpen(false);
      setMenuForm({
        menu_name: "",
        menu_code: "",
        parent_menu_id: null,
        menu_path: "",
        icon: "",
        menu_order: 0,
        status: true,
      });
      refreshMenus();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Save failed", severity: "error" });
    }
  };

  // -------------------------
  // Permissions (Role -> Menu)
  // -------------------------
  const roleOptions = useMemo(
    () =>
      roles
        .slice()
        .sort((a, b) => a.role_name.localeCompare(b.role_name))
        .map((r) => ({ label: `${r.role_name}${r.role_code ? ` (${r.role_code})` : ""}`, value: String(r.role_id) })),
    [roles],
  );
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [permLoading, setPermLoading] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);
  const [permMap, setPermMap] = useState<Record<number, PermState>>({});
  const [permOriginal, setPermOriginal] = useState<Record<number, PermState>>({});

  const menuTree = useMemo(() => {
    const activeMenus = menus.filter((m) => Boolean(m.status)).slice();
    activeMenus.sort((a, b) => Number(a.menu_order) - Number(b.menu_order) || a.menu_id - b.menu_id);
    const byParent = new Map<number | null, Menu[]>();
    for (const m of activeMenus) {
      const key = m.parent_menu_id ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(m);
    }
    const walk = (parentId: number | null, level: number, out: Array<Menu & { level: number }>) => {
      for (const m of byParent.get(parentId) ?? []) {
        out.push({ ...m, level });
        walk(m.menu_id, level + 1, out);
      }
    };
    const out: Array<Menu & { level: number }> = [];
    walk(null, 0, out);
    return out;
  }, [menus]);

  const loadPermissionsForRole = async (roleId: number) => {
    setPermLoading(true);
    setPermError(null);
    try {
      const perms = await adminApi.permissions.list({ role_id: roleId });
      const nextMap: Record<number, PermState> = {};
      const nextOriginal: Record<number, PermState> = {};

      const byMenu = new Map<number, Permission>();
      for (const p of perms) byMenu.set(p.menu_id, p);

      for (const m of menuTree) {
        const p = byMenu.get(m.menu_id);
        const state: PermState = {
          permission_id: p?.permission_id,
          menu_id: m.menu_id,
          can_view: bool(p?.can_view),
          can_add: bool(p?.can_add),
          can_edit: bool(p?.can_edit),
          can_delete: bool(p?.can_delete),
        };
        nextMap[m.menu_id] = { ...state };
        nextOriginal[m.menu_id] = { ...state };
      }
      setPermMap(nextMap);
      setPermOriginal(nextOriginal);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setPermError(apiErr?.message ?? "Failed to load permissions");
    } finally {
      setPermLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoleId == null) return;
    loadPermissionsForRole(selectedRoleId);
  }, [selectedRoleId, menuTree.length]);

  const markDirty = (menuId: number, next: Partial<PermState>) => {
    setPermMap((prev) => {
      const current = prev[menuId] ?? {
        menu_id: menuId,
        can_view: false,
        can_add: false,
        can_edit: false,
        can_delete: false,
      };
      const merged = { ...current, ...next } as PermState;
      const orig = permOriginal[menuId];
      const dirty =
        !orig ||
        orig.can_view !== merged.can_view ||
        orig.can_add !== merged.can_add ||
        orig.can_edit !== merged.can_edit ||
        orig.can_delete !== merged.can_delete;
      return { ...prev, [menuId]: { ...merged, dirty } };
    });
  };

  const anyDirty = useMemo(
    () => Object.values(permMap).some((p) => Boolean(p?.dirty)),
    [permMap],
  );

  const permissionsRows = useMemo(() => {
    return menuTree.map((m) => {
      const p = permMap[m.menu_id] ?? {
        menu_id: m.menu_id,
        can_view: false,
        can_add: false,
        can_edit: false,
        can_delete: false,
      };
      return {
        id: m.menu_id,
        menu_id: m.menu_id,
        menu_name: m.menu_name,
        level: m.level,
        menu_path: m.menu_path ?? "",
        dirty: Boolean(p.dirty),
        ...p,
      };
    });
  }, [menuTree, permMap]);

  const permCols = useMemo(
    () => [
      {
        field: "menu_name",
        headerName: "Menu",
        flex: 1,
        minWidth: 260,
        renderCell: (p: any) => {
          const level = Number(p.row.level ?? 0);
          return (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ pl: level * 2 }}>
              <Typography fontWeight={level === 0 ? 900 : 650} noWrap>
                {p.value}
              </Typography>
              {p.row.dirty ? <Chip size="small" label="Changed" color="warning" variant="outlined" /> : null}
            </Stack>
          );
        },
      },
      { field: "menu_path", headerName: "Path", flex: 1, minWidth: 220 },
      {
        field: "can_view",
        headerName: "View",
        width: 90,
        sortable: false,
        renderCell: (p: any) => (
          <Checkbox
            checked={Boolean(p.value)}
            onChange={(_, checked) => {
              markDirty(p.row.menu_id, {
                can_view: checked,
                ...(checked ? {} : { can_add: false, can_edit: false, can_delete: false }),
              });
            }}
          />
        ),
      },
      {
        field: "can_add",
        headerName: "Add",
        width: 90,
        sortable: false,
        renderCell: (p: any) => (
          <Checkbox
            checked={Boolean(p.value)}
            disabled={!Boolean(p.row.can_view)}
            onChange={(_, checked) => markDirty(p.row.menu_id, { can_add: checked })}
          />
        ),
      },
      {
        field: "can_edit",
        headerName: "Edit",
        width: 90,
        sortable: false,
        renderCell: (p: any) => (
          <Checkbox
            checked={Boolean(p.value)}
            disabled={!Boolean(p.row.can_view)}
            onChange={(_, checked) => markDirty(p.row.menu_id, { can_edit: checked })}
          />
        ),
      },
      {
        field: "can_delete",
        headerName: "Delete",
        width: 100,
        sortable: false,
        renderCell: (p: any) => (
          <Checkbox
            checked={Boolean(p.value)}
            disabled={!Boolean(p.row.can_view)}
            onChange={(_, checked) => markDirty(p.row.menu_id, { can_delete: checked })}
          />
        ),
      },
    ],
    [markDirty],
  );

  const savePermissions = async () => {
    if (selectedRoleId == null) return;
    const roleId = selectedRoleId;

    const changed = Object.values(permMap).filter((p) => Boolean(p.dirty));
    if (changed.length === 0) return;

    try {
      for (const p of changed) {
        const allFalse = !p.can_view && !p.can_add && !p.can_edit && !p.can_delete;
        if (p.permission_id) {
          if (allFalse) await adminApi.permissions.remove(p.permission_id);
          else {
            await adminApi.permissions.update(p.permission_id, {
              can_view: p.can_view,
              can_add: p.can_add,
              can_edit: p.can_edit,
              can_delete: p.can_delete,
            });
          }
        } else {
          if (!allFalse) {
            const created = await adminApi.permissions.create({
              role_id: roleId,
              menu_id: p.menu_id,
              can_view: p.can_view,
              can_add: p.can_add,
              can_edit: p.can_edit,
              can_delete: p.can_delete,
            });
            p.permission_id = created.permission_id;
          }
        }
      }
      setToast({ open: true, message: "Permissions saved", severity: "success" });
      await loadPermissionsForRole(roleId);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Save failed", severity: "error" });
    }
  };

  return (
    <Stack spacing={2.25}>
      <AdNotification
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          Menu Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Roles • Menus • Role Permissions
        </Typography>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
          <Tab label="Roles" />
          <Tab label="Menus" />
          <Tab label="Role Permissions" />
        </Tabs>
        <Divider />

        <Box sx={{ p: 2 }}>
          {tab === 0 ? (
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={900}>Roles</Typography>
                <AdButton
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() => {
                    setRoleForm({ role_name: "", role_code: "", description: "", status: true });
                    setRoleModalOpen(true);
                  }}
                >
                  Add Role
                </AdButton>
              </Stack>
              <AdGrid
                rows={roles.map((r) => ({ id: r.role_id, ...r }))}
                columns={roleCols as any}
                loading={loadingRoles}
                showExport={false}
                disableColumnMenu
              />
            </Stack>
          ) : null}

          {tab === 1 ? (
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={900}>Menus</Typography>
                <AdButton
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() => {
                    setMenuForm({
                      menu_name: "",
                      menu_code: "",
                      parent_menu_id: null,
                      menu_path: "",
                      icon: "",
                      menu_order: 0,
                      status: true,
                    });
                    setMenuModalOpen(true);
                  }}
                >
                  Add Menu
                </AdButton>
              </Stack>
              <AdGrid
                rows={menus.map((m) => ({ id: m.menu_id, ...m }))}
                columns={menuCols as any}
                loading={loadingMenus}
                showExport={false}
                disableColumnMenu
              />
            </Stack>
          ) : null}

          {tab === 2 ? (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
                <Box sx={{ flex: 1, minWidth: 260 }}>
                  <AdDropDown
                    label="Role"
                    required
                    options={roleOptions}
                    value={selectedRoleId ? String(selectedRoleId) : ""}
                    onChange={(v) => setSelectedRoleId(v ? Number(v) : null)}
                  />
                </Box>
                <Box sx={{ flex: 2 }} />
                <AdButton
                  startIcon={<SaveIcon fontSize="small" />}
                  disabled={!selectedRoleId || !anyDirty}
                  onClick={savePermissions}
                >
                  Save Changes
                </AdButton>
              </Stack>

              {permError && <AdAlertBox severity="error" title="Error" message={permError} />}
              {!selectedRoleId ? (
                <AdAlertBox severity="info" title="Select a role" message="Choose a role to edit menu permissions." />
              ) : (
                <AdGrid
                  rows={permissionsRows}
                  columns={permCols as any}
                  loading={permLoading}
                  showExport={false}
                  disableColumnMenu
                  getRowHeight={() => 44}
                />
              )}
            </Stack>
          ) : null}
        </Box>
      </AdCard>

      <AdModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={roleForm.role_id ? "Edit Role" : "Add Role"}
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </AdButton>
            <AdButton onClick={saveRole}>Save</AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <AdTextBox label="Role Name" required value={roleForm.role_name} onChange={(v) => setRoleForm((f) => ({ ...f, role_name: v }))} />
          <AdTextBox label="Role Code" value={roleForm.role_code} onChange={(v) => setRoleForm((f) => ({ ...f, role_code: v }))} />
          <AdTextBox label="Description" value={roleForm.description} onChange={(v) => setRoleForm((f) => ({ ...f, description: v }))} />
        </Stack>
      </AdModal>

      <AdModal
        open={menuModalOpen}
        onClose={() => setMenuModalOpen(false)}
        title={menuForm.menu_id ? "Edit Menu" : "Add Menu"}
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setMenuModalOpen(false)}>
              Cancel
            </AdButton>
            <AdButton onClick={saveMenu}>Save</AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <AdTextBox label="Menu Name" required value={menuForm.menu_name} onChange={(v) => setMenuForm((f) => ({ ...f, menu_name: v }))} />
          <AdTextBox label="Menu Code" value={menuForm.menu_code} onChange={(v) => setMenuForm((f) => ({ ...f, menu_code: v }))} />

          <AdDropDown
            label="Parent Menu"
            options={parentOptions}
            value={menuForm.parent_menu_id ? String(menuForm.parent_menu_id) : ""}
            onChange={(v) => setMenuForm((f) => ({ ...f, parent_menu_id: v ? Number(v) : null }))}
          />

          <AdTextBox label="Menu Path" value={menuForm.menu_path} onChange={(v) => setMenuForm((f) => ({ ...f, menu_path: v }))} />
          <AdTextBox label="Icon" value={menuForm.icon} onChange={(v) => setMenuForm((f) => ({ ...f, icon: v }))} />
          <AdTextBox
            label="Menu Order"
            type="number"
            value={String(menuForm.menu_order ?? 0)}
            onChange={(v) => setMenuForm((f) => ({ ...f, menu_order: safeNumber(v, 0) }))}
          />
        </Stack>
      </AdModal>
    </Stack>
  );
}
