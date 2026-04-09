import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Divider, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import dayjs, { type Dayjs } from "dayjs";
import { AdButton, AdDatePicker, AdDropDown, AdNotification, AdTextArea, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { deploymentApi, type DeploymentRow, type VisaDetailRow } from "../../common/services/deploymentApi";
import { mastersApi, type VisaType } from "../../common/services/mastersApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

const steps = ["Ready", "Visa Processing", "Biometrics", "Visa Approved", "Travel Booked", "Deployed"];

function activeIndex(status?: string | null) {
  const idx = steps.findIndex((s) => s.toLowerCase() === String(status ?? "").toLowerCase());
  return idx >= 0 ? idx : 0;
}

export default function CandidateProfileDeploymentPage() {
  const [rows, setRows] = useState<DeploymentRow[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [visaForm, setVisaForm] = useState<Partial<VisaDetailRow>>({});
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ passport: boolean; visa: boolean }>({ passport: false, visa: false });

  const activeDeployment = rows[0] ?? null;

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await deploymentApi.candidate.list();
      setRows(list);
      if (list[0]) {
        const details = await deploymentApi.visaDetails.get(list[0].deployment_id);
        setVisaForm(details ?? { deployment_id: list[0].deployment_id });
      }
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load deployment", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
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

  const uploadFile = async (file: File, type: "passport" | "visa") => {
    if (!activeDeployment) return;
    try {
      setUploading((u) => ({ ...u, [type]: true }));
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      const objectKey = `deployments/${activeDeployment.deployment_id}/${type}_${Date.now()}${ext}`;
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

  const saveVisa = async () => {
    if (!activeDeployment) return;
    try {
      await deploymentApi.candidate.upsertVisaDetails({
        deployment_id: activeDeployment.deployment_id,
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
      refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save visa details", severity: "error" });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Deployment Status
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Track your deployment progress and upload visa details.
          </Typography>
        </Box>

        {activeDeployment ? (
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography fontWeight={950}>Pipeline</Typography>
              <Box sx={{ mt: 2 }}>
                <Stepper activeStep={activeIndex(activeDeployment?.current_status)} alternativeLabel>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
              <Typography variant="body2" sx={{ mt: 2, color: "text.secondary", lineHeight: 1.85 }}>
                {loading ? "Loading deployment data..." : `Current stage: ${activeDeployment.current_status}`}
              </Typography>
            </CardContent>
          </Card>
        ) : null}

        {!activeDeployment && !loading ? (
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography fontWeight={950}>Not Deployed Yet</Typography>
              <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", lineHeight: 1.8 }}>
                You don’t have any deployment record yet. Once your application reaches the deployment stage, details will appear here.
              </Typography>
            </CardContent>
          </Card>
        ) : null}

        {activeDeployment ? (
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                    Visa Information
                  </Typography>
                  <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" } }}>
                    <AdDropDown
                      label="Visa Type"
                      options={visaOptions}
                      value={visaForm.visa_type_id ? String(visaForm.visa_type_id) : ""}
                      onChange={(v) => setVisaForm((f) => ({ ...f, visa_type_id: Number(v) || null }))}
                    />
                    <AdTextBox
                      label="Visa Number"
                      size="small"
                      value={visaForm.visa_number ?? ""}
                      onChange={(v) => setVisaForm((f) => ({ ...f, visa_number: v }))}
                    />
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
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                    Passport Details
                  </Typography>
                  <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
                    <AdTextBox
                      label="Passport Number"
                      size="small"
                      value={visaForm.passport_number ?? ""}
                      onChange={(v) => setVisaForm((f) => ({ ...f, passport_number: v }))}
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
                </Box>

                <Divider />

                <Box>
                  <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                    Sponsorship & Additional Info
                  </Typography>
                  <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
                    <AdTextBox
                      label="Sponsor ID"
                      size="small"
                      value={visaForm.sponsor_id ?? ""}
                      onChange={(v) => setVisaForm((f) => ({ ...f, sponsor_id: v }))}
                    />
                    <AdTextBox
                      label="Sponsor Contact"
                      size="small"
                      value={visaForm.sponsor_contact ?? ""}
                      onChange={(v) => setVisaForm((f) => ({ ...f, sponsor_contact: v }))}
                    />
                    <AdTextArea
                      label="Remarks"
                      minRows={1}
                      value={visaForm.remarks ?? ""}
                      onChange={(v) => setVisaForm((f) => ({ ...f, remarks: v }))}
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                    Documents
                  </Typography>
                  <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
                    <Stack spacing={1} alignItems="flex-start">
                      <AdButton component="label" variant="contained" startIcon={<UploadFileIcon fontSize="small" />} disabled={uploading.passport}>
                        Upload Passport
                        <input hidden type="file" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "passport")} />
                      </AdButton>
                      <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} disabled={!visaForm.passport_file_path} onClick={() => openFile(visaForm.passport_file_path)}>
                        View
                      </AdButton>
                    </Stack>
                    <Stack spacing={1} alignItems="flex-start">
                      <AdButton component="label" variant="contained" startIcon={<UploadFileIcon fontSize="small" />} disabled={uploading.visa}>
                        Upload Visa
                        <input hidden type="file" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "visa")} />
                      </AdButton>
                      <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} disabled={!visaForm.visa_file_path} onClick={() => openFile(visaForm.visa_file_path)}>
                        View
                      </AdButton>
                    </Stack>
                    <Stack spacing={1} alignItems="flex-end" justifyContent="flex-start">
                      <AdButton onClick={saveVisa}>Save</AdButton>
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Box>
  );
}
