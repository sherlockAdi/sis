import { Box, Container, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useEffect, useState } from "react";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { candidateApi, type CandidateDocumentRow } from "../../common/services/candidateApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

export default function CandidateProfileDocumentsPage() {
  const [rows, setRows] = useState<CandidateDocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        setRows(await candidateApi.documents.list());
      } catch (e: any) {
        setError((e as ApiError)?.message ?? "Failed to load documents");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openDoc = async (file_path: string) => {
    try {
      const presign = await recruitmentApi.files.presignDownload(file_path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open file", severity: "error" });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            My Documents
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            View your latest uploaded documents.
          </Typography>
        </Box>

        {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

        <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Typography fontWeight={900}>Documents</Typography>
            <AdGrid
              rows={rows.map((r) => ({ ...r, id: r.id }))}
              columns={[
                { field: "document_name", headerName: "Document", flex: 1, minWidth: 220 },
                { field: "uploaded_at", headerName: "Uploaded", width: 180 },
                {
                  field: "__actions",
                  headerName: "View",
                  width: 120,
                  sortable: false,
                  filterable: false,
                  renderCell: (p: any) => {
                    const r = p.row as CandidateDocumentRow;
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
