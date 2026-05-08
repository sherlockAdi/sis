import { useEffect, useRef, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TodayIcon from "@mui/icons-material/Today";
import PlaceIcon from "@mui/icons-material/Place";
import { AdAlertBox, AdButton, AdCard, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { workforceApi, type WorkforceSummary } from "../../common/services/workforceApi";

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

function photoFromVideo(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
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

export default function EmployeeAttendanceHomePage() {
  const [summary, setSummary] = useState<WorkforceSummary | null>(null);
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workforceApi.summary();
      setSummary(data);
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

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Employee Attendance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selfie, location, leave balance and punch overview under your employer policy
          </Typography>
        </Stack>
        <AdButton startIcon={<TodayIcon fontSize="small" />} onClick={refresh}>
          Refresh
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" } }}>
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
                <Typography variant="body2" fontWeight={800}>
                  {fmtNum(row.balance_days)}
                </Typography>
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
            <Typography variant="body2" color="text.secondary">
              No punch recorded for today.
            </Typography>
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
  );
}
