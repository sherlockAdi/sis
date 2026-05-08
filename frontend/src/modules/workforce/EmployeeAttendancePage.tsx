import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TodayIcon from "@mui/icons-material/Today";
import PlaceIcon from "@mui/icons-material/Place";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdModal, AdNotification, AdTextBox, AdDropDown } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { workforceApi, type AttendanceRow, type LeaveBalanceRow, type LeavePolicyRow, type LeaveRequestRow, type MonthlyReport, type WorkforceSummary } from "../../common/services/workforceApi";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

function fmtNum(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(0);
}

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toYm(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function photoFromVideo(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function EmployeeAttendancePage() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState<WorkforceSummary | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [reportMonth, setReportMonth] = useState(toYm(new Date()));
  const [reportLoading, setReportLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [leaveForm, setLeaveForm] = useState({
    leave_policy_id: "",
    leave_from: toYmd(new Date()),
    leave_to: toYmd(new Date()),
    leave_mode: "FULL",
    reason: "",
  });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!summary?.employer?.partner_id) return;
    let active = true;
    (async () => {
      setReportLoading(true);
      try {
        const [year, month] = reportMonth.split("-").map(Number);
        const report = await workforceApi.monthlyReport(summary.employer.partner_id, year, month);
        if (active) setMonthlyReport(report);
      } catch (e: any) {
        if (active) {
          setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load monthly attendance report", severity: "error" });
        }
      } finally {
        if (active) setReportLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [summary?.employer?.partner_id, reportMonth]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setToast({ open: true, message: "Camera is not available in this browser.", severity: "error" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);
    } catch (e: any) {
      setToast({ open: true, message: e?.message ?? "Failed to open camera", severity: "error" });
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const captured = photoFromVideo(videoRef.current);
    if (!captured) {
      setToast({ open: true, message: "Could not capture photo.", severity: "error" });
      return;
    }
    setPhoto(captured);
    setToast({ open: true, message: "Selfie captured.", severity: "success" });
  };

  const getGeo = async () => {
    if (!navigator.geolocation) {
      setToast({ open: true, message: "Location is not available in this browser.", severity: "error" });
      return null;
    }
    return new Promise<{ lat: number; lon: number; accuracy?: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const value = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setGeo(value);
          resolve(value);
        },
        (err) => {
          setToast({ open: true, message: err.message || "Failed to get location", severity: "error" });
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });
  };

  const submitPunch = async (kind: "check-in" | "check-out") => {
    if (!photo) {
      setToast({ open: true, message: "Please capture a selfie first.", severity: "warning" });
      return;
    }
    const location = geo ?? (await getGeo());
    const payload = {
      attendance_date: toYmd(new Date()),
      latitude: location?.lat ?? null,
      longitude: location?.lon ?? null,
      face_capture: photo,
      remarks: kind === "check-in" ? "Check-in from web" : "Check-out from web",
    };
    try {
      if (kind === "check-in") setCheckingIn(true);
      else setCheckingOut(true);
      const result = kind === "check-in" ? await workforceApi.attendance.checkIn(payload) : await workforceApi.attendance.checkOut(payload);
      setToast({ open: true, message: `${kind === "check-in" ? "Check-in" : "Check-out"} saved (${result.day_type})`, severity: "success" });
      await refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? `Failed to ${kind}`, severity: "error" });
    } finally {
      setCheckingIn(false);
      setCheckingOut(false);
    }
  };

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

  const leaveBalanceColumns = useMemo(
    () => [
      { field: "leave_name", headerName: "Leave Type", flex: 1, minWidth: 160 },
      { field: "leave_code", headerName: "Code", width: 120 },
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

  const monthlySummaryColumns = useMemo(
    () => [
      { field: "employee_name", headerName: "Employee", flex: 1, minWidth: 180 },
      { field: "employee_code", headerName: "Code", width: 120 },
      { field: "present_days", headerName: "Present", width: 100 },
      { field: "leave_days", headerName: "Leave", width: 90 },
      { field: "holiday_days", headerName: "Holiday", width: 100 },
      { field: "weekly_off_days", headerName: "Weekly Off", width: 110 },
      { field: "exception_days", headerName: "Exception", width: 100 },
      { field: "absent_days", headerName: "Absent", width: 90 },
      { field: "check_in_count", headerName: "Check In", width: 100 },
      { field: "check_out_count", headerName: "Check Out", width: 110 },
    ],
    [],
  );

  const monthlyAttendanceColumns = useMemo(
    () => [
      { field: "attendance_date", headerName: "Date", width: 120, valueFormatter: (p: any) => formatDate(p.value) },
      { field: "employee_name", headerName: "Employee", flex: 1, minWidth: 180 },
      { field: "employee_code", headerName: "Code", width: 120 },
      { field: "check_in_at", headerName: "Check In", width: 170, valueFormatter: (p: any) => formatDateTime(p.value) },
      { field: "check_out_at", headerName: "Check Out", width: 170, valueFormatter: (p: any) => formatDateTime(p.value) },
      { field: "day_type", headerName: "Day Type", width: 130 },
      { field: "status", headerName: "Status", width: 110 },
      { field: "remarks", headerName: "Remarks", flex: 1, minWidth: 220 },
    ],
    [],
  );

  const requestColumns = useMemo(
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
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "").toUpperCase()} color={p.value === "APPROVED" ? "success" : p.value === "REJECTED" ? "error" : "default"} />,
      },
      { field: "approval_remarks", headerName: "Remarks", flex: 1, minWidth: 220 },
    ],
    [],
  );

  const policyOptions = useMemo(
    () => (summary?.leave_policies ?? []).map((p) => ({ label: `${p.leave_name} (${p.leave_code})`, value: String(p.leave_policy_id) })),
    [summary?.leave_policies],
  );

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Employee Attendance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selfie, location, leave balance and leave requests under your employer policy
          </Typography>
        </Stack>
        <AdButton startIcon={<TodayIcon fontSize="small" />} onClick={refresh}>
          Refresh
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <Tabs value={tab} onChange={(_e, value) => setTab(value)} variant="scrollable" allowScrollButtonsMobile>
        <Tab label="Today" />
        <Tab label="Leave" />
        <Tab label="History" />
      </Tabs>

      {tab === 0 && (
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
            }}
          >
            <AdCard title="Today Overview" subtitle="Employer-aware attendance snapshot" animate={false} contentSx={{ p: 2 }}>
              <Stack spacing={1.2}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" icon={<PlaceIcon fontSize="small" />} label={summary?.employer.partner_name ?? "Employer"} />
                  <Chip size="small" label={summary?.current_day_state.day_type ?? "WORK_DAY"} color={summary?.current_day_state.day_type === "WORK_DAY" ? "success" : "warning"} />
                  <Chip size="small" label={summary?.today_attendance?.status ?? "No punch yet"} variant="outlined" />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {summary?.current_day_state.remarks ?? "No special rule applies today."}
                </Typography>
                <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
                  <Metric label="Employee" value={summary?.employee.employee_name ?? "—"} />
                  <Metric label="Location" value={summary?.employee.work_location ?? "—"} />
                  <Metric label="Shift" value={summary?.employee.shift_timing ?? "—"} />
                </Box>
              </Stack>
            </AdCard>

            <AdCard title="Selfie + Geo" subtitle="Capture before punching attendance" animate={false} contentSx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <AdButton startIcon={<CameraAltIcon fontSize="small" />} onClick={startCamera}>
                    Open Camera
                  </AdButton>
                  <AdButton variant="outlined" onClick={capturePhoto} disabled={!cameraReady}>
                    Capture Selfie
                  </AdButton>
                  <AdButton variant="text" onClick={stopCamera}>
                    Stop Camera
                  </AdButton>
                </Stack>
                <Box sx={{ border: "1px dashed rgba(15,23,42,0.24)", borderRadius: 2, overflow: "hidden", minHeight: 240, bgcolor: "#0f172a" }}>
                  {cameraReady ? (
                    <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: 240, objectFit: "cover" }} />
                  ) : photo ? (
                    <img src={photo} alt="Captured selfie" style={{ width: "100%", height: 240, objectFit: "cover" }} />
                  ) : (
                    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240, color: "#fff" }} spacing={1}>
                      <CameraAltIcon />
                      <Typography variant="body2">Camera preview will appear here</Typography>
                    </Stack>
                  )}
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" icon={<CheckCircleIcon fontSize="small" />} label={photo ? "Selfie ready" : "Selfie pending"} color={photo ? "success" : "default"} />
                  <Chip size="small" label={geo ? `Geo: ${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}` : "Location pending"} variant="outlined" />
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <AdButton onClick={() => submitPunch("check-in")} disabled={checkingIn}>
                    {checkingIn ? "Saving..." : "Check In"}
                  </AdButton>
                  <AdButton variant="outlined" onClick={() => submitPunch("check-out")} disabled={checkingOut}>
                    {checkingOut ? "Saving..." : "Check Out"}
                  </AdButton>
                  <AdButton variant="text" onClick={getGeo}>
                    Refresh Location
                  </AdButton>
                </Stack>
              </Stack>
            </AdCard>
          </Box>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" } }}>
            <AdCard title="Leave Balance" animate={false} contentSx={{ p: 2 }}>
              <Stack spacing={1}>
                {(summary?.leave_balances ?? []).slice(0, 3).map((row) => (
                  <Stack key={row.leave_balance_id} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                    <Typography variant="body2">{row.leave_name ?? row.leave_code ?? row.leave_policy_id}</Typography>
                    <Typography variant="body2" fontWeight={800}>{fmtNum(row.balance_days)}</Typography>
                  </Stack>
                ))}
                {(summary?.leave_balances ?? []).length === 0 && <Typography variant="body2" color="text.secondary">No balances loaded yet.</Typography>}
              </Stack>
            </AdCard>
            <AdCard title="Today Punch" animate={false} contentSx={{ p: 2 }}>
              {summary?.today_attendance ? (
                <Stack spacing={0.75}>
                  <Row label="Check In" value={formatDateTime(summary.today_attendance.check_in_at)} />
                  <Row label="Check Out" value={formatDateTime(summary.today_attendance.check_out_at)} />
                  <Row label="Day Type" value={summary.today_attendance.day_type} />
                  <Row label="Status" value={summary.today_attendance.status} />
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No punch recorded for today.</Typography>
              )}
            </AdCard>
            <AdCard title="Employer Rules" animate={false} contentSx={{ p: 2 }}>
              <Stack spacing={0.75}>
                <Row label="Paid / Unpaid" value={summary?.leave_policies?.length ? "Configured" : "Set policy"} />
                <Row label="Holiday" value={summary?.current_day_state.day_type ?? "WORK_DAY"} />
                <Row label="Location" value={summary?.employee.work_location ?? "—"} />
              </Stack>
            </AdCard>
          </Box>
        </Stack>
      )}

      {tab === 1 && (
        <Stack spacing={2.5}>
          <AdCard title="Apply Leave" subtitle="Employer-scoped leave policy and yearly balance" animate={false} contentSx={{ p: 2 }}>
            <Stack spacing={2}>
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
                <AdDropDown label="Leave Type" options={policyOptions} value={leaveForm.leave_policy_id} onChange={(v) => setLeaveForm((f) => ({ ...f, leave_policy_id: String(v) }))} />
                <AdDropDown
                  label="Leave Mode"
                  options={[
                    { label: "Full Day", value: "FULL" },
                    { label: "First Half", value: "FIRST_HALF" },
                    { label: "Second Half", value: "SECOND_HALF" },
                  ]}
                  value={leaveForm.leave_mode}
                  onChange={(v) => setLeaveForm((f) => ({ ...f, leave_mode: String(v) }))}
                />
                <AdTextBox label="From Date" type="date" value={leaveForm.leave_from} onChange={(v) => setLeaveForm((f) => ({ ...f, leave_from: v }))} />
                <AdTextBox label="To Date" type="date" value={leaveForm.leave_to} onChange={(v) => setLeaveForm((f) => ({ ...f, leave_to: v }))} />
              </Box>
              <AdTextBox label="Reason" value={leaveForm.reason} onChange={(v) => setLeaveForm((f) => ({ ...f, reason: v }))} placeholder="Write the reason for leave" />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <AdButton onClick={submitLeaveRequest} disabled={leaveSubmitting}>
                  {leaveSubmitting ? "Submitting..." : "Submit Leave Request"}
                </AdButton>
              </Stack>
            </Stack>
          </AdCard>

          <AdCard title="Leave Balances" animate={false} contentSx={{ p: 0 }}>
            <AdGrid rows={(summary?.leave_balances ?? []).map((r) => ({ id: r.leave_balance_id, ...r }))} columns={leaveBalanceColumns as any} loading={loading} showExport={false} disableColumnMenu autoHeight />
          </AdCard>

          <AdCard title="Leave Requests" animate={false} contentSx={{ p: 0 }}>
            <AdGrid rows={(summary?.leave_requests ?? []).map((r) => ({ id: r.leave_request_id, ...r }))} columns={requestColumns as any} loading={loading} showExport={false} disableColumnMenu autoHeight />
          </AdCard>
        </Stack>
      )}

      {tab === 2 && (
        <Stack spacing={2.5}>
          <AdCard
            title="Month Wise Attendance"
            subtitle="Select a month to review attendance summary and punch records"
            animate={false}
            contentSx={{ p: 2 }}
          >
            <Stack spacing={2}>
              <Box sx={{ maxWidth: 220 }}>
                <AdTextBox label="Select Month" type="month" value={reportMonth} onChange={(v) => setReportMonth(v)} />
              </Box>
              <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" } }}>
                <Metric label="Present Days" value={String(monthlyReport?.summary?.[0]?.present_days ?? 0)} />
                <Metric label="Leave Days" value={String(monthlyReport?.summary?.[0]?.leave_days ?? 0)} />
                <Metric label="Holiday Days" value={String(monthlyReport?.summary?.[0]?.holiday_days ?? 0)} />
                <Metric label="Weekly Off" value={String(monthlyReport?.summary?.[0]?.weekly_off_days ?? 0)} />
                <Metric label="Absent" value={String(monthlyReport?.summary?.[0]?.absent_days ?? 0)} />
              </Box>
            </Stack>
          </AdCard>

          <AdCard title="Monthly Employee Summary" animate={false} contentSx={{ p: 0 }}>
            <AdGrid
              rows={(monthlyReport?.summary ?? []).map((r) => ({ id: r.employee_id, ...r }))}
              columns={monthlySummaryColumns as any}
              loading={reportLoading}
              showExport={false}
              disableColumnMenu
              autoHeight
            />
          </AdCard>

          <AdCard title="Monthly Punch Records" animate={false} contentSx={{ p: 0 }}>
            <AdGrid
              rows={(monthlyReport?.attendance ?? []).map((r) => ({ id: r.attendance_id, ...r }))}
              columns={monthlyAttendanceColumns as any}
              loading={reportLoading}
              showExport={false}
              disableColumnMenu
              autoHeight
            />
          </AdCard>
        </Stack>
      )}
    </Stack>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(2,6,23,0.03)", border: "1px solid rgba(2,6,23,0.06)" }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={800} sx={{ wordBreak: "break-word" }}>
        {value}
      </Typography>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={1}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={800}>
        {value}
      </Typography>
    </Stack>
  );
}
