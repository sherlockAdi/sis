import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdDateTimePicker, AdDropDown, AdGrid, AdModal, AdNotification, AdTextArea } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { partnerPortalApi } from "../../common/services/partnersApi";
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
  const [apps, setApps] = useState<{ application_id: number; job_title: string; candidate_name: string }[]>([]);
  const [modes, setModes] = useState<InterviewMode[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
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
        const list = await partnerPortalApi.applications.list();
        setApps(list.map((a) => ({ application_id: a.application_id, job_title: a.job_title, candidate_name: a.candidate_name })));
      } catch {
        setApps([]);
      }
    })();
  }, []);

  const cols = useMemo(
    () => [
      { field: "interview_id", headerName: "Interview ID", width: 120 },
      { field: "candidate_name", headerName: "Candidate", flex: 1, minWidth: 180 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 220 },
      { field: "mode_name", headerName: "Mode", width: 140 },
      { field: "interview_date", headerName: "Date", width: 180 },
      {
        field: "result",
        headerName: "Result",
        width: 140,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "")} />,
      },
      { field: "remarks", headerName: "Remarks", flex: 1, minWidth: 200 },
      {
        field: "__actions",
        headerName: "View",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as PartnerInterviewRow;
          return (
            <AdButton
              variant="text"
              startIcon={<OpenInNewIcon fontSize="small" />}
              onClick={() => navigate(`/portal/partner/applicants/${r.candidate_id}`)}
            >
              Profile
            </AdButton>
          );
        },
      },
    ],
    [navigate],
  );

  const visibility = useMemo(
    () => ({
      remarks: !isMdDown,
      interview_id: !isSmDown,
    }),
    [isMdDown, isSmDown],
  );

  const appOptions = useMemo(
    () =>
      [{ label: "— Select —", value: "" }].concat(
        apps.map((a) => ({
          label: `${a.candidate_name} • ${a.job_title} (App ${a.application_id})`,
          value: String(a.application_id),
        })),
      ),
    [apps],
  );

  const modeOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(modes.map((m) => ({ label: m.mode_name, value: String(m.interview_mode_id) }))),
    [modes],
  );

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
      setSchedule({ application_id: "", mode_id: "", date: null, remarks: "" });
      refresh();
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
          rows={rows.map((r) => ({ id: r.interview_id, ...r }))}
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
    </Stack>
  );
}
