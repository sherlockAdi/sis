import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { associatePortalApi, type AssociateApplicationRow } from "../../common/services/associatePortalApi";

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function statusColor(status: string): any {
  const s = normalizeStatus(status);
  if (s.includes("short")) return "success";
  if (s === "applied") return "primary";
  if (s === "draft") return "warning";
  if (s.includes("interview")) return "secondary";
  if (s.includes("ready")) return "info";
  if (s.includes("reject") || s.includes("cancel")) return "error";
  return "default";
}

function statusMatches(value: string | null | undefined, selectedStatus: string): boolean {
  const s = normalizeStatus(value);
  if (selectedStatus === "all") return true;
  if (selectedStatus === "shortlisted") return s.includes("short");
  if (selectedStatus === "interview") return s.includes("interview");
  if (selectedStatus === "ready") return s.includes("ready");
  return s === selectedStatus;
}

export default function AssociateAppliedCandidateListPage() {
  const [rows, setRows] = useState<AssociateApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalizeRow, setFinalizeRow] = useState<AssociateApplicationRow | null>(null);
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await associatePortalApi.applications.list());
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load applied candidates");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const counts = useMemo(() => {
    const total = rows.length;
    const applied = rows.filter((r) => normalizeStatus(r.status) === "applied").length;
    const draft = rows.filter((r) => normalizeStatus(r.status) === "draft").length;
    const shortlist = rows.filter((r) => normalizeStatus(r.status).includes("short")).length;
    const interview = rows.filter((r) => normalizeStatus(r.status).includes("interview")).length;
    const ready = rows.filter((r) => normalizeStatus(r.status).includes("ready")).length;
    return { total, applied, draft, shortlist, interview, ready };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (selectedStatus === "all") return rows;
    return rows.filter((r) => statusMatches(r.status, selectedStatus));
  }, [rows, selectedStatus]);

  const openFinalize = (row: AssociateApplicationRow) => {
    setFinalizeRow(row);
    setOriginalEmail(row.email ?? "");
    setOriginalPhone(row.phone ?? "");
    setFinalizeOpen(true);
  };

  const finalizeUser = async () => {
    if (!finalizeRow) return;
    const original_email = originalEmail.trim();
    const original_phone = originalPhone.trim();
    if (!original_email || !original_phone) {
      setToast({ open: true, message: "Original email and mobile are required", severity: "warning" });
      return;
    }

    setFinalizing(true);
    try {
      const res = await associatePortalApi.candidates.finalize(finalizeRow.candidate_id, {
        original_email,
        original_phone,
      });
      setToast({
        open: true,
        message: res.user_created
          ? `Login created for ${res.username}${res.emailed ? " and confirmation email sent." : "."}`
          : res.existing_user_used
            ? `Linked to existing login ${res.username}.`
            : `Updated user details for ${res.username}${res.auth_error ? `: ${res.auth_error}` : ""}.`,
        severity: "success",
      });
      setFinalizeOpen(false);
      setFinalizeRow(null);
      await refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to update user details", severity: "error" });
    } finally {
      setFinalizing(false);
    }
  };

  const statusOptions = useMemo(
    () => [
      { key: "all", label: `All (${counts.total})` },
      { key: "applied", label: `Applied (${counts.applied})` },
      { key: "draft", label: `Draft (${counts.draft})` },
      { key: "shortlisted", label: `Shortlisted (${counts.shortlist})` },
      { key: "interview", label: `Interview (${counts.interview})` },
      { key: "ready", label: `Ready (${counts.ready})` },
    ],
    [counts],
  );

  const columns = useMemo(
    () => [
      { field: "application_id", headerName: "App ID", width: 100 },
      { field: "candidate_name", headerName: "Candidate", flex: 1, minWidth: 190 },
      { field: "candidate_id", headerName: "Candidate ID", width: 120 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 220 },
      { field: "job_code", headerName: "Job Code", width: 120 },
      { field: "application_date", headerName: "Date", width: 130 },
      {
        field: "status",
        headerName: "Status",
        width: 150,
        renderCell: (p: any) => {
          const status = String(p.value ?? "").trim();
          return <Chip size="small" label={status || "—"} color={statusColor(status)} />;
        },
      },
      { field: "phone", headerName: "Phone", width: 140 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
      {
        field: "__actions",
        headerName: "Action",
        width: 210,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const row = p.row as AssociateApplicationRow;
          const ready = normalizeStatus(row.status).includes("ready");
          return (
            <AdButton size="small" variant="contained" onClick={() => openFinalize(row)} disabled={!ready}>
              Update User Detail
            </AdButton>
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
          Applied Candidate List
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Show the associate partner&apos;s applied candidates with their current status.
        </Typography>
      </Stack>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.76)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {statusOptions.map((opt) => (
              <Chip
                key={opt.key}
                clickable
                label={opt.label}
                color={selectedStatus === opt.key ? "primary" : "default"}
                variant={selectedStatus === opt.key ? "filled" : "outlined"}
                onClick={() => setSelectedStatus(opt.key)}
              />
            ))}
          </Box>

          <AdGrid
            rows={filteredRows.map((r) => ({ id: r.application_id, ...r }))}
            columns={columns as any}
            loading={loading}
            disableColumnMenu
            sx={{ minWidth: 0 }}
          />
        </Stack>
      </AdCard>

      <Dialog open={finalizeOpen} onClose={() => setFinalizeOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Update User Detail</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              When you confirm these details, the system will create or link the candidate login and send the confirmation email.
            </Typography>
            <TextField label="Original Email" value={originalEmail} onChange={(e) => setOriginalEmail(e.target.value)} fullWidth />
            <TextField label="Original Mobile" value={originalPhone} onChange={(e) => setOriginalPhone(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <AdButton variant="text" onClick={() => setFinalizeOpen(false)}>
            Cancel
          </AdButton>
          <AdButton onClick={finalizeUser} disabled={finalizing}>
            {finalizing ? "Saving..." : "Save & Create Login"}
          </AdButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
