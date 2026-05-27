import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { useAuth } from "../../common/auth/AuthContext";
import { partnersApi, type PartnerRow } from "../../common/services/partnersApi";
import { workforceApi, type LeavePolicyRow } from "../../common/services/workforceApi";

type PolicyForm = {
  leave_policy_id?: number;
  partner_id: string;
  leave_code: string;
  leave_name: string;
  annual_limit_days: string;
  is_paid: boolean;
  allow_half_day: boolean;
  carry_forward_days: string;
  max_consecutive_days: string;
  min_notice_days: string;
  requires_approval: boolean;
  status: boolean;
};

function num(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function LeavePolicyPage() {
  const { me } = useAuth();
  const role = String(me?.role_code ?? "").toUpperCase();
  const isCandidate = role === "CANDIDATE";
  const isPartner = role === "SOURCING" || role === "PARTNER";
  const isEmployer = role === "EMPLOYER" || role === "CUSTOMER";
  const isAssociate = role === "ASSOCIATE";
  const isEmployee = role === "EMPLOYEE";
  const isAdminLike = !(isCandidate || isPartner || isEmployer || isAssociate || isEmployee);
  const currentPartnerId = String(me?.partner_id ?? "");

  const [partnerId, setPartnerId] = useState("");
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicyRow[]>([]);
  const [policyModal, setPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicyRow | null>(null);
  const [policyForm, setPolicyForm] = useState<PolicyForm>({
    partner_id: "",
    leave_code: "",
    leave_name: "",
    annual_limit_days: "12",
    is_paid: true,
    allow_half_day: true,
    carry_forward_days: "0",
    max_consecutive_days: "0",
    min_notice_days: "0",
    requires_approval: true,
    status: true,
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
      setLeavePolicies(await workforceApi.leavePolicies.list(partnerIdNumber));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load leave policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [partnerIdNumber]);

  useEffect(() => {
    void refreshPartners();
  }, [isAdminLike]);

  useEffect(() => {
    if (!isAdminLike && !currentPartnerId) setError("Partner profile not found for this user.");
  }, [currentPartnerId, isAdminLike]);

  const openPolicyModal = (row?: LeavePolicyRow | null) => {
    setEditingPolicy(row ?? null);
    setPolicyForm({
      partner_id: row ? String(row.partner_id) : isAdminLike ? partnerId : currentPartnerId,
      leave_code: row?.leave_code ?? "",
      leave_name: row?.leave_name ?? "",
      annual_limit_days: String(row?.annual_limit_days ?? 12),
      is_paid: Boolean(row?.is_paid ?? true),
      allow_half_day: Boolean(row?.allow_half_day ?? true),
      carry_forward_days: String(row?.carry_forward_days ?? 0),
      max_consecutive_days: String(row?.max_consecutive_days ?? 0),
      min_notice_days: String(row?.min_notice_days ?? 0),
      requires_approval: Boolean(row?.requires_approval ?? true),
      status: Boolean(row?.status ?? true),
    });
    setPolicyModal(true);
  };

  const savePolicy = async () => {
    const input: {
      partner_id?: number;
      leave_code: string;
      leave_name: string;
      annual_limit_days: number;
      is_paid: boolean;
      allow_half_day: boolean;
      carry_forward_days: number;
      max_consecutive_days: number;
      min_notice_days: number;
      requires_approval: boolean;
      status: boolean;
    } = {
      leave_code: policyForm.leave_code.trim(),
      leave_name: policyForm.leave_name.trim(),
      annual_limit_days: num(policyForm.annual_limit_days) ?? 0,
      is_paid: policyForm.is_paid,
      allow_half_day: policyForm.allow_half_day,
      carry_forward_days: num(policyForm.carry_forward_days) ?? 0,
      max_consecutive_days: num(policyForm.max_consecutive_days) ?? 0,
      min_notice_days: num(policyForm.min_notice_days) ?? 0,
      requires_approval: policyForm.requires_approval,
      status: policyForm.status,
    };

    input.partner_id = num(isAdminLike ? policyForm.partner_id : currentPartnerId) ?? undefined;

    if ((isAdminLike && !input.partner_id) || !input.leave_code || !input.leave_name) {
      setToast({
        open: true,
        message: isAdminLike ? "Partner, code and name are required." : "Code and name are required.",
        severity: "warning",
      });
      return;
    }

    try {
      if (editingPolicy) await workforceApi.leavePolicies.update(editingPolicy.leave_policy_id, input);
      else await workforceApi.leavePolicies.create(input);
      setToast({ open: true, message: "Leave policy saved.", severity: "success" });
      setPolicyModal(false);
      await refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save policy", severity: "error" });
    }
  };

  const policyColumns = useMemo(
    () => [
      { field: "leave_code", headerName: "Code", width: 120 },
      { field: "leave_name", headerName: "Leave Type", flex: 1, minWidth: 180 },
      { field: "annual_limit_days", headerName: "Annual", width: 90 },
      { field: "carry_forward_days", headerName: "Carry Fwd", width: 100 },
      { field: "max_consecutive_days", headerName: "Max Days", width: 100 },
      { field: "min_notice_days", headerName: "Notice", width: 90 },
      { field: "is_paid", headerName: "Paid", width: 90, renderCell: (p: any) => <Chip size="small" label={p.value ? "Yes" : "No"} color={p.value ? "success" : "default"} /> },
      {
        field: "__actions",
        headerName: "Actions",
        width: 170,
        renderCell: (p: any) => (
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => openPolicyModal(p.row as LeavePolicyRow)}>
              Edit
            </AdButton>
            <AdButton
              variant="text"
              color="error"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={async () => {
                await workforceApi.leavePolicies.remove((p.row as LeavePolicyRow).leave_policy_id);
                await refresh();
              }}
            >
              Delete
            </AdButton>
          </Stack>
        ),
      },
    ],
    [isAdminLike, partnerId],
  );

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={2}>
        <Stack spacing={0.25} sx={{ minWidth: 260 }}>
          <Typography variant="h5" fontWeight={900}>
            Leave Policy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Paid and unpaid leave rules for the selected employer
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
          <AdButton startIcon={<SaveIcon fontSize="small" />} onClick={refresh}>
            Load
          </AdButton>
          <AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => openPolicyModal()}>
            New Policy
          </AdButton>
        </Stack>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} contentSx={{ p: 0 }}>
        <AdGrid rows={leavePolicies.map((r) => ({ id: r.leave_policy_id, ...r }))} columns={policyColumns as any} loading={loading} disableColumnMenu autoHeight />
      </AdCard>

      <AdModal
        open={policyModal}
        onClose={() => setPolicyModal(false)}
        title={editingPolicy ? "Edit Leave Policy" : "New Leave Policy"}
        maxWidth="sm"
        actions={<AdButton startIcon={<SaveIcon fontSize="small" />} onClick={savePolicy}>Save</AdButton>}
      >
        <Stack spacing={2}>
          {isAdminLike && (
            <AdDropDown
              label="Partner"
              variant="standard"
              options={partnerOptions}
              value={policyForm.partner_id}
              onChange={(v) => setPolicyForm((f) => ({ ...f, partner_id: String(v) }))}
            />
          )}
          <AdTextBox variant="standard" label="Leave Code" value={policyForm.leave_code} onChange={(v) => setPolicyForm((f) => ({ ...f, leave_code: v }))} />
          <AdTextBox variant="standard" label="Leave Name" value={policyForm.leave_name} onChange={(v) => setPolicyForm((f) => ({ ...f, leave_name: v }))} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <AdTextBox variant="standard" label="Annual Limit" value={policyForm.annual_limit_days} onChange={(v) => setPolicyForm((f) => ({ ...f, annual_limit_days: v }))} />
            <AdTextBox variant="standard" label="Carry Forward" value={policyForm.carry_forward_days} onChange={(v) => setPolicyForm((f) => ({ ...f, carry_forward_days: v }))} />
            <AdTextBox variant="standard" label="Max Consecutive" value={policyForm.max_consecutive_days} onChange={(v) => setPolicyForm((f) => ({ ...f, max_consecutive_days: v }))} />
            <AdTextBox variant="standard" label="Min Notice" value={policyForm.min_notice_days} onChange={(v) => setPolicyForm((f) => ({ ...f, min_notice_days: v }))} />
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" label={policyForm.is_paid ? "Paid" : "Unpaid"} color={policyForm.is_paid ? "success" : "default"} onClick={() => setPolicyForm((f) => ({ ...f, is_paid: !f.is_paid }))} />
            <Chip size="small" label={policyForm.allow_half_day ? "Half day allowed" : "Half day blocked"} color={policyForm.allow_half_day ? "success" : "default"} onClick={() => setPolicyForm((f) => ({ ...f, allow_half_day: !f.allow_half_day }))} />
            <Chip size="small" label={policyForm.requires_approval ? "Approval required" : "Auto-approved"} color={policyForm.requires_approval ? "success" : "default"} onClick={() => setPolicyForm((f) => ({ ...f, requires_approval: !f.requires_approval }))} />
            <Chip size="small" label={policyForm.status ? "Active" : "Inactive"} color={policyForm.status ? "success" : "default"} onClick={() => setPolicyForm((f) => ({ ...f, status: !f.status }))} />
          </Stack>
        </Stack>
      </AdModal>
    </Stack>
  );
}
