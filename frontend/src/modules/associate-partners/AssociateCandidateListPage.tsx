import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { associatePortalApi, type AssociateCandidateRow } from "../../common/services/associatePortalApi";
import { jobsApi, type JobListRow } from "../../common/services/jobsApi";

export default function AssociateCandidateListPage() {
  const [rows, setRows] = useState<AssociateCandidateRow[]>([]);
  const [jobs, setJobs] = useState<JobListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalizeCandidate, setFinalizeCandidate] = useState<AssociateCandidateRow | null>(null);
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [finalizing, setFinalizing] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [candidateRows, jobRows] = await Promise.all([
        associatePortalApi.candidates.list(),
        jobsApi.preview({ status: "Open" }),
      ]);
      setRows(candidateRows);
      setJobs(jobRows);
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load associate candidates");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const openFinalize = (candidate: AssociateCandidateRow) => {
    setFinalizeCandidate(candidate);
    setOriginalEmail(candidate.email ?? "");
    setOriginalPhone(candidate.phone ?? "");
    setFinalizeOpen(true);
  };

  const finalize = async () => {
    if (!finalizeCandidate) return;
    setFinalizing(true);
    try {
      const res = await associatePortalApi.candidates.finalize(finalizeCandidate.candidate_id, {
        original_email: originalEmail.trim(),
        original_phone: originalPhone.trim(),
      });
      setToast({
        open: true,
        message: res.user_created
          ? `Candidate finalized as ${res.username}${res.emailed ? " and confirmation was sent." : "."}`
          : res.existing_user_used
            ? `Candidate linked to existing user ${res.username}.`
            : `Candidate finalized${res.auth_error ? `: ${res.auth_error}` : "."}`,
        severity: "success",
      });
      setFinalizeOpen(false);
      setFinalizeCandidate(null);
      await refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to finalize candidate", severity: "error" });
    } finally {
      setFinalizing(false);
    }
  };

  const cols = useMemo(
    () => [
      { field: "candidate_code", headerName: "Code", width: 110 },
      { field: "first_name", headerName: "First Name", width: 140 },
      { field: "last_name", headerName: "Last Name", width: 140 },
      { field: "phone", headerName: "Reference Mobile", width: 160 },
      { field: "email", headerName: "Reference Email", flex: 1, minWidth: 210 },
      { field: "status", headerName: "Status", width: 150 },
      {
        field: "is_verified",
        headerName: "Verified",
        width: 120,
        renderCell: (p: any) => <Chip size="small" label={p.value ? "Yes" : "No"} color={p.value ? "success" : "default"} />,
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const row = p.row as AssociateCandidateRow;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton variant="outlined" size="small" onClick={() => openFinalize(row)} disabled={Boolean(row.user_id)}>
                {row.user_id ? "Linked" : "Finalize"}
              </AdButton>
            </Stack>
          );
        },
      },
    ],
    [],
  );

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          Associate Candidate List
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Candidates created through the associate partner flow stay here until original contact details are confirmed.
        </Typography>
      </Stack>
      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.candidate_id, ...r }))} columns={cols as any} loading={loading} disableColumnMenu />
      </AdCard>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 0.5 }}>
          Open Jobs for Apply
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Use the apply candidates page to map a submitted candidate to one of these jobs.
        </Typography>
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          {jobs.slice(0, 6).map((job) => (
            <Box key={job.job_id} sx={{ p: 1.5, border: "1px solid rgba(148,163,184,0.22)", borderRadius: 2, bgcolor: "#fff" }}>
              <Typography fontWeight={800}>{job.job_title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {job.job_code ?? `Job #${job.job_id}`} {job.partner_name ? `• ${job.partner_name}` : ""}
              </Typography>
            </Box>
          ))}
        </Box>
      </AdCard>

      <Dialog open={finalizeOpen} onClose={() => setFinalizeOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Finalize Candidate Login</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the candidate&apos;s original contact details now. This is the point where the login user is created or linked.
            </Typography>
            <TextField label="Original Email" value={originalEmail} onChange={(e) => setOriginalEmail(e.target.value)} fullWidth />
            <TextField label="Original Mobile" value={originalPhone} onChange={(e) => setOriginalPhone(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <AdButton variant="text" onClick={() => setFinalizeOpen(false)}>
            Cancel
          </AdButton>
          <AdButton onClick={finalize} disabled={finalizing}>
            {finalizing ? "Finalizing..." : "Finalize"}
          </AdButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
