import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
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

function formatCurrency(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);
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
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<number | null>(null);
  const [savingAcceptance, setSavingAcceptance] = useState(false);
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
      try {
        setDetails(await deploymentApi.visaDetails.get(selectedDeploymentId));
      } catch (e: any) {
        setDetails(null);
        setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load selected offer", severity: "error" });
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

  const isOfferVisible = selectedDeployment
    ? ["ready", "offered", "visa approved", "visa processing"].includes(normalizeStatus(selectedDeployment.current_status))
    : false;
  const isAccepted = details?.isaccepted === 1;
  const paymentReceived = Number(details?.offer_payment_received ?? 0);

  const saveAcceptance = async () => {
    if (!selectedDeployment) return;
    if (isAccepted) return;
    try {
      setSavingAcceptance(true);
      await deploymentApi.candidate.upsertVisaDetails({
        deployment_id: selectedDeployment.deployment_id,
        isaccepted: true,
      });
      setToast({ open: true, message: "Offer accepted", severity: "success" });
      await deploymentApi.candidate.list().then(setRows);
      const updatedDetails = await deploymentApi.visaDetails.get(selectedDeployment.deployment_id);
      setDetails(updatedDetails);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save acceptance", severity: "error" });
    } finally {
      setSavingAcceptance(false);
    }
  };

  if (!loading && !selectedDeployment) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
        <Card
          variant="outlined"
          sx={{
            borderRadius: 0,
            borderColor: "rgba(15, 23, 42, 0.10)",
            bgcolor: "#fff",
            boxShadow: "0 12px 40px rgba(15, 23, 42, 0.04)",
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
            <Typography variant="h5" fontWeight={950}>
              Download Offer
            </Typography>
            <Typography sx={{ mt: 0.75, color: "text.secondary" }}>
              When an offer is created for one of your jobs, it will appear here.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -0.5 }}>
            Offer Acceptance Portal
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
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", lg: "center" }}
                justifyContent="space-between"
              >
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

                <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "flex-start", lg: "flex-end" }}>
                  <Button
                    variant="contained"
                    onClick={saveAcceptance}
                    disabled={!details || isAccepted || savingAcceptance}
                    sx={{
                      borderRadius: 2.25,
                      textTransform: "none",
                      fontWeight: 850,
                      px: 1.75,
                      py: 0.75,
                      bgcolor: "#2f7a3f",
                      "&:hover": { bgcolor: "#256434" },
                      "&.Mui-disabled": { bgcolor: "rgba(148, 163, 184, 0.28)", color: "rgba(15, 23, 42, 0.45)" },
                    }}
                  >
                    {isAccepted ? "Accepted" : savingAcceptance ? "Accepting..." : "Accept Offer"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<HelpOutlineIcon />}
                    sx={{ borderRadius: 2.25, textTransform: "none", fontWeight: 800, px: 1.5, py: 0.75 }}
                  >
                    Help
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SupportAgentIcon />}
                    sx={{
                      borderRadius: 2.25,
                      textTransform: "none",
                      fontWeight: 850,
                      px: 1.75,
                      py: 0.75,
                      bgcolor: "#425868",
                      "&:hover": { bgcolor: "#31424f" },
                    }}
                  >
                    Get Support
                  </Button>
                </Stack>
              </Stack>

              <Divider />

              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.55fr) minmax(300px, 1fr)" },
                }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 0,
                    borderColor: "rgba(15, 23, 42, 0.10)",
                    bgcolor: "#fff",
                  }}
                >
                  <CardContent sx={{ p: { xs: 1, md: 1.35 } }}>
                    <Stack spacing={0.85}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={900}>
                          Job Overview
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "grid",
                          gap: 0.75,
                          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                        }}
                      >
                        <SummaryField label="Candidate" value={selectedDeployment?.candidate_name ?? "-"} />
                        <SummaryField label="Job" value={selectedDeployment?.job_title ?? "-"} />
                        <SummaryField
                          label="Role"
                          value={selectedDeployment?.job_code ? `${selectedDeployment.job_title} - ${selectedDeployment.job_code}` : selectedDeployment?.job_title ?? "-"}
                        />
                        <SummaryField label="Status" value={selectedDeployment?.current_status ?? "Unknown"} />
                        <SummaryField label="Offer Date" value={formatDate(details?.offer_date)} />
                      </Box>

                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 0,
                          border: "none",
                          background:
                            "linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(243, 244, 246, 0.95) 100%)",
                        }}
                      >
                        <CardContent sx={{ p: { xs: 0.85, md: 1 } }}>
                        <Typography variant="caption" color="text.secondary">
                          Offer Notes
                        </Typography>
                          <Typography
                            sx={{
                              mt: 0.15,
                              lineHeight: 1.35,
                              fontSize: 14,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {fieldValue(details?.offer_remarks)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Stack>
                  </CardContent>
                </Card>

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 0,
                    borderColor: "rgba(15, 23, 42, 0.10)",
                    bgcolor: "#fff",
                  }}
                >
                  <CardContent sx={{ p: { xs: 1, md: 1.35 } }}>
                    <Stack spacing={0.85}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={900}>
                          Financial & Letter
                        </Typography>
                      </Box>

                      <Stack spacing={0.2}>
                        <Typography variant="caption" color="text.secondary">
                          Payment Status
                        </Typography>
                        <Typography fontWeight={900} sx={{ fontSize: 16 }}>
                          {formatCurrency(paymentReceived)}{" "}
                          <Typography component="span" sx={{ color: paymentReceived > 0 ? "success.main" : "text.secondary", fontWeight: 800 }}>
                            {paymentReceived > 0 ? "(Received)" : "(Pending)"}
                          </Typography>
                        </Typography>
                      </Stack>

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                          Offer Letter
                        </Typography>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<DownloadRoundedIcon />}
                          onClick={() => openFile(details?.offer_letter_file_path)}
                          disabled={!details?.offer_letter_file_path}
                          sx={{
                            borderRadius: 2,
                            py: 0.95,
                            textTransform: "none",
                            fontWeight: 800,
                            borderColor: "rgba(71, 85, 105, 0.35)",
                            color: "text.primary",
                            "&:hover": { borderColor: "rgba(71, 85, 105, 0.55)", bgcolor: "rgba(15, 23, 42, 0.02)" },
                          }}
                        >
                          Download Offer Letter
                        </Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

function SummaryField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        minHeight: 64,
        borderRadius: 0,
        border: "1px solid",
        borderColor: "rgba(15, 23, 42, 0.10)",
        px: 1.25,
        py: 0.9,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        bgcolor: "#fff",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.1, minWidth: 0 }}>
        <Typography fontWeight={850} sx={{ wordBreak: "break-word", lineHeight: 1.2, fontSize: 14 }}>
          {value}
        </Typography>
      </Stack>
    </Box>
  );
}
