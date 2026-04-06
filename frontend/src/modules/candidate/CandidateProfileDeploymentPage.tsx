import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import { AdButton, AdDropDown, AdNotification, AdTextArea } from "../../common/ad";
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
              {loading ? "Loading deployment data..." : activeDeployment ? `Current stage: ${activeDeployment.current_status}` : "No deployment found yet."}
            </Typography>
          </CardContent>
        </Card>

        {activeDeployment ? (
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography fontWeight={950}>Visa Details</Typography>
                <AdDropDown
                  label="Visa Type"
                  options={visaOptions}
                  value={visaForm.visa_type_id ? String(visaForm.visa_type_id) : ""}
                  onChange={(v) => setVisaForm((f) => ({ ...f, visa_type_id: Number(v) || null }))}
                />
                <AdTextArea label="Visa Number" minRows={1} value={visaForm.visa_number ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, visa_number: v }))} />
                <AdTextArea label="Issue Date" minRows={1} value={visaForm.issue_date ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, issue_date: v }))} />
                <AdTextArea label="Expiry Date" minRows={1} value={visaForm.expiry_date ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, expiry_date: v }))} />
                <AdTextArea label="Passport Number" minRows={1} value={visaForm.passport_number ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, passport_number: v }))} />
                <AdTextArea label="Passport Issue Date" minRows={1} value={visaForm.passport_issue_date ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, passport_issue_date: v }))} />
                <AdTextArea label="Passport Expiry Date" minRows={1} value={visaForm.passport_expiry_date ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, passport_expiry_date: v }))} />
                <AdTextArea label="Sponsor ID" minRows={1} value={visaForm.sponsor_id ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, sponsor_id: v }))} />
                <AdTextArea label="Sponsor Contact" minRows={1} value={visaForm.sponsor_contact ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, sponsor_contact: v }))} />
                <AdTextArea label="Remarks" minRows={2} value={visaForm.remarks ?? ""} onChange={(v) => setVisaForm((f) => ({ ...f, remarks: v }))} />

                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                  <AdButton component="label" variant="outlined" disabled={uploading.passport}>
                    Upload Passport Image
                    <input hidden type="file" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "passport")} />
                  </AdButton>
                  <AdButton component="label" variant="outlined" disabled={uploading.visa}>
                    Upload Visa Image
                    <input hidden type="file" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "visa")} />
                  </AdButton>
                </Stack>

                <Stack direction="row" justifyContent="flex-end">
                  <AdButton onClick={saveVisa}>Save</AdButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Box>
  );
}
