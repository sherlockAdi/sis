import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Divider, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import dayjs, { type Dayjs } from "dayjs";
import {
  AdAlertBox,
  AdButton,
  AdCard,
  AdDateTimePicker,
  AdDropDown,
  AdGrid,
  AdModal,
  AdNotification,
  AdTextArea,
} from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { recruitmentApi, type ApplicationInterviewRow, type ApplicationRow } from "../../common/services/recruitmentApi";
import { deploymentApi } from "../../common/services/deploymentApi";
import { mastersApi, type InterviewMode } from "../../common/services/mastersApi";

const statusOrder = ["Screening", "Interview", "Shortlist", "Offer", "Rejected", "On Hold", "Pending", "Scheduled", "Completed"];

function formatDate(value: string | null) {
  if (!value) return "-";
  const d = dayjs(value);
  if (!d.isValid()) return String(value);
  return d.format("DD MMM YYYY, HH:mm");
}

export default function RecruitmentScreeningInterviewsPage() {
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");

  const [interviewsOpen, setInterviewsOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<ApplicationRow | null>(null);
  const [interviews, setInterviews] = useState<ApplicationInterviewRow[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [scheduleAppId, setScheduleAppId] = useState<string>("");
  const [modes, setModes] = useState<InterviewMode[]>([]);
  const [schedule, setSchedule] = useState<{ mode_id: string; date: Dayjs | null; remarks: string }>({
    mode_id: "",
    date: null,
    remarks: "",
  });
  const [scheduledRows, setScheduledRows] = useState<Array<{
    interview_id: number;
    application_id: number;
    candidate_name: string;
    job_title: string;
    mode_name: string | null;
    interview_date: string | null;
    result: string | null;
    remarks: string | null;
  }>>([]);

  const loadScheduled = async (apps: ApplicationRow[]) => {
    if (!apps.length) {
      setScheduledRows([]);
      return;
    }
    setScheduledLoading(true);
    try {
      const results = await Promise.all(
        apps.map(async (app) => {
          const list = await recruitmentApi.applications.interviews(app.application_id);
          return list.map((item) => ({
            interview_id: item.interview_id,
            application_id: app.application_id,
            candidate_name: app.candidate_name,
            job_title: app.job_title,
            mode_name: item.mode_name,
            interview_date: item.interview_date,
            result: item.result,
            remarks: item.remarks,
          }));
        }),
      );
      const flat = results.flat();
      flat.sort((a, b) => {
        const da = a.interview_date ? dayjs(a.interview_date).valueOf() : 0;
        const db = b.interview_date ? dayjs(b.interview_date).valueOf() : 0;
        return db - da;
      });
      setScheduledRows(flat);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load scheduled interviews", severity: "error" });
    } finally {
      setScheduledLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const apps = await recruitmentApi.applications.list();
      setRows(apps);
      loadScheduled(apps);
      setLastRefreshedAt(dayjs().format("DD MMM YYYY, HH:mm"));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const loadInterviews = async (application_id: number) => {
    setInterviewsLoading(true);
    try {
      setInterviews(await recruitmentApi.applications.interviews(application_id));
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load interviews", severity: "error" });
    } finally {
      setInterviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!scheduleAppId) {
      setActiveApp(null);
      setInterviews([]);
      return;
    }
    const app = rows.find((r) => String(r.application_id) === scheduleAppId) ?? null;
    setActiveApp(app);
    if (app) loadInterviews(app.application_id);
  }, [scheduleAppId, rows]);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setModes(await mastersApi.interviewModes.list(true));
      } catch {
        setModes([]);
      }
    })();
  }, []);

  const modeOptions = useMemo(
    () => [{ label: "- Select -", value: "" }].concat(modes.map((m) => ({ label: m.mode_name, value: String(m.interview_mode_id) }))),
    [modes],
  );

  const applicationOptions = useMemo(
    () =>
      [{ label: "- Select Application -", value: "" }].concat(
        rows.map((r) => ({
          label: `#${r.application_id} - ${r.candidate_name} (${r.job_title})`,
          value: String(r.application_id),
        })),
      ),
    [rows],
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const screening = rows.filter((r) => String(r.status ?? "").toLowerCase().includes("screen")).length;
    const interviews = rows.filter((r) => String(r.status ?? "").toLowerCase().includes("interview")).length;
    const shortlisted = rows.filter((r) => String(r.status ?? "").toLowerCase().includes("shortlist")).length;
    return { total, screening, interviews, shortlisted };
  }, [rows]);

  const scheduledVisibility = useMemo(
    () => ({
      job_title: !isLgDown,
      mode_name: !isMdDown,
      interview_date: true,
    }),
    [isLgDown, isMdDown],
  );

  const scheduleInterview = async () => {
    if (!activeApp) return;
    const interview_mode_id = schedule.mode_id ? Number(schedule.mode_id) : 0;
    if (!interview_mode_id) {
      setToast({ open: true, message: "Select interview mode", severity: "error" });
      return;
    }
    if (!schedule.date) {
      setToast({ open: true, message: "Select interview date/time", severity: "error" });
      return;
    }
    try {
      const interview_date = dayjs(schedule.date).format("YYYY-MM-DD HH:mm:ss");
      await recruitmentApi.applications.scheduleInterview(activeApp.application_id, {
        interview_mode_id,
        interview_date,
        remarks: schedule.remarks.trim() || null,
      });
      setToast({ open: true, message: "Interview scheduled", severity: "success" });
      loadInterviews(activeApp.application_id);
      setSchedule({ mode_id: "", date: null, remarks: "" });
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to schedule interview", severity: "error" });
    }
  };

  const markReady = async (applicationId?: number) => {
    const appId = applicationId ?? activeApp?.application_id;
    if (!appId) return;
    try {
      await deploymentApi.create({ application_id: appId, status: "Ready" });
      await recruitmentApi.applications.updateStatus(appId, "Ready");
      setToast({ open: true, message: "Marked as Ready for Deployment", severity: "success" });
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to update", severity: "error" });
    }
  };

  const markNotReady = async (applicationId?: number) => {
    const appId = applicationId ?? activeApp?.application_id;
    if (!appId) return;
    try {
      await recruitmentApi.applications.updateStatus(appId, "Not Ready");
      setToast({ open: true, message: "Marked as Not Ready", severity: "success" });
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to update", severity: "error" });
    }
  };

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={900}>
            Screening and Interviews
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View applications, review interview history, and schedule interviews.
          </Typography>
          {lastRefreshedAt ? (
            <Typography variant="caption" color="text.secondary">
              Last refreshed: {lastRefreshedAt}
            </Typography>
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1}>
          <AdButton
            variant="outlined"
            onClick={() => {
              setScheduleAppId("");
              setSchedule({ mode_id: "", date: null, remarks: "" });
              setInterviewsOpen(true);
            }}
          >
            New Schedule
          </AdButton>
          <AdButton variant="outlined" onClick={refresh} disabled={loading}>
            Refresh
          </AdButton>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
        }}
      >
        <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
          <AdCard title="Total Active" subtitle="Open applications" animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
            <Typography variant="h4" fontWeight={800}>
              {stats.total}
            </Typography>
          </AdCard>
        </Box>
        <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
          <AdCard title="In Screening" subtitle="Status contains Screening" animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
            <Typography variant="h4" fontWeight={800}>
              {stats.screening}
            </Typography>
          </AdCard>
        </Box>
        <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
          <AdCard title="In Interview" subtitle="Status contains Interview" animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
            <Typography variant="h4" fontWeight={800}>
              {stats.interviews}
            </Typography>
          </AdCard>
        </Box>
        <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
          <AdCard title="Shortlisted" subtitle="Status contains Shortlist" animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
            <Typography variant="h4" fontWeight={800}>
              {stats.shortlisted}
            </Typography>
          </AdCard>
        </Box>
      </Box>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <AdCard title="Scheduled Interviews" subtitle={`${scheduledRows.length} total`} animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <AdGrid
          rows={scheduledRows.map((r) => ({ id: r.interview_id, ...r }))}
          columns={
            [
              { field: "interview_id", headerName: "Interview ID", width: 90 },
              { field: "application_id", headerName: "App ID", width: 80 },
              { field: "candidate_name", headerName: "Candidate", flex: 1.1, minWidth: 140 },
              { field: "job_title", headerName: "Job", flex: 1.1, minWidth: 150 },
              { field: "mode_name", headerName: "Mode", flex: 0.7, minWidth: 100 },
              {
                field: "interview_date",
                headerName: "Interview Date",
                flex: 0.9,
                minWidth: 130,
                renderCell: (p: any) => <Typography variant="caption">{formatDate(p.value ?? null)}</Typography>,
              },
              {
                field: "result",
                headerName: "Result",
                width: 90,
                renderCell: (p: any) => <Chip size="small" label={p.value ? String(p.value) : "Pending"} />,
              },
              {
                field: "__decision",
                headerName: "Decision",
                width: 220,
                sortable: false,
                filterable: false,
                renderCell: (p: any) => {
                  const r = p.row as any;
                  return (
                    <Stack direction="row" spacing={1}>
                      <AdButton variant="text" onClick={() => markReady(r.application_id)}>
                        Ready
                      </AdButton>
                      <AdButton variant="text" color="error" onClick={() => markNotReady(r.application_id)}>
                        Not Ready
                      </AdButton>
                    </Stack>
                  );
                },
              },
            ] as any
          }
          loading={scheduledLoading}
          showExport={false}
          disableColumnMenu
          columnVisibilityModel={scheduledVisibility as any}
          sx={{ minWidth: 0 }}
        />
      </AdCard>

      <AdModal
        open={interviewsOpen}
        onClose={() => setInterviewsOpen(false)}
        title="Interview Schedule"
        subtitle={activeApp ? `Application ID: ${activeApp.application_id} - ${activeApp.candidate_name}` : "Select an application to continue"}
        maxWidth="md"
      >
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography fontWeight={800}>Schedule new interview</Typography>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
              }}
            >
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <AdDropDown label="Application" options={applicationOptions} value={scheduleAppId} onChange={(v) => setScheduleAppId(String(v))} />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                <AdDropDown label="Mode" options={modeOptions} value={schedule.mode_id} onChange={(v) => setSchedule((s) => ({ ...s, mode_id: String(v) }))} />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                <AdDateTimePicker label="Date and Time" value={schedule.date} onChange={(v) => setSchedule((s) => ({ ...s, date: v }))} />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                <AdButton variant="contained" startIcon={<EventAvailableIcon />} onClick={scheduleInterview} sx={{ mt: { xs: 1, md: 0.5 } }} disabled={!scheduleAppId}>
                  Schedule
                </AdButton>
              </Box>
              <Box sx={{ gridColumn: "span 12" }}>
                <AdTextArea label="Remarks" minRows={3} value={schedule.remarks} onChange={(v) => setSchedule((s) => ({ ...s, remarks: v }))} />
              </Box>
            </Box>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography fontWeight={800}>Interview Decision</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <AdButton variant="contained" onClick={markReady} disabled={!activeApp}>
                Ready for Deployment
              </AdButton>
              <AdButton variant="outlined" color="error" onClick={markNotReady} disabled={!activeApp}>
                Not Ready
              </AdButton>
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography fontWeight={800}>Interview history</Typography>
            {interviewsLoading ? (
              <Typography variant="body2" color="text.secondary">
                Loading interviews...
              </Typography>
            ) : interviews.length ? (
              <Stack spacing={1}>
                {interviews.map((item) => (
                  <Box
                    key={item.interview_id}
                    sx={{
                      border: "1px solid rgba(15,23,42,0.1)",
                      borderRadius: 2,
                      p: 1.5,
                      backgroundColor: "rgba(255,255,255,0.8)",
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip size="small" label={item.mode_name ?? "Mode"} />
                        {item.result ? <Chip size="small" label={item.result} color="success" /> : <Chip size="small" label="Pending" />}
                      </Stack>
                      <Typography variant="body2" fontWeight={700}>
                        {formatDate(item.interview_date)}
                      </Typography>
                      {item.remarks ? (
                        <Typography variant="caption" color="text.secondary">
                          {item.remarks}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No interviews scheduled yet.
              </Typography>
            )}
          </Stack>
        </Stack>
      </AdModal>
    </Stack>
  );
}
