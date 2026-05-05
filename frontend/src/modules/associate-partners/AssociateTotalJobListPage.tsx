import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableViewIcon from "@mui/icons-material/TableView";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdModal, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { jobsApi, type JobDetail, type JobListRow } from "../../common/services/jobsApi";

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function fieldValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.length ? value.map((v) => String(v)).join(", ") : "-";
  return String(value);
}

function shortDate(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 10);
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

function sanitizeFileName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]+/g, "-") || "job";
}

export default function AssociateTotalJobListPage() {
  const [rows, setRows] = useState<JobListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await jobsApi.list());
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load job list");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openDetail = async (jobId: number) => {
    setActiveJobId(jobId);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      setDetail(await jobsApi.get(jobId));
    } catch (e: any) {
      const apiErr = e as ApiError;
      setToast({ open: true, message: apiErr?.message ?? "Failed to load job detail", severity: "error" });
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadSingleJobPdf = async (row: JobListRow) => {
    setPdfBusy(true);
    try {
      const d = detail && detail.job.job_id === row.job_id ? detail : await jobsApi.get(row.job_id);
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      let cursorY = 36;

      doc.setFontSize(18);
      doc.text("Associate Total Job List", pageWidth / 2, cursorY, { align: "center" });
      cursorY += 20;
      doc.setFontSize(11);
      doc.text(`Job PDF Summary • ${new Date().toLocaleString()}`, pageWidth / 2, cursorY, { align: "center" });
      cursorY += 24;

      autoTable(doc, {
        startY: cursorY,
        head: [["Field", "Value"]],
        body: [
          ["Job Code", fieldValue(d.job.job_code)],
          ["Job Title", fieldValue(d.job.job_title)],
          ["Status", fieldValue(d.job.status)],
          ["Category", fieldValue(d.job.category_id)],
          ["Country", fieldValue(d.job.country_id)],
          ["Vacancy", fieldValue(d.job.vacancy)],
          ["Salary Min", fieldValue(d.job.salary_min)],
          ["Salary Max", fieldValue(d.job.salary_max)],
          ["Partner", fieldValue(d.job.partner_name ?? d.job.partner_id)],
          ["Employment Type", fieldValue(d.job.employment_type_name)],
          ["Work Mode", fieldValue(d.job.work_mode_name)],
          ["Currency", fieldValue(d.job.currency_code ?? d.job.currency_name)],
          ["Min Education", fieldValue(d.job.min_education)],
          ["Skills", fieldValue(d.job.skills)],
          ["Experience", fieldValue(d.job.min_experience)],
          ["Age Range", [d.job.min_age, d.job.max_age].filter(Boolean).join(" - ") || "-"],
          ["Gender", fieldValue(d.job.gender_requirement)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
        columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: "auto" } },
      });

      const req = (d.requirements ?? []).map((r) => [String(r.requirement_id), r.requirement]);
      const ben = (d.benefits ?? []).map((b) => [String(b.benefit_id), b.benefit]);
      const docs = [
        ...(d.documents ?? []).map((x) => [String(x.document_type_id), `${x.document_name}${Number(x.is_required) ? " (Required)" : ""}`]),
        ...(d.job_specific_documents ?? []).map((x) => [String(x.id), `${x.document_name}${Number(x.is_required) ? " (Required)" : ""}`]),
      ];

      if (req.length) {
        autoTable(doc, {
          startY: (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 16 : cursorY + 200,
          head: [["Requirements ID", "Requirement"]],
          body: req,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [47, 122, 63] },
        });
      }
      if (ben.length) {
        autoTable(doc, {
          startY: (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 16 : cursorY + 260,
          head: [["Benefit ID", "Benefit"]],
          body: ben,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [66, 88, 104] },
        });
      }
      if (docs.length) {
        autoTable(doc, {
          startY: (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 16 : cursorY + 320,
          head: [["Doc ID", "Document"]],
          body: docs,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [102, 102, 102] },
        });
      }

      doc.save(`${sanitizeFileName(`${row.job_title}-${row.job_code ?? row.job_id}`)}.pdf`);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setToast({ open: true, message: apiErr?.message ?? "Failed to download job PDF", severity: "error" });
    } finally {
      setPdfBusy(false);
    }
  };

  const cols = useMemo(
    () => [
      { field: "job_code", headerName: "Job Code", width: 120 },
      { field: "job_title", headerName: "Job Title", flex: 1.2, minWidth: 200 },
      { field: "partner_name", headerName: "Partner", flex: 0.9, minWidth: 160 },
      { field: "country_name", headerName: "Country", flex: 0.8, minWidth: 140 },
      { field: "vacancy", headerName: "Vacancy", width: 100 },
      { field: "salary_min", headerName: "Salary Min", width: 120 },
      { field: "salary_max", headerName: "Salary Max", width: 120 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p: any) => {
          const status = String(p.value ?? "");
          const normalized = normalizeStatus(status);
          const color = normalized === "open" ? "success" : normalized === "draft" ? "warning" : normalized === "closed" ? "default" : "info";
          return <Chip size="small" label={status || "—"} color={color as any} />;
        },
      },
      { field: "created_at", headerName: "Created", width: 130, valueFormatter: (p: any) => shortDate(p.value) },
      {
        field: "__actions",
        headerName: "Actions",
        width: 190,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as JobListRow;
          return (
            <Stack direction="row" spacing={0.5}>
              <IconButton aria-label="view job" size="small" onClick={() => openDetail(r.job_id)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="download job pdf" size="small" onClick={() => downloadSingleJobPdf(r)} disabled={pdfBusy}>
                <PictureAsPdfIcon fontSize="small" />
              </IconButton>
            </Stack>
          );
        },
      },
    ],
    [pdfBusy],
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Total Job List
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            Browse all jobs visible to the associate partner and export them to Excel or PDF.
          </Typography>
        </Box>

        {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
          <MetricCard label="Total Jobs" value={rows.length} />
          <MetricCard label="Open Jobs" value={rows.filter((r) => normalizeStatus(r.status) === "open").length} />
          <MetricCard label="Draft / Closed" value={rows.filter((r) => ["draft", "closed"].includes(normalizeStatus(r.status))).length} />
        </Box>

        <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25, gap: 1, flexWrap: "wrap" }}>
            <Box>
              <Typography fontWeight={900}>Report Actions</Typography>
              <Typography variant="body2" color="text.secondary">
                Use the grid toolbar to export all jobs, or use the row actions for a single job PDF.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<TableViewIcon />} onClick={refresh} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2 }}>
                Refresh
              </Button>
            </Stack>
          </Box>

          <AdGrid
            rows={rows.map((r) => ({ id: r.job_id, ...r }))}
            columns={cols as any}
            loading={loading}
            showExport
            exportFileName="Associate-Total-Job-List"
            pdfBrandingText="SIS Global Connect"
            pdfTitle="Associate Total Job List"
            disableColumnMenu
            sx={{ minWidth: 0 }}
          />
        </AdCard>
      </Stack>

      <AdModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detail?.job?.job_title ?? "Job Detail"}
        actions={
          <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
            <Button variant="text" onClick={() => setDetailOpen(false)} sx={{ textTransform: "none", fontWeight: 800 }}>
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              disabled={!detail || detailLoading || !activeJobId}
              onClick={() => {
                const row = rows.find((r) => r.job_id === activeJobId);
                if (row) downloadSingleJobPdf(row);
              }}
              sx={{ textTransform: "none", fontWeight: 850, borderRadius: 2 }}
            >
              Download PDF
            </Button>
          </Stack>
        }
      >
        {detailLoading ? (
          <Box sx={{ py: 3 }}>
            <Typography fontWeight={800}>Loading job details...</Typography>
          </Box>
        ) : detail ? (
          <Stack spacing={2}>
            <Card variant="outlined" sx={{ borderRadius: 0 }}>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography fontWeight={950} variant="h6">
                      {detail.job.job_title}
                    </Typography>
                    <Chip size="small" label={detail.job.status ?? "Unknown"} />
                    <Chip size="small" variant="outlined" label={detail.job.job_code ?? `Job #${detail.job.job_id}`} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {detail.job.partner_name ?? "Partner job"} • {detail.job.country_id ?? "No country"} • Vacancy {detail.job.vacancy ?? "-"}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <PreviewSection title="Job Snapshot">
              <GridFields
                items={[
                  ["Category", fieldValue(detail.job.category_id)],
                  ["Employment", fieldValue(detail.job.employment_type_name)],
                  ["Work Mode", fieldValue(detail.job.work_mode_name)],
                  ["Currency", fieldValue(detail.job.currency_code ?? detail.job.currency_name)],
                  ["Salary Min", fieldValue(detail.job.salary_min)],
                  ["Salary Max", fieldValue(detail.job.salary_max)],
                  ["Min Education", fieldValue(detail.job.min_education)],
                  ["Skills", fieldValue(detail.job.skills)],
                  ["Min Experience", fieldValue(detail.job.min_experience)],
                  ["Age Range", [detail.job.min_age, detail.job.max_age].filter(Boolean).join(" - ") || "-"],
                  ["Gender", fieldValue(detail.job.gender_requirement)],
                ]}
              />
            </PreviewSection>

            <PreviewSection title="Requirements and Benefits">
              <GridFields
                items={[
                  ["Requirements", fieldValue(detail.requirements.map((r) => r.requirement))],
                  ["Benefits", fieldValue(detail.benefits.map((b) => b.benefit))],
                ]}
              />
            </PreviewSection>

            <PreviewSection title="Documents">
              <GridFields
                items={[
                  ["Master Docs", fieldValue(detail.documents.map((d) => `${d.document_name}${Number(d.is_required) ? " (Required)" : ""}`))],
                  ["Job Specific Docs", fieldValue(detail.job_specific_documents.map((d) => `${d.document_name}${Number(d.is_required) ? " (Required)" : ""}`))],
                ]}
              />
            </PreviewSection>
          </Stack>
        ) : (
          <Box sx={{ py: 3 }}>
            <Typography fontWeight={800}>No detail available</Typography>
          </Box>
        )}
      </AdModal>
    </Box>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 0, borderColor: "rgba(15, 23, 42, 0.10)", bgcolor: "#fff", boxShadow: "0 12px 40px rgba(15, 23, 42, 0.04)" }}>
      <CardContent sx={{ p: { xs: 1.25, md: 1.4 } }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={950}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 0 }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography fontWeight={900}>{title}</Typography>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

function GridFields({ items }: { items: Array<[string, string]> }) {
  return (
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
      {items.map(([label, value]) => (
        <Box key={label} sx={{ p: 1.1, border: "1px solid", borderColor: "rgba(15, 23, 42, 0.10)", borderRadius: 0, bgcolor: "#fff" }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography fontWeight={800} sx={{ mt: 0.2 }}>
            {value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
