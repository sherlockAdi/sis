import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate, useParams } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { mastersApi, type DocumentType } from "../../common/services/mastersApi";
import { partnerPortalApi, type PartnerCandidateDocumentRow, type PartnerCandidateRow } from "../../common/services/partnersApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

export default function PartnerApplicantProfilePage() {
  const navigate = useNavigate();
  const params = useParams();
  const candidateId = params.candidateId ? Number(params.candidateId) : null;

  const [candidate, setCandidate] = useState<PartnerCandidateRow | null>(null);
  const [docs, setDocs] = useState<PartnerCandidateDocumentRow[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    (async () => {
      try {
        setDocTypes(await mastersApi.documentTypes.list(true));
      } catch {
        setDocTypes([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!candidateId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await partnerPortalApi.candidates.get(candidateId);
        setCandidate(res.candidate);
        setDocs(res.documents ?? []);
      } catch (e: any) {
        setError((e as ApiError)?.message ?? "Failed to load candidate");
      } finally {
        setLoading(false);
      }
    })();
  }, [candidateId]);

  const docName = (document_type_id: number) => docTypes.find((d) => d.document_type_id === document_type_id)?.document_name ?? `#${document_type_id}`;

  const openDoc = async (file_path: string) => {
    try {
      const presign = await recruitmentApi.files.presignDownload(file_path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open file", severity: "error" });
    }
  };

  const docRows = useMemo(
    () =>
      docs.map((d) => ({
        id: d.id,
        document_type_id: d.document_type_id,
        document_name: docName(d.document_type_id),
        file_path: d.file_path,
        uploaded_at: d.uploaded_at,
      })),
    [docs, docTypes],
  );

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Candidate Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View candidate details and documents
          </Typography>
        </Stack>
        <AdButton variant="text" onClick={() => navigate(-1)}>
          Back
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        ) : candidate ? (
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={900}>
                  {`${candidate.first_name ?? ""} ${candidate.last_name ?? ""}`.trim() || "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {candidate.candidate_code ?? `ID ${candidate.candidate_id}`}
                </Typography>
              </Box>
              <Chip size="small" label={candidate.status ?? "—"} />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Typography variant="body2">Email: {candidate.email ?? "—"}</Typography>
              <Typography variant="body2">Phone: {candidate.phone ?? "—"}</Typography>
              <Typography variant="body2">Passport: {candidate.passport_number ?? "—"}</Typography>
            </Stack>
          </Stack>
        ) : null}
      </AdCard>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography fontWeight={900}>Documents</Typography>
          <AdGrid
            rows={docRows.map((r) => ({ ...r, id: r.id }))}
            columns={[
              { field: "document_name", headerName: "Document", flex: 1, minWidth: 200 },
              { field: "uploaded_at", headerName: "Uploaded", width: 170 },
              {
                field: "__actions",
                headerName: "View",
                width: 120,
                sortable: false,
                filterable: false,
                renderCell: (p: any) => {
                  const r = p.row as any;
                  if (!r.file_path) return "—";
                  return (
                    <AdButton
                      variant="text"
                      startIcon={<OpenInNewIcon fontSize="small" />}
                      onClick={() => openDoc(String(r.file_path))}
                    >
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
  );
}
