import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { associatePortalApi, type AssociateOnboardingOfferRow } from "../../common/services/associatePortalApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

const statusFilters = ["All", "Ready", "Offered", "Visa Processing", "Visa Approved", "Travel Booked", "Deployed"] as const;

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 10);
}

function shortValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function statusColor(status: string | null | undefined): "default" | "info" | "success" | "warning" {
  const normalized = normalizeStatus(status);
  if (normalized === "deployed") return "success";
  if (normalized.includes("visa") || normalized.includes("travel")) return "info";
  if (normalized === "offered") return "warning";
  return "default";
}

export default function AssociateOnboardingOfferPage() {
  const [rows, setRows] = useState<AssociateOnboardingOfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<(typeof statusFilters)[number]>("All");
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const refresh = async (status?: string | null) => {
    setLoading(true);
    try {
      setRows(await associatePortalApi.onboarding.offers.list({ status: status && status !== "All" ? status : null }));
    } catch (e: any) {
      setRows([]);
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load onboarding offers", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh(selectedStatus);
  }, [selectedStatus]);

  const filteredRows = useMemo(() => rows, [rows]);

  const stats = useMemo(() => {
    const total = rows.length;
    const accepted = rows.filter((row) => Number(row.isaccepted ?? 0) === 1).length;
    const available = rows.filter((row) => !!row.offer_letter_file_path).length;
    return { total, accepted, available };
  }, [rows]);

  const openFile = async (path?: string | null) => {
    if (!path) return;
    try {
      const presign = await recruitmentApi.files.presignDownload(path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open offer letter", severity: "error" });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Download Offer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            Offer letters for candidates submitted through your associate partner profile.
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
          <MetricCard label="Total Records" value={stats.total} />
          <MetricCard label="Offer Available" value={stats.available} />
          <MetricCard label="Accepted" value={stats.accepted} />
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
            <Stack spacing={1.25}>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", lg: "center" }}>
                <Box>
                  <Typography fontWeight={900} sx={{ fontSize: 15, mb: 0.35 }}>
                    Filter by Status
                  </Typography>
                  <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                    {statusFilters.map((status) => (
                      <Chip
                        key={status}
                        label={status}
                        clickable
                        color={selectedStatus === status ? "primary" : "default"}
                        variant={selectedStatus === status ? "filled" : "outlined"}
                        onClick={() => setSelectedStatus(status)}
                        sx={{ borderRadius: 1.5, fontWeight: 800 }}
                      />
                    ))}
                  </Stack>
                </Box>

                <Button
                  startIcon={<RefreshRoundedIcon />}
                  variant="outlined"
                  onClick={() => refresh(selectedStatus)}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800, alignSelf: { xs: "flex-start", lg: "center" } }}
                >
                  Refresh
                </Button>
              </Stack>

              <Divider />

              {loading ? (
                <Box sx={{ py: 4 }}>
                  <Typography fontWeight={800}>Loading offer records...</Typography>
                </Box>
              ) : filteredRows.length ? (
                <Stack spacing={1}>
                  {filteredRows.map((row) => (
                    <Card
                      key={row.deployment_id}
                      variant="outlined"
                      sx={{
                        borderRadius: 0,
                        borderColor: "rgba(15, 23, 42, 0.10)",
                        bgcolor: "rgba(248, 250, 252, 0.85)",
                      }}
                    >
                      <CardContent sx={{ p: { xs: 1.1, md: 1.35 } }}>
                        <Stack spacing={1}>
                          <Stack
                            direction={{ xs: "column", lg: "row" }}
                            spacing={1}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", lg: "center" }}
                          >
                            <Box>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography fontWeight={950} sx={{ fontSize: 16 }}>
                                  {row.candidate_name || "Candidate"}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={row.current_status ?? "Unknown"}
                                  color={statusColor(row.current_status)}
                                  sx={{ fontWeight: 800 }}
                                />
                                {Number(row.isaccepted ?? 0) === 1 ? (
                                  <Chip size="small" label="Accepted" color="success" sx={{ fontWeight: 800 }} />
                                ) : null}
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                                Application #{row.application_id} • {row.job_title}
                                {row.job_code ? ` • ${row.job_code}` : ""}
                              </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                              <Button
                                variant="contained"
                                startIcon={<DownloadRoundedIcon />}
                                onClick={() => openFile(row.offer_letter_file_path)}
                                disabled={!row.offer_letter_file_path}
                                sx={{
                                  borderRadius: 2.25,
                                  textTransform: "none",
                                  fontWeight: 850,
                                  bgcolor: "#2f7a3f",
                                  "&:hover": { bgcolor: "#256434" },
                                  "&.Mui-disabled": { bgcolor: "rgba(148, 163, 184, 0.28)", color: "rgba(15, 23, 42, 0.45)" },
                                }}
                              >
                                Download Offer Letter
                              </Button>
                            </Stack>
                          </Stack>

                          <Box
                            sx={{
                              display: "grid",
                              gap: 0.75,
                              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                            }}
                          >
                            <MiniField label="Offer Date" value={formatDate(row.offer_date)} />
                            <MiniField label="Email" value={shortValue(row.email)} />
                            <MiniField label="Phone" value={shortValue(row.phone)} />
                            <MiniField label="Offer Payment" value={Number(row.offer_payment_received ?? 0) > 0 ? "Received" : "Pending"} />
                            <MiniField label="Remarks" value={shortValue(row.offer_remarks || row.remarks)} />
                            <MiniField label="Updated" value={formatDate(row.updated_at)} />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ py: 4 }}>
                  <Typography fontWeight={900}>No offer records found</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {selectedStatus === "All"
                      ? "Offer letters will appear here when a candidate reaches the offer stage."
                      : `No records match the ${selectedStatus.toLowerCase()} filter.`}
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

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 0,
        borderColor: "rgba(15, 23, 42, 0.10)",
        bgcolor: "#fff",
        boxShadow: "0 12px 40px rgba(15, 23, 42, 0.04)",
      }}
    >
      <CardContent sx={{ p: { xs: 1.25, md: 1.4 } }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={950}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        minHeight: 62,
        borderRadius: 0,
        border: "1px solid",
        borderColor: "rgba(15, 23, 42, 0.10)",
        px: 1.1,
        py: 0.85,
        bgcolor: "#fff",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={800} sx={{ mt: 0.2, fontSize: 14 }}>
        {value}
      </Typography>
    </Box>
  );
}
