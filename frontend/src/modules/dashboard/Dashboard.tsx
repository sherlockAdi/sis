import { useMemo } from "react";
import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { AdAlertBox, AdCard, AdGrid } from "../../common/ad";
import { useAuth } from "../../common/auth/AuthContext";

function yesNo(v: number) {
  return v ? "Yes" : "No";
}

function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="baseline">
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
        {value ?? "-"}
      </Typography>
    </Stack>
  );
}

export default function Dashboard() {
  const { me } = useAuth();
  const error = !me ? "Missing profile. Please login again." : null;
  const data = me;
  const loading = false;

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={900}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Logged-in user details from `GET /auth/me`
        </Typography>
      </Stack>

      {error && <AdAlertBox severity="error" title="Failed to load" message={error} />}

      {!loading && data && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={5}>
            <AdCard
              title={
                <Stack direction="row" spacing={1} alignItems="center">
                  <PersonIcon fontSize="small" />
                  <span>Profile</span>
                </Stack>
              }
              animate={false}
              sx={{ backgroundColor: "rgba(255,255,255,0.72)", backdropFilter: "blur(10px)" }}
            >
              <Stack spacing={1.25}>
                <FieldRow label="Username" value={data.username} />
                <FieldRow label="Name" value={[data.first_name, data.last_name].filter(Boolean).join(" ") || "-"} />
                <FieldRow label="Email" value={data.email} />
                <FieldRow label="Phone" value={data.phone} />
                <FieldRow
                  label="Status"
                  value={
                    <Chip
                      size="small"
                      label={data.status ? "Active" : "Disabled"}
                      color={data.status ? "success" : "default"}
                    />
                  }
                />
                <FieldRow label="Last Login" value={data.last_login} />
                <FieldRow label="Created At" value={data.created_at} />
              </Stack>
            </AdCard>
          </Grid>

          <Grid item xs={12} md={7}>
            <AdCard
              title={
                <Stack direction="row" spacing={1} alignItems="center">
                  <AdminPanelSettingsIcon fontSize="small" />
                  <span>Role</span>
                </Stack>
              }
              animate={false}
              sx={{ backgroundColor: "rgba(255,255,255,0.72)", backdropFilter: "blur(10px)" }}
            >
              <Stack spacing={1.25}>
                <FieldRow label="Role Name" value={data.role_name} />
                <FieldRow label="Role Code" value={data.role_code} />
                <FieldRow label="Description" value={data.role_description} />
                <FieldRow
                  label="Role Status"
                  value={
                    <Chip
                      size="small"
                      label={data.role_status ? "Active" : "Disabled"}
                      color={data.role_status ? "success" : "default"}
                    />
                  }
                />
              </Stack>
            </AdCard>

            <Box mt={2.5}>
              <AdCard
                title="Menus / Permissions"
                subtitle="Menus returned for your role"
                animate={false}
                sx={{ backgroundColor: "rgba(255,255,255,0.72)", backdropFilter: "blur(10px)" }}
                contentSx={{ p: 2 }}
              >
                <AdGrid
                  rows={(data.menus ?? []).map((m) => ({ id: m.menu_id, ...m }))}
                  columns={[
                    { field: "menu_name", headerName: "Menu", flex: 1, minWidth: 220 },
                    { field: "menu_path", headerName: "Path", flex: 1, minWidth: 200 },
                    { field: "can_view", headerName: "View", width: 90, valueGetter: (p) => yesNo(Number(p.value)) },
                    { field: "can_add", headerName: "Add", width: 90, valueGetter: (p) => yesNo(Number(p.value)) },
                    { field: "can_edit", headerName: "Edit", width: 90, valueGetter: (p) => yesNo(Number(p.value)) },
                    { field: "can_delete", headerName: "Delete", width: 90, valueGetter: (p) => yesNo(Number(p.value)) },
                    { field: "menu_order", headerName: "Order", width: 90 },
                  ]}
                  showToolbar
                  showExport={false}
                  disableColumnMenu
                  sx={{
                    border: "1px solid rgba(2,6,23,0.08)",
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.92)",
                  }}
                />
              </AdCard>
            </Box>
          </Grid>
        </Grid>
      )}
    </Stack>
  );
}
