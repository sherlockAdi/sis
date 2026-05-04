import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { AdDropDown, AdNotification } from "../../common/ad";
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
  const hasReady = status.includes("ready");
  const currentKey = hasReady ? "ready" : hasInterview ? "interview" : hasShortlist ? "shortlisted" : "applied";

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
      note: hasReady ? "All previous steps are complete for this job" : "Waiting for final readiness",
      time: hasReady ? formatDateTime(latestInterview?.interview_date ?? activeApplication.application_date) : undefined,
      evidence: hasReady,
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
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
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
      try {
        setInterviews(await recruitmentApi.applications.interviews(selectedApplication.application_id));
      } catch (e: any) {
        setInterviews([]);
        setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load interview history", severity: "error" });
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
            Select your job and follow a compact journey timeline with the important timestamps.
          </Typography>
        </Box>

        <Box
          sx={{
            p: { xs: 1.5, md: 2 },
            borderRadius: 4,
            border: "1px solid rgba(226,232,240,0.95)",
            bgcolor: "rgba(255,255,255,0.88)",
          }}
        >
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
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  <Chip size="small" label={selectedApplication.candidate_name} variant="outlined" />
                  <Chip size="small" label={selectedApplication.job_title} variant="outlined" />
                  <Chip size="small" label={formatStatusLabel(selectedApplication.status)} color={currentChipColor(selectedApplication.status)} />
                </Box>

                <Box>
                  <Typography fontWeight={900} sx={{ mb: 1 }}>
                    Journey Timeline
                  </Typography>
                  <Stack spacing={1.1}>
                    {journey.map((step, index) => (
                      <TimelineRow key={step.key} {...step} isLast={index === journey.length - 1} />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            ) : (
              <Box sx={{ py: 2 }}>
                <Typography fontWeight={800}>No applications found</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {loading ? "Loading your job status..." : "Apply to a job and its journey will appear here."}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

function TimelineRow({
  label,
  note,
  state,
  time,
  isLast = false,
}: JourneyStepModel & { isLast?: boolean }) {
  const style =
    state === "done"
      ? {
          dot: "#16a34a",
          bg: "rgba(34,197,94,0.08)",
          border: "rgba(34,197,94,0.22)",
          titleColor: "success.main",
        }
      : state === "current"
        ? {
          dot: "#2563eb",
          bg: "rgba(37,99,235,0.08)",
          border: "rgba(37,99,235,0.24)",
          titleColor: "primary.main",
        }
        : {
          dot: "#94a3b8",
          bg: "rgba(148,163,184,0.08)",
          border: "rgba(148,163,184,0.22)",
          titleColor: "text.primary",
        };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "18px minmax(0, 1fr)",
        gap: 1.25,
        alignItems: "start",
        minWidth: 0,
        position: "relative",
        pb: isLast ? 0 : 0.9,
        "&::after": isLast
          ? undefined
          : {
              content: '""',
              position: "absolute",
              left: 8,
              top: 18,
              bottom: 0,
              width: 2,
              bgcolor: "rgba(148,163,184,0.25)",
              borderRadius: 999,
            },
      }}
    >
      <Box
        sx={{
          mt: 0.35,
          width: 18,
          height: 18,
          borderRadius: "50%",
          bgcolor: style.dot,
          boxShadow: `0 0 0 4px ${style.bg}`,
          position: "relative",
          zIndex: 1,
        }}
      />
      <Box
        sx={{
          px: 1.25,
          py: 1,
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: style.border,
          bgcolor: style.bg,
          minWidth: 0,
        }}
      >
        <Stack spacing={0.45}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="body2" fontWeight={900} sx={{ color: style.titleColor }}>
              {label}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                px: 0.85,
                py: 0.25,
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.55)",
                color: "text.secondary",
                whiteSpace: "nowrap",
                fontWeight: 800,
              }}
            >
              {state === "done" ? "Done" : state === "current" ? "Current" : "Pending"}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
            {note}
          </Typography>
          {time ? (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {time}
            </Typography>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
