import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HistoryIcon from "@mui/icons-material/History";
import CancelIcon from "@mui/icons-material/Cancel";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import IconButton from "@mui/material/IconButton";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdDateTimePicker, AdDropDown, AdGrid, AdModal, AdNotification, AdTextArea } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { deploymentApi } from "../../common/services/deploymentApi";
import { partnerPortalApi, type PartnerApplicationRow } from "../../common/services/partnersApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";
import { mastersApi, type InterviewMode } from "../../common/services/mastersApi";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

type PartnerInterviewRow = {
  interview_id: number;
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  job_id: number;
  job_title: string;
  mode_name: string | null;
  interview_date: string | null;
  result: string | null;
  remarks: string | null;
};

type PartnerApplicationLite = Pick<
  PartnerApplicationRow,
  "application_id" | "candidate_id" | "job_id" | "candidate_name" | "job_title" | "status" | "application_date" | "trade_test_required"
>;

type PartnerInterviewDisplayRow = {
  id: number;
  interview_id: number | null;
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  job_id: number;
  job_title: string;
  mode_name: string | null;
  interview_date: string | null;
  result: string | null;
  remarks: string | null;
  stage: string;
};

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function getInterviewStage(row: PartnerInterviewRow, appStatus: string | null | undefined): "shortlisted" | "interviewed" | "postponed" | null {
  const status = normalizeStatus(appStatus);
  const result = normalizeStatus(row.result);
  const remarks = normalizeStatus(row.remarks);
  const mode = normalizeStatus(row.mode_name);

  if (status.includes("deploy") || status === "ready") return null;
  if (status.includes("shortlist")) return "shortlisted";
  if (status.includes("postpon")) return "postponed";
  if (status.includes("interview")) return "interviewed";
  if (result.includes("postpon") || remarks.includes("postpon") || mode.includes("postpon")) return "postponed";
  if (result.includes("interview") || remarks.includes("interview") || mode.includes("interview")) return "interviewed";
  return null;
}

function stageLabel(stage: "shortlisted" | "interviewed" | "postponed"): string {
  if (stage === "shortlisted") return "Shortlisted";
  if (stage === "interviewed") return "Interviewed";
  return "Postponed";
}

export default function PartnerInterviewsPage() {
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const [rows, setRows] = useState<PartnerInterviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [apps, setApps] = useState<PartnerApplicationLite[]>([]);
  const [modes, setModes] = useState<InterviewMode[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [schedule, setSchedule] = useState<{ application_id: string; mode_id: string; date: Dayjs | null; remarks: string }>({
    application_id: "",
    mode_id: "",
    date: null,
    remarks: "",
  });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await partnerPortalApi.interviews.list());
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }

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

  useEffect(() => {
    (async () => {
      try {
        setApps(await partnerPortalApi.applications.list());
      } catch {
        setApps([]);
      }
    })();
  }, []);

  const refreshApplications = async () => {
    try {
      setApps(await partnerPortalApi.applications.list());
    } catch {
      setApps([]);
    }
  };

  const openScheduleForApplication = (application_id: number) => {
    setSchedule((current) => ({ ...current, application_id: String(application_id) }));
    setScheduleOpen(true);
  };

  const openInterviewRecord = (application_id: number) => {
    setSchedule((current) => ({ ...current, application_id: String(application_id) }));
    setRecordOpen(true);
  };

  const markReadyForDeployment = async (application_id: number) => {
    try {
      const application = apps.find((row) => Number(row.application_id) === Number(application_id));
      const needsTradeTest = Boolean(application?.trade_test_required);
      if (needsTradeTest) {
        await recruitmentApi.applications.updateStatus(application_id, "Trade Test");
        setToast({ open: true, message: "Sent for trade test review", severity: "success" });
        await Promise.all([refresh(), refreshApplications()]);
        return;
      }

      const existing = await deploymentApi.getByApplication(application_id);
      if (existing?.deployment_id) {
        await deploymentApi.setStatus(existing.deployment_id, { status: "Ready" });
      } else {
        await deploymentApi.create({ application_id, status: "Ready" });
      }
      await recruitmentApi.applications.updateStatus(application_id, "Ready");
      setToast({ open: true, message: "Marked ready for deployment", severity: "success" });
      await Promise.all([refresh(), refreshApplications()]);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to mark ready for deployment", severity: "error" });
    }
  };

  const markRejected = async (application_id: number) => {
    try {
      await recruitmentApi.applications.updateStatus(application_id, "Rejected");
      setToast({ open: true, message: "Marked rejected", severity: "success" });
      await Promise.all([refresh(), refreshApplications()]);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to reject application", severity: "error" });
    }
  };

  const cols = useMemo(
    () => [
      { field: "application_id", headerName: "App ID", width: 100 },
      { field: "candidate_name", headerName: "Candidate", flex: 1, minWidth: 180 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 220 },
      { field: "mode_name", headerName: "Mode", width: 140 },
      { field: "interview_date", headerName: "Date", width: 180 },
      {
        field: "stage",
        headerName: "Status",
        width: 140,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "")} />,
      },
      { field: "remarks", headerName: "Remarks", flex: 1, minWidth: 200 },
      {
        field: "__actions",
        headerName: "Actions",
        width: 340,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as PartnerInterviewDisplayRow;
          return (
            <Stack direction="row" spacing={0.75}>
              <AdButton
                variant="text"
                startIcon={<OpenInNewIcon fontSize="small" />}
                onClick={() => navigate(`/portal/partner/applicants/${r.candidate_id}`)}
              >
                Profile
              </AdButton>
              <IconButton aria-label="Schedule interview" onClick={() => openScheduleForApplication(r.application_id)} size="small">
                <EventAvailableIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="View interview record" onClick={() => openInterviewRecord(r.application_id)} size="small">
                <HistoryIcon fontSize="small" />
              </IconButton>
              {r.interview_id ? (
                <IconButton aria-label="Mark ready for deployment" onClick={() => markReadyForDeployment(r.application_id)} size="small">
                  <RocketLaunchIcon fontSize="small" />
                </IconButton>
              ) : null}
              <IconButton aria-label="Reject application" onClick={() => markRejected(r.application_id)} size="small">
                <CancelIcon fontSize="small" />
              </IconButton>
            </Stack>
          );
        },
      },
    ],
    [navigate, openScheduleForApplication],
  );

  const visibility = useMemo(
    () => ({
      remarks: !isMdDown,
      interview_id: !isSmDown,
    }),
    [isMdDown, isSmDown],
  );

  const filteredRows = useMemo(() => {
    const latestInterviewByApp = new Map<number, PartnerInterviewRow>();
    for (const row of rows) {
      const current = latestInterviewByApp.get(row.application_id);
      if (!current) {
        latestInterviewByApp.set(row.application_id, row);
        continue;
      }

      const currentDate = current.interview_date ? dayjs(current.interview_date).valueOf() : 0;
      const nextDate = row.interview_date ? dayjs(row.interview_date).valueOf() : 0;
      if (nextDate > currentDate || (nextDate === currentDate && row.interview_id > current.interview_id)) {
        latestInterviewByApp.set(row.application_id, row);
      }
    }

    const latestByPair = new Map<string, PartnerInterviewDisplayRow>();

    for (const app of apps) {
      const status = normalizeStatus(app.status);
      if (status.includes("deploy") || status === "ready") continue;

      const interview = latestInterviewByApp.get(app.application_id);
      const stage = status.includes("shortlist")
        ? "shortlisted"
        : status.includes("postpon")
          ? "postponed"
          : status.includes("interview")
            ? "interviewed"
            : interview
              ? getInterviewStage(interview, app.status)
              : null;

      if (!stage) continue;

      const row: PartnerInterviewDisplayRow = {
        id: app.application_id,
        interview_id: interview?.interview_id ?? null,
        application_id: app.application_id,
        candidate_id: app.candidate_id,
        candidate_name: app.candidate_name,
        job_id: app.job_id,
        job_title: app.job_title,
        mode_name: interview?.mode_name ?? null,
        interview_date: interview?.interview_date ?? app.application_date ?? null,
        result: interview?.result ?? null,
        remarks: interview?.remarks ?? null,
        stage: stageLabel(stage),
      };

      const key = `${app.candidate_id}:${app.job_id}`;
      const current = latestByPair.get(key);
      if (!current) {
        latestByPair.set(key, row);
        continue;
      }

      const currentDate = current.interview_date ? dayjs(current.interview_date).valueOf() : 0;
      const nextDate = row.interview_date ? dayjs(row.interview_date).valueOf() : 0;
      if (nextDate > currentDate || (nextDate === currentDate && row.application_id > current.application_id)) {
        latestByPair.set(key, row);
      }
    }

    return Array.from(latestByPair.values()).sort((a, b) => {
      const ad = a.interview_date ? dayjs(a.interview_date).valueOf() : 0;
      const bd = b.interview_date ? dayjs(b.interview_date).valueOf() : 0;
      return bd - ad;
    });
  }, [apps, rows]);

  const appOptions = useMemo(() => {
    const latestByPair = new Map<string, PartnerApplicationLite>();
    for (const app of apps) {
      const status = normalizeStatus(app.status);
      if (status.includes("deploy") || status === "ready") continue;
      const key = `${app.candidate_id}:${app.job_id}`;
      const current = latestByPair.get(key);
      if (!current) {
        latestByPair.set(key, app);
        continue;
      }
      const currentDate = current.application_date ? dayjs(current.application_date).valueOf() : 0;
      const nextDate = app.application_date ? dayjs(app.application_date).valueOf() : 0;
      if (nextDate > currentDate || (nextDate === currentDate && app.application_id > current.application_id)) {
        latestByPair.set(key, app);
      }
    }

    return [{ label: "— Select —", value: "" }].concat(
      Array.from(latestByPair.values()).map((a) => ({
        label: `${a.candidate_name} • ${a.job_title} (App ${a.application_id})`,
        value: String(a.application_id),
      })),
    );
  }, [apps]);

  const modeOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(modes.map((m) => ({ label: m.mode_name, value: String(m.interview_mode_id) }))),
    [modes],
  );

  const selectedApplication = useMemo(
    () => apps.find((app) => String(app.application_id) === schedule.application_id) ?? null,
    [apps, schedule.application_id],
  );

  const selectedApplicationInterviews = useMemo(() => {
    const appId = Number(schedule.application_id);
    if (!appId) return [];
    return rows
      .filter((row) => Number(row.application_id) === appId)
      .sort((a, b) => {
        const ad = a.interview_date ? dayjs(a.interview_date).valueOf() : 0;
        const bd = b.interview_date ? dayjs(b.interview_date).valueOf() : 0;
        return bd - ad;
      });
  }, [rows, schedule.application_id]);

  const scheduleInterview = async () => {
    try {
      const application_id = schedule.application_id ? Number(schedule.application_id) : 0;
      const interview_mode_id = schedule.mode_id ? Number(schedule.mode_id) : 0;
      if (!application_id) throw new Error("Select application");
      if (!interview_mode_id) throw new Error("Select interview mode");
      if (!schedule.date) throw new Error("Select interview date");

      setScheduling(true);
      const interview_date = dayjs(schedule.date).format("YYYY-MM-DD HH:mm:ss");
      await partnerPortalApi.interviews.create({
        application_id,
        interview_mode_id,
        interview_date,
        remarks: schedule.remarks.trim() || null,
      });
      setToast({ open: true, message: "Interview scheduled", severity: "success" });
      setScheduleOpen(false);
      setRecordOpen(false);
      setSchedule({ application_id: "", mode_id: "", date: null, remarks: "" });
      await Promise.all([refresh(), refreshApplications()]);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Failed to schedule interview", severity: "error" });
    } finally {
      setScheduling(false);
    }
  };

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1.5}
        sx={{ width: "100%", maxWidth: "100%", pr: 1, flexWrap: "wrap" }}
      >
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Interview Process
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Interviews scheduled for your job applicants
          </Typography>
        </Stack>
        <AdButton
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => setScheduleOpen(true)}
          sx={{ alignSelf: { xs: "stretch", md: "center" }, maxWidth: { xs: "100%", md: "fit-content" } }}
        >
          Schedule Interview
        </AdButton>
      </Stack>
      {error && <AdAlertBox severity="error" title="Error" message={error} />}
      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <AdGrid
          rows={filteredRows}
          columns={cols as any}
          loading={loading}
          showExport={false}
          disableColumnMenu
          columnVisibilityModel={visibility as any}
          sx={{ minWidth: 0 }}
        />
      </AdCard>

      <AdModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule Interview"
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            {selectedApplicationInterviews.length ? (
              <AdButton variant="contained" color="success" onClick={() => markReadyForDeployment(Number(schedule.application_id))} disabled={scheduling}>
                Ready to Deploy
              </AdButton>
            ) : null}
            <AdButton variant="outlined" color="error" onClick={() => markRejected(Number(schedule.application_id))} disabled={scheduling || !schedule.application_id}>
              Reject
            </AdButton>
            <AdButton variant="text" onClick={() => setScheduleOpen(false)}>
              Cancel
            </AdButton>
            <AdButton onClick={scheduleInterview} disabled={scheduling}>
              {scheduling ? "Saving..." : "Schedule"}
            </AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <AdDropDown
            label="Application"
            value={schedule.application_id}
            onChange={(v) => setSchedule((s) => ({ ...s, application_id: String(v) }))}
            options={appOptions}
          />
          <Stack spacing={1}>
            <Typography fontWeight={900}>Previous Interviews</Typography>
            {selectedApplication ? (
              <Typography variant="body2" color="text.secondary">
                {selectedApplication.candidate_name} • {selectedApplication.job_title}
              </Typography>
            ) : null}
            {!selectedApplicationInterviews.length ? (
              <AdAlertBox severity="info" title="No interviews yet" message="This application has no previous interview records." />
            ) : (
              <Stack spacing={1}>
                {selectedApplicationInterviews.map((item) => (
                  <AdCard key={item.interview_id} animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.85)" }} contentSx={{ p: 1.5 }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                      <Stack spacing={0.25}>
                        <Typography fontWeight={900}>{item.mode_name ?? "Interview"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.interview_date ?? "—"}
                        </Typography>
                        {item.remarks ? (
                          <Typography variant="caption" color="text.secondary">
                            {item.remarks}
                          </Typography>
                        ) : null}
                      </Stack>
                      <Chip size="small" label={item.result || "Scheduled"} color={item.result ? "default" : "primary"} />
                    </Stack>
                  </AdCard>
                ))}
              </Stack>
            )}
          </Stack>
          <AdDropDown
            label="Interview Mode"
            value={schedule.mode_id}
            onChange={(v) => setSchedule((s) => ({ ...s, mode_id: String(v) }))}
            options={modeOptions}
          />
          <AdDateTimePicker label="Interview Date/Time" value={schedule.date} onChange={(v) => setSchedule((s) => ({ ...s, date: v }))} />
          <AdTextArea label="Remarks" value={schedule.remarks} onChange={(v) => setSchedule((s) => ({ ...s, remarks: v }))} />
        </Stack>
      </AdModal>

      <AdModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        title="Interview Record"
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setRecordOpen(false)}>
              Close
            </AdButton>
          </Stack>
        }
      >
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            {selectedApplication ? `${selectedApplication.candidate_name} • ${selectedApplication.job_title}` : "Select an application to view its record."}
          </Typography>
          {!selectedApplicationInterviews.length ? (
            <AdAlertBox severity="info" title="No interviews yet" message="No previous interview records found for this application." />
          ) : (
            <Stack spacing={1}>
              {selectedApplicationInterviews.map((item) => (
                <AdCard key={item.interview_id} animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.85)" }} contentSx={{ p: 1.5 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                    <Stack spacing={0.25}>
                      <Typography fontWeight={900}>{item.mode_name ?? "Interview"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.interview_date ?? "—"}
                      </Typography>
                      {item.remarks ? (
                        <Typography variant="caption" color="text.secondary">
                          {item.remarks}
                        </Typography>
                      ) : null}
                    </Stack>
                    <Chip size="small" label={item.result || "Scheduled"} color={item.result ? "default" : "primary"} />
                  </Stack>
                </AdCard>
              ))}
            </Stack>
          )}
        </Stack>
      </AdModal>
    </Stack>
  );
}
