import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import TodayIcon from "@mui/icons-material/Today";
import SaveIcon from "@mui/icons-material/Save";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { useAuth } from "../../common/auth/AuthContext";
import { partnersApi, type PartnerRow } from "../../common/services/partnersApi";
import { workforceApi, type AttendanceRow } from "../../common/services/workforceApi";

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function AttendanceLogsPage() {
  const { me } = useAuth();
  const role = String(me?.role_code ?? "").toUpperCase();
  const isCandidate = role === "CANDIDATE";
  const isPartner = role === "SOURCING" || role === "PARTNER";
  const isEmployer = role === "EMPLOYER" || role === "CUSTOMER";
  const isAssociate = role === "ASSOCIATE";
  const isEmployee = role === "EMPLOYEE";
  const isAdminLike = !(isCandidate || isPartner || isEmployer || isAssociate || isEmployee);

  const currentPartnerId = String(me?.partner_id ?? "");
  const [partnerId, setPartnerId] = useState(isAdminLike ? "" : currentPartnerId);
  const [logDate, setLogDate] = useState(ymd(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [rows, setRows] = useState<AttendanceRow[]>([]);

  const partnerIdNumber = useMemo(() => {
    const n = Number(isAdminLike ? partnerId : currentPartnerId);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [currentPartnerId, isAdminLike, partnerId]);

  const partnerOptions = useMemo(
    () =>
      partners
        .slice()
        .sort((a, b) => String(a.partner_name ?? "").localeCompare(String(b.partner_name ?? "")))
        .map((p) => ({ label: `${p.partner_name}${p.partner_code ? ` (${p.partner_code})` : ""}`, value: String(p.partner_id) })),
    [partners],
  );

  const refreshPartners = async () => {
    if (!isAdminLike) return;
    try {
      setPartners(await partnersApi.list(true));
    } catch {
      setPartners([]);
    }
  };

  const refresh = async () => {
    if (!partnerIdNumber) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const date_from = logDate;
      const date_to = ymd(new Date(new Date(logDate).getTime() + 24 * 60 * 60 * 1000));
      setRows(
        await workforceApi.attendance.list({
          partner_id: partnerIdNumber,
          date_from,
          date_to,
        }),
      );
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load attendance logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshPartners();
  }, [isAdminLike]);

  useEffect(() => {
    if (!isAdminLike && !currentPartnerId) {
      setError("Partner profile not found for this user.");
      return;
    }
    if (!isAdminLike) setPartnerId(currentPartnerId);
  }, [currentPartnerId, isAdminLike]);

  useEffect(() => {
    void refresh();
  }, [partnerIdNumber, logDate]);

  const columns = useMemo(
    () => [
      { field: "employee_name", headerName: "Employee", flex: 1, minWidth: 180 },
      { field: "employee_code", headerName: "Code", width: 120 },
      { field: "attendance_date", headerName: "Date", width: 120 },
      { field: "check_in_at", headerName: "Check In", width: 170, renderCell: (p: any) => formatDateTime(p?.value) },
      { field: "check_out_at", headerName: "Check Out", width: 170, renderCell: (p: any) => formatDateTime(p?.value) },
      { field: "day_type", headerName: "Day Type", width: 120 },
      { field: "status", headerName: "Status", width: 120 },
      { field: "remarks", headerName: "Remarks", flex: 1, minWidth: 220 },
    ],
    [],
  );

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={2}>
        <Stack spacing={0.25} sx={{ minWidth: 260 }}>
          <Typography variant="h5" fontWeight={900}>
            Attendance Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check-in and check-out records for a selected partner and date
          </Typography>
          {isAdminLike && (
            <AdDropDown
              label="Select Partner"
              variant="standard"
              options={partnerOptions}
              value={partnerId}
              onChange={(v) => setPartnerId(String(v))}
            />
          )}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Box sx={{ width: 180 }}>
            <AdTextBox label="Date" type="date" value={logDate} onChange={(v) => setLogDate(v)} />
          </Box>
          <AdButton startIcon={<TodayIcon fontSize="small" />} onClick={refresh}>
            Load
          </AdButton>
          <AdButton startIcon={<SaveIcon fontSize="small" />} onClick={refresh}>
            Refresh
          </AdButton>
        </Stack>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} contentSx={{ p: 0 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.attendance_id, ...r }))} columns={columns as any} loading={loading} showExport={false} disableColumnMenu autoHeight />
      </AdCard>
    </Stack>
  );
}
