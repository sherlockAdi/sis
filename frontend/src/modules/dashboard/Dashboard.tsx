import { useState } from "react";
import { Avatar, Box, Chip, Divider, Grid, Stack, Tab, Tabs, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { AdAlertBox, AdCard, AdGrid } from "../../common/ad";
import { useAuth } from "../../common/auth/AuthContext";
import WorkflowDashboard from "./WorkflowDashboard";
import OverviewDashboard from "./OverviewDashboard";

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

function ProfileDashboard({ data }: { data: any }) {
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ") || data.username;
  const menus = (data.menus ?? []) as any[];
  const viewableMenus = menus.filter((m) => Number(m.can_view) === 1);
  const permissions = {
    view: menus.filter((m) => Number(m.can_view) === 1).length,
    add: menus.filter((m) => Number(m.can_add) === 1).length,
    edit: menus.filter((m) => Number(m.can_edit) === 1).length,
    delete: menus.filter((m) => Number(m.can_delete) === 1).length,
  };

  return (
    <Stack spacing={2.5}>
      <AdCard
        animate={false}
        sx={{
          backgroundColor: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(2,6,23,0.08)",
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
        }}
        contentSx={{ p: 2 }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2.25} alignItems={{ xs: "stretch", md: "center" }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: "rgba(216,27,96,0.14)",
                color: "#d81b60",
                fontWeight: 950,
              }}
            >
              {String(fullName).slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="h6" fontWeight={950} noWrap sx={{ minWidth: 0 }}>
                  {fullName}
                </Typography>
                <Chip size="small" label={data.username} variant="outlined" />
                <Chip
                  size="small"
                  icon={<VerifiedUserIcon fontSize="small" />}
                  label={data.status ? "Active" : "Disabled"}
                  color={data.status ? "success" : "default"}
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 0.5 }} flexWrap="wrap">
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {data.email ?? "-"}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <PhoneIphoneIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {data.phone ?? "-"}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
            <Chip size="small" icon={<AdminPanelSettingsIcon fontSize="small" />} label={data.role_name ?? "Role"} />
            <Chip size="small" label={data.role_code ?? "—"} variant="outlined" />
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
              <CalendarMonthIcon fontSize="small" />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                Last login: {data.last_login ?? "—"}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </AdCard>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, minmax(0, 1fr))" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <AdCard
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonIcon fontSize="small" />
              <span>Account</span>
            </Stack>
          }
          animate={false}
          sx={{
            backgroundColor: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(2,6,23,0.08)",
            boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            height: "100%",
          }}
          contentSx={{ p: 2 }}
        >
          <Stack spacing={1.1}>
            <FieldRow label="Created At" value={data.created_at} />
            <FieldRow label="Last Login" value={data.last_login} />
          </Stack>
        </AdCard>

        <AdCard
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <AdminPanelSettingsIcon fontSize="small" />
              <span>Role</span>
            </Stack>
          }
          animate={false}
          sx={{
            backgroundColor: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(2,6,23,0.08)",
            boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            height: "100%",
          }}
          contentSx={{ p: 2 }}
        >
          <Stack spacing={1.1}>
            <FieldRow label="Role Name" value={data.role_name} />
            <FieldRow label="Role Code" value={data.role_code} />
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

        <AdCard
          title="Access"
          subtitle="Permissions summary"
          animate={false}
          sx={{
            backgroundColor: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(2,6,23,0.08)",
            boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            height: "100%",
          }}
          contentSx={{ p: 2 }}
        >
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`View: ${permissions.view}`} variant="outlined" />
              <Chip size="small" label={`Add: ${permissions.add}`} variant="outlined" />
              <Chip size="small" label={`Edit: ${permissions.edit}`} variant="outlined" />
              <Chip size="small" label={`Delete: ${permissions.delete}`} variant="outlined" />
            </Stack>
            <Divider />
            <Typography variant="body2" color="text.secondary">
              Menus you can access: <b>{viewableMenus.length}</b>
            </Typography>
          </Stack>
        </AdCard>

        <AdCard
          title="Quick Tips"
          subtitle="Getting started"
          animate={false}
          sx={{
            backgroundColor: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(2,6,23,0.08)",
            boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            height: "100%",
          }}
          contentSx={{ p: 2 }}
        >
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary">
              Use <b>Overview</b> for admin KPIs.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use <b>Workflow</b> to move items across stages.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Export from <b>Work Queue</b> when needed.
            </Typography>
          </Stack>
        </AdCard>
      </Box>

      <AdCard
        title="Menus / Permissions"
        subtitle="Menus returned for your role"
        animate={false}
        sx={{
          backgroundColor: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(2,6,23,0.08)",
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
        }}
        contentSx={{ p: 2 }}
      >
        <AdGrid
          rows={(data.menus ?? []).map((m: any) => ({ id: m.menu_id, ...m }))}
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
    </Stack>
  );
}

export default function Dashboard() {
  const { me } = useAuth();
  const [tab, setTab] = useState<"overview" | "workflow" | "profile">("overview");

  const error = !me ? "Missing profile. Please login again." : null;
  const data = me;
  const loading = false;

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.75}>
        <Typography variant="h4" fontWeight={900}>
          Dashboard
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ minHeight: 44 }}
          TabIndicatorProps={{ sx: { height: 3, borderRadius: 2 } }}
        >
          <Tab value="overview" label="Overview" sx={{ textTransform: "none", fontWeight: 800 }} />
          <Tab value="workflow" label="Workflow" sx={{ textTransform: "none", fontWeight: 800 }} />
          <Tab value="profile" label="My Profile" sx={{ textTransform: "none", fontWeight: 800 }} />
        </Tabs>
      </Stack>

      {error && <AdAlertBox severity="error" title="Failed to load" message={error} />}

      {!loading && data && tab === "overview" && <OverviewDashboard userName={data.username} />}

      {!loading && data && tab === "workflow" && <WorkflowDashboard currentUser={data.username} />}

      {!loading && data && tab === "profile" && <ProfileDashboard data={data} />}
    </Stack>
  );
}
