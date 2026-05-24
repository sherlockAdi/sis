import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  AdAlertBox,
  AdButton,
  AdCard,
  AdNotification,
  AdSearchableDropDown,
  AdTextBox,
} from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { partnersApi } from "../../common/services/partnersApi";
import { listCities, listCountries, listStates, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";

type Form = {
  partner_id?: number;
  partner_code: string;
  partner_name: string;
  contact_name: string;
  alt_email: string;
  phone: string;
  email: string;
  address: string;
  country_id: string;
  state_id: string;
  city_id: string;
  alt_partner_name: string;
  alt_phone: string;
  organisation_name: string;
  address2: string;
  pin: string;
  landline: string;
  cr_licence_number: string;
  website: string;
  other_info: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string;
};

const emptyForm: Form = {
  partner_id: undefined,
  partner_code: "",
  partner_name: "",
  contact_name: "",
  alt_email: "",
  phone: "",
  email: "",
  address: "",
  country_id: "",
  state_id: "",
  city_id: "",
  alt_partner_name: "",
  alt_phone: "",
  organisation_name: "",
  address2: "",
  pin: "",
  landline: "",
  cr_licence_number: "",
  website: "",
  other_info: "",
  status: true,
  created_at: "",
  updated_at: "",
  deleted_at: "",
};

function mapPartnerForm(partner: Awaited<ReturnType<typeof partnersApi.get>>): Form {
  return {
    partner_id: partner.partner_id,
    partner_code: partner.partner_code ?? "",
    partner_name: partner.partner_name ?? "",
    contact_name: partner.contact_name ?? "",
    alt_email: partner.alt_email ?? "",
    phone: partner.phone ?? "",
    email: partner.email ?? "",
    address: partner.address ?? "",
    country_id: partner.country_id ? String(partner.country_id) : "",
    state_id: partner.state_id ? String(partner.state_id) : "",
    city_id: partner.city_id ? String(partner.city_id) : "",
    alt_partner_name: partner.alt_partner_name ?? "",
    alt_phone: partner.alt_phone ?? "",
    organisation_name: partner.organisation_name ?? "",
    address2: partner.address2 ?? "",
    pin: partner.pin ?? "",
    landline: partner.landline ?? "",
    cr_licence_number: partner.cr_licence_number ?? "",
    website: partner.website ?? "",
    other_info: partner.other_info ?? "",
    status: Number(partner.status) === 1,
    created_at: partner.created_at ?? "",
    updated_at: partner.updated_at ?? "",
    deleted_at: partner.deleted_at ?? "",
  };
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function PartnerFormPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const params = useParams();
  const partnerId = params.partnerId ? Number(params.partnerId) : null;

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [form, setForm] = useState<Form>(emptyForm);

  useEffect(() => {
    (async () => {
      try {
        setCountries(await listCountries(true));
      } catch {
        setCountries([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !partnerId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const partner = await partnersApi.get(partnerId);
        setForm(mapPartnerForm(partner));
      } catch (e: any) {
        setError((e as ApiError)?.message ?? "Failed to load employer");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, partnerId]);

  useEffect(() => {
    if (!form.country_id) {
      setStates([]);
      setCities([]);
      return;
    }
    (async () => {
      try {
        setStates(await listStates(Number(form.country_id), true));
      } catch {
        setStates([]);
      }
    })();
  }, [form.country_id]);

  useEffect(() => {
    if (!form.state_id) {
      setCities([]);
      return;
    }
    (async () => {
      try {
        setCities(await listCities(Number(form.state_id), true));
      } catch {
        setCities([]);
      }
    })();
  }, [form.state_id]);

  const countryOptions = useMemo(
    () => countries.map((c) => ({ label: c.country_name, value: String(c.country_id) })),
    [countries],
  );
  const stateOptions = useMemo(
    () => states.map((s) => ({ label: s.state_name, value: String(s.state_id) })),
    [states],
  );
  const cityOptions = useMemo(
    () => cities.map((c) => ({ label: c.city_name, value: String(c.city_id) })),
    [cities],
  );
  const statusOptions = useMemo(
    () => [
      { label: "Active", value: "1" },
      { label: "Inactive", value: "0" },
    ],
    [],
  );
  const canSave = useMemo(
    () => Boolean(form.partner_name.trim() && form.organisation_name.trim()),
    [form.organisation_name, form.partner_name],
  );

  const savePartner = async () => {
    setSaving(true);
    try {
      const payload = {
        partner_code: form.partner_code.trim() || null,
        partner_name: form.partner_name.trim(),
        contact_name: form.contact_name.trim() || null,
        alt_email: form.alt_email.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        country_id: form.country_id ? Number(form.country_id) : null,
        state_id: form.state_id ? Number(form.state_id) : null,
        city_id: form.city_id ? Number(form.city_id) : null,
        alt_partner_name: form.alt_partner_name.trim() || null,
        alt_phone: form.alt_phone.trim() || null,
        organisation_name: form.organisation_name.trim() || null,
        address2: form.address2.trim() || null,
        pin: form.pin.trim() || null,
        landline: form.landline.trim() || null,
        cr_licence_number: form.cr_licence_number.trim() || null,
        website: form.website.trim() || null,
        other_info: form.other_info.trim() || null,
        status: form.status,
      };
      if (!payload.partner_name) throw new Error("Employer name is required");
      if (!payload.organisation_name) throw new Error("Organisation is required");

      if (form.partner_id) {
        await partnersApi.update(form.partner_id, payload);
        setToast({ open: true, message: "Employer updated", severity: "success" });
      } else {
        const created = await partnersApi.create(payload);
        const authMsg = created.user_created
          ? `Employer created. Code: ${created.partner_code ?? "—"}. Username: ${created.username}. ${created.emailed ? "Credentials emailed." : "Email not sent (check SMTP)." }`
          : created.existing_user_used
            ? `Employer created. Code: ${created.partner_code ?? "—"}. Existing login account linked: ${created.username}.`
            : `Employer created. Code: ${created.partner_code ?? "—"}. The login account could not be created right now${created.auth_error ? `: ${created.auth_error}` : ""}.`;
        setToast({ open: true, message: authMsg, severity: "success" });
      }

      navigate("/portal/partners");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Save failed", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 1520, mx: "auto", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard
        animate={false}
        title="Create a new employer profile"
        headerRight={
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <AdButton variant="text" onClick={() => navigate("/portal/partners")}>
              Cancel
            </AdButton>
            <AdButton onClick={savePartner} disabled={saving || loading || !canSave}>
              {saving ? "Saving..." : "Save Employer"}
            </AdButton>
          </Stack>
        }
        sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }}
        contentSx={{ p: { xs: 1.5, md: 2 } }}
      >
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading employer details...
          </Typography>
        ) : (
            <Stack spacing={1.5}>
            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              }}
            >
              <AdSearchableDropDown
                variant="standard"
                label="Country"
                options={countryOptions}
                value={form.country_id}
                onChange={(v) => setForm((f) => ({ ...f, country_id: String(v), state_id: "", city_id: "" }))}
              />
              <AdSearchableDropDown
                variant="standard"
                label="State"
                options={stateOptions}
                value={form.state_id}
                onChange={(v) => setForm((f) => ({ ...f, state_id: String(v), city_id: "" }))}
                disabled={!form.country_id}
              />
              <AdSearchableDropDown
                variant="standard"
                label="City"
                options={cityOptions}
                value={form.city_id}
                onChange={(v) => setForm((f) => ({ ...f, city_id: String(v) }))}
                disabled={!form.state_id}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Organisation"
                required
                value={form.organisation_name}
                onChange={(v) => setForm((f) => ({ ...f, organisation_name: v }))}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="CR/License Number"
                value={form.cr_licence_number}
                onChange={(v) => setForm((f) => ({ ...f, cr_licence_number: v }))}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Employer Name"
                required
                value={form.partner_name}
                onChange={(v) => setForm((f) => ({ ...f, partner_name: v }))}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Employer Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Employer Mobile Number"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: digitsOnly(v) }))}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Alternate Contact Person"
                value={form.contact_name}
                onChange={(v) => setForm((f) => ({ ...f, contact_name: v }))}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Alternate Contact Person Email"
                type="email"
                value={form.alt_email}
                onChange={(v) => setForm((f) => ({ ...f, alt_email: v }))}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Alternate Contact Person Mobile Number"
                value={form.alt_phone}
                onChange={(v) => setForm((f) => ({ ...f, alt_phone: digitsOnly(v) }))}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              />
              <AdTextBox variant="standard" size="small" label="Address 1" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} />
              <AdTextBox variant="standard" size="small" label="Address 2" value={form.address2} onChange={(v) => setForm((f) => ({ ...f, address2: v }))} />
              <Box sx={{ maxWidth: { xs: "100%", md: 220 } }}>
                <AdTextBox
                  variant="standard"
                  size="small"
                  label="Pincode"
                  value={form.pin}
                  onChange={(v) => setForm((f) => ({ ...f, pin: v.replace(/\D/g, "").slice(0, 6) }))}
                  maxLength={6}
                  pattern={/^\d{6}$/}
                />
              </Box>
              <AdTextBox
                variant="standard"
                size="small"
                label="Landline"
                value={form.landline}
                onChange={(v) => setForm((f) => ({ ...f, landline: v }))}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Website"
                value={form.website}
                onChange={(v) => setForm((f) => ({ ...f, website: v }))}
              />
              <AdTextBox variant="standard" size="small" label="Other Info" value={form.other_info} onChange={(v) => setForm((f) => ({ ...f, other_info: v }))} />
              <AdSearchableDropDown
                variant="standard"
                label="Status"
                options={statusOptions}
                value={form.status ? "1" : "0"}
                onChange={(v) => setForm((f) => ({ ...f, status: String(v) === "1" }))}
              />
            </Box>

            {form.partner_id ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ color: "text.secondary" }}>
                <Typography variant="body2">Created At: {form.created_at || "—"}</Typography>
                <Typography variant="body2">Updated At: {form.updated_at || "—"}</Typography>
                <Typography variant="body2">Deleted At: {form.deleted_at || "—"}</Typography>
              </Stack>
            ) : null}
          </Stack>
        )}
      </AdCard>
    </Stack>
  );
}
