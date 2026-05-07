import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { workforceApi, type LeaveBalanceRow, type LeavePolicyRow, type LeaveRequestRow, type WorkforceSummary } from "../../common/services/workforceApi";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function fmtNum(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(0);
}

export default function EmployeeLeaveBalancePage() {
  const [summary, setSummary] = useState<WorkforceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workforceApi.summary();
      setSummary(data);
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load leave balance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const leaveBalanceColumns = useMemo(
    () => [
      { field: "leave_name", headerName: "Leave Type", flex: 1, minWidth: 160 },
      { field: "leave_code", headerName: "Code", width: 120 },
      { field: "leave_year", headerName: "Year", width: 100 },
      { field: "opening_balance", headerName: "Annual", width: 100 },
      { field: "used_days", headerName: "Used", width: 90 },
      { field: "balance_days", headerName: "Balance", width: 100 },
      {
        field: "is_paid",
        headerName: "Paid",
        width: 90,
        renderCell: (p: any) => <Chip size="small" label={p.value ? "Yes" : "No"} color={p.value ? "success" : "default"} />,
      },
    ],
    [],
  );

  const policyColumns = useMemo(
    () => [
      { field: "leave_name", headerName: "Leave Type", flex: 1, minWidth: 160 },
      { field: "leave_code", headerName: "Code", width: 120 },
      { field: "annual_limit_days", headerName: "Annual Limit", width: 120 },
      {
        field: "is_paid",
        headerName: "Paid",
        width: 90,
        renderCell: (p: any) => <Chip size="small" label={p.value ? "Yes" : "No"} color={p.value ? "success" : "default"} />,
      },
      { field: "carry_forward_days", headerName: "Carry Forward", width: 130 },
      { field: "max_consecutive_days", headerName: "Max Days", width: 100 },
      { field: "min_notice_days", headerName: "Notice", width: 90 },
    ],
    [],
  );

  const historyColumns = useMemo(
    () => [
      { field: "leave_name", headerName: "Leave Type", flex: 1, minWidth: 160 },
      { field: "leave_from", headerName: "From", width: 120, valueFormatter: (p: any) => formatDate(p.value) },
      { field: "leave_to", headerName: "To", width: 120, valueFormatter: (p: any) => formatDate(p.value) },
      { field: "leave_mode", headerName: "Mode", width: 120 },
      { field: "days_requested", headerName: "Days", width: 90 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p: any) => (
          <Chip size="small" label={String(p.value ?? "").toUpperCase()} color={p.value === "APPROVED" ? "success" : p.value === "REJECTED" ? "error" : "default"} />
        ),
      },
      { field: "approval_remarks", headerName: "Remarks", flex: 1, minWidth: 220 },
    ],
    [],
  );

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Leave Balance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Yearly leave balance under your employer policy
          </Typography>
        </Stack>
        <AdButton startIcon={<AccountBalanceWalletOutlinedIcon fontSize="small" />} onClick={refresh}>
          Refresh
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
        <AdCard title="Total Balance" animate={false} contentSx={{ p: 2 }}>
          <Typography variant="h4" fontWeight={900}>
            {fmtNum((summary?.leave_balances ?? []).reduce((acc, row) => acc + Number(row.balance_days ?? 0), 0))}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Combined remaining leave days
          </Typography>
        </AdCard>
        <AdCard title="Paid Leaves" animate={false} contentSx={{ p: 2 }}>
          <Typography variant="h4" fontWeight={900}>
            {fmtNum((summary?.leave_balances ?? []).filter((row) => row.is_paid).length)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Leave balances marked as paid
          </Typography>
        </AdCard>
        <AdCard title="Unpaid Leaves" animate={false} contentSx={{ p: 2 }}>
          <Typography variant="h4" fontWeight={900}>
            {fmtNum((summary?.leave_balances ?? []).filter((row) => !row.is_paid).length)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Leave balances marked as unpaid
          </Typography>
        </AdCard>
      </Box>

      <AdCard title="Leave Balances" animate={false} contentSx={{ p: 0 }}>
        <AdGrid rows={(summary?.leave_balances ?? []).map((r: LeaveBalanceRow) => ({ id: r.leave_balance_id, ...r }))} columns={leaveBalanceColumns as any} loading={loading} showExport={false} disableColumnMenu autoHeight />
      </AdCard>

      <AdCard title="Leave Policies" animate={false} contentSx={{ p: 0 }}>
        <AdGrid rows={(summary?.leave_policies ?? []).map((r: LeavePolicyRow) => ({ id: r.leave_policy_id, ...r }))} columns={policyColumns as any} loading={loading} showExport={false} disableColumnMenu autoHeight />
      </AdCard>

      <AdCard title="Leave History" animate={false} contentSx={{ p: 0 }}>
        <AdGrid
          rows={(summary?.leave_requests ?? []).map((r: LeaveRequestRow) => ({ id: r.leave_request_id, ...r }))}
          columns={historyColumns as any}
          loading={loading}
          showExport={false}
          disableColumnMenu
          autoHeight
        />
      </AdCard>
    </Stack>
  );
}
