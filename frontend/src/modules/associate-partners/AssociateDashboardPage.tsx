import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdCard } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import {
  associatePortalApi,
  type AssociateApplicationRow,
  type AssociateCandidateRow,
  type AssociateOnboardingOfferRow,
} from "../../common/services/associatePortalApi";
import { jobsApi, type JobListRow } from "../../common/services/jobsApi";
import { withPortalBase } from "../../common/paths";

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function statusLabel(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  return raw || "Pending";
}

function statusColor(value: string | null | undefined): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" {
  const status = normalizeStatus(value);
  if (status.includes("short") || status.includes("select") || status.includes("accept")) return "success";
  if (status.includes("interview")) return "secondary";
  if (status.includes("draft")) return "warning";
  if (status.includes("reject") || status.includes("cancel")) return "error";
  if (status.includes("ready") || status.includes("offer")) return "info";
  if (status.includes("apply") || status.includes("submit")) return "primary";
  return "default";
}

function MetricCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <AdCard
      animate={false}
      sx={{
        borderRadius: 0,
        border: "1px solid rgba(15,23,42,0.10)",
        boxShadow: "none",
        bgcolor: "#fff",
        minHeight: 126,
      }}
      contentSx={{ p: 1.6, height: "100%" }}
    >
      <Stack spacing={1.5} sx={{ height: "100%", justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 900, textTransform: "uppercase" }}>
            {label}
          </Typography>
          <Box sx={{ color: "#0f172a", display: "flex" }}>{icon}</Box>
        </Stack>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 950, color: "#0f172a", lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
            {helper}
          </Typography>
        </Box>
      </Stack>
    </AdCard>
  );
}

export default function AssociateDashboardPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<AssociateCandidateRow[]>([]);
  const [applications, setApplications] = useState<AssociateApplicationRow[]>([]);
  const [offers, setOffers] = useState<AssociateOnboardingOfferRow[]>([]);
  const [jobs, setJobs] = useState<JobListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [candidateRows, applicationRows, offerRows, jobRows] = await Promise.all([
          associatePortalApi.candidates.list(),
          associatePortalApi.applications.list(),
          associatePortalApi.onboarding.offers.list(),
          jobsApi.preview({ status: "Open" }),
        ]);
        if (!active) return;
        setCandidates(candidateRows);
        setApplications(applicationRows);
        setOffers(offerRows);
        setJobs(jobRows);
      } catch (e: any) {
        if (!active) return;
        setError((e as ApiError)?.message ?? "Failed to load associate dashboard");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const linkedCandidates = candidates.filter((row) => Boolean(row.user_id)).length;
    const verifiedCandidates = candidates.filter((row) => Boolean(row.is_verified)).length;
    const activeApplications = applications.filter((row) => {
      const status = normalizeStatus(row.status);
      return !status.includes("reject") && !status.includes("cancel");
    }).length;
    const readyForLogin = applications.filter((row) => normalizeStatus(row.status).includes("ready")).length;
    const pendingOffers = offers.filter((row) => !Number(row.isaccepted)).length;

    return {
      totalCandidates: candidates.length,
      linkedCandidates,
      verifiedCandidates,
      activeApplications,
      readyForLogin,
      pendingOffers,
      openJobs: jobs.length,
    };
  }, [applications, candidates, jobs, offers]);

  const applicationStatusRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of applications) {
      const label = statusLabel(row.status);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [applications]);

  const recentApplications = useMemo(() => applications.slice(0, 5), [applications]);
  const recentCandidates = useMemo(() => candidates.slice(0, 5), [candidates]);

  if (loading && !candidates.length && !applications.length) {
    return (
      <AdCard animate={false} sx={{ bgcolor: "#fff", border: "1px solid rgba(15,23,42,0.10)", boxShadow: "none" }} contentSx={{ p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Loading associate dashboard...
        </Typography>
      </AdCard>
    );
  }

  return (
    <Stack spacing={2.25} sx={{ opacity: loading ? 0.78 : 1 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between">
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 950, color: "#0f172a" }}>
            Associate Partner Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Candidate submission, job application, and onboarding overview.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="outlined"
            startIcon={<PersonAddAltIcon />}
            onClick={() => navigate(withPortalBase("/associate/upload-candidate/create-candidates"))}
            sx={{ borderRadius: 0, textTransform: "none", fontWeight: 900 }}
          >
            Create Candidate
          </Button>
          <Button
            variant="contained"
            startIcon={<WorkOutlineIcon />}
            onClick={() => navigate(withPortalBase("/associate/job/job-list"))}
            sx={{ borderRadius: 0, textTransform: "none", fontWeight: 900, boxShadow: "none" }}
          >
            View Jobs
          </Button>
        </Stack>
      </Stack>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
          gap: 1.2,
        }}
      >
        <MetricCard label="Candidates" value={stats.totalCandidates} helper={`${stats.linkedCandidates} login linked`} icon={<PersonAddAltIcon fontSize="small" />} />
        <MetricCard label="Verified" value={stats.verifiedCandidates} helper="Ready for application" icon={<FactCheckIcon fontSize="small" />} />
        <MetricCard label="Applications" value={stats.activeApplications} helper={`${stats.readyForLogin} ready for user detail`} icon={<AssignmentTurnedInIcon fontSize="small" />} />
        <MetricCard label="Open Jobs" value={stats.openJobs} helper={`${stats.pendingOffers} offers pending`} icon={<WorkOutlineIcon fontSize="small" />} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" }, gap: 1.5 }}>
        <AdCard animate={false} sx={{ borderRadius: 0, border: "1px solid rgba(15,23,42,0.10)", boxShadow: "none", bgcolor: "#fff" }} contentSx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 950 }}>
                Applied Candidate Status
              </Typography>
              <Button
                size="small"
                onClick={() => navigate(withPortalBase("/associate/applied-candidate/applied-candidate-list"))}
                sx={{ textTransform: "none", fontWeight: 900 }}
              >
                Open List
              </Button>
            </Stack>
            <Stack spacing={1}>
              {applicationStatusRows.length ? (
                applicationStatusRows.map((item) => (
                  <Box key={item.label} sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "center" }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                      <Chip size="small" label={item.label} color={statusColor(item.label)} sx={{ borderRadius: 0, fontWeight: 800 }} />
                    </Stack>
                    <Typography sx={{ fontWeight: 950 }}>{item.value}</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No applications submitted yet.
                </Typography>
              )}
            </Stack>
          </Stack>
        </AdCard>

        <AdCard animate={false} sx={{ borderRadius: 0, border: "1px solid rgba(15,23,42,0.10)", boxShadow: "none", bgcolor: "#fff" }} contentSx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 950 }}>
                Quick Actions
              </Typography>
              <AddIcon fontSize="small" />
            </Stack>
            {[
              { label: "Candidate List", to: "/associate/upload-candidate/candidate-list", icon: <PersonAddAltIcon fontSize="small" /> },
              { label: "Apply Job Candidates", to: "/associate/job/apply-candidates", icon: <WorkOutlineIcon fontSize="small" /> },
              { label: "Interview Process", to: "/associate/applied-candidate/interview-process", icon: <FactCheckIcon fontSize="small" /> },
              { label: "Download Offer", to: "/associate/onboarding/download-offer", icon: <ReceiptLongIcon fontSize="small" /> },
            ].map((item) => (
              <Button
                key={item.to}
                startIcon={item.icon}
                onClick={() => navigate(withPortalBase(item.to))}
                variant="outlined"
                fullWidth
                sx={{ justifyContent: "flex-start", borderRadius: 0, textTransform: "none", fontWeight: 900 }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </AdCard>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 1.5 }}>
        <AdCard animate={false} sx={{ borderRadius: 0, border: "1px solid rgba(15,23,42,0.10)", boxShadow: "none", bgcolor: "#fff" }} contentSx={{ p: 2 }}>
          <Stack spacing={1.25}>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>
              Recent Candidates
            </Typography>
            <Divider />
            {recentCandidates.length ? (
              recentCandidates.map((row) => (
                <Stack key={row.candidate_id} direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900, wordBreak: "break-word" }}>
                      {[row.first_name, row.last_name].filter(Boolean).join(" ") || row.candidate_code || `Candidate #${row.candidate_id}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.phone ?? "No phone"} | {row.email ?? "No email"}
                    </Typography>
                  </Box>
                  <Chip size="small" label={row.user_id ? "Linked" : "Draft"} color={row.user_id ? "success" : "warning"} sx={{ borderRadius: 0 }} />
                </Stack>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No candidates created yet.
              </Typography>
            )}
          </Stack>
        </AdCard>

        <AdCard animate={false} sx={{ borderRadius: 0, border: "1px solid rgba(15,23,42,0.10)", boxShadow: "none", bgcolor: "#fff" }} contentSx={{ p: 2 }}>
          <Stack spacing={1.25}>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>
              Recent Applications
            </Typography>
            <Divider />
            {recentApplications.length ? (
              recentApplications.map((row) => (
                <Stack key={row.application_id} direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900, wordBreak: "break-word" }}>{row.candidate_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.job_title} | {row.job_code ?? `Job #${row.job_id}`}
                    </Typography>
                  </Box>
                  <Chip size="small" label={statusLabel(row.status)} color={statusColor(row.status)} sx={{ borderRadius: 0 }} />
                </Stack>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No applications submitted yet.
              </Typography>
            )}
          </Stack>
        </AdCard>
      </Box>
    </Stack>
  );
}
