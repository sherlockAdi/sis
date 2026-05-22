import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import { AdAlertBox, AdButton, AdCard, AdNotification, AdTextBox, AdDropDown } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { workforceApi, type LeavePolicyRow, type WorkforceSummary } from "../../common/services/workforceApi";

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function EmployeeLeavePage() {
  const [summary, setSummary] = useState<WorkforceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [leaveForm, setLeaveForm] = useState({
    leave_policy_id: "",
    leave_from: toYmd(new Date()),
    leave_to: toYmd(new Date()),
    leave_mode: "FULL",
    reason: "",
  });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workforceApi.summary();
      setSummary(data);
      const defaultPolicy = data.leave_policies[0]?.leave_policy_id ? String(data.leave_policies[0].leave_policy_id) : "";
      setLeaveForm((f) => ({ ...f, leave_policy_id: f.leave_policy_id || defaultPolicy }));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load workforce summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const submitLeaveRequest = async () => {
    if (!summary?.employee.partner_id) {
      setToast({ open: true, message: "Employee employer scope is missing.", severity: "error" });
      return;
    }
    if (!leaveForm.leave_policy_id) {
      setToast({ open: true, message: "Please choose a leave type.", severity: "warning" });
      return;
    }
    setLeaveSubmitting(true);
    try {
      await workforceApi.leaveRequests.create({
        employee_id: summary.employee.employee_id,
        partner_id: summary.employee.partner_id,
        leave_policy_id: Number(leaveForm.leave_policy_id),
        leave_from: leaveForm.leave_from,
        leave_to: leaveForm.leave_to,
        leave_mode: leaveForm.leave_mode as any,
        reason: leaveForm.reason.trim() || null,
      });
      setToast({ open: true, message: "Leave request submitted.", severity: "success" });
      await refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Leave request failed", severity: "error" });
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const policyOptions = useMemo(
    () => (summary?.leave_policies ?? []).map((p: LeavePolicyRow) => ({ label: p.leave_name, value: String(p.leave_policy_id) })),
    [summary?.leave_policies],
  );

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Apply Leave
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compact leave request form under your employer policy
          </Typography>
        </Stack>
        <AdButton startIcon={<NoteAltIcon fontSize="small" />} onClick={refresh}>
          Refresh
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard title="Leave Request" subtitle="Submit a new leave request" animate={false} contentSx={{ p: 1.75 }}>
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
            <AdDropDown label="Leave Type" variant="standard" options={policyOptions} value={leaveForm.leave_policy_id} onChange={(v) => setLeaveForm((f) => ({ ...f, leave_policy_id: String(v) }))} />
            <AdDropDown
              label="Leave Mode"
              variant="standard"
              options={[
                { label: "Full Day", value: "FULL" },
                { label: "First Half", value: "FIRST_HALF" },
                { label: "Second Half", value: "SECOND_HALF" },
              ]}
              value={leaveForm.leave_mode}
              onChange={(v) => setLeaveForm((f) => ({ ...f, leave_mode: String(v) }))}
            />
            <AdTextBox label="From Date" type="date" variant="standard" value={leaveForm.leave_from} onChange={(v) => setLeaveForm((f) => ({ ...f, leave_from: v }))} />
            <AdTextBox label="To Date" type="date" variant="standard" value={leaveForm.leave_to} onChange={(v) => setLeaveForm((f) => ({ ...f, leave_to: v }))} />
            <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
              <AdTextBox label="Reason" variant="standard" value={leaveForm.reason} onChange={(v) => setLeaveForm((f) => ({ ...f, reason: v }))} placeholder="Write the reason for leave" />
            </Box>
          </Box>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <AdButton onClick={submitLeaveRequest} disabled={leaveSubmitting}>
              {leaveSubmitting ? "Submitting..." : "Submit Leave Request"}
            </AdButton>
          </Stack>
        </Stack>
      </AdCard>
    </Stack>
  );
}
