import { useEffect, useMemo, useState } from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdModal, AdNotification, AdTextArea } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { recruitmentApi } from "../../common/services/recruitmentApi";
import { tradeTestApi, type TradeTestRecordRow } from "../../common/services/tradeTestApi";

type TradeTestRecordsPageProps = {
  scope: "admin" | "partner";
  editable: boolean;
  title: string;
  subtitle: string;
};

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function makeObjectKey(applicationId: number, kind: "video" | "certificate", file: File): string {
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  return `trade-tests/${applicationId}/${kind}_${Date.now()}${ext}`;
}

export default function TradeTestRecordsPage({ scope, editable, title, subtitle }: TradeTestRecordsPageProps) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<TradeTestRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<{ video: boolean; certificate: boolean }>({ video: false, certificate: false });
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [activeRow, setActiveRow] = useState<TradeTestRecordRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<TradeTestRecordRow>>({});

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = scope === "admin" ? await tradeTestApi.admin.list() : await tradeTestApi.partner.list();
      setRows(data);
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load trade test records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [scope]);

  const openRow = (row: TradeTestRecordRow) => {
    setActiveRow(row);
    setForm(row);
    setModalOpen(true);
  };

  const openFile = async (path?: string | null) => {
    if (!path) return;
    try {
      const presign = await recruitmentApi.files.presignDownload(path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open file", severity: "error" });
    }
  };

  const uploadFile = async (kind: "video" | "certificate", file: File) => {
    if (!activeRow || !editable) return;
    try {
      setUploading((u) => ({ ...u, [kind]: true }));
      const objectKey = makeObjectKey(activeRow.application_id, kind, file);
      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      setForm((current) => ({
        ...current,
        ...(kind === "video"
          ? {
              trade_video_file_path: objectKey,
              trade_video_file_name: file.name,
              trade_video_file_size: file.size,
            }
          : {
              certificate_file_path: objectKey,
              certificate_file_name: file.name,
              certificate_file_size: file.size,
            }),
      }));
      setToast({
        open: true,
        message: `${kind === "video" ? "Trade video" : "Certificate"} uploaded`,
        severity: "success",
      });
    } catch (e: any) {
      setToast({
        open: true,
        message: (e as ApiError)?.message ?? e?.message ?? "Upload failed",
        severity: "error",
      });
    } finally {
      setUploading((u) => ({ ...u, [kind]: false }));
    }
  };

  const save = async () => {
    if (!activeRow || !editable) return;
    try {
      setSaving(true);
      const payload = {
        review_status: String(form.review_status ?? "Pending"),
        trade_video_file_path: form.trade_video_file_path ?? null,
        trade_video_file_name: form.trade_video_file_name ?? null,
        trade_video_file_size: form.trade_video_file_size ?? null,
        certificate_file_path: form.certificate_file_path ?? null,
        certificate_file_name: form.certificate_file_name ?? null,
        certificate_file_size: form.certificate_file_size ?? null,
        remarks: form.remarks ?? null,
      };
      const result = await tradeTestApi.admin.upsert(activeRow.application_id, payload);
      setToast({
        open: true,
        message:
          normalizeStatus(payload.review_status).includes("pass")
            ? result.deployment_created
              ? "Trade test approved and deployment created"
              : "Trade test approved and deployment updated"
            : "Trade test saved",
        severity: "success",
      });
      setModalOpen(false);
      await loadRows();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save trade test", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const cols = useMemo(
    () => [
      { field: "application_id", headerName: "App ID", width: 90 },
      { field: "candidate_name", headerName: "Candidate", flex: 1, minWidth: 180 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 180 },
      { field: "partner_name", headerName: "Employer", flex: 1, minWidth: 180 },
      {
        field: "application_status",
        headerName: "App Status",
        width: 130,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "")} />,
      },
      {
        field: "review_status",
        headerName: "Trade Test",
        width: 120,
        renderCell: (p: any) => {
          const label = String(p.value ?? "Pending");
          const tone = normalizeStatus(label).includes("pass")
            ? "success"
            : normalizeStatus(label).includes("fail")
              ? "error"
              : "default";
          return <Chip size="small" label={label} color={tone as any} />;
        },
      },
      {
        field: "trade_video_file_path",
        headerName: "Video",
        width: 90,
        renderCell: (p: any) => (p.value ? <Chip size="small" label="Available" color="success" /> : <Chip size="small" label="Missing" />),
      },
      {
        field: "certificate_file_path",
        headerName: "Certificate",
        width: 110,
        renderCell: (p: any) => (p.value ? <Chip size="small" label="Available" color="success" /> : <Chip size="small" label="Missing" />),
      },
      { field: "remarks", headerName: "Remarks", flex: 1, minWidth: 160 },
      {
        field: "__actions",
        headerName: "Actions",
        width: scope === "admin" ? 120 : 100,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const row = p.row as TradeTestRecordRow;
          return (
            <Stack direction="row" spacing={0.5} alignItems="center">
              {scope === "partner" ? (
                <IconButton aria-label="Open profile" size="small" onClick={() => navigate(`/portal/partner/applicants/${row.candidate_id}`)}>
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              ) : null}
              <IconButton aria-label="Review trade test" size="small" onClick={() => openRow(row)}>
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Stack>
          );
        },
      },
    ],
    [navigate, scope],
  );

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Stack>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        {editable ? (
          <AdButton variant="outlined" onClick={loadRows} disabled={loading}>
            Refresh
          </AdButton>
        ) : null}
      </Box>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid
          rows={rows.map((r) => ({ id: r.application_id, ...r }))}
          columns={cols as any}
          loading={loading}
          showExport={false}
          disableColumnMenu
          sx={{ minWidth: 0 }}
        />
      </AdCard>

      <AdModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Trade Test Review"
        subtitle={activeRow ? `${activeRow.candidate_name} • ${activeRow.job_title}` : ""}
        maxWidth="lg"
      >
        {activeRow ? (
          <Stack spacing={2}>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
              <Box sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(226,232,240,0.85)" }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Candidate
                </Typography>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {activeRow.candidate_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeRow.phone ?? "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeRow.email ?? "—"}
                  </Typography>
                </Stack>
              </Box>

              <Box sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(226,232,240,0.85)" }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Job / Employer
                </Typography>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {activeRow.job_title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeRow.partner_name ?? "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trade test required: {Boolean(activeRow.trade_test_required) ? "Yes" : "No"}
                  </Typography>
                </Stack>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
              <Box sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(226,232,240,0.85)" }}>
                <Stack spacing={1}>
                  <Typography fontWeight={900}>Trade Video</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                    <AdButton
                      component="label"
                      variant="contained"
                      startIcon={<UploadFileIcon fontSize="small" />}
                      disabled={!editable || uploading.video}
                    >
                      Upload Video
                      <input hidden type="file" accept="video/*,.mp4,.mov,.webm,.mkv" onChange={(e) => e.target.files?.[0] && uploadFile("video", e.target.files[0])} />
                    </AdButton>
                    <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} disabled={!form.trade_video_file_path} onClick={() => openFile(form.trade_video_file_path)}>
                      View Video
                    </AdButton>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {form.trade_video_file_name ?? "No video uploaded"}
                  </Typography>
                </Stack>
              </Box>

              <Box sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(226,232,240,0.85)" }}>
                <Stack spacing={1}>
                  <Typography fontWeight={900}>Certificate</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                    <AdButton
                      component="label"
                      variant="contained"
                      startIcon={<UploadFileIcon fontSize="small" />}
                      disabled={!editable || uploading.certificate}
                    >
                      Upload Certificate
                      <input hidden type="file" accept="image/*,.pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && uploadFile("certificate", e.target.files[0])} />
                    </AdButton>
                    <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} disabled={!form.certificate_file_path} onClick={() => openFile(form.certificate_file_path)}>
                      View Certificate
                    </AdButton>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {form.certificate_file_name ?? "No certificate uploaded"}
                  </Typography>
                </Stack>
              </Box>
            </Box>

            <AdDropDown
              label="Review Status"
              options={[
                { label: "Pending", value: "Pending" },
                { label: "Passed", value: "Passed" },
                { label: "Failed", value: "Failed" },
              ]}
              value={String(form.review_status ?? "Pending")}
              onChange={(value) => setForm((current) => ({ ...current, review_status: value }))}
              disabled={!editable}
            />

            <AdTextArea
              label="Remarks"
              minRows={3}
              value={String(form.remarks ?? "")}
              onChange={(value) => setForm((current) => ({ ...current, remarks: value }))}
              disabled={!editable}
            />

            <Stack direction="row" justifyContent="space-between" spacing={1} flexWrap="wrap">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {normalizeStatus(form.review_status ?? "Pending").includes("pass")
                    ? "Saving as Passed will move the application to Ready and create deployment."
                    : "Saving keeps the trade test record in review."}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <AdButton variant="text" onClick={() => setModalOpen(false)}>
                  Close
                </AdButton>
                {editable ? (
                  <AdButton variant="contained" onClick={save} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </AdButton>
                ) : null}
              </Stack>
            </Stack>
          </Stack>
        ) : null}
      </AdModal>
    </Stack>
  );
}
