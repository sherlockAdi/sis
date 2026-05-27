import { useEffect, useMemo, useRef, useState } from "react";
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
import { associatePartnersApi } from "../../common/services/associatePartnersApi";
import { listCities, listCountries, listStates, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";

type Form = {
  associate_partner_id?: number;
  associate_partner_code: string;
  associate_partner_name: string;
  alt_associate_partner_name: string;
  alt_email: string;
  primary_contact: string;
  alternate_contact: string;
  email: string;
  organisation_name: string;
  other_info: string;
  address1: string;
  address2: string;
  pin: string;
  landline: string;
  country_id: string;
  state_id: string;
  city_id: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string;
};

const emptyForm: Form = {
  associate_partner_id: undefined,
  associate_partner_code: "",
  associate_partner_name: "",
  alt_associate_partner_name: "",
  alt_email: "",
  primary_contact: "",
  alternate_contact: "",
  email: "",
  organisation_name: "",
  other_info: "",
  address1: "",
  address2: "",
  pin: "",
  landline: "",
  country_id: "",
  state_id: "",
  city_id: "",
  status: true,
  created_at: "",
  updated_at: "",
  deleted_at: "",
};

function mapForm(row: Awaited<ReturnType<typeof associatePartnersApi.get>>): Form {
  return {
    associate_partner_id: row.associate_partner_id,
    associate_partner_code: row.associate_partner_code ?? "",
    associate_partner_name: row.associate_partner_name ?? "",
    alt_associate_partner_name: row.alt_associate_partner_name ?? "",
    alt_email: row.alt_email ?? "",
    primary_contact: row.primary_contact ?? "",
    alternate_contact: row.alternate_contact ?? "",
    email: row.email ?? "",
    organisation_name: row.organisation_name ?? "",
    other_info: row.other_info ?? "",
    address1: row.address1 ?? "",
    address2: row.address2 ?? "",
    pin: row.pin ?? "",
    landline: row.landline ?? "",
    country_id: row.country_id ? String(row.country_id) : "",
    state_id: row.state_id ? String(row.state_id) : "",
    city_id: row.city_id ? String(row.city_id) : "",
    status: Number(row.status) === 1,
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
    deleted_at: row.deleted_at ?? "",
  };
}

function digitsOnly10(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export default function AssociatePartnerFormPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const params = useParams();
  const associatePartnerId = params.associatePartnerId ? Number(params.associatePartnerId) : null;

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
  const savingRef = useRef(false);

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
    if (mode !== "edit" || !associatePartnerId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await associatePartnersApi.get(associatePartnerId);
        setForm(mapForm(row));
      } catch (e: any) {
        setError((e as ApiError)?.message ?? "Failed to load associate partner");
      } finally {
        setLoading(false);
      }
    })();
  }, [associatePartnerId, mode]);

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
  const canSave = useMemo(() => Boolean(form.associate_partner_name.trim()), [form.associate_partner_name]);

  const saveAssociatePartner = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const payload = {
        associate_partner_code: form.associate_partner_code.trim() || null,
        associate_partner_name: form.associate_partner_name.trim(),
        alt_associate_partner_name: form.alt_associate_partner_name.trim() || null,
        alt_email: form.alt_email.trim() || null,
        primary_contact: form.primary_contact.trim() || null,
        alternate_contact: form.alternate_contact.trim() || null,
        email: form.email.trim() || null,
        organisation_name: form.organisation_name.trim() || null,
        other_info: form.other_info.trim() || null,
        address1: form.address1.trim() || null,
        address2: form.address2.trim() || null,
        pin: form.pin.trim() || null,
        landline: form.landline.trim() || null,
        country_id: form.country_id ? Number(form.country_id) : null,
        state_id: form.state_id ? Number(form.state_id) : null,
        city_id: form.city_id ? Number(form.city_id) : null,
        status: form.status,
      };

      if (!payload.associate_partner_name) throw new Error("Associate partner name is required");

      if (form.associate_partner_id) {
        await associatePartnersApi.update(form.associate_partner_id, payload);
        setToast({ open: true, message: "Associate partner updated", severity: "success" });
      } else {
        const created = await associatePartnersApi.create(payload);
        const authMsg = created.user_created
          ? `Associate partner created. Username: ${created.username}. ${created.emailed ? "Credentials emailed." : "Email not sent (check SMTP)." }`
          : created.existing_user_used
            ? `Associate partner created. Existing login account linked: ${created.username}.`
            : `Associate partner created, but the login account could not be created right now${created.auth_error ? `: ${created.auth_error}` : ""}.`;
        setToast({ open: true, message: authMsg, severity: "success" });
      }

      navigate("/portal/associate-partners");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Save failed", severity: "error" });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 1520, mx: "auto", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard
        animate={false}
        title={mode === "create" ? "Create Associate Partner" : "Edit Associate Partner"}
        headerRight={
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <AdButton variant="text" onClick={() => navigate("/portal/associate-partners")}>
              Cancel
            </AdButton>
            <AdButton onClick={saveAssociatePartner} disabled={saving || loading || !canSave}>
              {saving ? "Saving..." : "Save Associate Partner"}
            </AdButton>
          </Stack>
        }
        sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }}
        contentSx={{ p: { xs: 1.5, md: 2 } }}
      >
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading...
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
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    country_id: String(v),
                    state_id: "",
                    city_id: "",
                  }))
                }
              />
              <AdSearchableDropDown
                variant="standard"
                label="State"
                options={stateOptions}
                value={form.state_id}
                disabled={!form.country_id}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    state_id: String(v),
                    city_id: "",
                  }))
                }
              />
              <AdSearchableDropDown
                variant="standard"
                label="City"
                options={cityOptions}
                value={form.city_id}
                disabled={!form.state_id}
                onChange={(v) => setForm((f) => ({ ...f, city_id: String(v) }))}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Organization"
                value={form.organisation_name}
                onChange={(v) => setForm((f) => ({ ...f, organisation_name: v }))}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Associate Partner Name"
                required
                value={form.associate_partner_name}
                onChange={(v) => setForm((f) => ({ ...f, associate_partner_name: v }))}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Associate Partner Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Mobile Number"
                value={form.primary_contact}
                onChange={(v) => setForm((f) => ({ ...f, primary_contact: digitsOnly10(v) }))}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 10 }}
              />
              <AdTextBox
                variant="standard"
                size="small"
                label="Alternate Contact Person"
                value={form.alt_associate_partner_name}
                onChange={(v) => setForm((f) => ({ ...f, alt_associate_partner_name: v }))}
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
                value={form.alternate_contact}
                onChange={(v) => setForm((f) => ({ ...f, alternate_contact: digitsOnly10(v) }))}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 10 }}
              />
              <Box sx={{ gridColumn: { xs: "auto", md: "1 / span 3" } }}>
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                  }}
                >
                  <AdTextBox variant="standard" size="small" label="Address 1" value={form.address1} onChange={(v) => setForm((f) => ({ ...f, address1: v }))} />
                  <AdTextBox variant="standard" size="small" label="Address 2" value={form.address2} onChange={(v) => setForm((f) => ({ ...f, address2: v }))} />
                  <Box sx={{ maxWidth: { xs: "100%", md: 220 } }}>
                    <AdTextBox
                      variant="standard"
                      size="small"
                      label="PINCODE"
                      value={form.pin}
                      onChange={(v) => setForm((f) => ({ ...f, pin: v.replace(/\D/g, "").slice(0, 6) }))}
                      maxLength={6}
                      pattern={/^\d{6}$/}
                    />
                  </Box>
                  <AdTextBox
                    variant="standard"
                    size="small"
                    label="Landline with Country Code"
                    value={form.landline}
                    onChange={(v) => setForm((f) => ({ ...f, landline: v }))}
                  />
                  <AdTextBox variant="standard" size="small" label="Other Info" value={form.other_info} onChange={(v) => setForm((f) => ({ ...f, other_info: v }))} />
                </Box>
              </Box>
              <AdSearchableDropDown
                variant="standard"
                label="Status"
                options={statusOptions}
                value={form.status ? "1" : "0"}
                onChange={(v) => setForm((f) => ({ ...f, status: String(v) === "1" }))}
              />
            </Box>

            {form.associate_partner_id ? (
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
