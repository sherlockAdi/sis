import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { useAuth } from "../../common/auth/AuthContext";
import { partnersApi, type PartnerRow } from "../../common/services/partnersApi";
import { workforceApi, type LeaveRequestRow } from "../../common/services/workforceApi";

type ReviewAction = "approve" | "reject";

function statusColor(status: LeaveRequestRow["status"]) {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "error";
  if (status === "CANCELLED") return "default";
  return "warning";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(from: string | null | undefined, to: string | null | undefined) {
  if (!from) return "—";
  if (!to || from === to) return formatDate(from);
  return `${formatDate(from)} - ${formatDate(to)}`;
}

export default function LeaveRequestsPage() {
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
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [requests, setRequests] = useState<LeaveRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<ReviewAction>("approve");
  const [reviewRequest, setReviewRequest] = useState<LeaveRequestRow | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [savingReview, setSavingReview] = useState(false);

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

  const filteredRequests = useMemo(() => {
    if (statusFilter === "ALL") return requests;
    return requests.filter((row) => row.status === statusFilter);
  }, [requests, statusFilter]);

  const refreshPartners = async () => {
    if (!isAdminLike) return;
    try {
      setPartners(await partnersApi.list(true));
    } catch {
      setPartners([]);
    }
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await workforceApi.leaveRequests.list({ partner_id: partnerIdNumber }));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshPartners();
  }, [isAdminLike]);

  useEffect(() => {
    if (!isAdminLike && !currentPartnerId) setError("Partner profile not found for this user.");
  }, [currentPartnerId, isAdminLike]);

  useEffect(() => {
    void refresh();
  }, [partnerIdNumber]);

  const openReview = (row: LeaveRequestRow, action: ReviewAction) => {
    setReviewRequest(row);
    setReviewAction(action);
    setReviewRemarks(row.approval_remarks ?? "");
    setReviewModal(true);
  };

  const saveReview = async () => {
    if (!reviewRequest) return;
    setSavingReview(true);
    try {
      if (reviewAction === "approve") {
        await workforceApi.leaveRequests.approve(reviewRequest.leave_request_id, {
          approval_remarks: reviewRemarks.trim() || null,
        });
      } else {
        await workforceApi.leaveRequests.reject(reviewRequest.leave_request_id, {
          approval_remarks: reviewRemarks.trim() || null,
        });
      }
      setToast({
        open: true,
        message: reviewAction === "approve" ? "Leave request approved." : "Leave request rejected.",
        severity: "success",
      });
      setReviewModal(false);
      await refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to update leave request", severity: "error" });
    } finally {
      setSavingReview(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "__employee",
        headerName: "Employee",
        flex: 1,
        minWidth: 220,
        renderCell: (p: any) => {
          const name = String(p.row.employee_name ?? "—");
          const code = String(p.row.employee_code ?? "");
          return (
            <Stack spacing={0.25}>
              <Typography variant="body2" fontWeight={700}>
                {name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {code ? code : "No code"}
              </Typography>
            </Stack>
          );
        },
      },
      { field: "leave_name", headerName: "Leave Type", flex: 1, minWidth: 180 },
      {
        field: "__dates",
        headerName: "Leave Dates",
        flex: 1,
        minWidth: 190,
        renderCell: (p: any) => formatDateRange(p.row.leave_from, p.row.leave_to),
      },
      { field: "leave_mode", headerName: "Mode", width: 120 },
      { field: "days_requested", headerName: "Days", width: 90 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "").toUpperCase()} color={statusColor(p.value)} />,
      },
      { field: "reason", headerName: "Reason", flex: 1, minWidth: 220 },
      { field: "approval_remarks", headerName: "Approval Remarks", flex: 1, minWidth: 220 },
      {
        field: "approved_at",
        headerName: "Updated",
        width: 140,
        renderCell: (p: any) => formatDate(p.value),
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 190,
        renderCell: (p: any) => {
          const row = p.row as LeaveRequestRow;
          const pending = row.status === "PENDING";
          return pending ? (
            <Stack direction="row" spacing={1}>
              <AdButton variant="text" startIcon={<CheckIcon fontSize="small" />} onClick={() => openReview(row, "approve")}>
                Approve
              </AdButton>
              <AdButton variant="text" color="error" startIcon={<CloseIcon fontSize="small" />} onClick={() => openReview(row, "reject")}>
                Reject
              </AdButton>
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
          );
        },
      },
    ],
    [],
  );

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <AdCard animate={false} contentSx={{ p: 2.25 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(320px, 460px)" },
            alignItems: "end",
          }}
        >
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={900}>
              Leave Requests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and approve leave requests for the selected employer
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
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
              ) : (
                <Chip size="small" label={`Partner #${currentPartnerId || "N/A"}`} color="primary" />
              )}
            </Stack>
          </Stack>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="flex-end"
            justifyContent={{ xs: "flex-start", lg: "flex-end" }}
            flexWrap="wrap"
            sx={{ "& > *": { minWidth: 150 } }}
          >
            <Box sx={{ minWidth: 150 }}>
              <AdDropDown
                label="Status"
                variant="standard"
                options={[
                  { label: "All", value: "ALL" },
                  { label: "Pending", value: "PENDING" },
                  { label: "Approved", value: "APPROVED" },
                  { label: "Rejected", value: "REJECTED" },
                  { label: "Cancelled", value: "CANCELLED" },
                ]}
                value={statusFilter}
                onChange={(v) => setStatusFilter(String(v))}
              />
            </Box>
            <AdButton startIcon={<RefreshIcon fontSize="small" />} onClick={refresh}>
              Refresh
            </AdButton>
          </Stack>
        </Box>
      </AdCard>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} contentSx={{ p: 0 }}>
        <AdGrid rows={filteredRequests.map((r) => ({ id: r.leave_request_id, ...r }))} columns={columns as any} loading={loading} disableColumnMenu autoHeight />
      </AdCard>

      <AdModal
        open={reviewModal}
        onClose={() => setReviewModal(false)}
        title={reviewAction === "approve" ? "Approve Leave Request" : "Reject Leave Request"}
        maxWidth="sm"
        actions={
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" onClick={() => setReviewModal(false)}>
              Cancel
            </AdButton>
            <AdButton
              color={reviewAction === "approve" ? "primary" : "error"}
              startIcon={reviewAction === "approve" ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
              onClick={saveReview}
              disabled={savingReview}
            >
              {savingReview ? "Saving..." : reviewAction === "approve" ? "Approve" : "Reject"}
            </AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {reviewRequest
              ? `${reviewRequest.employee_name ?? "Employee"} • ${reviewRequest.leave_name ?? "Leave"} • ${formatDateRange(reviewRequest.leave_from, reviewRequest.leave_to)}`
              : ""}
          </Typography>
          <AdTextBox
            variant="standard"
            label={reviewAction === "approve" ? "Approval Remarks" : "Rejection Remarks"}
            value={reviewRemarks}
            onChange={(v) => setReviewRemarks(v)}
            placeholder="Add a note for the request"
          />
        </Stack>
      </AdModal>
    </Stack>
  );
}
