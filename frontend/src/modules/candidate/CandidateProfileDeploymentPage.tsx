import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Box, Card, CardContent, Chip, Divider, IconButton, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import dayjs from "dayjs";
import { AdDropDown, AdModal, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { candidateApi, type CandidateApplicationRow } from "../../common/services/candidateApi";
import { recruitmentApi, type ApplicationInterviewRow } from "../../common/services/recruitmentApi";

type JourneyStepModel = {
  key: string;
  label: string;
  state: "done" | "current" | "pending";
  note: string;
  time?: string;
};

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY, HH:mm") : String(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY") : String(value);
}

function formatStatusLabel(value: string | null | undefined): string {
  const status = normalizeStatus(value);
  if (!status) return "Applied";
  if (status.includes("ready")) return "Ready";
  if (status.includes("interview")) return "Interview";
  if (status.includes("shortlist")) return "Shortlisted";
  return "Applied";
}

function buildJourney(activeApplication: CandidateApplicationRow | null, interviews: ApplicationInterviewRow[]): JourneyStepModel[] {
  if (!activeApplication) return [];

  const status = normalizeStatus(activeApplication.status);
  const latestInterview = [...interviews].sort((a, b) => {
    const ad = a.interview_date ? new Date(a.interview_date).getTime() : 0;
    const bd = b.interview_date ? new Date(b.interview_date).getTime() : 0;
    return bd - ad;
  })[0];
  const interviewText = normalizeStatus([latestInterview?.result, latestInterview?.mode_name, latestInterview?.remarks].filter(Boolean).join(" "));
  const hasPostponed = status.includes("postpon") || interviewText.includes("postpon");
  const hasReschedule = status.includes("resched") || interviewText.includes("resched");
  const hasInterview = hasPostponed || hasReschedule || status.includes("interview") || interviews.length > 0;
  const hasShortlist = hasInterview || status.includes("shortlist") || status.includes("screen") || status.includes("ready");
  const currentKey = status.includes("ready") ? "ready" : hasInterview ? "interview" : hasShortlist ? "shortlisted" : "applied";

  const steps: Array<{ key: JourneyStepModel["key"]; label: string; note: string; time?: string; evidence: boolean }> = [
    {
      key: "applied",
      label: "Applied",
      note: "Application received for this job",
      time: activeApplication.application_date ? formatDateTime(activeApplication.application_date) : undefined,
      evidence: true,
    },
    {
      key: "shortlisted",
      label: "Shortlisted",
      note: hasShortlist ? "Your job application has moved into review" : "Waiting for shortlist",
      time: hasShortlist ? formatDateTime(activeApplication.application_date) : undefined,
      evidence: hasShortlist,
    },
    {
      key: "interview",
      label: "Interview",
      note: latestInterview
        ? `${hasPostponed ? "Postponed" : hasReschedule ? "Reschedule pending" : latestInterview.mode_name ?? "Interview"}${latestInterview.interview_date ? ` • ${formatDateTime(latestInterview.interview_date)}` : ""}`
        : hasPostponed
          ? "Postponed"
          : "Interview not scheduled yet",
      time: latestInterview?.interview_date ? formatDateTime(latestInterview.interview_date) : undefined,
      evidence: hasInterview,
    },
    {
      key: "ready",
      label: "Ready",
      note: hasShortlist ? "All previous steps are complete for this job" : "Not ready yet",
      time: hasShortlist ? formatDateTime(latestInterview?.interview_date ?? activeApplication.application_date) : undefined,
      evidence: hasShortlist || status.includes("ready"),
    },
  ];

  return steps.map((step) => ({
    key: step.key,
    label: step.label,
    note: step.note,
    time: step.time,
    state: step.key === currentKey ? "current" : step.evidence ? "done" : "pending",
  }));
}

function journeyHint(status?: string | null) {
  const label = formatStatusLabel(status);
  if (label === "Ready") return "All screening, interview, and selection steps are complete.";
  if (label === "Interview") return "You are already shortlisted and under interview review.";
  if (label === "Shortlisted") return "Your application has been shortlisted after applying.";
  return "You have applied for this job.";
}

function currentChipColor(status?: string | null) {
  const label = formatStatusLabel(status);
  if (label === "Ready") return "success";
  if (label === "Interview") return "info";
  if (label === "Shortlisted") return "success";
  return "default";
}

export default function CandidateProfileDeploymentPage() {
  const [rows, setRows] = useState<CandidateApplicationRow[]>([]);
  const [interviews, setInterviews] = useState<ApplicationInterviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [visualOpen, setVisualOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const refresh = async () => {
    setLoading(true);
    try {
      setRows(await candidateApi.applications.list());
    } catch (e: any) {
      setRows([]);
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load job status", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!rows.length) {
      setSelectedApplicationId(null);
      return;
    }
    setSelectedApplicationId((current) => {
      if (current && rows.some((row) => row.application_id === current)) return current;
      return rows[0].application_id;
    });
  }, [rows]);

  const selectedApplication = useMemo(
    () => rows.find((row) => row.application_id === selectedApplicationId) ?? null,
    [rows, selectedApplicationId],
  );

  const applicationOptions = useMemo(
    () =>
      rows.map((row) => ({
        label: `${row.job_title} • ${formatStatusLabel(row.status)}${row.job_code ? ` • ${row.job_code}` : ""}`,
        value: row.application_id,
      })),
    [rows],
  );

  useEffect(() => {
    if (!selectedApplication) {
      setInterviews([]);
      return;
    }

    (async () => {
      setInterviewsLoading(true);
      try {
        setInterviews(await recruitmentApi.applications.interviews(selectedApplication.application_id));
      } catch (e: any) {
        setInterviews([]);
        setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load interview history", severity: "error" });
      } finally {
        setInterviewsLoading(false);
      }
    })();
  }, [selectedApplication?.application_id]);

  const journey = useMemo(() => buildJourney(selectedApplication, interviews), [selectedApplication, interviews]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Job Status
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Select your job and visualize the same journey used by the partner view, with time shown for each step.
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Respective Job
                </Typography>
                <AdDropDown
                  label="Select Job"
                  options={applicationOptions.length ? applicationOptions : [{ label: "No jobs available", value: "" }]}
                  value={selectedApplicationId ?? ""}
                  disabled={applicationOptions.length === 0}
                  onChange={(value) => setSelectedApplicationId(Number(value) || null)}
                />
              </Box>

              {selectedApplication ? (
                <>
                  <Divider />
                  <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" } }}>
                    <InfoCard label="Candidate" value={selectedApplication.candidate_name} />
                    <InfoCard label="Job" value={selectedApplication.job_title} />
                    <InfoCard label="Application Date" value={formatDate(selectedApplication.application_date)} />
                    <InfoCard label="Application Status" value={formatStatusLabel(selectedApplication.status)} />
                    <InfoCard label="What it means" value={journeyHint(selectedApplication.status)} fullWidth />
                    <Card variant="outlined" sx={{ borderRadius: 3, gridColumn: { xs: "1 / -1", md: "auto" } }}>
                      <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Visualize
                          </Typography>
                          <Typography fontWeight={900}>Journey</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Open the read-only timeline
                          </Typography>
                        </Box>
                        <IconButton onClick={() => setVisualOpen(true)}>
                          <VisibilityIcon />
                        </IconButton>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box sx={{ mt: 1 }}>
                    <Typography fontWeight={900} sx={{ mb: 1 }}>
                      Journey
                    </Typography>
                    <Box
                      sx={{
                        mb: 2,
                        px: { xs: 0.5, md: 1 },
                        py: 1.25,
                        borderRadius: 3,
                        bgcolor: "rgba(37,99,235,0.04)",
                        border: "1px solid rgba(37,99,235,0.12)",
                        overflowX: "auto",
                      }}
                    >
                      <Stepper
                        activeStep={journey.findIndex((step) => step.state === "current")}
                        alternativeLabel
                        sx={{
                          minWidth: 520,
                          "& .MuiStepIcon-root": { color: "rgba(37,99,235,0.35)" },
                          "& .MuiStepIcon-root.Mui-active": { color: "#2563eb" },
                          "& .MuiStepIcon-root.Mui-completed": { color: "#2563eb" },
                          "& .MuiStepConnector-line": {
                            borderTopWidth: 3,
                            borderColor: "rgba(37,99,235,0.2)",
                          },
                          "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line, & .MuiStepConnector-root.Mui-completed .MuiStepConnector-line": {
                            borderColor: "#2563eb",
                          },
                          "& .MuiStepLabel-label": {
                            fontWeight: 800,
                          },
                          "& .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed": {
                            color: "#1d4ed8",
                          },
                        }}
                      >
                        {journey.map((step) => (
                          <Step key={step.key}>
                            <StepLabel>{step.label}</StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </Box>
                    <Stack spacing={1.2}>
                      {journey.map((step) => (
                        <JourneyCard key={step.key} {...step} />
                      ))}
                    </Stack>
                  </Box>
                </>
              ) : (
                <Box sx={{ py: 2 }}>
                  <Typography fontWeight={800}>No applications found</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {loading ? "Loading your job status..." : "Apply to a job and its status will appear here."}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <AdModal
        open={visualOpen}
        onClose={() => setVisualOpen(false)}
        title="Visualize Journey"
        subtitle={selectedApplication ? `${selectedApplication.job_title} • ${formatStatusLabel(selectedApplication.status)}` : undefined}
        maxWidth="sm"
      >
        {selectedApplication ? (
          <Stack spacing={1.5}>
            <Chip
              label={formatStatusLabel(selectedApplication.status)}
              color={currentChipColor(selectedApplication.status)}
              sx={{ alignSelf: "flex-start" }}
            />
            <Typography variant="body2" color="text.secondary">
              {journeyHint(selectedApplication.status)}
            </Typography>
            <Box
              sx={{
                px: { xs: 0.5, md: 1 },
                py: 1.25,
                borderRadius: 3,
                bgcolor: "rgba(37,99,235,0.04)",
                border: "1px solid rgba(37,99,235,0.12)",
                overflowX: "auto",
              }}
            >
              <Stepper
                activeStep={journey.findIndex((step) => step.state === "current")}
                alternativeLabel
                sx={{
                  minWidth: 520,
                  "& .MuiStepIcon-root": { color: "rgba(37,99,235,0.35)" },
                  "& .MuiStepIcon-root.Mui-active": { color: "#2563eb" },
                  "& .MuiStepIcon-root.Mui-completed": { color: "#2563eb" },
                  "& .MuiStepConnector-line": {
                    borderTopWidth: 3,
                    borderColor: "rgba(37,99,235,0.2)",
                  },
                  "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line, & .MuiStepConnector-root.Mui-completed .MuiStepConnector-line": {
                    borderColor: "#2563eb",
                  },
                  "& .MuiStepLabel-label": {
                    fontWeight: 800,
                  },
                  "& .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed": {
                    color: "#1d4ed8",
                  },
                }}
              >
                {journey.map((step) => (
                  <Step key={step.key}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            <Stack spacing={1}>
              {journey.map((step) => (
                <JourneyCard key={step.key} {...step} compact />
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              This screen stops at `Ready`. Deployment details are not shown here.
            </Typography>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No application selected.
          </Typography>
        )}
      </AdModal>

      {interviewsLoading ? null : null}
    </Box>
  );
}

function JourneyCard({
  label,
  note,
  state,
  time,
  compact = false,
}: JourneyStepModel & { compact?: boolean }) {
  const style =
    state === "done"
      ? {
          bgcolor: "rgba(34,197,94,0.08)",
          borderColor: "rgba(34,197,94,0.28)",
          titleColor: "success.main",
          chipBg: "rgba(34,197,94,0.14)",
          chipText: "success.dark",
          chipLabel: "Done",
        }
      : state === "current"
        ? {
            bgcolor: "rgba(37,99,235,0.08)",
            borderColor: "rgba(37,99,235,0.34)",
            titleColor: "primary.main",
            chipBg: "rgba(37,99,235,0.14)",
            chipText: "primary.dark",
            chipLabel: "Current",
          }
        : {
            bgcolor: "rgba(148,163,184,0.08)",
            borderColor: "rgba(148,163,184,0.24)",
            titleColor: "text.primary",
            chipBg: "rgba(148,163,184,0.14)",
            chipText: "text.secondary",
            chipLabel: "Pending",
          };

  return (
    <Box
      sx={{
        minWidth: 0,
        px: compact ? 1.25 : 1.5,
        py: compact ? 0.9 : 1.25,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: style.borderColor,
        bgcolor: style.bgcolor,
      }}
    >
      <Stack spacing={0.7}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="body2" fontWeight={900} sx={{ color: style.titleColor }}>
            {label}
          </Typography>
          <Box
            sx={{
              px: 0.9,
              py: 0.2,
              borderRadius: 999,
              bgcolor: style.chipBg,
              color: style.chipText,
              fontSize: 11,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {style.chipLabel}
          </Box>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ minHeight: compact ? 0 : 36, lineHeight: 1.4 }}>
          {note}
        </Typography>
        {time ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <OpenInNewIcon sx={{ fontSize: 14 }} />
            {time}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}

function InfoCard({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography fontWeight={800} sx={{ mt: 0.25, lineHeight: 1.6 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
