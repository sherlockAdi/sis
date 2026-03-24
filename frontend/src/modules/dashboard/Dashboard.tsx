import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { AdAlertBox, AdCard, AdGrid } from "../../common/ad";
import { useAuth } from "../../common/auth/AuthContext";
import WorkflowDashboard from "./WorkflowDashboard";
import OverviewDashboard from "./OverviewDashboard";
import { candidateApi, type CandidateApplicationDocRow, type CandidateApplicationRow } from "../../common/services/candidateApi";
import { jobsApi, type JobListRow } from "../../common/services/jobsApi";
import type { ApiError } from "../../common/services/apiFetch";
import { useNavigate } from "react-router-dom";
import { withPortalBase } from "../../common/paths";

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

function statusColor(status: string | null): "default" | "success" | "warning" | "error" | "info" {
  const s = String(status ?? "").trim().toLowerCase();
  if (!s) return "default";
  if (s.includes("reject")) return "error";
  if (s.includes("shortlist")) return "info";
  if (s.includes("select") || s.includes("deploy") || s.includes("offer")) return "success";
  if (s.includes("review") || s.includes("interview") || s.includes("pending")) return "warning";
  return "default";
}

function CandidateDashboard({ me }: { me: any }) {
  const navigate = useNavigate();
  const [apps, setApps] = useState<CandidateApplicationRow[]>([]);
  const [jobs, setJobs] = useState<JobListRow[]>([]);
  const [pendingDocs, setPendingDocs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullName = useMemo(() => {
    const name = [me?.first_name, me?.last_name].filter(Boolean).join(" ");
    return name || me?.username || "Candidate";
  }, [me?.first_name, me?.last_name, me?.username]);

  const completion = useMemo(() => {
    const fields = [
      Boolean(me?.first_name),
      Boolean(me?.last_name),
      Boolean(me?.phone),
      Boolean(me?.email),
    ];
    const got = fields.filter(Boolean).length;
    return Math.round((got / fields.length) * 100);
  }, [me?.email, me?.first_name, me?.last_name, me?.phone]);

  const appSummary = useMemo(() => {
    const total = apps.length;
    const byStatus = new Map<string, number>();
    for (const a of apps) {
      const key = String(a.status ?? "Applied").trim() || "Applied";
      byStatus.set(key, (byStatus.get(key) ?? 0) + 1);
    }
    const active = apps.filter((a) => {
      const s = String(a.status ?? "").toLowerCase();
      return !s.includes("reject") && !s.includes("closed");
    }).length;
    return { total, active, byStatus };
  }, [apps]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [appsRes, jobsRes] = await Promise.all([
          candidateApi.applications.list(),
          (async () => {
            try {
              return await jobsApi.preview({ status: "Open" }, { auth: false });
            } catch {
              return await jobsApi.preview({ status: "Open" });
            }
          })(),
        ]);
        if (cancelled) return;
        setApps(appsRes ?? []);
        setJobs((jobsRes ?? []).slice(0, 6));

        // Pending docs for the most recent application
        const latest = (appsRes ?? [])[0];
        if (latest?.application_id) {
          try {
            const docs: CandidateApplicationDocRow[] = await candidateApi.applications.documents(latest.application_id);
            const pending = docs.filter((d) => Number(d.job_is_required) === 1 && !d.candidate_document_id).length;
            setPendingDocs(pending);
          } catch {
            setPendingDocs(null);
          }
        } else {
          setPendingDocs(0);
        }
      } catch (e: any) {
        const msg = (e as ApiError)?.message ?? "Failed to load dashboard data.";
        if (!cancelled) setError(String(msg));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar
              sx={{
                width: 52,
                height: 52,
                bgcolor: "rgba(216,27,96,0.14)",
                color: "#d81b60",
                fontWeight: 950,
              }}
            >
              {String(fullName).slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={950} noWrap sx={{ minWidth: 0 }}>
                Welcome back, {fullName}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Complete profile → Apply jobs → Track status → Get deployed
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(withPortalBase("/candidate/jobs"))}
              sx={{ borderRadius: 999 }}
            >
              Apply for Job
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(withPortalBase("/candidate/profile/documents"))}
              sx={{ borderRadius: 999, fontWeight: 900 }}
            >
              Upload Documents
            </Button>
          </Stack>
        </Stack>
      </AdCard>

      {error ? <AdAlertBox severity="error" title="Dashboard error" message={error} /> : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        <AdCard
          title="Profile completion"
          subtitle="Complete to apply faster"
          animate={false}
          sx={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.08)" }}
          contentSx={{ p: 2 }}
        >
          <Typography variant="h4" fontWeight={950}>
            {completion}%
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Add missing details to increase matching.
          </Typography>
        </AdCard>

        <AdCard
          title="Recommended jobs"
          subtitle="Based on open roles"
          animate={false}
          sx={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.08)" }}
          contentSx={{ p: 2 }}
        >
          <Typography variant="h4" fontWeight={950}>
            {jobs.length}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Open listings available now.
          </Typography>
        </AdCard>

        <AdCard
          title="Applications"
          subtitle="Your pipeline"
          animate={false}
          sx={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.08)" }}
          contentSx={{ p: 2 }}
        >
          <Typography variant="h4" fontWeight={950}>
            {appSummary.active}/{appSummary.total}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Active / Total
          </Typography>
        </AdCard>

        <AdCard
          title="Alerts"
          subtitle="Action needed"
          animate={false}
          sx={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.08)" }}
          contentSx={{ p: 2 }}
        >
          <Typography variant="h4" fontWeight={950}>
            {pendingDocs == null ? "—" : pendingDocs}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Pending required documents (latest application)
          </Typography>
        </AdCard>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" }, gap: 2 }}>
        <AdCard
          title="Recent applications"
          subtitle="Latest status updates"
          animate={false}
          sx={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.08)" }}
          contentSx={{ p: 0 }}
        >
          <AdGrid
            rows={apps.slice(0, 10).map((r) => ({ id: r.application_id, ...r }))}
            columns={[
              { field: "job_title", headerName: "Job", flex: 1, minWidth: 180 },
              { field: "job_code", headerName: "Code", width: 130 },
              {
                field: "status",
                headerName: "Status",
                width: 160,
                renderCell: (p) => (
                  <Chip size="small" label={String(p.value ?? "Applied")} color={statusColor(p.value as any)} />
                ),
              },
            ]}
            showToolbar={false}
            showExport={false}
            disableColumnMenu
            sx={{ border: 0, borderRadius: 0 }}
          />
          {loading ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Loading…
              </Typography>
            </Box>
          ) : null}
        </AdCard>

        <AdCard
          title="Quick actions"
          subtitle="Do this next"
          animate={false}
          sx={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.08)" }}
          contentSx={{ p: 2 }}
        >
          <Stack spacing={1}>
            <Button
              variant="contained"
              onClick={() => navigate(withPortalBase("/candidate/jobs"))}
              sx={{ borderRadius: 3 }}
            >
              Browse & Apply
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(withPortalBase("/candidate/applications"))}
              sx={{ borderRadius: 3, fontWeight: 900 }}
            >
              Track Applications
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(withPortalBase("/candidate/training"))}
              sx={{ borderRadius: 3, fontWeight: 900 }}
            >
              Continue Training
            </Button>
          </Stack>
        </AdCard>
      </Box>

      <AdCard
        title="Open jobs"
        subtitle="Top listings"
        animate={false}
        sx={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.08)" }}
        contentSx={{ p: 2 }}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          {jobs.slice(0, 6).map((j) => (
            <Box
              key={j.job_id}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid rgba(2,6,23,0.08)",
                bgcolor: "rgba(255,255,255,0.7)",
              }}
            >
              <Typography fontWeight={950}>{j.job_title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {(j.country_name ?? "Country") + (j.category_name ? ` • ${j.category_name}` : "")}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {j.vacancy != null ? <Chip size="small" label={`${j.vacancy} vacancies`} /> : null}
                {j.salary_min || j.salary_max ? (
                  <Chip size="small" label={`Salary: ${j.salary_min ?? ""}${j.salary_max ? `-${j.salary_max}` : ""}`} />
                ) : null}
              </Stack>
              <Button
                size="small"
                sx={{ mt: 1.5, fontWeight: 900 }}
                onClick={() => navigate(`/jobs/${j.job_id}`)}
              >
                View details
              </Button>
            </Box>
          ))}
          {!jobs.length && !loading ? (
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="body2" color="text.secondary">
                No open jobs found.
              </Typography>
            </Box>
          ) : null}
        </Box>
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

  const role = String(me?.role_code ?? "").toUpperCase();
  if (role === "CANDIDATE") {
    if (!me) return <AdAlertBox severity="error" title="Failed to load" message="Missing profile. Please login again." />;
    return <CandidateDashboard me={me} />;
  }

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
