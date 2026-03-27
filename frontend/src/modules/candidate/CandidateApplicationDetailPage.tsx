import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Alert, Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { AdButton, AdCard, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { candidateApi, type CandidateApplicationDocRow, type CandidateApplicationRow } from "../../common/services/candidateApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx).toLowerCase();
}

export default function CandidateApplicationDetailPage() {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const id = Number(applicationId);

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [app, setApp] = useState<CandidateApplicationRow | null>(null);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  const [docs, setDocs] = useState<CandidateApplicationDocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const loadApp = async () => {
    if (!Number.isFinite(id) || id <= 0) return;
    setAppLoading(true);
    setAppError(null);
    try {
      setApp(await candidateApi.applications.get(id));
    } catch (e: any) {
      setApp(null);
      setAppError((e as ApiError)?.message ?? "Failed to load application");
    } finally {
      setAppLoading(false);
    }
  };

  const loadDocs = async () => {
    if (!Number.isFinite(id) || id <= 0) return;
    setDocsLoading(true);
    try {
      setDocs(await candidateApi.applications.documents(id));
    } catch (e: any) {
      setDocs([]);
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load documents", severity: "error" });
    } finally {
      setDocsLoading(false);
    }
  };

  const uploadForDoc = async (doc: CandidateApplicationDocRow, file: File) => {
    if (!Number.isFinite(id) || id <= 0) return;
    try {
      const now = Date.now();
      const ext = fileExt(file.name);
      const objectKey = `applications/${id}/docs/${doc.document_type_id}/${now}${ext}`;

      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      await candidateApi.applications.upsertDocument(id, doc.document_type_id, objectKey);
      setToast({ open: true, message: "Uploaded", severity: "success" });
      loadDocs();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Upload failed", severity: "error" });
    }
  };

  const openDoc = async (doc: CandidateApplicationDocRow) => {
    if (!doc.file_path) return;
    try {
      const presign = await recruitmentApi.files.presignDownload(doc.file_path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open file", severity: "error" });
    }
  };

  useEffect(() => {
    loadApp();
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
        <AdButton variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate("/portal/candidate/applications")}>
          Back to Applications
        </AdButton>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" label={`App ID: ${Number.isFinite(id) ? id : "—"}`} />
          {app?.status ? <Chip size="small" label={`Status: ${app.status}`} /> : null}
        </Stack>
      </Stack>

      {!Number.isFinite(id) || id <= 0 ? <Alert severity="warning">Invalid application id.</Alert> : null}
      {appLoading ? <Alert severity="info">Loading application...</Alert> : null}
      {appError ? <Alert severity="warning">{appError}</Alert> : null}

      {app ? (
        <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={950}>
              {app.job_title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {app.application_date ? `Applied on: ${app.application_date}` : "Applied date: —"}
              {app.job_code ? ` • Job Code: ${app.job_code}` : ""}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {app.candidate_name ? `Candidate: ${app.candidate_name}` : null}
            </Typography>
          </Stack>
        </AdCard>
      ) : null}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
            <Box>
              <Typography fontWeight={950}>Documents</Typography>
              <Typography variant="body2" color="text.secondary">
                View or upload documents for this application.
              </Typography>
            </Box>

            <AdButton variant="outlined" onClick={loadDocs} disabled={docsLoading}>
              Refresh
            </AdButton>
          </Stack>

          {docsLoading ? <Typography>Loading documents...</Typography> : null}
          {!docsLoading && !docs.length ? <Alert severity="warning">No job documents found for this application.</Alert> : null}

          {docs.map((d) => (
            <AdCard
              key={d.document_type_id}
              animate={false}
              contentSx={{ p: 1.75 }}
              sx={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 3 }}
            >
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
                {(() => {
                  return (
                <Stack spacing={0.25}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography fontWeight={900}>{d.document_name}</Typography>
                    {Number(d.job_is_required) ? <Chip size="small" label="Required" color="primary" /> : <Chip size="small" label="Optional" />}
                    {d.file_path ? <Chip size="small" label="Uploaded" color="success" /> : <Chip size="small" label="Pending" />}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {d.uploaded_at ? `Uploaded at: ${d.uploaded_at}` : "Not uploaded yet"}
                  </Typography>
                </Stack>
                  );
                })()}

                <Stack direction="row" spacing={1}>
                  {d.file_path ? (
                    <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} onClick={() => openDoc(d)}>
                      View
                    </AdButton>
                  ) : null}

                  <AdButton component="label" startIcon={<UploadFileIcon fontSize="small" />}>
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

          <Divider />
          <AdButton variant="text" onClick={() => navigate(`/portal/candidate/jobs/${app?.job_id}/apply`)}>
            View job & application flow
          </AdButton>
        </Stack>
      </AdCard>
    </Stack>
  );
}
