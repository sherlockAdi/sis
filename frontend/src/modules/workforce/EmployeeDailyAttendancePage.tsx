import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { AdAlertBox, AdButton, AdCard, AdModal, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { workforceApi, type AttendanceRow, type WorkforceSummary } from "../../common/services/workforceApi";

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

function toYmd(d: Dayjs | Date | string): string {
  const value = dayjs(d);
  return value.isValid() ? value.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
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

export default function EmployeeDailyAttendancePage() {
  const [summary, setSummary] = useState<WorkforceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [attendance, setAttendance] = useState<AttendanceRow | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [punchModalOpen, setPunchModalOpen] = useState(false);
  const [punchMode, setPunchMode] = useState<"check-in" | "check-out">("check-in");
  const [cameraReady, setCameraReady] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [marking, setMarking] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workforceApi.summary();
      setSummary(data);
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load attendance page");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForDate = async (date: Dayjs | null) => {
    if (!summary?.employee?.employee_id || !summary?.employee?.partner_id || !date) return;
    setReportLoading(true);
    try {
      const ymd = toYmd(date);
      const nextDay = dayjs(ymd).add(1, "day").format("YYYY-MM-DD");
      const rows = await workforceApi.attendance.list({
        employee_id: summary.employee.employee_id,
        partner_id: summary.employee.partner_id,
        date_from: ymd,
        date_to: nextDay,
      });
      setAttendance(rows[0] ?? null);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load attendance detail", severity: "error" });
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadSummary();
    })();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (summary?.employee?.employee_id && summary?.employee?.partner_id && selectedDate) {
      loadAttendanceForDate(selectedDate);
    }
  }, [summary?.employee?.employee_id, summary?.employee?.partner_id, selectedDate]);

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

  const openPunchModal = async (mode: "check-in" | "check-out") => {
    setPunchMode(mode);
    setPunchModalOpen(true);
    setPhoto(null);
    setGeo(null);
    await startCamera();
  };

  const submitPunch = async () => {
    if (!photo) {
      setToast({ open: true, message: "Please capture a selfie first.", severity: "warning" });
      return;
    }
    const location = geo ?? (await getGeo());
    if (!summary?.employee?.partner_id) return;
    const payload = {
      attendance_date: toYmd(selectedDate ?? dayjs()),
      latitude: location?.lat ?? null,
      longitude: location?.lon ?? null,
      face_capture: photo,
      remarks: punchMode === "check-in" ? "Check-in from daily attendance" : "Check-out from daily attendance",
    };
    setMarking(true);
    try {
      const result =
        punchMode === "check-in"
          ? await workforceApi.attendance.checkIn(payload)
          : await workforceApi.attendance.checkOut(payload);
      setToast({ open: true, message: `${punchMode === "check-in" ? "Check-in" : "Check-out"} saved (${result.day_type})`, severity: "success" });
      setPunchModalOpen(false);
      stopCamera();
      await loadAttendanceForDate(selectedDate);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? `Failed to ${punchMode}`, severity: "error" });
    } finally {
      setMarking(false);
    }
  };

  const canPunchToday = useMemo(() => {
    if (!selectedDate) return false;
    return selectedDate.isSame(dayjs(), "day");
  }, [selectedDate]);

  const hasCheckIn = Boolean(attendance?.check_in_at);
  const hasCheckOut = Boolean(attendance?.check_out_at);
  const nextPunchMode: "check-in" | "check-out" = hasCheckIn && !hasCheckOut ? "check-out" : "check-in";
  const punchButtonLabel = hasCheckIn ? (hasCheckOut ? "Attendance Completed" : "Mark Check Out") : "Mark Check In";
  const punchButtonDisabled = reportLoading || (hasCheckIn && hasCheckOut);

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Daily Attendance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pick a date to inspect punch details or open the attendance modal to mark a punch
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={setSelectedDate}
              slotProps={{ textField: { size: "small" } }}
            />
          </LocalizationProvider>
          <AdButton variant="outlined" startIcon={<EditCalendarIcon fontSize="small" />} onClick={() => loadAttendanceForDate(selectedDate)}>
            Refresh
          </AdButton>
          <AdButton
            startIcon={<CameraAltIcon fontSize="small" />}
            onClick={() => openPunchModal(nextPunchMode)}
            disabled={punchButtonDisabled}
          >
            {punchButtonLabel}
          </AdButton>
        </Stack>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard title="Attendance Detail" subtitle={selectedDate ? selectedDate.format("DD MMM YYYY") : "Selected date"} animate={false} contentSx={{ p: 2 }}>
        {reportLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading attendance...
          </Typography>
        ) : attendance ? (
          <Stack spacing={1.1}>
            <Row label="Employee" value={summary?.employee.employee_name ?? "—"} />
            <Row label="Date" value={formatDate(attendance.attendance_date)} />
            <Row label="Day Type" value={attendance.day_type} />
            <Row label="Status" value={attendance.status} />
            <Row label="Check In" value={formatDateTime(attendance.check_in_at)} />
            <Row label="Check Out" value={formatDateTime(attendance.check_out_at)} />
            <Row label="Remarks" value={attendance.remarks ?? "—"} />
            <Row
              label="Punch State"
              value={hasCheckOut ? "Check-in and checkout completed" : hasCheckIn ? "Check-in done, checkout pending" : "Not marked yet"}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ pt: 1 }}>
              <Chip size="small" icon={<LocationOnIcon fontSize="small" />} label={attendance.check_in_distance_meters !== null ? `${attendance.check_in_distance_meters} m from office` : "No geo captured"} />
              <Chip size="small" icon={<CheckCircleIcon fontSize="small" />} label={attendance.check_in_face_capture ? "Selfie captured" : "No selfie"} color={attendance.check_in_face_capture ? "success" : "default"} />
            </Stack>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No attendance found for the selected date.
          </Typography>
        )}
      </AdCard>

      <AdModal
        open={punchModalOpen}
        onClose={() => {
          setPunchModalOpen(false);
          stopCamera();
        }}
        title={`Mark ${punchMode === "check-in" ? "Check In" : "Check Out"}`}
        subtitle={selectedDate ? selectedDate.format("DD MMM YYYY") : ""}
        maxWidth="md"
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setPunchModalOpen(false)} disabled={marking}>
              Cancel
            </AdButton>
            <AdButton onClick={submitPunch} disabled={marking}>
              {marking ? "Saving..." : punchMode === "check-in" ? "Save Check In" : "Save Check Out"}
            </AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <AdCard title="Camera" animate={false} contentSx={{ p: 1.5 }}>
              <Box sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "#0f172a", minHeight: 260 }}>
                {cameraReady ? (
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: 260, objectFit: "cover" }} />
                ) : (
                  <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 260, color: "#fff" }} spacing={1}>
                    <CameraAltIcon />
                    <Typography variant="body2">Camera preview will appear here</Typography>
                  </Stack>
                )}
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                <AdButton variant="outlined" onClick={startCamera}>
                  Open Camera
                </AdButton>
                <AdButton variant="outlined" onClick={capturePhoto} disabled={!cameraReady}>
                  Capture Selfie
                </AdButton>
                <AdButton variant="text" onClick={stopCamera}>
                  Stop Camera
                </AdButton>
              </Stack>
            </AdCard>

            <AdCard title="Geo Check" animate={false} contentSx={{ p: 1.5 }}>
              <Stack spacing={1.25}>
                <Typography variant="body2" color="text.secondary">
                  Location permission is used to confirm the employee is near the employer office before marking attendance.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" label={geo ? `Lat ${geo.lat.toFixed(4)}` : "Latitude pending"} />
                  <Chip size="small" label={geo ? `Lon ${geo.lon.toFixed(4)}` : "Longitude pending"} />
                </Stack>
                <AdButton variant="outlined" onClick={getGeo}>
                  Detect Location
                </AdButton>
                {!canPunchToday ? (
                  <Typography variant="caption" color="text.secondary">
                    You can still open the modal for backdated review, but punch entry is intended for the selected day.
                  </Typography>
                ) : null}
              </Stack>
            </AdCard>
          </Box>

          {photo ? (
            <AdCard title="Captured Selfie" animate={false} contentSx={{ p: 1.5 }}>
              <img src={photo} alt="Captured selfie" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 12 }} />
            </AdCard>
          ) : null}
        </Stack>
      </AdModal>
    </Stack>
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
