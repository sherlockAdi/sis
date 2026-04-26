import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Stack,
  Tab,
  Tabs,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useLocation, useNavigate } from "react-router-dom";
import { AdButton, AdGrid, AdNotification } from "../../common/ad";
import { ticketsApi, type TicketMeta, type TicketRow } from "../../common/services/ticketsApi";
import { withPortalBase } from "../../common/paths";

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

function statusColor(status: string | null | undefined) {
  const s = normalize(status);
  if (["OPEN", "REOPENED"].includes(s)) return "info";
  if (["IN PROGRESS", "IN_PROGRESS"].includes(s)) return "warning";
  if (["RESOLVED"].includes(s)) return "success";
  if (["ESCALATED"].includes(s)) return "error";
  if (["CLOSED"].includes(s)) return "default";
  return "default";
}

function prettyDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function relationText(row: TicketRow | null | undefined) {
  if (!row) return "Unlinked";
  const pieces = [
    row.related_job_title ? `Job: ${row.related_job_title}` : row.related_job_id ? `Job #${row.related_job_id}` : "",
    row.related_candidate_name ? `Candidate: ${row.related_candidate_name}` : row.related_candidate_id ? `Candidate #${row.related_candidate_id}` : "",
    row.related_employee_name ? `Employee: ${row.related_employee_name}` : row.related_employee_id ? `Employee #${row.related_employee_id}` : "",
    row.related_deployment_id ? `Deployment #${row.related_deployment_id}` : "",
  ].filter(Boolean);
  return pieces.length ? pieces.join(" • ") : "Unlinked";
}

export default function TicketListPage() {
  const location = useLocation();
  const [meta, setMeta] = useState<TicketMeta | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [toast, setToast] = useState<ToastState>({ open: false, message: "", severity: "success" });
  const navigate = useNavigate();

  const filteredTickets = useMemo(() => {
    const jobOnly = location.pathname.includes("/partner/helpdesk/job-tickets");
    const scoped = jobOnly ? tickets.filter((t) => Boolean(t.related_job_id)) : tickets;
    if (selectedStatus === "ALL") return scoped;
    return scoped.filter((t) => normalize(t.ticket_status_code) === normalize(selectedStatus));
  }, [location.pathname, selectedStatus, tickets]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [metaRes, ticketRes] = await Promise.all([ticketsApi.meta(), ticketsApi.list()]);
      setMeta(metaRes);
      setTickets(ticketRes);
    } catch (e) {
      setToast({
        open: true,
        message: (e as any)?.message ?? "Failed to load tickets",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [selectedStatus]);

  const columns = [
    { field: "ticket_code", headerName: "Ticket", flex: 0.9, minWidth: 140 },
    { field: "subject", headerName: "Subject", flex: 1.5, minWidth: 220 },
    { field: "ticket_type_name", headerName: "Type", flex: 1, minWidth: 160 },
    {
      field: "ticket_status_name",
      headerName: "Status",
      flex: 0.8,
      minWidth: 140,
      renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "")} color={statusColor(p.value) as any} />,
    },
    { field: "priority", headerName: "Priority", flex: 0.7, minWidth: 120 },
    { field: "relation", headerName: "Relation", flex: 1.3, minWidth: 260, valueGetter: (_: any, row: TicketRow) => relationText(row) },
    {
      field: "created_at",
      headerName: "Created",
      flex: 0.9,
      minWidth: 180,
      valueFormatter: (v: any) => prettyDate(String(v?.value ?? "")),
    },
    {
      field: "updated_at",
      headerName: "Updated",
      flex: 0.9,
      minWidth: 180,
      valueFormatter: (v: any) => prettyDate(String(v?.value ?? "")),
    },
    {
      field: "detail",
      headerName: "Detail",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (p: any) => (
        <AdButton
          variant="text"
          size="small"
          startIcon={<OpenInNewIcon fontSize="small" />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(withPortalBase(`/employees/helpdesk/ticket/${p.row.ticket_id}`));
          }}
        >
          Open
        </AdButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Stack spacing={2}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Tabs
            value={selectedStatus}
            onChange={(_, value) => setSelectedStatus(String(value))}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 36 }}
          >
            <Tab value="ALL" label="All" sx={{ minHeight: 36 }} />
            {(meta?.statuses ?? []).map((s) => (
              <Tab key={s.ticket_status_id} value={s.ticket_status_code} label={s.ticket_status_name} sx={{ minHeight: 36 }} />
            ))}
          </Tabs>
          <AdButton
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => navigate(withPortalBase("/helpdesk/create"))}
          >
            Create Token
          </AdButton>
        </Box>

        {loading ? (
          <Alert severity="info">Loading tickets...</Alert>
        ) : (
          <AdGrid
            rows={filteredTickets.map((r) => ({ id: r.ticket_id, ...r }))}
            columns={columns as any}
            loading={loading}
            showExport={false}
            disableColumnMenu
            autoHeight
            pageSizeOptions={[10, 20, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          />
        )}
      </Stack>

      <AdNotification
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </Box>
  );
}
