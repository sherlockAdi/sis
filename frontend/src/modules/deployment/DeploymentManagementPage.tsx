import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { useLocation } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdModal, AdNotification, AdTextArea } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { deploymentApi, type DeploymentRow, type VisaDetailRow } from "../../common/services/deploymentApi";
import { mastersApi, type VisaType } from "../../common/services/mastersApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

const stages = ["Ready", "Visa Processing", "Biometrics", "Visa Approved", "Travel Booked", "Deployed"] as const;

function stageFromPath(pathname: string): string | null {
  if (pathname.includes("/deployment/ready")) return "Ready";
  if (pathname.includes("/deployment/visa-processing")) return "Visa Processing";
  if (pathname.includes("/deployment/biometrics")) return "Biometrics";
  if (pathname.includes("/deployment/visa-approved")) return "Visa Approved";
  if (pathname.includes("/deployment/travel-booked")) return "Travel Booked";
  if (pathname.includes("/deployment/deployed")) return "Deployed";
  return null;
}

export default function DeploymentManagementPage() {
  const location = useLocation();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const [rows, setRows] = useState<DeploymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [visaOpen, setVisaOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<DeploymentRow | null>(null);
  const [updateForm, setUpdateForm] = useState<{ status: string; visa_type_id: string; remarks: string }>({
    status: "",
    visa_type_id: "",
    remarks: "",
  });
  const [visaForm, setVisaForm] = useState<Partial<VisaDetailRow>>({});
  const [visaLoading, setVisaLoading] = useState(false);
  const [uploading, setUploading] = useState<{ passport: boolean; visa: boolean }>({ passport: false, visa: false });

  const activeStage = stageFromPath(location.pathname);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await deploymentApi.list(activeStage ?? undefined));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load deployments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [location.pathname]);

  useEffect(() => {
    (async () => {
      try {
        setVisaTypes(await mastersApi.visaTypes.list(true));
      } catch {
        setVisaTypes([]);
      }
    })();
  }, []);

  const visaOptions = useMemo(
    () => [{ label: "- Select -", value: "" }].concat(visaTypes.map((v) => ({ label: v.visa_type_name, value: String(v.visa_type_id) }))),
    [visaTypes],
  );

  const statusOptions = useMemo(
    () => [{ label: "- Select -", value: "" }].concat(stages.map((s) => ({ label: s, value: s }))),
    [],
  );

  const cols = useMemo(
    () => [
      { field: "deployment_id", headerName: "ID", width: 80 },
      { field: "candidate_name", headerName: "Candidate", flex: 1, minWidth: 160 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 160 },
      {
        field: "current_status",
        headerName: "Status",
        width: 150,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "")} />,
      },
      { field: "visa_type_name", headerName: "Visa", width: 140 },
      {
        field: "__actions",
        headerName: "Actions",
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as DeploymentRow;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EventAvailableIcon fontSize="small" />}
                onClick={() => {
                  setActiveRow(r);
                  setUpdateForm({
                    status: r.current_status ?? "",
                    visa_type_id: r.visa_type_id ? String(r.visa_type_id) : "",
                    remarks: r.remarks ?? "",
                  });
                  setEditOpen(true);
                }}
              >
                Update
              </AdButton>
              <AdButton
                variant="text"
                onClick={async () => {
                  setActiveRow(r);
                  setVisaOpen(true);
                  setVisaLoading(true);
                  try {
                    const details = await deploymentApi.visaDetails.get(r.deployment_id);
                    setVisaForm(details ?? { deployment_id: r.deployment_id });
                  } catch (e: any) {
                    setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load visa details", severity: "error" });
                    setVisaForm({ deployment_id: r.deployment_id });
                  } finally {
                    setVisaLoading(false);
                  }
                }}
              >
                Visa Details
              </AdButton>
            </Stack>
          );
        },
      },
    ],
    [],
  );

  const visibility = useMemo(
    () => ({
      job_title: !isMdDown,
      visa_type_name: !isMdDown,
    }),
    [isMdDown],
  );

  const saveUpdate = async () => {
    if (!activeRow) return;
    if (!updateForm.status) {
      setToast({ open: true, message: "Select status", severity: "error" });
      return;
    }
    try {
      await deploymentApi.setStatus(activeRow.deployment_id, {
        status: updateForm.status,
        visa_type_id: updateForm.visa_type_id ? Number(updateForm.visa_type_id) : null,
        remarks: updateForm.remarks.trim() || null,
      });
      setToast({ open: true, message: "Status updated", severity: "success" });
      setEditOpen(false);
      refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to update", severity: "error" });
    }
  };

  const uploadFile = async (file: File, type: "passport" | "visa") => {
    if (!activeRow) return;
    try {
      setUploading((u) => ({ ...u, [type]: true }));
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      const objectKey = `deployments/${activeRow.deployment_id}/${type}_${Date.now()}${ext}`;
      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      setVisaForm((v) => ({
        ...v,
        passport_file_path: type === "passport" ? objectKey : v.passport_file_path,
        visa_file_path: type === "visa" ? objectKey : v.visa_file_path,
      }));
      setToast({ open: true, message: "Uploaded", severity: "success" });
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Upload failed", severity: "error" });
    } finally {
      setUploading((u) => ({ ...u, [type]: false }));
    }
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

  const saveVisaDetails = async () => {
    if (!activeRow) return;
    try {
      await deploymentApi.visaDetails.upsert(activeRow.deployment_id, {
        visa_type_id: visaForm.visa_type_id ?? null,
        visa_number: visaForm.visa_number ?? null,
        issue_date: visaForm.issue_date ?? null,
        expiry_date: visaForm.expiry_date ?? null,
        passport_number: visaForm.passport_number ?? null,
        passport_issue_date: visaForm.passport_issue_date ?? null,
        passport_expiry_date: visaForm.passport_expiry_date ?? null,
        sponsor_id: visaForm.sponsor_id ?? null,
        sponsor_contact: visaForm.sponsor_contact ?? null,
        passport_file_path: visaForm.passport_file_path ?? null,
        visa_file_path: visaForm.visa_file_path ?? null,
        remarks: visaForm.remarks ?? null,
      });
      setToast({ open: true, message: "Visa details saved", severity: "success" });
      setVisaOpen(false);
      refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save visa details", severity: "error" });
    }
  };

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1.5}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Deployment Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeStage ? `${activeStage} candidates` : "All deployment stages"}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <AdButton variant="outlined" onClick={refresh} disabled={loading}>
            Refresh
          </AdButton>
        </Stack>
      </Stack>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <AdGrid
          rows={rows.map((r) => ({ id: r.deployment_id, ...r }))}
          columns={cols as any}
          loading={loading}
          showExport={false}
          disableColumnMenu
          columnVisibilityModel={visibility as any}
          sx={{ minWidth: 0 }}
        />
      </AdCard>

      <AdModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Update Deployment Status"
        subtitle={activeRow ? `Deployment ID: ${activeRow.deployment_id}` : ""}
        maxWidth="sm"
      >
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" } }}>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
              <AdDropDown label="Status" options={statusOptions} value={updateForm.status} onChange={(v) => setUpdateForm((f) => ({ ...f, status: String(v) }))} />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
              <AdDropDown label="Visa Type" options={visaOptions} value={updateForm.visa_type_id} onChange={(v) => setUpdateForm((f) => ({ ...f, visa_type_id: String(v) }))} />
            </Box>
            <Box sx={{ gridColumn: "span 12" }}>
              <AdTextArea label="Remarks" minRows={3} value={updateForm.remarks} onChange={(v) => setUpdateForm((f) => ({ ...f, remarks: v }))} />
            </Box>
          </Box>

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <AdButton variant="text" onClick={() => setEditOpen(false)}>
              Cancel
            </AdButton>
            <AdButton onClick={saveUpdate}>Save</AdButton>
          </Stack>
        </Stack>
      </AdModal>

      <AdModal
        open={visaOpen}
        onClose={() => setVisaOpen(false)}
        title="Visa Details"
        subtitle={activeRow ? `Deployment ID: ${activeRow.deployment_id}` : ""}
        maxWidth="md"
      >
        <Stack spacing={2}>
          {visaLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          ) : (
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" } }}>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <AdDropDown
                  label="Visa Type"
                  options={visaOptions}
                  value={visaForm.visa_type_id ? String(visaForm.visa_type_id) : ""}
                  onChange={(v) => setVisaForm((f) => ({ ...f, visa_type_id: Number(v) || null }))}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <AdTextArea
                  label="Visa Number"
                  minRows={1}
                  value={visaForm.visa_number ?? ""}
                  onChange={(v) => setVisaForm((f) => ({ ...f, visa_number: v }))}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <AdTextArea
                  label="Issue Date"
                  minRows={1}
                  value={visaForm.issue_date ?? ""}
                  onChange={(v) => setVisaForm((f) => ({ ...f, issue_date: v }))}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <AdTextArea
                  label="Expiry Date"
                  minRows={1}
                  value={visaForm.expiry_date ?? ""}
                  onChange={(v) => setVisaForm((f) => ({ ...f, expiry_date: v }))}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <AdTextArea
                  label="Passport Number"
                  minRows={1}
                  value={visaForm.passport_number ?? ""}
                  onChange={(v) => setVisaForm((f) => ({ ...f, passport_number: v }))}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <AdTextArea
                  label="Passport Issue Date"
                  minRows={1}
                  value={visaForm.passport_issue_date ?? ""}
                  onChange={(v) => setVisaForm((f) => ({ ...f, passport_issue_date: v }))}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <AdTextArea
                  label="Passport Expiry Date"
                  minRows={1}
                  value={visaForm.passport_expiry_date ?? ""}
                  onChange={(v) => setVisaForm((f) => ({ ...f, passport_expiry_date: v }))}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <AdTextArea
                  label="Sponsor ID"
                  minRows={1}
                  value={visaForm.sponsor_id ?? ""}
                  onChange={(v) => setVisaForm((f) => ({ ...f, sponsor_id: v }))}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <AdTextArea
                  label="Sponsor Contact"
                  minRows={1}
                  value={visaForm.sponsor_contact ?? ""}
                  onChange={(v) => setVisaForm((f) => ({ ...f, sponsor_contact: v }))}
                />
              </Box>
              <Box sx={{ gridColumn: "span 12" }}>
                <AdTextArea
                  label="Remarks"
                  minRows={3}
                  value={visaForm.remarks ?? ""}
                  onChange={(v) => setVisaForm((f) => ({ ...f, remarks: v }))}
                />
              </Box>

              <Box sx={{ gridColumn: "span 12" }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                  <AdButton component="label" variant="outlined" disabled={uploading.passport}>
                    Upload Passport Image
                    <input hidden type="file" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "passport")} />
                  </AdButton>
                  <AdButton variant="text" disabled={!visaForm.passport_file_path} onClick={() => openFile(visaForm.passport_file_path)}>
                    View Passport
                  </AdButton>
                </Stack>
              </Box>
              <Box sx={{ gridColumn: "span 12" }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                  <AdButton component="label" variant="outlined" disabled={uploading.visa}>
                    Upload Visa Image
                    <input hidden type="file" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "visa")} />
                  </AdButton>
                  <AdButton variant="text" disabled={!visaForm.visa_file_path} onClick={() => openFile(visaForm.visa_file_path)}>
                    View Visa
                  </AdButton>
                </Stack>
              </Box>
            </Box>
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <AdButton variant="text" onClick={() => setVisaOpen(false)}>
              Cancel
            </AdButton>
            <AdButton onClick={saveVisaDetails}>Save</AdButton>
          </Stack>
        </Stack>
      </AdModal>
    </Stack>
  );
}
