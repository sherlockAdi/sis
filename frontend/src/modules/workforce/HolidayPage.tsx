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
import { workforceApi, type HolidayRow } from "../../common/services/workforceApi";

type HolidayForm = {
  holiday_id?: number;
  partner_id: string;
  holiday_name: string;
  holiday_type: "FIXED" | "YEARLY_VARIABLE" | "ONCE";
  holiday_date: string;
  holiday_month: string;
  holiday_day: string;
  holiday_year: string;
  is_paid: boolean;
  status: boolean;
};

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

export default function HolidayPage() {
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
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);
  const [holidayModal, setHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayRow | null>(null);
  const [holidayForm, setHolidayForm] = useState<HolidayForm>({
    partner_id: "",
    holiday_name: "",
    holiday_type: "FIXED",
    holiday_date: ymd(new Date()),
    holiday_month: "",
    holiday_day: "",
    holiday_year: "",
    is_paid: true,
    status: true,
  });

  const effectivePartnerId = isAdminLike ? partnerId : currentPartnerId;
  const effectivePartnerIdNumber = useMemo(() => {
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

  const queryPartnerId = useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get("partner_id");
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? String(n) : "";
  }, []);

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
      setHolidays(await workforceApi.holidays.list(effectivePartnerIdNumber));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [effectivePartnerIdNumber]);

  useEffect(() => {
    void refreshPartners();
  }, [isAdminLike]);

  useEffect(() => {
    if (!isAdminLike) return;
    if (queryPartnerId && partnerId !== queryPartnerId) setPartnerId(queryPartnerId);
  }, [isAdminLike, partnerId, queryPartnerId]);

  useEffect(() => {
    if (isAdminLike) return;
    if (!currentPartnerId) setError("Partner profile not found for this user.");
  }, [currentPartnerId, isAdminLike]);

  const openHolidayModal = (row?: HolidayRow | null) => {
    setEditingHoliday(row ?? null);
    setHolidayForm({
      partner_id: row ? String(row.partner_id) : isAdminLike ? partnerId : currentPartnerId,
      holiday_name: row?.holiday_name ?? "",
      holiday_type: row?.holiday_type ?? "FIXED",
      holiday_date: row?.holiday_date?.slice(0, 10) ?? ymd(new Date()),
      holiday_month: row?.holiday_month ? String(row.holiday_month) : "",
      holiday_day: row?.holiday_day ? String(row.holiday_day) : "",
      holiday_year: row?.holiday_year ? String(row.holiday_year) : "",
      is_paid: Boolean(row?.is_paid ?? true),
      status: Boolean(row?.status ?? true),
    });
    setHolidayModal(true);
  };

  const saveHoliday = async () => {
    const input: {
      partner_id?: number;
      holiday_name: string;
      holiday_type: "FIXED" | "YEARLY_VARIABLE" | "ONCE";
      holiday_date: string | null;
      holiday_month: number | null;
      holiday_day: number | null;
      holiday_year: number | null;
      is_paid: boolean;
      status: boolean;
    } = {
      holiday_name: holidayForm.holiday_name.trim(),
      holiday_type: holidayForm.holiday_type,
      holiday_date: holidayForm.holiday_date || null,
      holiday_month: num(holidayForm.holiday_month),
      holiday_day: num(holidayForm.holiday_day),
      holiday_year: num(holidayForm.holiday_year),
      is_paid: holidayForm.is_paid,
      status: holidayForm.status,
    };

    input.partner_id = num(isAdminLike ? holidayForm.partner_id : currentPartnerId) ?? undefined;

    if ((isAdminLike && !input.partner_id) || !input.holiday_name) {
      setToast({
        open: true,
        message: isAdminLike ? "Partner and holiday name are required." : "Holiday name is required.",
        severity: "warning",
      });
      return;
    }

    try {
      if (editingHoliday) await workforceApi.holidays.update(editingHoliday.holiday_id, input);
      else await workforceApi.holidays.create(input);
      setToast({ open: true, message: "Holiday saved.", severity: "success" });
      setHolidayModal(false);
      await refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save holiday", severity: "error" });
    }
  };

  const holidayColumns = useMemo(
    () => [
      { field: "holiday_name", headerName: "Holiday", flex: 1, minWidth: 180 },
      { field: "holiday_type", headerName: "Type", width: 160 },
      { field: "holiday_date", headerName: "Date", width: 120 },
      { field: "holiday_year", headerName: "Year", width: 90 },
      { field: "is_paid", headerName: "Paid", width: 90, renderCell: (p: any) => <Chip size="small" label={p.value ? "Yes" : "No"} color={p.value ? "success" : "default"} /> },
      {
        field: "__actions",
        headerName: "Actions",
        width: 170,
        renderCell: (p: any) => (
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => openHolidayModal(p.row as HolidayRow)}>
              Edit
            </AdButton>
            <AdButton
              variant="text"
              color="error"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={async () => {
                await workforceApi.holidays.remove((p.row as HolidayRow).holiday_id);
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
            Holiday Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Holiday definitions for the selected employer
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
          <AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => openHolidayModal()}>
            New Holiday
          </AdButton>
        </Stack>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} contentSx={{ p: 0 }}>
        <AdGrid rows={holidays.map((r) => ({ id: r.holiday_id, ...r }))} columns={holidayColumns as any} loading={loading} showExport={false} disableColumnMenu autoHeight />
      </AdCard>

      <AdModal
        open={holidayModal}
        onClose={() => setHolidayModal(false)}
        title={editingHoliday ? "Edit Holiday" : "New Holiday"}
        maxWidth="sm"
        actions={<AdButton startIcon={<SaveIcon fontSize="small" />} onClick={saveHoliday}>Save</AdButton>}
      >
        <Stack spacing={2}>
          {isAdminLike && (
            <AdDropDown
              label="Partner"
              variant="standard"
              options={partnerOptions}
              value={holidayForm.partner_id}
              onChange={(v) => setHolidayForm((f) => ({ ...f, partner_id: String(v) }))}
            />
          )}
          <AdTextBox variant="standard" label="Holiday Name" value={holidayForm.holiday_name} onChange={(v) => setHolidayForm((f) => ({ ...f, holiday_name: v }))} />
          <AdDropDown
            label="Holiday Type"
            variant="standard"
            options={[
              { label: "Fixed Every Year", value: "FIXED" },
              { label: "Variable Every Year", value: "YEARLY_VARIABLE" },
              { label: "One-time", value: "ONCE" },
            ]}
            value={holidayForm.holiday_type}
            onChange={(v) => setHolidayForm((f) => ({ ...f, holiday_type: v as any }))}
          />
          <AdTextBox variant="standard" label="Holiday Date" type="date" value={holidayForm.holiday_date} onChange={(v) => setHolidayForm((f) => ({ ...f, holiday_date: v }))} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" } }}>
            <AdTextBox variant="standard" label="Month" value={holidayForm.holiday_month} onChange={(v) => setHolidayForm((f) => ({ ...f, holiday_month: v }))} />
            <AdTextBox variant="standard" label="Day" value={holidayForm.holiday_day} onChange={(v) => setHolidayForm((f) => ({ ...f, holiday_day: v }))} />
            <AdTextBox variant="standard" label="Year" value={holidayForm.holiday_year} onChange={(v) => setHolidayForm((f) => ({ ...f, holiday_year: v }))} />
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" label={holidayForm.is_paid ? "Paid" : "Unpaid"} color={holidayForm.is_paid ? "success" : "default"} onClick={() => setHolidayForm((f) => ({ ...f, is_paid: !f.is_paid }))} />
            <Chip size="small" label={holidayForm.status ? "Active" : "Inactive"} color={holidayForm.status ? "success" : "default"} onClick={() => setHolidayForm((f) => ({ ...f, status: !f.status }))} />
          </Stack>
        </Stack>
      </AdModal>
    </Stack>
  );
}
