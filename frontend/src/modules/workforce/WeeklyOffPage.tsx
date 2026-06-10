import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdDropDownMulti, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { useAuth } from "../../common/auth/AuthContext";
import { partnersApi, type PartnerRow } from "../../common/services/partnersApi";
import { workforceApi, type WeeklyOffRow } from "../../common/services/workforceApi";

type WeeklyForm = {
  weekly_off_rule_id?: number;
  partner_id: string;
  country_id: string;
  rule_name: string;
  off_days: string[];
  effective_from: string;
  effective_to: string;
  status: boolean;
};

const WEEKDAY_OPTIONS = [
  { label: "Monday", value: "MONDAY" },
  { label: "Tuesday", value: "TUESDAY" },
  { label: "Wednesday", value: "WEDNESDAY" },
  { label: "Thursday", value: "THURSDAY" },
  { label: "Friday", value: "FRIDAY" },
  { label: "Saturday", value: "SATURDAY" },
  { label: "Sunday", value: "SUNDAY" },
];

function num(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateCompact(value?: string | null): string {
  if (!value) return "-";
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split("-");
  if (!year || !month || !day) return String(value);
  return `${day}${month}${year.slice(-2)}`;
}

export default function WeeklyOffPage() {
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
  const [weeklyOffs, setWeeklyOffs] = useState<WeeklyOffRow[]>([]);
  const [weeklyModal, setWeeklyModal] = useState(false);
  const [editingWeekly, setEditingWeekly] = useState<WeeklyOffRow | null>(null);
  const [weeklyForm, setWeeklyForm] = useState<WeeklyForm>({
    partner_id: "",
    country_id: "",
    rule_name: "Weekend Rule",
    off_days: ["SATURDAY", "SUNDAY"],
    effective_from: ymd(new Date()),
    effective_to: "",
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
      setWeeklyOffs(await workforceApi.weeklyOffs.list(partnerIdNumber));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load weekly off rules");
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

  const openWeeklyModal = (row?: WeeklyOffRow | null) => {
    setEditingWeekly(row ?? null);
    const parsed = row ? JSON.parse(row.off_days_json || "[]") : ["SATURDAY", "SUNDAY"];
    setWeeklyForm({
      partner_id: row ? String(row.partner_id) : isAdminLike ? partnerId : currentPartnerId,
      country_id: row?.country_id ? String(row.country_id) : "",
      rule_name: row?.rule_name ?? "Weekend Rule",
      off_days: Array.isArray(parsed) ? parsed.map((d: string) => String(d).toUpperCase()) : ["SATURDAY", "SUNDAY"],
      effective_from: row?.effective_from?.slice(0, 10) ?? ymd(new Date()),
      effective_to: row?.effective_to?.slice(0, 10) ?? "",
      status: Boolean(row?.status ?? true),
    });
    setWeeklyModal(true);
  };

  const saveWeekly = async () => {
    const input: {
      partner_id?: number;
      country_id: number | null;
      rule_name: string;
      off_days: string[];
      effective_from: string | null;
      effective_to: string | null;
      status: boolean;
    } = {
      country_id: num(weeklyForm.country_id),
      rule_name: weeklyForm.rule_name.trim(),
      off_days: weeklyForm.off_days.map((d) => String(d).trim().toUpperCase()).filter(Boolean),
      effective_from: weeklyForm.effective_from || null,
      effective_to: weeklyForm.effective_to || null,
      status: weeklyForm.status,
    };

    input.partner_id = num(isAdminLike ? weeklyForm.partner_id : currentPartnerId) ?? undefined;

    if ((isAdminLike && !input.partner_id) || input.off_days.length === 0) {
      setToast({
        open: true,
        message: isAdminLike ? "Partner and off days are required." : "Off days are required.",
        severity: "warning",
      });
      return;
    }

    try {
      if (editingWeekly) await workforceApi.weeklyOffs.update(editingWeekly.weekly_off_rule_id, input);
      else await workforceApi.weeklyOffs.create(input);
      setToast({ open: true, message: "Weekly off rule saved.", severity: "success" });
      setWeeklyModal(false);
      await refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save weekly off rule", severity: "error" });
    }
  };

  const weeklyColumns = useMemo(
    () => [
      { field: "rule_name", headerName: "Rule", flex: 1, minWidth: 180 },
      { field: "off_days_json", headerName: "Off Days", flex: 1, minWidth: 160, valueGetter: (p: any) => p.value },
      { field: "effective_from", headerName: "From", width: 120, valueFormatter: (value: any) => formatDateCompact(value?.value ?? value) },
      { field: "effective_to", headerName: "To", width: 120, valueFormatter: (value: any) => formatDateCompact(value?.value ?? value) },
      { field: "status", headerName: "Status", width: 90, renderCell: (p: any) => <Chip size="small" label={p.value ? "Active" : "Off"} color={p.value ? "success" : "default"} /> },
      {
        field: "__actions",
        headerName: "Actions",
        width: 170,
        renderCell: (p: any) => (
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => openWeeklyModal(p.row as WeeklyOffRow)}>
              Edit
            </AdButton>
            <AdButton
              variant="text"
              color="error"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={async () => {
                await workforceApi.weeklyOffs.remove((p.row as WeeklyOffRow).weekly_off_rule_id);
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
            Weekly Off Rules
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Weekly off patterns for the selected employer
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
          <AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => openWeeklyModal()}>
            New Rule
          </AdButton>
        </Stack>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} contentSx={{ p: 0 }}>
        <AdGrid rows={weeklyOffs.map((r) => ({ id: r.weekly_off_rule_id, ...r }))} columns={weeklyColumns as any} loading={loading} disableColumnMenu autoHeight />
      </AdCard>

      <AdModal
        open={weeklyModal}
        onClose={() => setWeeklyModal(false)}
        title={editingWeekly ? "Edit Weekly Off" : "New Weekly Off"}
        maxWidth="sm"
        actions={<AdButton startIcon={<SaveIcon fontSize="small" />} onClick={saveWeekly}>Save</AdButton>}
      >
        <Stack spacing={2}>
          {isAdminLike && (
            <AdDropDown
              label="Partner"
              variant="standard"
              options={partnerOptions}
              value={weeklyForm.partner_id}
              onChange={(v) => setWeeklyForm((f) => ({ ...f, partner_id: String(v) }))}
            />
          )}
          <AdTextBox variant="standard" label="Rule Name" value={weeklyForm.rule_name} onChange={(v) => setWeeklyForm((f) => ({ ...f, rule_name: v }))} />
          <AdDropDownMulti
            label="Off Days"
            options={WEEKDAY_OPTIONS}
            value={weeklyForm.off_days}
            onChange={(values) => setWeeklyForm((f) => ({ ...f, off_days: values }))}
          />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <AdTextBox variant="standard" label="Country ID" value={weeklyForm.country_id} onChange={(v) => setWeeklyForm((f) => ({ ...f, country_id: v }))} />
            <AdTextBox variant="standard" label="Effective From" type="date" value={weeklyForm.effective_from} onChange={(v) => setWeeklyForm((f) => ({ ...f, effective_from: v }))} />
            <AdTextBox variant="standard" label="Effective To" type="date" value={weeklyForm.effective_to} onChange={(v) => setWeeklyForm((f) => ({ ...f, effective_to: v }))} />
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip size="small" label={weeklyForm.status ? "Active" : "Inactive"} color={weeklyForm.status ? "success" : "default"} onClick={() => setWeeklyForm((f) => ({ ...f, status: !f.status }))} />
          </Stack>
        </Stack>
      </AdModal>
    </Stack>
  );
}
