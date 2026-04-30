import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
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

export default function CandidateOnboardingTicketsPage() {
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
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load ticket details", severity: "error" });
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
        setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load ticket details", severity: "error" });
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
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open ticket file", severity: "error" });
    }
  };

  const ticketStatus = selectedDeployment ? normalizeStatus(selectedDeployment.current_status) : "";
  const ticketVisible = !!selectedDeployment && ["ticket confirmed", "travel booked", "visa approved", "deployed"].includes(ticketStatus);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Download Tickets
          </Typography>
        </Box>

        <Card
          variant="outlined"
          sx={{
            borderRadius: 0,
            borderColor: "rgba(15, 23, 42, 0.10)",
            bgcolor: "#fff",
            boxShadow: "0 12px 40px rgba(15, 23, 42, 0.04)",
          }}
        >
          <CardContent sx={{ p: { xs: 1.1, md: 1.35 } }}>
            <Stack spacing={1.1}>
              <Box>
                <Typography fontWeight={900} sx={{ mb: 0.25, fontSize: 15 }}>
                  Select Job
                </Typography>
                <Box sx={{ minWidth: { xs: "100%", lg: 320 } }}>
                  <AdDropDown
                    label="Respective Job"
                    options={deploymentOptions.length ? deploymentOptions : [{ label: "No jobs available", value: "" }]}
                    value={selectedDeploymentId ?? ""}
                    disabled={deploymentOptions.length === 0}
                    onChange={(value) => setSelectedDeploymentId(Number(value) || null)}
                  />
                </Box>
              </Box>

              {selectedDeployment ? (
                <>
                  <Divider />
                  <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
                    <InfoCard label="Candidate" value={selectedDeployment.candidate_name} />
                    <InfoCard label="Job" value={selectedDeployment.job_title} />
                    <InfoCard label="Status" value={selectedDeployment.current_status ?? "Unknown"} />
                    <InfoCard label="Ticket Number" value={fieldValue(details?.ticket_number)} />
                    <InfoCard label="Booked Date" value={formatDate(details?.booked_date)} />
                    <InfoCard label="Travel Date" value={formatDate(details?.travel_date)} />
                    <InfoCard
                      label="Ticket File"
                      value={details?.ticket_file_path ? "Available" : "Not uploaded"}
                      action={
                        <IconButton disabled={!details?.ticket_file_path} onClick={() => openFile(details?.ticket_file_path)}>
                          <VisibilityIcon />
                        </IconButton>
                      }
                    />
                    <InfoCard label="Ticket Remarks" value={fieldValue(details?.ticket_remarks)} fullWidth />
                  </Box>

                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 0,
                      mt: 0.75,
                      borderColor: ticketVisible ? "success.main" : "divider",
                      background: ticketVisible ? "rgba(34,197,94,0.04)" : "transparent",
                    }}
                  >
                    <CardContent sx={{ p: { xs: 1, md: 1.35 } }}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle2" fontWeight={900}>Ticket Status</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {detailLoading ? "Loading ticket details..." : ticketVisible ? "Your ticket is available for download." : "Ticket details are not ready yet for this job."}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Box sx={{ py: 1.25 }}>
                  <Typography fontWeight={800}>No ticket record available</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {loading ? "Loading your job list..." : "When ticket details are available for one of your jobs, they will appear here."}
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
    <Card
      variant="outlined"
      sx={{ borderRadius: 0, gridColumn: fullWidth ? "1 / -1" : undefined, borderColor: "rgba(15, 23, 42, 0.10)" }}
    >
      <CardContent sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, p: 1.15, "&:last-child": { pb: 1.15 } }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography fontWeight={800} sx={{ mt: 0.15, wordBreak: "break-word", fontSize: 14, lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
        {action}
      </CardContent>
    </Card>
  );
}
