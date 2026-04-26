import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import { useNavigate } from "react-router-dom";
import { AdButton, AdDropDown, AdNotification, AdTextArea } from "../../common/ad";
import { ticketsApi, type TicketDetail, type TicketMeta, type TicketRow } from "../../common/services/ticketsApi";
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

function relationText(row: TicketDetail | null | undefined) {
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

export default function TicketStatusPage() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState<TicketMeta | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [commentDraft, setCommentDraft] = useState("");
  const [toast, setToast] = useState<ToastState>({ open: false, message: "", severity: "success" });

  const ticketOptions = useMemo(
    () =>
      tickets.map((t) => ({
        label: `${t.ticket_code} - ${t.subject}`,
        value: String(t.ticket_id),
      })),
    [tickets],
  );

  const statusActions = useMemo(() => {
    if (!detail) return [];
    return (meta?.statuses ?? []).filter((s) =>
      ["RESOLVED", "CLOSED", "REOPENED", "IN_PROGRESS", "ESCALATED"].includes(normalize(s.ticket_status_code)),
    );
  }, [detail, meta?.statuses]);

  const loadList = async () => {
    setLoading(true);
    try {
      const [metaRes, ticketRes] = await Promise.all([ticketsApi.meta(), ticketsApi.list()]);
      setMeta(metaRes);
      setTickets(ticketRes);
      if (ticketRes.length && !selectedTicketId) {
        setSelectedTicketId(String(ticketRes[0].ticket_id));
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
    setDetailLoading(true);
    try {
      const data = await ticketsApi.get(ticketId);
      setDetail(data);
      setSelectedStatus(data.ticket_status_code);
      setCommentDraft("");
    } catch (e) {
      setToast({
        open: true,
        message: (e as any)?.message ?? "Failed to load ticket details",
        severity: "error",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ticketId = Number(selectedTicketId);
    if (!selectedTicketId || !Number.isFinite(ticketId)) {
      setDetail(null);
      return;
    }
    void loadDetail(ticketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicketId]);

  const saveComment = async () => {
    if (!detail || !String(commentDraft).trim()) return;
    setCommentSaving(true);
    try {
      await ticketsApi.comments.add(detail.ticket_id, commentDraft);
      setToast({ open: true, message: "Comment added", severity: "success" });
      setCommentDraft("");
      await loadDetail(detail.ticket_id);
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

  const changeStatus = async (statusCode: string) => {
    if (!detail) return;
    setSaving(true);
    try {
      await ticketsApi.updateStatus(detail.ticket_id, { ticket_status_code: statusCode });
      setToast({ open: true, message: `Status updated to ${statusCode.replace(/_/g, " ")}`, severity: "success" });
      await loadDetail(detail.ticket_id);
    } catch (e) {
      setToast({
        open: true,
        message: (e as any)?.message ?? "Failed to update status",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <AdNotification
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <Stack spacing={1.5}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Ticket Status
          </Typography>
          <AdButton variant="text" onClick={() => navigate(withPortalBase("/employees/helpdesk/open-ticket"))}>
            Back to List
          </AdButton>
        </Box>

        {loading ? (
          <Alert severity="info">Loading tickets...</Alert>
        ) : (
          <Stack spacing={1.25}>
            <AdDropDown
              variant="standard"
              label="Select Ticket"
              value={selectedTicketId}
              options={ticketOptions}
              onChange={(value) => setSelectedTicketId(String(value))}
            />

            {detailLoading ? (
              <Alert severity="info">Loading ticket details...</Alert>
            ) : !detail ? (
              <Alert severity="warning">Select a ticket to view its detail.</Alert>
            ) : (
              <Stack spacing={1.5}>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Ticket</Typography>
                        <Typography fontWeight={800}>{detail.ticket_code}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Type</Typography>
                        <Typography fontWeight={800}>{detail.ticket_type_name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Status</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip size="small" label={detail.ticket_status_name} color={statusColor(detail.ticket_status_code) as any} />
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Priority</Typography>
                        <Typography fontWeight={800}>{detail.priority ?? "Normal"}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ mt: 1.25 }}>
                      <Typography variant="caption" color="text.secondary">Relation</Typography>
                      <Typography fontWeight={800} sx={{ fontSize: 14 }}>
                        {relationText(detail)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.25 }}>
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography fontWeight={900} sx={{ mb: 1 }}>Action</Typography>
                      <Stack spacing={1}>
                        <AdDropDown
                          variant="standard"
                          label="Status"
                          value={selectedStatus || detail.ticket_status_code}
                          options={statusActions.map((s) => ({ label: s.ticket_status_name, value: s.ticket_status_code }))}
                          onChange={(value) => setSelectedStatus(String(value))}
                        />
                        <AdButton
                          loading={saving}
                          onClick={() => selectedStatus && selectedStatus !== detail.ticket_status_code ? changeStatus(selectedStatus) : undefined}
                        >
                          Save Status
                        </AdButton>
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
                    <Stack spacing={1}>
                      {detail.comments.length ? (
                        detail.comments.map((c) => (
                          <Box key={c.ticket_comment_id} sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1 }}>
                            <Typography fontWeight={800} sx={{ lineHeight: 1.2 }}>{c.username ?? `User ${c.user_id}`}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {c.role_code ?? "Unknown"} • {prettyDate(c.created_at)}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>{c.comment}</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">No comments yet.</Typography>
                      )}
                      <AdTextArea label="Add Comment" minRows={3} value={commentDraft} onChange={(value) => setCommentDraft(String(value))} />
                      <Stack direction="row" justifyContent="flex-end">
                        <AdButton startIcon={<CommentIcon fontSize="small" />} onClick={saveComment} loading={commentSaving}>
                          Add
                        </AdButton>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
