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
import { workforceApi, type OfficeLocationRow } from "../../common/services/workforceApi";

type OfficeForm = {
  office_location_id?: number;
  partner_id: string;
  location_name: string;
  country_id: string;
  state_id: string;
  city_id: string;
  address: string;
  latitude: string;
  longitude: string;
  radius_meters: string;
  status: boolean;
};

function num(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function OfficeLocationsPage() {
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
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [offices, setOffices] = useState<OfficeLocationRow[]>([]);
  const [officeModal, setOfficeModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState<OfficeLocationRow | null>(null);
  const [officeForm, setOfficeForm] = useState<OfficeForm>({
    partner_id: "",
    location_name: "",
    country_id: "",
    state_id: "",
    city_id: "",
    address: "",
    latitude: "",
    longitude: "",
    radius_meters: "250",
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
      setOffices(await workforceApi.offices.list(partnerIdNumber));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load office geo locations");
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

  const openOfficeModal = (row?: OfficeLocationRow | null) => {
    setEditingOffice(row ?? null);
    setOfficeForm({
      partner_id: row ? String(row.partner_id) : isAdminLike ? partnerId : currentPartnerId,
      location_name: row?.location_name ?? "",
      country_id: row?.country_id ? String(row.country_id) : "",
      state_id: row?.state_id ? String(row.state_id) : "",
      city_id: row?.city_id ? String(row.city_id) : "",
      address: row?.address ?? "",
      latitude: row?.latitude !== null && row?.latitude !== undefined ? String(row.latitude) : "",
      longitude: row?.longitude !== null && row?.longitude !== undefined ? String(row.longitude) : "",
      radius_meters: String(row?.radius_meters ?? 250),
      status: Boolean(row?.status ?? true),
    });
    setOfficeModal(true);
  };

  const saveOffice = async () => {
    const input: {
      partner_id?: number;
      location_name: string;
      country_id: number | null;
      state_id: number | null;
      city_id: number | null;
      address: string | null;
      latitude: number | null;
      longitude: number | null;
      radius_meters: number;
      status: boolean;
    } = {
      partner_id: num(isAdminLike ? officeForm.partner_id : currentPartnerId) ?? undefined,
      location_name: officeForm.location_name.trim(),
      country_id: num(officeForm.country_id),
      state_id: num(officeForm.state_id),
      city_id: num(officeForm.city_id),
      address: officeForm.address.trim() || null,
      latitude: num(officeForm.latitude),
      longitude: num(officeForm.longitude),
      radius_meters: num(officeForm.radius_meters) ?? 250,
      status: officeForm.status,
    };

    if ((isAdminLike && !input.partner_id) || !input.location_name) {
      setToast({
        open: true,
        message: isAdminLike ? "Partner and location name are required." : "Location name is required.",
        severity: "warning",
      });
      return;
    }

    try {
      if (editingOffice) await workforceApi.offices.update(editingOffice.office_location_id, input);
      else await workforceApi.offices.create(input);
      setToast({ open: true, message: "Office saved.", severity: "success" });
      setOfficeModal(false);
      await refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save office", severity: "error" });
    }
  };

  const officeColumns = useMemo(
    () => [
      { field: "location_name", headerName: "Office", flex: 1, minWidth: 180 },
      { field: "country_id", headerName: "Country", width: 90 },
      { field: "state_id", headerName: "State", width: 90 },
      { field: "city_id", headerName: "City", width: 90 },
      { field: "radius_meters", headerName: "Radius", width: 90 },
      { field: "status", headerName: "Status", width: 90, renderCell: (p: any) => <Chip size="small" label={p.value ? "Active" : "Off"} color={p.value ? "success" : "default"} /> },
      {
        field: "__actions",
        headerName: "Actions",
        width: 170,
        renderCell: (p: any) => (
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => openOfficeModal(p.row as OfficeLocationRow)}>
              Edit
            </AdButton>
            <AdButton
              variant="text"
              color="error"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={async () => {
                await workforceApi.offices.remove((p.row as OfficeLocationRow).office_location_id);
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
            Office Geo Locations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Office geofences for the selected employer
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
          <AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => openOfficeModal()}>
            New Office
          </AdButton>
        </Stack>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} contentSx={{ p: 0 }}>
        <AdGrid rows={offices.map((r) => ({ id: r.office_location_id, ...r }))} columns={officeColumns as any} loading={loading} disableColumnMenu autoHeight />
      </AdCard>

      <AdModal
        open={officeModal}
        onClose={() => setOfficeModal(false)}
        title={editingOffice ? "Edit Office" : "New Office"}
        maxWidth="sm"
        actions={<AdButton startIcon={<SaveIcon fontSize="small" />} onClick={saveOffice}>Save</AdButton>}
      >
        <Stack spacing={2}>
          {isAdminLike && (
            <AdDropDown
              label="Partner"
              variant="standard"
              options={partnerOptions}
              value={officeForm.partner_id}
              onChange={(v) => setOfficeForm((f) => ({ ...f, partner_id: String(v) }))}
            />
          )}
          <AdTextBox variant="standard" label="Location Name" value={officeForm.location_name} onChange={(v) => setOfficeForm((f) => ({ ...f, location_name: v }))} />
          <AdTextBox variant="standard" label="Address" value={officeForm.address} onChange={(v) => setOfficeForm((f) => ({ ...f, address: v }))} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
            <AdTextBox variant="standard" label="Country ID" value={officeForm.country_id} onChange={(v) => setOfficeForm((f) => ({ ...f, country_id: v }))} />
            <AdTextBox variant="standard" label="State ID" value={officeForm.state_id} onChange={(v) => setOfficeForm((f) => ({ ...f, state_id: v }))} />
            <AdTextBox variant="standard" label="City ID" value={officeForm.city_id} onChange={(v) => setOfficeForm((f) => ({ ...f, city_id: v }))} />
            <AdTextBox variant="standard" label="Latitude" value={officeForm.latitude} onChange={(v) => setOfficeForm((f) => ({ ...f, latitude: v }))} />
            <AdTextBox variant="standard" label="Longitude" value={officeForm.longitude} onChange={(v) => setOfficeForm((f) => ({ ...f, longitude: v }))} />
            <AdTextBox variant="standard" label="Radius (meters)" value={officeForm.radius_meters} onChange={(v) => setOfficeForm((f) => ({ ...f, radius_meters: v }))} />
          </Box>
          <Chip size="small" label={officeForm.status ? "Active" : "Inactive"} color={officeForm.status ? "success" : "default"} onClick={() => setOfficeForm((f) => ({ ...f, status: !f.status }))} />
        </Stack>
      </AdModal>
    </Stack>
  );
}
