import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import CommentIcon from "@mui/icons-material/Comment";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { AdButton, AdCard, AdDropDown, AdGrid, AdNotification, AdTextArea, AdTextBox } from "../../common/ad";
import { me as getMe, type MeResponse } from "../../common/services/authApi";
import { ticketsApi, type TicketDetail, type TicketMeta, type TicketRow } from "../../common/services/ticketsApi";
import { useLocation, useParams } from "react-router-dom";

type TicketForm = {
  ticket_type_id: number | "";
  subject: string;
  description: string;
  priority: string;
  related_job_id: string;
  related_deployment_id: string;
  related_candidate_id: string;
  related_employee_id: string;
};

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

const priorityOptions = [
  { label: "Low", value: "Low" },
  { label: "Normal", value: "Normal" },
  { label: "High", value: "High" },
  { label: "Urgent", value: "Urgent" },
];

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

function relationText(row: TicketRow | TicketDetail | null | undefined) {
  if (!row) return "Unlinked";
  const pieces = [
    row.related_job_title ? `Job: ${row.related_job_title}` : row.related_job_id ? `Job #${row.related_job_id}` : "",
    row.related_candidate_name ? `Candidate: ${row.related_candidate_name}` : row.related_candidate_id ? `Candidate #${row.related_candidate_id}` : "",
    row.related_employee_name ? `Employee: ${row.related_employee_name}` : row.related_employee_id ? `Employee #${row.related_employee_id}` : "",
    row.related_deployment_id ? `Deployment #${row.related_deployment_id}` : "",
  ].filter(Boolean);
  return pieces.length ? pieces.join(" • ") : "Unlinked";
}

function prettyDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function TicketCenterPage() {
  const params = useParams<{ ticketId?: string }>();
  const location = useLocation();
  const isEscalationsPage = location.pathname.includes("/helpdesk/escalations");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meta, setMeta] = useState<TicketMeta | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [editForm, setEditForm] = useState<TicketForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({ open: false, message: "", severity: "success" });
  const [form, setForm] = useState<TicketForm>({
    ticket_type_id: "",
    subject: "",
    description: "",
    priority: "Normal",
    related_job_id: "",
    related_deployment_id: "",
    related_candidate_id: "",
    related_employee_id: "",
  });

  const ticketTypeOptions = useMemo(() => {
    const allowed = (meta?.types ?? []).filter((t) => Number(t.can_create) === 1);
    if (allowed.length > 0) return allowed;
    return meta?.types ?? [];
  }, [meta?.types]);

  const filteredTickets = useMemo(() => {
    if (isEscalationsPage) return tickets.filter((t) => normalize(t.ticket_status_code) === "ESCALATED");
    if (selectedStatus === "ALL") return tickets;
    return tickets.filter((t) => normalize(t.ticket_status_code) === normalize(selectedStatus));
  }, [isEscalationsPage, selectedStatus, tickets]);

  const stats = useMemo(() => {
    const open = tickets.filter((t) => normalize(t.ticket_status_code) === "OPEN").length;
    const progress = tickets.filter((t) => normalize(t.ticket_status_code) === "IN_PROGRESS").length;
    const resolved = tickets.filter((t) => normalize(t.ticket_status_code) === "RESOLVED").length;
    return { total: tickets.length, open, progress, resolved };
  }, [tickets]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [profile, metaRes, ticketRes] = await Promise.all([
        getMe(),
        ticketsApi.meta(),
        ticketsApi.list(),
      ]);
      setMe(profile);
      setMeta(metaRes);
      setTickets(ticketRes);
      if (!isEscalationsPage && !selectedTicketId && ticketRes[0]) {
        setSelectedTicketId(ticketRes[0].ticket_id);
      }
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

  const loadDetail = async (ticketId: number) => {
    if (isEscalationsPage) return;
    try {
      const data = await ticketsApi.get(ticketId);
      setDetail(data);
      setEditForm({
        ticket_type_id: data.ticket_type_id,
        subject: data.subject ?? "",
        description: data.description ?? "",
        priority: data.priority ?? "Normal",
        related_job_id: data.related_job_id ? String(data.related_job_id) : "",
        related_deployment_id: data.related_deployment_id ? String(data.related_deployment_id) : "",
        related_candidate_id: data.related_candidate_id ? String(data.related_candidate_id) : "",
        related_employee_id: data.related_employee_id ? String(data.related_employee_id) : "",
      });
      setCommentDraft("");
    } catch (e) {
      setToast({
        open: true,
        message: (e as any)?.message ?? "Failed to load ticket details",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, isEscalationsPage]);

  useEffect(() => {
    const ticketId = params.ticketId ? Number(params.ticketId) : null;
    if (ticketId && Number.isFinite(ticketId)) {
      setSelectedTicketId(ticketId);
    }
  }, [params.ticketId]);

  useEffect(() => {
    if (isEscalationsPage) return;
    if (selectedTicketId) void loadDetail(selectedTicketId);
    else setDetail(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEscalationsPage, selectedTicketId]);

  const saveTicket = async () => {
    if (!form.ticket_type_id || !String(form.subject).trim()) {
      setToast({ open: true, message: "Ticket type and subject are required", severity: "warning" });
      return;
    }
    setSaving(true);
    try {
      const created = await ticketsApi.create({
        ticket_type_id: Number(form.ticket_type_id),
        subject: form.subject,
        description: form.description || null,
        priority: form.priority,
        related_job_id: form.related_job_id ? Number(form.related_job_id) : null,
        related_deployment_id: form.related_deployment_id ? Number(form.related_deployment_id) : null,
        related_candidate_id: form.related_candidate_id ? Number(form.related_candidate_id) : null,
        related_employee_id: form.related_employee_id ? Number(form.related_employee_id) : null,
      });

      setToast({ open: true, message: `Ticket ${created.ticket_code} created`, severity: "success" });
      setForm({
        ticket_type_id: "",
        subject: "",
        description: "",
        priority: "Normal",
        related_job_id: "",
        related_deployment_id: "",
        related_candidate_id: "",
        related_employee_id: "",
      });
      await refresh();
      setSelectedTicketId(created.ticket_id);
    } catch (e) {
      setToast({
        open: true,
        message: (e as any)?.message ?? "Failed to create ticket",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveComment = async () => {
    if (!selectedTicketId || !String(commentDraft).trim()) return;
    setCommentSaving(true);
    try {
      await ticketsApi.comments.add(selectedTicketId, commentDraft);
      setToast({ open: true, message: "Comment added", severity: "success" });
      setCommentDraft("");
      await loadDetail(selectedTicketId);
    } catch (e) {
      setToast({
        open: true,
        message: (e as any)?.message ?? "Failed to add comment",
        severity: "error",
      });
    } finally {
      setCommentSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!selectedTicketId || !detail || !editForm || !String(editForm.subject).trim()) {
      setToast({ open: true, message: "Subject is required", severity: "warning" });
      return;
    }
    setEditSaving(true);
    try {
      await ticketsApi.update(selectedTicketId, {
        subject: editForm.subject,
        description: editForm.description || null,
        priority: editForm.priority,
        related_job_id: editForm.related_job_id ? Number(editForm.related_job_id) : null,
        related_deployment_id: editForm.related_deployment_id ? Number(editForm.related_deployment_id) : null,
        related_candidate_id: editForm.related_candidate_id ? Number(editForm.related_candidate_id) : null,
        related_employee_id: editForm.related_employee_id ? Number(editForm.related_employee_id) : null,
      });
      setToast({ open: true, message: "Ticket updated", severity: "success" });
      await refresh();
      await loadDetail(selectedTicketId);
    } catch (e) {
      setToast({
        open: true,
        message: (e as any)?.message ?? "Failed to update ticket",
        severity: "error",
      });
    } finally {
      setEditSaving(false);
    }
  };

  const changeStatus = async (ticketId: number, statusCode: string) => {
    try {
      await ticketsApi.updateStatus(ticketId, { ticket_status_code: statusCode });
      setToast({ open: true, message: `Status updated to ${statusCode.replace(/_/g, " ")}`, severity: "success" });
      await refresh();
      await loadDetail(ticketId);
    } catch (e) {
      setToast({
        open: true,
        message: (e as any)?.message ?? "Failed to update status",
        severity: "error",
      });
    }
  };

  const columns = [
    {
      field: "ticket_code",
      headerName: "Ticket",
      flex: 0.9,
      minWidth: 140,
    },
    {
      field: "subject",
      headerName: "Subject",
      flex: 1.4,
      minWidth: 220,
    },
    {
      field: "ticket_type_name",
      headerName: "Type",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "ticket_status_name",
      headerName: "Status",
      flex: 0.8,
      minWidth: 140,
      renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "")} color={statusColor(p.value) as any} />,
    },
    {
      field: "priority",
      headerName: "Priority",
      flex: 0.7,
      minWidth: 120,
    },
    {
      field: "relation",
      headerName: "Relation",
      flex: 1.4,
      minWidth: 260,
      valueGetter: (_: any, row: TicketRow) => relationText(row),
    },
    {
      field: "updated_at",
      headerName: "Updated",
      flex: 0.9,
      minWidth: 180,
      valueFormatter: (v: any) => prettyDate(String(v?.value ?? "")),
    },
    {
      field: "open",
      headerName: "Open",
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (p: any) => (
        <AdButton
          variant="text"
          size="small"
          startIcon={<OpenInNewIcon fontSize="small" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTicketId(Number(p.row.ticket_id));
          }}
        >
          View
        </AdButton>
      ),
    },
  ];
  const escalationColumns = columns.filter((column: any) => column.field !== "open");

  return (
    isEscalationsPage ? (
      <Box sx={{ p: { xs: 1, md: 2 } }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Escalations
            </Typography>
            <Typography sx={{ mt: 0.25, color: "text.secondary" }}>
              Only escalated helpdesk tickets are shown here.
            </Typography>
          </Box>

          {loading ? (
            <Alert severity="info">Loading escalations...</Alert>
          ) : (
            <AdGrid
              rows={filteredTickets.map((r) => ({ id: r.ticket_id, ...r }))}
              columns={escalationColumns as any}
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
    ) : (
    <Container maxWidth="xl" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.25}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Ticketing & Helpdesk
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            {me?.role_code ? `${me.role_code} portal` : "Portal"} tickets, comments, and tracking in one place.
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total</Typography>
              <Typography variant="h5" fontWeight={950}>{stats.total}</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Open</Typography>
              <Typography variant="h5" fontWeight={950}>{stats.open}</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">In Progress</Typography>
              <Typography variant="h5" fontWeight={950}>{stats.progress}</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Resolved</Typography>
              <Typography variant="h5" fontWeight={950}>{stats.resolved}</Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "380px 1fr" }, gap: 2 }}>
          <AdCard>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Raise Ticket
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Submit helpdesk issues, job clarifications, or support requests.
                </Typography>
              </Box>

              <Stack spacing={1.4}>
                <AdDropDown
                  label="Ticket Type"
                  required
                  value={form.ticket_type_id}
                  options={ticketTypeOptions.map((t) => ({ label: t.ticket_type_name, value: t.ticket_type_id }))}
                  onChange={(value) => setForm((prev) => ({ ...prev, ticket_type_id: Number(value) || "" }))}
                />
                <AdTextBox label="Subject" required value={form.subject} onChange={(value) => setForm((prev) => ({ ...prev, subject: String(value) }))} />
                <AdTextArea label="Description" minRows={4} value={form.description} onChange={(value) => setForm((prev) => ({ ...prev, description: String(value) }))} />
                <AdDropDown
                  label="Priority"
                  value={form.priority}
                  options={priorityOptions}
                  onChange={(value) => setForm((prev) => ({ ...prev, priority: String(value) }))}
                />
                <Divider />
                <Typography variant="subtitle2" fontWeight={900}>
                  Optional Links
                </Typography>
                <AdTextBox label="Job ID" type="number" value={form.related_job_id} onChange={(value) => setForm((prev) => ({ ...prev, related_job_id: String(value) }))} />
                <AdTextBox label="Deployment ID" type="number" value={form.related_deployment_id} onChange={(value) => setForm((prev) => ({ ...prev, related_deployment_id: String(value) }))} />
                <AdTextBox label="Candidate ID" type="number" value={form.related_candidate_id} onChange={(value) => setForm((prev) => ({ ...prev, related_candidate_id: String(value) }))} />
                <AdTextBox label="Employee ID" type="number" value={form.related_employee_id} onChange={(value) => setForm((prev) => ({ ...prev, related_employee_id: String(value) }))} />
              </Stack>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <AdButton startIcon={<RefreshIcon fontSize="small" />} variant="text" onClick={refresh} disabled={loading}>
                  Refresh
                </AdButton>
                <AdButton startIcon={<AddIcon fontSize="small" />} onClick={saveTicket} loading={saving}>
                  Create
                </AdButton>
              </Stack>
            </Stack>
          </AdCard>

          <Stack spacing={2}>
            <AdCard>
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="h6" fontWeight={900}>
                      Tickets
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Browse your visible tickets and open any row for details.
                    </Typography>
                  </Box>
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
                    onRowClick={(params) => setSelectedTicketId(Number(params.row.ticket_id))}
                  />
                )}
              </Stack>
            </AdCard>

            <AdCard>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight={900}>
                    Ticket Detail
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {detail ? detail.ticket_code : "Select a ticket to inspect comments, status, and attachments."}
                  </Typography>
                </Box>

                {!detail ? (
                  <Alert severity="info">No ticket selected yet.</Alert>
                ) : (
                  <Stack spacing={2}>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.25 }}>
                      <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">Type</Typography>
                          <Typography fontWeight={900}>{detail.ticket_type_name}</Typography>
                        </CardContent>
                      </Card>
                      <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip size="small" label={detail.ticket_status_name} color={statusColor(detail.ticket_status_code) as any} sx={{ mt: 0.75 }} />
                        </CardContent>
                      </Card>
                      <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">Priority</Typography>
                          <Typography fontWeight={900}>{detail.priority ?? "Normal"}</Typography>
                        </CardContent>
                      </Card>
                    </Box>

                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Subject</Typography>
                        <Typography fontWeight={900}>{detail.subject}</Typography>
                        <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap", color: "text.secondary" }}>
                          {detail.description || "No description provided."}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
                          Relation: {relationText(detail)}
                        </Typography>
                      </CardContent>
                    </Card>

                    {editForm ? (
                      <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Stack spacing={1.5}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                              <Box>
                                <Typography fontWeight={900}>Edit Ticket</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Update the subject, description, priority, or linked records.
                                </Typography>
                              </Box>
                              <AdButton onClick={saveEdit} loading={editSaving}>
                                Save Changes
                              </AdButton>
                            </Box>

                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.25 }}>
                              <AdDropDown
                                variant="standard"
                                label="Priority"
                                value={editForm.priority}
                                options={priorityOptions}
                                onChange={(value) => setEditForm((prev) => prev ? ({ ...prev, priority: String(value) }) : prev)}
                              />
                              <AdTextBox
                                variant="standard"
                                label="Job ID"
                                type="number"
                                size="small"
                                value={editForm.related_job_id}
                                onChange={(value) => setEditForm((prev) => prev ? ({ ...prev, related_job_id: String(value) }) : prev)}
                              />
                              <AdTextBox
                                variant="standard"
                                label="Deployment ID"
                                type="number"
                                size="small"
                                value={editForm.related_deployment_id}
                                onChange={(value) => setEditForm((prev) => prev ? ({ ...prev, related_deployment_id: String(value) }) : prev)}
                              />
                              <AdTextBox
                                variant="standard"
                                label="Candidate ID"
                                type="number"
                                size="small"
                                value={editForm.related_candidate_id}
                                onChange={(value) => setEditForm((prev) => prev ? ({ ...prev, related_candidate_id: String(value) }) : prev)}
                              />
                              <AdTextBox
                                variant="standard"
                                label="Employee ID"
                                type="number"
                                size="small"
                                value={editForm.related_employee_id}
                                onChange={(value) => setEditForm((prev) => prev ? ({ ...prev, related_employee_id: String(value) }) : prev)}
                              />
                              <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" } }}>
                                <AdTextBox
                                  variant="standard"
                                  label="Subject"
                                  required
                                  size="small"
                                  value={editForm.subject}
                                  onChange={(value) => setEditForm((prev) => prev ? ({ ...prev, subject: String(value) }) : prev)}
                                />
                              </Box>
                              <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" } }}>
                                <AdTextArea
                                  label="Description"
                                  minRows={3}
                                  value={editForm.description}
                                  onChange={(value) => setEditForm((prev) => prev ? ({ ...prev, description: String(value) }) : prev)}
                                />
                              </Box>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    ) : null}

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.25 }}>
                      <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Typography fontWeight={900} sx={{ mb: 1 }}>Actions</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {(meta?.statuses ?? [])
                              .filter((s) => ["RESOLVED", "CLOSED", "REOPENED", "IN_PROGRESS", "ESCALATED"].includes(normalize(s.ticket_status_code)))
                              .map((s) => (
                                <AdButton key={s.ticket_status_id} variant="outlined" size="small" onClick={() => changeStatus(detail.ticket_id, s.ticket_status_code)}>
                                  {s.ticket_status_name}
                                </AdButton>
                              ))}
                          </Stack>
                        </CardContent>
                      </Card>

                      <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Typography fontWeight={900} sx={{ mb: 1 }}>Attachments</Typography>
                          {detail.attachments.length ? (
                            <Stack spacing={1}>
                              {detail.attachments.map((a) => (
                                <Box key={a.ticket_attachment_id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                                  <Box>
                                    <Typography fontWeight={700}>{a.file_name || "Attachment"}</Typography>
                                    <Typography variant="caption" color="text.secondary">{a.file_path}</Typography>
                                  </Box>
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No attachments yet.</Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Box>

                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Typography fontWeight={900} sx={{ mb: 1 }}>Comments</Typography>
                        <Stack spacing={1.25}>
                          {detail.comments.length ? (
                            detail.comments.map((c) => (
                              <Box key={c.ticket_comment_id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.25 }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                  <Box>
                                    <Typography fontWeight={800}>{c.username ?? `User ${c.user_id}`}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {c.role_code ?? "Unknown"} • {prettyDate(c.created_at)}
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>{c.comment}</Typography>
                              </Box>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">No comments yet.</Typography>
                          )}

                          <Divider sx={{ my: 0.5 }} />
                          <AdTextArea label="Add Comment" minRows={3} value={commentDraft} onChange={(value) => setCommentDraft(String(value))} />
                          <Stack direction="row" justifyContent="flex-end">
                            <AdButton startIcon={<CommentIcon fontSize="small" />} onClick={saveComment} loading={commentSaving}>
                              Add Comment
                            </AdButton>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                )}
              </Stack>
            </AdCard>
          </Stack>
        </Box>
      </Stack>

      <AdNotification
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </Container>
    )
  );
}
