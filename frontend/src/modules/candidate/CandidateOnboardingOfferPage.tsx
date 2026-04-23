import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { AdDropDown, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { deploymentApi, type DeploymentRow, type VisaDetailRow } from "../../common/services/deploymentApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 10);
}

function fieldValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return String(value);
}

export default function CandidateOnboardingOfferPage() {
  const [rows, setRows] = useState<DeploymentRow[]>([]);
  const [details, setDetails] = useState<VisaDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const refresh = async () => {
    setLoading(true);
    try {
      setRows(await deploymentApi.candidate.list());
    } catch (e: any) {
      setRows([]);
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load offer details", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!rows.length) {
      setSelectedDeploymentId(null);
      return;
    }
    setSelectedDeploymentId((current) => {
      if (current && rows.some((row) => row.deployment_id === current)) return current;
      return rows[0].deployment_id;
    });
  }, [rows]);

  const selectedDeployment = useMemo(
    () => rows.find((row) => row.deployment_id === selectedDeploymentId) ?? null,
    [rows, selectedDeploymentId],
  );

  const deploymentOptions = useMemo(
    () =>
      rows.map((row) => ({
        label: `${row.job_title} • ${row.current_status ?? "Unknown"}${row.job_code ? ` • ${row.job_code}` : ""}`,
        value: row.deployment_id,
      })),
    [rows],
  );

  useEffect(() => {
    if (!selectedDeploymentId) {
      setDetails(null);
      return;
    }

    (async () => {
      setDetailLoading(true);
      try {
        setDetails(await deploymentApi.visaDetails.get(selectedDeploymentId));
      } catch (e: any) {
        setDetails(null);
        setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load selected offer", severity: "error" });
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [selectedDeploymentId]);

  const openFile = async (path?: string | null) => {
    if (!path) return;
    try {
      const presign = await recruitmentApi.files.presignDownload(path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open offer letter", severity: "error" });
    }
  };

  const isOfferVisible = selectedDeployment ? ["ready", "offered", "visa approved", "visa processing"].includes(normalizeStatus(selectedDeployment.current_status)) : false;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Download Offer
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Select your job and view the offer details for that specific deployment.
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Select Job
                </Typography>
                <AdDropDown
                  label="Respective Job"
                  options={deploymentOptions.length ? deploymentOptions : [{ label: "No jobs available", value: "" }]}
                  value={selectedDeploymentId ?? ""}
                  disabled={deploymentOptions.length === 0}
                  onChange={(value) => setSelectedDeploymentId(Number(value) || null)}
                />
              </Box>

              {selectedDeployment ? (
                <>
                  <Divider />
                  <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
                    <InfoCard label="Candidate" value={selectedDeployment.candidate_name} />
                    <InfoCard label="Job" value={selectedDeployment.job_title} />
                    <InfoCard label="Status" value={selectedDeployment.current_status ?? "Unknown"} />
                    <InfoCard label="Offer Date" value={formatDate(details?.offer_date)} />
                    <InfoCard label="Payment Received" value={fieldValue(details?.offer_payment_received)} />
                    <InfoCard
                      label="Offer Letter"
                      value={details?.offer_letter_file_path ? "Available" : "Not uploaded"}
                      action={
                        <IconButton disabled={!details?.offer_letter_file_path} onClick={() => openFile(details?.offer_letter_file_path)}>
                          <VisibilityIcon />
                        </IconButton>
                      }
                    />
                    <InfoCard label="Remarks" value={fieldValue(details?.offer_remarks)} fullWidth />
                  </Box>

                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      mt: 1,
                      borderColor: isOfferVisible ? "success.main" : "divider",
                      background: isOfferVisible ? "rgba(46, 125, 50, 0.04)" : "transparent",
                    }}
                  >
                    <CardContent>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between">
                        <Box>
                          <Typography fontWeight={900}>Offer Status</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {detailLoading ? "Loading offer details..." : isOfferVisible ? "Offer is available for this job." : "Offer is not ready yet for this job."}
                          </Typography>
                        </Box>
                        <Chip
                          label={selectedDeployment.current_status ?? "Unknown"}
                          color={normalizeStatus(selectedDeployment.current_status) === "offered" ? "success" : "default"}
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Box sx={{ py: 2 }}>
                  <Typography fontWeight={800}>No offer available</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {loading ? "Loading your job list..." : "When an offer is created for one of your jobs, it will appear here."}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

function InfoCard({
  label,
  value,
  action,
  fullWidth = false,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <CardContent sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography fontWeight={800} sx={{ mt: 0.25, wordBreak: "break-word" }}>
            {value}
          </Typography>
        </Box>
        {action}
      </CardContent>
    </Card>
  );
}
