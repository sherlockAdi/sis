import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import dayjs, { type Dayjs } from "dayjs";
import { AdAlertBox, AdButton, AdCard, AdDateTimePicker, AdDropDown, AdGrid, AdModal, AdNotification, AdTextArea } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { recruitmentApi, type ApplicationDocRow, type ApplicationInterviewRow, type ApplicationRow } from "../../common/services/recruitmentApi";
import { mastersApi, type InterviewMode } from "../../common/services/mastersApi";

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx).toLowerCase();
}

export default function RecruitmentApplicationsPage() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [docsOpen, setDocsOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<ApplicationRow | null>(null);
  const [docs, setDocs] = useState<ApplicationDocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const [interviewsOpen, setInterviewsOpen] = useState(false);
  const [interviews, setInterviews] = useState<ApplicationInterviewRow[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [modes, setModes] = useState<InterviewMode[]>([]);
  const [schedule, setSchedule] = useState<{ mode_id: string; date: Dayjs | null; remarks: string }>({
    mode_id: "",
    date: null,
    remarks: "",
  });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await recruitmentApi.applications.list());
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const loadDocs = async (application_id: number) => {
    setDocsLoading(true);
    try {
      setDocs(await recruitmentApi.applications.documents(application_id));
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load documents", severity: "error" });
    } finally {
      setDocsLoading(false);
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

  const cols = useMemo(
    () => [
      { field: "application_id", headerName: "App ID", width: 100 },
      { field: "candidate_name", headerName: "Candidate", flex: 1, minWidth: 180 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 220 },
      { field: "application_date", headerName: "Date", width: 130 },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "")} />,
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 260,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as ApplicationRow;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<UploadFileIcon fontSize="small" />}
                onClick={() => {
                  setActiveApp(r);
                  setDocsOpen(true);
                  loadDocs(r.application_id);
                }}
              >
                Documents
              </AdButton>
              <AdButton
                variant="text"
                startIcon={<EventAvailableIcon fontSize="small" />}
                onClick={() => {
                  setActiveApp(r);
                  setInterviewsOpen(true);
                  setSchedule({ mode_id: "", date: null, remarks: "" });
                  loadInterviews(r.application_id);
                }}
              >
                Interview
              </AdButton>
            </Stack>
          );
        },
      },
    ],
    [],
  );

  const uploadForDoc = async (doc: ApplicationDocRow, file: File) => {
    if (!activeApp) return;
    try {
      const now = Date.now();
      const ext = fileExt(file.name);
      const objectKey = `candidates/${activeApp.candidate_id}/applications/${activeApp.application_id}/docs/${doc.document_type_id}/${now}${ext}`;

      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      await recruitmentApi.applications.upsertDocument(activeApp.application_id, doc.document_type_id, objectKey);
      setToast({ open: true, message: "Uploaded", severity: "success" });
      loadDocs(activeApp.application_id);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Upload failed", severity: "error" });
    }
  };

  const openDoc = async (doc: ApplicationDocRow) => {
    if (!doc.file_path) return;
    try {
      const presign = await recruitmentApi.files.presignDownload(doc.file_path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open file", severity: "error" });
    }
  };

  const modeOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(modes.map((m) => ({ label: m.mode_name, value: String(m.interview_mode_id) }))),
    [modes],
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

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          Applications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Candidate applications and job-specific documents
        </Typography>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.application_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>

      <AdModal
        open={docsOpen}
        onClose={() => setDocsOpen(false)}
        title="Application Documents"
        subtitle={activeApp ? `${activeApp.candidate_name} • ${activeApp.job_title}` : undefined}
        maxWidth="md"
      >
        {!activeApp ? (
          <AdAlertBox severity="info" title="Select an application" message="Open documents from an application row." />
        ) : (
          <Stack spacing={1.5}>
            {docsLoading ? <Typography>Loading...</Typography> : null}
            {!docsLoading && !docs.length ? (
              <AdAlertBox severity="warning" title="No required docs" message="No job documents found for this job." />
            ) : null}

            {docs.map((d) => (
              <AdCard key={d.document_type_id} animate={false} contentSx={{ p: 1.75 }} sx={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 3 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Stack spacing={0.25}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={900}>{d.document_name}</Typography>
                      {Number(d.job_is_required) ? <Chip size="small" label="Required" color="primary" /> : <Chip size="small" label="Optional" />}
                      {d.file_path ? <Chip size="small" label="Uploaded" color="success" /> : <Chip size="small" label="Pending" />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {d.uploaded_at ? `Uploaded at: ${d.uploaded_at}` : "Not uploaded yet"}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    {d.file_path ? (
                      <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} onClick={() => openDoc(d)}>
                        View
                      </AdButton>
                    ) : null}

                    <AdButton
                      component="label"
                      startIcon={<UploadFileIcon fontSize="small" />}
                    >
                      {d.file_path ? "Update" : "Upload"}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadForDoc(d, f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </AdButton>
                  </Stack>
                </Stack>
              </AdCard>
            ))}
          </Stack>
        )}
      </AdModal>

      <AdModal
        open={interviewsOpen}
        onClose={() => setInterviewsOpen(false)}
        title="Schedule Interview"
        subtitle={activeApp ? `${activeApp.candidate_name} • ${activeApp.job_title}` : undefined}
        maxWidth="md"
      >
        {!activeApp ? (
          <AdAlertBox severity="info" title="Select an application" message="Open interview scheduling from an application row." />
        ) : (
          <Stack spacing={2}>
            <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.85)" }} contentSx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Typography fontWeight={900}>New Interview</Typography>
                <AdDropDown
                  label="Interview Mode"
                  options={modeOptions}
                  value={schedule.mode_id}
                  onChange={(v) => setSchedule((s) => ({ ...s, mode_id: v }))}
                />
                <AdDateTimePicker
                  label="Interview Date & Time"
                  value={schedule.date}
                  onChange={(v) => setSchedule((s) => ({ ...s, date: v }))}
                />
                <AdTextArea
                  label="Remarks (optional)"
                  value={schedule.remarks}
                  onChange={(v: string) => setSchedule((s) => ({ ...s, remarks: v }))}
                  minRows={3}
                />
                <Stack direction="row" justifyContent="flex-end">
                  <AdButton variant="contained" onClick={scheduleInterview}>
                    Schedule
                  </AdButton>
                </Stack>
              </Stack>
            </AdCard>

            <Stack spacing={1}>
              <Typography fontWeight={900}>Scheduled Interviews</Typography>
              {interviewsLoading ? <Typography>Loading...</Typography> : null}
              {!interviewsLoading && !interviews.length ? (
                <AdAlertBox severity="info" title="No interviews yet" message="No interviews scheduled for this application." />
              ) : null}
              {interviews.map((i) => (
                <AdCard key={i.interview_id} animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.85)" }} contentSx={{ p: 1.75 }}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
                    <Stack spacing={0.25}>
                      <Typography fontWeight={900}>{i.mode_name ?? `Mode #${i.interview_mode_id ?? ""}`}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {i.interview_date ?? "—"}
                      </Typography>
                      {i.remarks ? (
                        <Typography variant="caption" color="text.secondary">
                          {i.remarks}
                        </Typography>
                      ) : null}
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {i.result ? <Chip size="small" label={i.result} /> : <Chip size="small" label="Scheduled" color="primary" />}
                    </Stack>
                  </Stack>
                </AdCard>
              ))}
            </Stack>
          </Stack>
        )}
      </AdModal>
    </Stack>
  );
}
