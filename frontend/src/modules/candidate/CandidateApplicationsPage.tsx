import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdModal, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { candidateApi, type CandidateApplicationDocRow, type CandidateApplicationRow } from "../../common/services/candidateApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx).toLowerCase();
}

export default function CandidateApplicationsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CandidateApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [docsOpen, setDocsOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<CandidateApplicationRow | null>(null);
  const [docs, setDocs] = useState<CandidateApplicationDocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await candidateApi.applications.list());
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const loadDocs = async (application_id: number) => {
    setDocsLoading(true);
    try {
      setDocs(await candidateApi.applications.documents(application_id));
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load documents", severity: "error" });
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const cols = useMemo(
    () => [
      { field: "application_id", headerName: "App ID", width: 110 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 240 },
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
        width: 230,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as CandidateApplicationRow;
          return (
            <Stack direction="row" spacing={0.5}>
              <AdButton variant="text" onClick={() => navigate(`/portal/candidate/applications/${r.application_id}`)}>
                View
              </AdButton>
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
            </Stack>
          );
        },
      },
    ],
    [],
  );

  const uploadForDoc = async (doc: CandidateApplicationDocRow, file: File) => {
    if (!activeApp) return;
    try {
      const now = Date.now();
      const ext = fileExt(file.name);
      const objectKey = `applications/${activeApp.application_id}/docs/${doc.document_type_id}/${now}${ext}`;

      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      await candidateApi.applications.upsertDocument(activeApp.application_id, doc.document_type_id, objectKey);
      setToast({ open: true, message: "Uploaded", severity: "success" });
      loadDocs(activeApp.application_id);
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

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          My Applications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your job applications and upload the required documents.
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
        subtitle={activeApp ? `Application #${activeApp.application_id} • ${activeApp.job_title}` : undefined}
        maxWidth="md"
      >
        {!activeApp ? (
          <AdAlertBox severity="info" title="Select an application" message="Open documents from an application row." />
        ) : (
          <Stack spacing={1.5}>
            {docsLoading ? <Typography>Loading...</Typography> : null}
            {!docsLoading && !docs.length ? (
              <AdAlertBox severity="warning" title="No required docs" message="No job documents found for this application." />
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
          </Stack>
        )}
      </AdModal>
    </Stack>
  );
}
