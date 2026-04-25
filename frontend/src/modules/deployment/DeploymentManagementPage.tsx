import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Divider, IconButton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { useLocation } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import { AdAlertBox, AdButton, AdCard, AdDatePicker, AdDropDown, AdGrid, AdModal, AdNotification, AdTextArea } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { deploymentApi, type DeploymentRow, type VisaDetailRow } from "../../common/services/deploymentApi";
import { employeesApi } from "../../common/services/employeesApi";
import { mastersApi, type VisaType } from "../../common/services/mastersApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

const stages = ["Ready", "Offered", "Visa Processing", "Biometrics", "Visa Approved", "Travel Booked", "Deployed"] as const;

function stageFromPath(pathname: string): string | null {
  if (pathname.includes("/deployment/ready")) return "Ready";
  if (pathname.includes("/deployment/visa-processing")) return "Visa Processing";
  if (pathname.includes("/deployment/biometrics")) return "Biometrics";
  if (pathname.includes("/deployment/visa-approved")) return "Visa Approved";
  if (pathname.includes("/deployment/travel-booked")) return "Travel Booked";
  if (pathname.includes("/deployment/deployed")) return "Deployed";
  return null;
}

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
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

  const [visaOpen, setVisaOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<DeploymentRow | null>(null);
  const [visaForm, setVisaForm] = useState<Partial<VisaDetailRow>>({});
  const [visaLoading, setVisaLoading] = useState(false);
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeSaving, setEmployeeSaving] = useState(false);
  const [employeeForm, setEmployeeForm] = useState<{
    employment_status: string;
    date_of_joining: string;
    date_of_confirmation: string;
    shift_timing: string;
  }>({
    employment_status: "Active",
    date_of_joining: dayjs().format("YYYY-MM-DD"),
    date_of_confirmation: dayjs().format("YYYY-MM-DD"),
    shift_timing: "",
  });
  const [uploading, setUploading] = useState<{ offer: boolean; passport: boolean; visa: boolean; ticket: boolean }>({
    offer: false,
    passport: false,
    visa: false,
    ticket: false,
  });
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);

  const activeStage = stageFromPath(location.pathname);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const shouldUseLocalFilter = activeStage === "Ready" || activeStage === "Visa Processing" || activeStage === "Travel Booked" || activeStage === "Deployed";
      setRows(await deploymentApi.list(shouldUseLocalFilter ? undefined : activeStage ?? undefined));
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

  const cols = useMemo(
    () => [
      { field: "deployment_id", headerName: "ID", width: 80 },
      { field: "candidate_name", headerName: "Candidate", flex: 1, minWidth: 160 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 160 },
      {
        field: "current_status",
        headerName: "Status",
        width: 150,
        renderCell: (p: any) => {
          const status = normalizeStatus(p.value);
          return <Chip size="small" label={String(p.value ?? "")} color={["offered", "visa approved", "ticket confirmed", "deployed", "employee"].includes(status) ? "success" : "default"} />;
        },
      },
      { field: "visa_type_name", headerName: "Visa", width: 140 },
      {
        field: "__actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as DeploymentRow;
          const status = normalizeStatus(r.current_status);
          const canUploadOffer = activeStage === "Ready" && status === "ready";
          const canUploadTicket = activeStage === "Travel Booked" && (status === "travel booked" || status === "visa approved" || status === "ticket confirmed");
          const canMarkDeployed = activeStage === "Deployed" && status === "ticket confirmed";
          const canConfirmEmployee = activeStage === "Deployed" && status === "deployed";
          const canApproveVisa = activeStage === "Visa Processing" && status === "visa processing";
          const canUploadVisa = activeStage === "Visa Processing" && ["offered", "visa processing", "visa approved"].includes(status);
          return (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} sx={{ width: "100%" }}>
              {canUploadOffer ? (
                <IconButton
                  aria-label="Upload offer details"
                  size="small"
                  disabled={uploading.offer}
                  onClick={async () => {
                    setActiveRow(r);
                    setVisaOpen(true);
                    setVisaLoading(true);
                    try {
                      const details = await deploymentApi.visaDetails.get(r.deployment_id);
                      setVisaForm(details ?? { deployment_id: r.deployment_id });
                    } catch (e: any) {
                      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load offer details", severity: "error" });
                      setVisaForm({ deployment_id: r.deployment_id });
                    } finally {
                      setVisaLoading(false);
                    }
                  }}
                  sx={{ alignSelf: "center" }}
                >
                  <UploadFileIcon fontSize="small" />
                </IconButton>
              ) : null}
              {canUploadTicket ? (
                <IconButton
                  aria-label="Upload ticket details"
                  size="small"
                  disabled={uploading.ticket}
                  onClick={async () => {
                    setActiveRow(r);
                    setVisaOpen(true);
                    setVisaLoading(true);
                    try {
                      const details = await deploymentApi.visaDetails.get(r.deployment_id);
                      setVisaForm(details ?? { deployment_id: r.deployment_id });
                    } catch (e: any) {
                      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load ticket details", severity: "error" });
                      setVisaForm({ deployment_id: r.deployment_id });
                    } finally {
                      setVisaLoading(false);
                    }
                  }}
                  sx={{ alignSelf: "center" }}
                >
                  <UploadFileIcon fontSize="small" />
                </IconButton>
              ) : null}
              {canMarkDeployed ? (
                <Tooltip title="Mark as deployed">
                  <IconButton
                    aria-label="Mark deployed"
                    size="small"
                    onClick={async () => {
                      try {
                        await deploymentApi.setStatus(r.deployment_id, {
                          status: "Deployed",
                          remarks: r.remarks ?? null,
                        });
                        setToast({ open: true, message: "Status changed to Deployed", severity: "success" });
                        refresh();
                      } catch (e: any) {
                        setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to mark deployed", severity: "error" });
                      }
                    }}
                    sx={{
                      alignSelf: "center",
                      bgcolor: "rgba(46,125,50,0.08)",
                      border: "1px solid rgba(46,125,50,0.18)",
                      "&:hover": { bgcolor: "rgba(46,125,50,0.14)" },
                    }}
                  >
                    <CheckCircleOutlineIcon fontSize="small" color="success" />
                  </IconButton>
                </Tooltip>
              ) : null}
              {canConfirmEmployee ? (
                <Tooltip title="Confirm as employee">
                  <IconButton
                    aria-label="Confirm as employee"
                    size="small"
                    onClick={async () => {
                      setActiveRow(r);
                      setEmployeeOpen(true);
                      setEmployeeLoading(true);
                    setEmployeeForm({
                      employment_status: "Active",
                      date_of_joining: dayjs().format("YYYY-MM-DD"),
                      date_of_confirmation: dayjs().format("YYYY-MM-DD"),
                      shift_timing: "",
                    });
                      setEmployeeLoading(false);
                    }}
                    sx={{
                      alignSelf: "center",
                      bgcolor: "rgba(25,118,210,0.08)",
                      border: "1px solid rgba(25,118,210,0.18)",
                      "&:hover": { bgcolor: "rgba(25,118,210,0.14)" },
                    }}
                  >
                    <PersonAddAlt1Icon fontSize="small" color="primary" />
                  </IconButton>
                </Tooltip>
              ) : null}
              {canApproveVisa ? (
                <IconButton
                  aria-label="Mark visa approved"
                  size="small"
                  onClick={async () => {
                    try {
                      await deploymentApi.setStatus(r.deployment_id, {
                        status: "Visa Approved",
                        remarks: r.remarks ?? null,
                      });
                      setToast({ open: true, message: "Status changed to Visa Approved", severity: "success" });
                      refresh();
                    } catch (e: any) {
                      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to mark visa approved", severity: "error" });
                    }
                  }}
                  sx={{ alignSelf: "center" }}
                >
                  <CheckCircleOutlineIcon fontSize="small" />
                </IconButton>
              ) : null}
              {canUploadVisa ? (
                <Tooltip title="Upload visa details">
                  <IconButton
                    aria-label="Upload visa details"
                    size="small"
                    disabled={uploading.passport || uploading.visa}
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
                    sx={{
                      alignSelf: "center",
                      bgcolor: "rgba(25,118,210,0.08)",
                      border: "1px solid rgba(25,118,210,0.18)",
                      "&:hover": { bgcolor: "rgba(25,118,210,0.14)" },
                    }}
                  >
                    <UploadFileIcon fontSize="small" color="primary" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>
          );
        },
      },
    ],
    [uploading.offer, uploading.passport, uploading.visa, uploading.ticket, activeStage],
  );

  const visibility = useMemo(
    () => ({
      job_title: !isMdDown,
      visa_type_name: !isMdDown,
    }),
    [isMdDown],
  );

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
      setToast({ open: true, message: `${type === "passport" ? "Passport" : "Visa"} file uploaded`, severity: "success" });
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? `${type === "passport" ? "Passport" : "Visa"} upload failed`, severity: "error" });
    } finally {
      setUploading((u) => ({ ...u, [type]: false }));
    }
  };

  const uploadOfferFile = async (file: File) => {
    if (!activeRow) return;
    try {
      setUploading((u) => ({ ...u, offer: true }));
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      const objectKey = `deployments/${activeRow.deployment_id}/offer_letter_${Date.now()}${ext}`;
      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      setVisaForm((v) => ({ ...v, offer_letter_file_path: objectKey }));
      setToast({ open: true, message: "Offer letter uploaded", severity: "success" });
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Offer upload failed", severity: "error" });
    } finally {
      setUploading((u) => ({ ...u, offer: false }));
    }
  };

  const uploadTicketFile = async (file: File) => {
    if (!activeRow) return;
    try {
      setUploading((u) => ({ ...u, ticket: true }));
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      const objectKey = `deployments/${activeRow.deployment_id}/ticket_${Date.now()}${ext}`;
      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      setVisaForm((v) => ({ ...v, ticket_file_path: objectKey }));
      setToast({ open: true, message: "Ticket file uploaded", severity: "success" });
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Ticket upload failed", severity: "error" });
    } finally {
      setUploading((u) => ({ ...u, ticket: false }));
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
      if (activeStage === "Ready") {
        await deploymentApi.visaDetails.upsert(activeRow.deployment_id, {
          offer_date: visaForm.offer_date ?? null,
          offer_letter_file_path: visaForm.offer_letter_file_path ?? null,
          offer_payment_received: visaForm.offer_payment_received ?? null,
          offer_remarks: visaForm.offer_remarks ?? null,
          remarks: visaForm.remarks ?? null,
        });
        await deploymentApi.setStatus(activeRow.deployment_id, {
          status: "Offered",
          remarks: visaForm.remarks ?? null,
        });
        setToast({ open: true, message: "Offer details saved", severity: "success" });
      } else if (activeStage === "Travel Booked") {
        await deploymentApi.visaDetails.upsert(activeRow.deployment_id, {
          ticket_number: visaForm.ticket_number ?? null,
          booked_date: visaForm.booked_date ?? null,
          travel_date: visaForm.travel_date ?? null,
          ticket_file_path: visaForm.ticket_file_path ?? null,
          ticket_remarks: visaForm.ticket_remarks ?? null,
          remarks: visaForm.remarks ?? null,
        });
        await deploymentApi.setStatus(activeRow.deployment_id, {
          status: "Ticket Confirmed",
          remarks: visaForm.remarks ?? null,
        });
        setToast({ open: true, message: "Ticket details saved", severity: "success" });
      } else if (activeStage === "Deployed") {
        await deploymentApi.visaDetails.upsert(activeRow.deployment_id, {
          remarks: visaForm.remarks ?? null,
        });
        await deploymentApi.setStatus(activeRow.deployment_id, {
          status: "Deployed",
          remarks: visaForm.remarks ?? null,
        });
        setToast({ open: true, message: "Deployment details saved", severity: "success" });
      } else {
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
          visa_payment_received: visaForm.visa_payment_received ?? null,
          visa_remarks: visaForm.visa_remarks ?? null,
          remarks: visaForm.remarks ?? null,
        });
        setToast({ open: true, message: "Visa details saved", severity: "success" });
      }
      setVisaOpen(false);
      refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save details", severity: "error" });
    }
  };

  const confirmEmployee = async () => {
    if (!activeRow) return;
    try {
      setEmployeeSaving(true);
      await employeesApi.confirmFromDeployment({
        deployment_id: activeRow.deployment_id,
        employment_status: employeeForm.employment_status,
        date_of_joining: employeeForm.date_of_joining || null,
        date_of_confirmation: employeeForm.date_of_confirmation || null,
        shift_timing: employeeForm.shift_timing.trim() || null,
      });
      setToast({ open: true, message: "Employee created", severity: "success" });
      setEmployeeOpen(false);
      refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to create employee", severity: "error" });
    } finally {
      setEmployeeSaving(false);
    }
  };

  const visibleRows = useMemo(
    () =>
      rows.filter((row) => {
        const status = normalizeStatus(row.current_status);
        if (activeStage === "Ready") return status === "ready" || status === "offered" || status === "visa approved";
        if (activeStage === "Visa Processing") return status === "visa processing" || status === "visa approved" || status === "offered";
        if (activeStage === "Ready") return status === "ready" || status === "offered" || status === "visa approved";
        if (activeStage === "Travel Booked") return status === "travel booked" || status === "visa approved" || status === "ticket confirmed";
        if (activeStage === "Deployed") return status === "ticket confirmed" || status === "deployed" || status === "employee";
        return status === normalizeStatus(activeStage);
      }),
    [activeStage, rows],
  );

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
          rows={visibleRows.map((r) => ({ id: r.deployment_id, ...r }))}
          columns={cols as any}
          loading={loading}
          showExport={false}
          disableColumnMenu
          columnVisibilityModel={visibility as any}
          sx={{ minWidth: 0 }}
        />
      </AdCard>

      <AdModal
        open={visaOpen}
        onClose={() => setVisaOpen(false)}
        title={
          activeStage === "Ready"
            ? "Offer Details"
            : activeStage === "Travel Booked"
              ? "Ticket Details"
              : activeStage === "Deployed"
                ? "Deployment Details"
                : "Visa Details"
        }
        subtitle={activeRow ? `Deployment ID: ${activeRow.deployment_id}` : ""}
        maxWidth="lg"
      >
        <Stack spacing={2}>
          {visaLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          ) : (
            <Stack spacing={2}>
              {activeStage === "Ready" ? (
                <Box sx={{ p: 2, border: "1px solid rgba(226,232,240,0.8)", borderRadius: 3 }}>
                  <Typography fontWeight={900} sx={{ mb: 1 }}>
                    Offer Generation
                  </Typography>
                  <Stack spacing={1.25}>
                    <AdDatePicker
                      label="Offer Date"
                      value={visaForm.offer_date ? dayjs(visaForm.offer_date) : null}
                      onChange={(v: Dayjs | null) => setVisaForm((f) => ({ ...f, offer_date: v ? v.format("YYYY-MM-DD") : null }))}
                    />
                    <AdDropDown
                      label="Payment Received"
                      options={[
                        { label: "No", value: "0" },
                        { label: "Yes", value: "1" },
                      ]}
                      value={String(visaForm.offer_payment_received ?? 0)}
                      onChange={(v) => setVisaForm((f) => ({ ...f, offer_payment_received: Number(v) }))}
                    />
                    <AdTextArea label="Offer Remarks" minRows={2} value={visaForm.offer_remarks ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, offer_remarks: v }))} />
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <AdButton component="label" variant="contained" startIcon={<UploadFileIcon fontSize="small" />} disabled={uploading.offer || !activeRow}>
                        Upload Offer Letter
                        <input hidden type="file" accept="image/*,.pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && uploadOfferFile(e.target.files[0])} />
                      </AdButton>
                      <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} disabled={!visaForm.offer_letter_file_path} onClick={() => openFile(visaForm.offer_letter_file_path)}>
                        View Offer
                      </AdButton>
                    </Stack>
                  </Stack>
                </Box>
              ) : activeStage === "Travel Booked" ? (
                <Box sx={{ p: 2, border: "1px solid rgba(226,232,240,0.8)", borderRadius: 3 }}>
                  <Typography fontWeight={900} sx={{ mb: 1 }}>
                    Ticket Booking
                  </Typography>
                  <Stack spacing={1.25}>
                    <AdTextArea label="Ticket Number" minRows={1} value={visaForm.ticket_number ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, ticket_number: v }))} />
                    <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
                      <AdDatePicker
                        label="Booked Date"
                        value={visaForm.booked_date ? dayjs(visaForm.booked_date) : null}
                        onChange={(v: Dayjs | null) => setVisaForm((f) => ({ ...f, booked_date: v ? v.format("YYYY-MM-DD") : null }))}
                      />
                      <AdDatePicker
                        label="Travel Date"
                        value={visaForm.travel_date ? dayjs(visaForm.travel_date) : null}
                        onChange={(v: Dayjs | null) => setVisaForm((f) => ({ ...f, travel_date: v ? v.format("YYYY-MM-DD") : null }))}
                      />
                    </Box>
                    <AdTextArea label="Ticket Remarks" minRows={2} value={visaForm.ticket_remarks ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, ticket_remarks: v }))} />
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <AdButton component="label" variant="contained" startIcon={<UploadFileIcon fontSize="small" />} disabled={uploading.ticket || !activeRow}>
                        Upload Ticket
                        <input hidden type="file" accept="image/*,.pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && uploadTicketFile(e.target.files[0])} />
                      </AdButton>
                      <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} disabled={!visaForm.ticket_file_path} onClick={() => openFile(visaForm.ticket_file_path)}>
                        View Ticket
                      </AdButton>
                    </Stack>
                  </Stack>
                </Box>
              ) : activeStage === "Deployed" ? (
                <Box sx={{ p: 2, border: "1px solid rgba(226,232,240,0.8)", borderRadius: 3 }}>
                  <Typography fontWeight={900} sx={{ mb: 1 }}>
                    Deployment Details
                  </Typography>
                  <Stack spacing={1.25}>
                    <AdTextArea label="Deployment Remarks" minRows={2} value={visaForm.remarks ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, remarks: v }))} />
                    <Box sx={{ px: 1.25, py: 0.8, borderRadius: 2, bgcolor: "rgba(248,250,252,0.95)", border: "1px solid rgba(226,232,240,0.9)" }}>
                      <Typography variant="body2" color="text.secondary">
                        Saving this will mark the deployment as <strong>Deployed</strong>.
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ p: 2, border: "1px solid rgba(226,232,240,0.8)", borderRadius: 3 }}>
                  <Typography fontWeight={900} sx={{ mb: 1 }}>
                    Visa Processing
                  </Typography>
                  <Stack spacing={1.25}>
                    <AdDropDown
                      label="Visa Type"
                      options={visaOptions}
                      value={visaForm.visa_type_id ? String(visaForm.visa_type_id) : ""}
                      onChange={(v) => setVisaForm((f) => ({ ...f, visa_type_id: Number(v) || null }))}
                    />
                    <AdTextArea label="Visa Remarks" minRows={2} value={visaForm.visa_remarks ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, visa_remarks: v }))} />
                    <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
                      <AdDatePicker
                        label="Visa Issue Date"
                        value={visaForm.issue_date ? dayjs(visaForm.issue_date) : null}
                        onChange={(v: Dayjs | null) => setVisaForm((f) => ({ ...f, issue_date: v ? v.format("YYYY-MM-DD") : null }))}
                      />
                      <AdDatePicker
                        label="Visa Expiry Date"
                        value={visaForm.expiry_date ? dayjs(visaForm.expiry_date) : null}
                        onChange={(v: Dayjs | null) => setVisaForm((f) => ({ ...f, expiry_date: v ? v.format("YYYY-MM-DD") : null }))}
                      />
                      <AdTextArea label="Passport Number" minRows={1} value={visaForm.passport_number ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, passport_number: v }))} />
                      <AdTextArea label="Sponsor ID" minRows={1} value={visaForm.sponsor_id ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, sponsor_id: v }))} />
                      <AdTextArea label="Sponsor Contact" minRows={1} value={visaForm.sponsor_contact ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, sponsor_contact: v }))} />
                      <AdDropDown
                        label="Payment Received"
                        options={[
                          { label: "No", value: "0" },
                          { label: "Yes", value: "1" },
                        ]}
                        value={String(visaForm.visa_payment_received ?? 0)}
                        onChange={(v) => setVisaForm((f) => ({ ...f, visa_payment_received: Number(v) }))}
                      />
                      <AdDatePicker
                        label="Passport Issue Date"
                        value={visaForm.passport_issue_date ? dayjs(visaForm.passport_issue_date) : null}
                        onChange={(v: Dayjs | null) => setVisaForm((f) => ({ ...f, passport_issue_date: v ? v.format("YYYY-MM-DD") : null }))}
                      />
                      <AdDatePicker
                        label="Passport Expiry Date"
                        value={visaForm.passport_expiry_date ? dayjs(visaForm.passport_expiry_date) : null}
                        onChange={(v: Dayjs | null) => setVisaForm((f) => ({ ...f, passport_expiry_date: v ? v.format("YYYY-MM-DD") : null }))}
                      />
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <AdButton component="label" variant="contained" startIcon={<UploadFileIcon fontSize="small" />} disabled={uploading.passport || !activeRow}>
                        Upload Passport
                        <input hidden type="file" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "passport")} />
                      </AdButton>
                      <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} disabled={!visaForm.passport_file_path} onClick={() => openFile(visaForm.passport_file_path)}>
                        View Passport
                      </AdButton>
                      <AdButton component="label" variant="contained" startIcon={<UploadFileIcon fontSize="small" />} disabled={uploading.visa || !activeRow}>
                        Upload Visa
                        <input hidden type="file" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "visa")} />
                      </AdButton>
                      <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} disabled={!visaForm.visa_file_path} onClick={() => openFile(visaForm.visa_file_path)}>
                        View Visa
                      </AdButton>
                    </Stack>
                  </Stack>
                </Box>
              )}

              <Divider />

              <Box>
                <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                  Remarks
                </Typography>
                <AdTextArea label="Remarks" minRows={2} value={visaForm.remarks ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, remarks: v }))} />
              </Box>
            </Stack>
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <AdButton variant="text" onClick={() => setVisaOpen(false)}>
              Close
            </AdButton>
            <AdButton onClick={saveVisaDetails}>
              {activeStage === "Ready" ? "Save Offer" : activeStage === "Travel Booked" ? "Save Ticket" : "Save Visa Details"}
            </AdButton>
          </Stack>
        </Stack>
      </AdModal>

      <AdModal
        open={employeeOpen}
        onClose={() => setEmployeeOpen(false)}
        title="Confirm as Employee"
        subtitle={activeRow ? `Deployment ID: ${activeRow.deployment_id}` : ""}
        maxWidth="md"
      >
        <Stack spacing={2}>
          {employeeLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          ) : (
            <Stack spacing={2}>
              <Box sx={{ p: 2, border: "1px solid rgba(226,232,240,0.8)", borderRadius: 3 }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Employee Details
                </Typography>
                <Stack spacing={1.25}>
                  <AdDropDown
                    label="Employment Status"
                    options={[
                      { label: "Active", value: "Active" },
                      { label: "Inactive", value: "Inactive" },
                    ]}
                    value={employeeForm.employment_status}
                    onChange={(v) => setEmployeeForm((f) => ({ ...f, employment_status: String(v) }))}
                  />
                  <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
                    <AdDatePicker
                      label="Date of Joining"
                      value={employeeForm.date_of_joining ? dayjs(employeeForm.date_of_joining) : null}
                      onChange={(v: Dayjs | null) => setEmployeeForm((f) => ({ ...f, date_of_joining: v ? v.format("YYYY-MM-DD") : "" }))}
                    />
                    <AdDatePicker
                      label="Date of Confirmation"
                      value={employeeForm.date_of_confirmation ? dayjs(employeeForm.date_of_confirmation) : null}
                      onChange={(v: Dayjs | null) => setEmployeeForm((f) => ({ ...f, date_of_confirmation: v ? v.format("YYYY-MM-DD") : "" }))}
                    />
                  </Box>
                  <AdTextArea
                    label="Shift Timing"
                    minRows={1}
                    value={employeeForm.shift_timing}
                    onChange={(v) => setEmployeeForm((f) => ({ ...f, shift_timing: v }))}
                  />
                </Stack>
              </Box>
              <Box sx={{ px: 1.25, py: 0.8, borderRadius: 2, bgcolor: "rgba(248,250,252,0.95)", border: "1px solid rgba(226,232,240,0.9)" }}>
                <Typography variant="body2" color="text.secondary">
                  Saving this will insert the employee record and move the candidate into the employee zone.
                </Typography>
              </Box>
            </Stack>
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <AdButton variant="text" onClick={() => setEmployeeOpen(false)}>
              Close
            </AdButton>
            <AdButton onClick={confirmEmployee} disabled={employeeSaving}>
              Confirm as Employee
            </AdButton>
          </Stack>
        </Stack>
      </AdModal>
    </Stack>
  );
}
