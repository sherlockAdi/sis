import { useEffect, useMemo, useState } from "react";
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import RefreshIcon from "@mui/icons-material/Refresh";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { useAuth } from "../../common/auth/AuthContext";
import { partnersApi, type PartnerRow } from "../../common/services/partnersApi";
import { workforceApi, type AttendanceRow, type HolidayRow, type MonthlyReport, type WeeklyOffRow } from "../../common/services/workforceApi";

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
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function toYm(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthDays(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return [];
  const total = new Date(year, month, 0).getDate();
  return Array.from({ length: total }, (_, idx) => idx + 1);
}

function dayKey(monthValue: string, day: number) {
  return `${monthValue}-${String(day).padStart(2, "0")}`;
}

function monthLabel(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return monthValue;
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function toDateKey(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year ?? "0000"}-${byType.month ?? "00"}-${byType.day ?? "00"}`;
}

function weekdayName(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "long" }).format(d).toUpperCase();
}

function safeJsonArray(value: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed.map((v) => String(v).toUpperCase()) : [];
  } catch {
    return [];
  }
}

function fmt(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0";
  return String(Number(value));
}

function statusColor(status: AttendanceRow["status"]) {
  if (status === "CLOSED") return "success";
  if (status === "EXCEPTION") return "error";
  return "warning";
}

function sanitizeFileName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "monthly-report";
  return trimmed.replace(/[\\/:*?"<>|]+/g, "-");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const TOTAL_HEADERS = ["Present", "Absent"];

type MonthCell = {
  letter: "P" | "A" | "L" | "O" | "H" | "S";
  title: string;
  record?: AttendanceRow | null;
};

function buildCell(
  monthlyRow: { absent_days?: number | null },
  record: AttendanceRow | undefined,
  dayState: { day_type: "WORK_DAY" | "HOLIDAY" | "WEEKLY_OFF"; remarks: string | null } | undefined,
  date: string,
  withoutTime: boolean,
): MonthCell {
  if (record) {
    const dayType = String(record.day_type ?? "").toUpperCase();
    const hasAnyPunch = Boolean(record.check_in_at || record.check_out_at);
    if (dayType === "EXCEPTION" || String(record.status ?? "").toUpperCase() === "EXCEPTION") {
      return { letter: "S", title: `Exception ${date}`, record };
    }
    if (hasAnyPunch) {
      return { letter: "P", title: withoutTime ? `Present ${date}` : `Present ${date}${record.check_in_at ? `\nIn: ${formatDateTime(record.check_in_at)}` : ""}${record.check_out_at ? `\nOut: ${formatDateTime(record.check_out_at)}` : ""}`, record };
    }
    if (dayType === "LEAVE") {
      return { letter: "L", title: `Leave ${date}`, record };
    }
    if (dayType === "HOLIDAY") {
      return { letter: "H", title: `Holiday ${date}`, record };
    }
    if (dayType === "WEEKLY_OFF") {
      return { letter: "O", title: `Weekly off ${date}`, record };
    }
  }

  if (dayState?.day_type === "HOLIDAY") return { letter: "H", title: `Holiday ${date}${dayState.remarks ? `\n${dayState.remarks}` : ""}`, record: null };
  if (dayState?.day_type === "WEEKLY_OFF") return { letter: "O", title: `Weekly off ${date}${dayState.remarks ? `\n${dayState.remarks}` : ""}`, record: null };
  return { letter: "A", title: `Absent ${date}`, record: null };
}

function computeFallbackDayState(
  monthValue: string,
  holidays: HolidayRow[],
  weeklyOffs: WeeklyOffRow[],
): Map<string, { day_type: "WORK_DAY" | "HOLIDAY" | "WEEKLY_OFF"; remarks: string | null }> {
  const map = new Map<string, { day_type: "WORK_DAY" | "HOLIDAY" | "WEEKLY_OFF"; remarks: string | null }>();
  const [year, month] = monthValue.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return map;
  const total = new Date(year, month, 0).getDate();

  for (let day = 1; day <= total; day += 1) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const holiday = holidays.find((row) => {
      if (!row.status) return false;
      const type = String(row.holiday_type ?? "").toUpperCase();
      if (type === "ONCE" || type === "YEARLY_VARIABLE") return String(row.holiday_date ?? "").slice(0, 10) === date;
      if (type === "FIXED") {
        const [yy, mm, dd] = date.split("-").map(Number);
        return Number(row.holiday_month) === mm && Number(row.holiday_day) === dd;
      }
      return false;
    });
    if (holiday) {
      map.set(date, { day_type: "HOLIDAY", remarks: holiday.holiday_name ?? null });
      continue;
    }

    const weekday = weekdayName(date);
    const weekly = weeklyOffs.find((row) => {
      if (!row.status) return false;
      const offDays = safeJsonArray(row.off_days_json);
      const effectiveFrom = String(row.effective_from ?? "").slice(0, 10);
      const effectiveTo = String(row.effective_to ?? "").slice(0, 10);
      if (effectiveFrom && effectiveFrom > date) return false;
      if (effectiveTo && effectiveTo < date && effectiveTo !== effectiveFrom) return false;
      return offDays.includes(weekday);
    });
    if (weekly) {
      map.set(date, { day_type: "WEEKLY_OFF", remarks: weekly.rule_name ?? null });
      continue;
    }

    map.set(date, { day_type: "WORK_DAY", remarks: null });
  }

  return map;
}

export default function MonthlyReportPage() {
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
  const [reportMonth, setReportMonth] = useState(toYm(new Date()));
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [withoutTime, setWithoutTime] = useState(true);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [holidayRows, setHolidayRows] = useState<HolidayRow[]>([]);
  const [weeklyOffRows, setWeeklyOffRows] = useState<WeeklyOffRow[]>([]);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const effectivePartnerId = isAdminLike ? partnerId : currentPartnerId;
  const partnerIdNumber = useMemo(() => {
    const n = Number(effectivePartnerId);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [effectivePartnerId]);

  const partnerOptions = useMemo(
    () =>
      partners
        .slice()
        .sort((a, b) => String(a.partner_name ?? "").localeCompare(String(b.partner_name ?? "")))
        .map((p) => ({ label: `${p.partner_name}${p.partner_code ? ` (${p.partner_code})` : ""}`, value: String(p.partner_id) })),
    [partners],
  );

  const totals = useMemo(() => {
    const rows = report?.summary ?? [];
    return {
      present_days: rows.reduce((acc, row) => acc + Number(row.present_days ?? 0), 0),
      leave_days: rows.reduce((acc, row) => acc + Number(row.leave_days ?? 0), 0),
      holiday_days: rows.reduce((acc, row) => acc + Number(row.holiday_days ?? 0), 0),
      weekly_off_days: rows.reduce((acc, row) => acc + Number(row.weekly_off_days ?? 0), 0),
      absent_days: rows.reduce((acc, row) => acc + Number(row.absent_days ?? 0), 0),
    };
  }, [report?.summary]);

  const reportDays = useMemo(() => monthDays(reportMonth), [reportMonth]);

  const attendanceByEmployee = useMemo(() => {
    const map = new Map<number, Map<string, AttendanceRow>>();
    for (const row of report?.attendance ?? []) {
      if (!map.has(row.employee_id)) map.set(row.employee_id, new Map<string, AttendanceRow>());
      map.get(row.employee_id)!.set(toDateKey(row.attendance_date), row);
    }
    return map;
  }, [report?.attendance]);

  const dayStateByDate = useMemo(() => {
    const map = computeFallbackDayState(reportMonth, holidayRows, weeklyOffRows);
    for (const state of report?.day_states ?? []) {
      const key = toDateKey(state.attendance_date);
      const existing = map.get(key);
      if (state.day_type === "HOLIDAY" || state.day_type === "WEEKLY_OFF") {
        map.set(key, { day_type: state.day_type, remarks: state.remarks });
      } else if (!existing) {
        map.set(key, { day_type: state.day_type, remarks: state.remarks });
      }
    }
    return map;
  }, [holidayRows, report?.day_states, reportMonth, weeklyOffRows]);

  const visibleEmployees = useMemo(() => {
    const term = employeeSearch.trim().toLowerCase();
    const rows = report?.summary ?? [];
    if (!term) return rows;
    return rows.filter((row) => {
      const name = String(row.employee_name ?? "").toLowerCase();
      const code = String(row.employee_code ?? "").toLowerCase();
      return name.includes(term) || code.includes(term);
    });
  }, [employeeSearch, report?.summary]);

  const exportRows = useMemo(() => {
    return visibleEmployees.map((row) => {
      const monthAttendance = attendanceByEmployee.get(row.employee_id) ?? new Map<string, AttendanceRow>();
      const cells = reportDays.map((day) => {
        const date = dayKey(reportMonth, day);
        const record = monthAttendance.get(date);
        const dayState = dayStateByDate.get(date);
        return buildCell(row, record, dayState, date, withoutTime).letter;
      });

      return [
        row.employee_name ? `${row.employee_name}${row.employee_code ? ` (${row.employee_code})` : ""}` : "",
        ...cells,
        fmt(row.present_days),
        fmt(row.absent_days),
      ];
    });
  }, [attendanceByEmployee, dayStateByDate, reportDays, reportMonth, visibleEmployees, withoutTime]);

  const downloadExcel = async () => {
    if (!report) return;

    try {
      const headers = ["Employee", ...reportDays.map(String), ...TOTAL_HEADERS];
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");
      const out = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer | Uint8Array;
      const blob = new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, `${sanitizeFileName(`monthly-report-${monthLabel(reportMonth)}`)}.xlsx`);
    } catch (err) {
      console.error("Monthly report Excel export failed:", err);
      setToast({ open: true, message: "Excel download failed.", severity: "error" });
    }
  };

  const downloadPdf = async () => {
    if (!report) return;

    try {
      const headers = ["Employee", ...reportDays.map(String), ...TOTAL_HEADERS];
      const doc = new jsPDF({
        orientation: headers.length > 10 ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(16);
      doc.text("Monthly Report", pageWidth / 2, 34, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(monthLabel(reportMonth), pageWidth / 2, 50, { align: "center" });
      doc.setTextColor(0);

      autoTable(doc, {
        startY: 64,
        head: [headers],
        body: exportRows,
        styles: { fontSize: 7.5, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42] },
        columnStyles: {
          0: { cellWidth: 110 },
        },
      });

      doc.save(`${sanitizeFileName(`monthly-report-${monthLabel(reportMonth)}`)}.pdf`);
    } catch (err) {
      console.error("Monthly report PDF export failed:", err);
      setToast({ open: true, message: "PDF download failed.", severity: "error" });
    }
  };

  const refreshPartners = async () => {
    if (!isAdminLike) return;
    try {
      setPartners(await partnersApi.list(true));
    } catch {
      setPartners([]);
    }
  };

  const loadReport = async () => {
    setReportLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      if (!partnerIdNumber) {
        setReport(null);
        setInfoMessage(isAdminLike ? "Please select a partner to load the monthly report." : "Partner profile not found for this user.");
        return;
      }
      const [year, month] = reportMonth.split("-").map(Number);
      const [reportData, holidaysData, weeklyOffsData] = await Promise.all([
        workforceApi.monthlyReport(partnerIdNumber, year, month),
        workforceApi.holidays.list(partnerIdNumber),
        workforceApi.weeklyOffs.list(partnerIdNumber),
      ]);
      setReport(reportData);
      setHolidayRows(holidaysData);
      setWeeklyOffRows(weeklyOffsData);
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load monthly report");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    void refreshPartners();
  }, [isAdminLike]);

  useEffect(() => {
    if (!isAdminLike && !currentPartnerId) {
      setInfoMessage("Partner profile not found for this user.");
      return;
    }
    if (!isAdminLike) setPartnerId(currentPartnerId);
  }, [currentPartnerId, isAdminLike]);

  useEffect(() => {
    void loadReport();
  }, [partnerIdNumber, reportMonth]);

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      {infoMessage ? <AdAlertBox severity="info" title="Message" message={infoMessage} /> : null}
      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} contentSx={{ p: 2 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-end"
          flexWrap="nowrap"
          sx={{
            mb: 2,
            width: "100%",
            minWidth: "100%",
            overflowX: "auto",
            "& > *": { flexShrink: 0 },
          }}
        >
          {isAdminLike ? (
            <Box sx={{ minWidth: 240 }}>
              <AdDropDown
                label="Select Partner"
                variant="standard"
                options={partnerOptions}
                value={partnerId}
                onChange={(v) => setPartnerId(String(v))}
              />
            </Box>
          ) : null}
          <Box sx={{ maxWidth: 320, minWidth: 240, flex: "1 1 320px" }}>
            <AdTextBox variant="standard" label="Search Employee" value={employeeSearch} onChange={(v) => setEmployeeSearch(v)} />
          </Box>
          <Box sx={{ minWidth: 150 }}>
            <AdTextBox variant="standard" label="Month" type="month" value={reportMonth} onChange={(v) => setReportMonth(v)} />
          </Box>
          <Tooltip title="Refresh" arrow>
            <IconButton aria-label="refresh report" onClick={loadReport}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Excel" arrow>
            <IconButton aria-label="download excel" onClick={downloadExcel} disabled={!report}>
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF" arrow>
            <IconButton aria-label="download pdf" onClick={downloadPdf} disabled={!report}>
              <PictureAsPdfIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box sx={{ maxWidth: "100%", overflowX: "hidden" }}>
          {reportLoading || !report ? (
            <Box
              sx={{
                minHeight: 320,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
                border: "1px solid rgba(15,23,42,0.08)",
                background: "linear-gradient(180deg, rgba(248,250,252,0.95), rgba(255,255,255,0.98))",
              }}
            >
              <Stack spacing={1} alignItems="center" sx={{ py: 4, px: 2 }}>
                <Typography variant="h6" fontWeight={900}>
                  Loading monthly report
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Please wait while attendance data is being prepared.
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Box sx={{ maxWidth: "100%", overflowX: "auto", overflowY: "hidden", opacity: 1 }}>
              <Box sx={{ width: "fit-content", minWidth: "100%" }}>
              <Box
                component="table"
                sx={{
                  borderCollapse: "collapse",
                  width: "max-content",
                  minWidth: "100%",
                  tableLayout: "fixed",
                  fontSize: 12,
                  color: "#0f172a",
                  "& th, & td": {
                    border: "1px solid rgba(15,23,42,0.10)",
                    padding: "4px 6px",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    verticalAlign: "middle",
                    color: "#0f172a",
                  },
                  "& thead th": {
                    backgroundColor: "rgba(2,6,23,0.03)",
                    fontWeight: 800,
                    color: "#0f172a",
                  },
                }}
              >
                <Box component="thead">
                <Box component="tr">
                    <Box
                      component="th"
                      rowSpan={2}
                      sx={{
                        width: 180,
                        minWidth: 180,
                        maxWidth: 180,
                        textAlign: "left",
                        position: "sticky",
                        left: 0,
                        zIndex: 4,
                        bgcolor: "#ffffff !important",
                        backgroundColor: "#ffffff !important",
                        boxShadow: "1px 0 0 rgba(15,23,42,0.10)",
                        height: 54,
                        lineHeight: 1.1,
                        py: 1.5,
                      }}
                    >
                      EMPLOYEE NAME
                    </Box>
                      <Box component="th" colSpan={reportDays.length} sx={{ minWidth: reportDays.length * 28, fontWeight: 900, height: 28, lineHeight: 1.1, color: "#0f172a" }}>
                      {monthLabel(reportMonth)}
                    </Box>
                    <Box component="th" colSpan={TOTAL_HEADERS.length} sx={{ minWidth: TOTAL_HEADERS.length * 84, fontWeight: 900, height: 30, lineHeight: 1.1, color: "#0f172a" }}>
                      Total
                    </Box>
                  </Box>
                  <Box component="tr">
                    {reportDays.map((day) => (
                      <Box component="th" key={`sub-${day}`} sx={{ width: 28, minWidth: 28, maxWidth: 28, fontWeight: 900, color: "#334155", height: 28, lineHeight: 1.1, py: 0.5 }}>
                        {day}
                      </Box>
                    ))}
                    {TOTAL_HEADERS.map((label) => (
                      <Box component="th" key={label} sx={{ width: 84, minWidth: 84, maxWidth: 84, height: 30, lineHeight: 1.1, py: 0.75, fontWeight: 900 }}>
                        {label}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {visibleEmployees.map((row) => {
                    const monthAttendance = attendanceByEmployee.get(row.employee_id) ?? new Map<string, AttendanceRow>();
                    const rowTotals = reportDays.reduce(
                      (acc, day) => {
                        const date = dayKey(reportMonth, day);
                        const record = monthAttendance.get(date);
                        const dayState = dayStateByDate.get(date);
                        const cell = buildCell(row, record, dayState, date, withoutTime);
                        if (cell.letter === "P") acc.present_days += 1;
                        if (cell.letter === "A") acc.absent_days += 1;
                        return acc;
                      },
                      { present_days: 0, absent_days: 0 },
                    );
                    return (
                      <Box component="tr" key={row.employee_id}>
                        <Box
                          component="td"
                          sx={{
                            position: "sticky",
                            left: 0,
                            zIndex: 3,
                            textAlign: "left",
                            bgcolor: "#ffffff !important",
                            backgroundColor: "#ffffff !important",
                            width: 180,
                            minWidth: 180,
                            maxWidth: 180,
                            fontWeight: 800,
                            color: "#0f172a",
                            boxShadow: "1px 0 0 rgba(15,23,42,0.10)",
                          }}
                        >
                          {row.employee_name}
                          {row.employee_code ? ` (${row.employee_code})` : ""}
                        </Box>
                        {reportDays.map((day) => {
                          const date = dayKey(reportMonth, day);
                          const record = monthAttendance.get(date);
                          const dayState = dayStateByDate.get(date);
                          const cell = buildCell(row, record, dayState, date, withoutTime);
                          const fg =
                            cell.letter === "P"
                              ? "#047857"
                              : cell.letter === "A"
                                ? "#b91c1c"
                                : cell.letter === "L"
                                  ? "#1d4ed8"
                                  : cell.letter === "O"
                                    ? "#334155"
                              : cell.letter === "H"
                                ? "#92400e"
                                : "#6d28d9";
                          return (
                            <Box component="td" key={`${row.employee_id}-${day}`} sx={{ width: 28, minWidth: 28, maxWidth: 28, p: 0 }}>
                              <Tooltip title={cell.title} arrow placement="top">
                                <Box
                                  sx={{
                                    width: "100%",
                                    minHeight: 22,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: fg,
                                    fontWeight: 900,
                                    fontSize: 11,
                                    cursor: "default",
                                  }}
                                >
                                  {cell.letter}
                                </Box>
                              </Tooltip>
                            </Box>
                          );
                        })}
                        <Box component="td" sx={{ width: 84, minWidth: 84, maxWidth: 84, fontWeight: 800 }}>
                          {fmt(rowTotals.present_days)}
                        </Box>
                        <Box component="td" sx={{ width: 84, minWidth: 84, maxWidth: 84, fontWeight: 800, color: "#0f172a" }}>
                          {fmt(rowTotals.absent_days)}
                        </Box>
                      </Box>
                    );
                  })}
                  {visibleEmployees.length === 0 ? (
                    <Box component="tr">
                      <Box component="td" colSpan={reportDays.length + 8} sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                        No employees match the search.
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              </Box>
              </Box>
            </Box>
          )}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="flex-start"
            flexWrap="nowrap"
            sx={{
              mt: 1.5,
              width: "100%",
              minWidth: "100%",
              whiteSpace: "nowrap",
              "& > *": { flexShrink: 0 },
            }}
          >
            <Chip
              size="small"
              variant="outlined"
              label="P : Present"
              sx={{ fontWeight: 800, borderWidth: 0, "& .MuiChip-label": { fontWeight: 800 } }}
            />
            <Chip
              size="small"
              variant="outlined"
              label="A : Absent"
              sx={{ fontWeight: 800, borderWidth: 0, "& .MuiChip-label": { fontWeight: 800 } }}
            />
            <Chip
              size="small"
              variant="outlined"
              label="L : Leave"
              sx={{ fontWeight: 800, borderWidth: 0, "& .MuiChip-label": { fontWeight: 800 } }}
            />
            <Chip
              size="small"
              variant="outlined"
              label="O : Offday"
              sx={{ fontWeight: 800, borderWidth: 0, "& .MuiChip-label": { fontWeight: 800 } }}
            />
            <Chip
              size="small"
              variant="outlined"
              label="H : Holiday"
              sx={{ fontWeight: 800, borderWidth: 0, "& .MuiChip-label": { fontWeight: 800 } }}
            />
            <Chip
              size="small"
              variant="outlined"
              label="S : Special"
              sx={{ fontWeight: 800, borderWidth: 0, "& .MuiChip-label": { fontWeight: 800 } }}
            />
          </Stack>
        </Box>
      </AdCard>
    </Stack>
  );
}
