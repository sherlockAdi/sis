import { Box, Container, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useEffect, useState } from "react";
import { AdAlertBox, AdButton, AdCard, AdFilePreviewDialog, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { candidateApi, type CandidateApplicationDocRow } from "../../common/services/candidateApi";

type UnifiedDocumentRow = {
  id: string;
  source: string;
  scope: string;
  job_title: string;
  application_id: number | null;
  document_name: string;
  uploaded_at: string | null;
  file_path: string | null;
  status: string;
};

export default function CandidateProfileDocumentsPage() {
  const [rows, setRows] = useState<UnifiedDocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ open: boolean; title: string; filePath: string | null }>({
    open: false,
    title: "",
    filePath: null,
  });
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [profile, applicationDocs] = await Promise.all([
          candidateApi.profile.me(),
          candidateApi.applications.list().then(async (apps) => {
            const docs: Array<CandidateApplicationDocRow & { application_id: number; job_title: string; status?: string | null }> = [];
            for (const app of apps) {
              try {
                const rows = await candidateApi.applications.documents(app.application_id);
                docs.push(
                  ...rows.map((doc) => ({
                    ...doc,
                    application_id: app.application_id,
                    job_title: app.job_title,
                    status: app.status ?? null,
                  })),
                );
              } catch {
                // ignore document load errors for a single application
              }
            }
            return docs;
          }),
        ]);

        const unified: UnifiedDocumentRow[] = [
          ...[
            { label: "Resume Upload", file_path: profile.resume_file_path, uploaded_at: profile.updated_at },
            { label: "Passport Upload", file_path: profile.passport_file_path, uploaded_at: profile.updated_at },
            { label: "Aadhaar Upload", file_path: profile.aadhar_file_path, uploaded_at: profile.updated_at },
            { label: "PAN Upload", file_path: profile.pan_file_path, uploaded_at: profile.updated_at },
            { label: "Voter ID Upload", file_path: profile.voter_id_file_path, uploaded_at: profile.updated_at },
            { label: "Profile Photo", file_path: profile.profile_photo_file_path, uploaded_at: profile.updated_at },
          ].map((r) => ({
            id: `profile-${r.label}`,
            source: "Profile",
            scope: "Profile",
            job_title: "Profile Upload",
            application_id: null,
            document_name: r.label,
            uploaded_at: r.uploaded_at,
            file_path: r.file_path,
            status: "Uploaded",
          })),
          ...applicationDocs.map((r) => ({
            id: `app-${r.application_id}-${r.document_type_id ?? r.job_specific_document_id ?? r.document_name}`,
            source: "Job",
            scope: r.application_id ? `Application #${r.application_id}` : "Job",
            job_title: r.job_title,
            application_id: r.application_id,
            document_name: r.document_name,
            uploaded_at: r.uploaded_at,
            file_path: r.file_path,
            status: "Uploaded",
          })),
        ].filter((row) => Boolean(String(row.file_path ?? "").trim()));

        setRows(unified);
      } catch (e: any) {
        setError((e as ApiError)?.message ?? "Failed to load documents");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openDoc = (file_path: string) => {
    setPreview({ open: true, title: "Document Preview", filePath: file_path });
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
        <AdFilePreviewDialog
          open={preview.open}
          title={preview.title}
          filePath={preview.filePath}
          onClose={() => setPreview({ open: false, title: "", filePath: null })}
        />
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            My Documents
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            View your uploaded profile and application documents.
          </Typography>
        </Box>

        {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

        <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Typography fontWeight={900}>Documents</Typography>
            <AdGrid
              rows={rows.map((r) => ({ ...r, id: r.id }))}
              columns={[
                { field: "source", headerName: "Source", width: 110 },
                { field: "scope", headerName: "Scope", flex: 1, minWidth: 160 },
                { field: "job_title", headerName: "Job", flex: 1, minWidth: 220 },
                { field: "document_name", headerName: "Document", flex: 1, minWidth: 220 },
                { field: "status", headerName: "Status", width: 120 },
                { field: "uploaded_at", headerName: "Uploaded", width: 180 },
                {
                  field: "__actions",
                  headerName: "View",
                  width: 120,
                  sortable: false,
                  filterable: false,
                  renderCell: (p: any) => {
                    const r = p.row as UnifiedDocumentRow;
                    if (!r.file_path) return "—";
                    return (
                      <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} onClick={() => openDoc(String(r.file_path))}>
                        Open
                      </AdButton>
                    );
                  },
                },
              ] as any}
              loading={loading}
              showExport={false}
              disableColumnMenu
            />
          </Stack>
        </AdCard>
      </Stack>
    </Container>
  );
}
