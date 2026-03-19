import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { recruitmentApi, type CandidateRow } from "../../common/services/recruitmentApi";
import { listCities, listCountries, listStates, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";

type Form = {
  candidate_id?: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  passport_number: string;
  country_id: string;
  state_id: string;
  city_id: string;
};

export default function RecruitmentCandidatesPage() {
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({ open: false, message: "", severity: "success" });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Form>({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    passport_number: "",
    country_id: "",
    state_id: "",
    city_id: "",
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await recruitmentApi.candidates.list());
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    (async () => {
      try {
        setCountries(await listCountries(true));
      } catch {
        setCountries([]);
      }
    })();
  }, []);

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
    () => [{ label: "— Select —", value: "" }].concat(countries.map((c) => ({ label: c.country_name, value: String(c.country_id) }))),
    [countries],
  );
  const stateOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(states.map((s) => ({ label: s.state_name, value: String(s.state_id) }))),
    [states],
  );
  const cityOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(cities.map((c) => ({ label: c.city_name, value: String(c.city_id) }))),
    [cities],
  );

  const cols = useMemo(
    () => [
      { field: "candidate_code", headerName: "Code", width: 140 },
      {
        field: "__name",
        headerName: "Candidate",
        flex: 1,
        minWidth: 220,
        // MUI X changed `valueGetter` signature across versions:
        // - v5/v6: (params) => params.row...
        // - v7+:   (value, row) => ...
        valueGetter: (...args: any[]) => {
          const row = (args?.[0] as any)?.row ?? args?.[1] ?? {};
          return `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
        },
      },
      { field: "phone", headerName: "Phone", width: 150 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 240 },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "")} />,
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as CandidateRow;
          return (
            <AdButton
              variant="text"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => {
                setForm({
                  candidate_id: r.candidate_id,
                  first_name: r.first_name ?? "",
                  last_name: r.last_name ?? "",
                  phone: r.phone ?? "",
                  email: r.email ?? "",
                  passport_number: "",
                  country_id: "",
                  state_id: "",
                  city_id: "",
                });
                setModalOpen(true);
              }}
            >
              Edit
            </AdButton>
          );
        },
      },
    ],
    [],
  );

  const openAdd = () => {
    setForm({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      passport_number: "",
      country_id: "",
      state_id: "",
      city_id: "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    try {
      if (!form.email.trim()) throw new Error("Email is required");
      const res = await recruitmentApi.candidates.create({
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim(),
        passport_number: form.passport_number.trim() || null,
        country_id: form.country_id ? Number(form.country_id) : null,
        state_id: form.state_id ? Number(form.state_id) : null,
        city_id: form.city_id ? Number(form.city_id) : null,
        status: "New",
      });
      setToast({
        open: true,
        severity: "success",
        message: `Candidate created. Username: ${res.username}${res.emailed ? " (emailed)" : " (email not sent)"}`,
      });
      setModalOpen(false);
      refresh();
    } catch (e: any) {
      setToast({ open: true, severity: "error", message: (e as ApiError)?.message ?? e?.message ?? "Save failed" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Candidates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admin candidate registration (auto user + email credentials)
          </Typography>
        </Stack>
        <AdButton startIcon={<AddIcon fontSize="small" />} onClick={openAdd}>
          Add Candidate
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.candidate_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>

      <AdModal open={modalOpen} onClose={() => setModalOpen(false)} title="Register Candidate" maxWidth="md">
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <AdTextBox label="First Name" value={form.first_name} onChange={(v) => setForm((f) => ({ ...f, first_name: v }))} />
            <AdTextBox label="Last Name" value={form.last_name} onChange={(v) => setForm((f) => ({ ...f, last_name: v }))} />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <AdTextBox label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
            <AdTextBox label="Email" required value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
          </Stack>
          <AdTextBox label="Passport Number" value={form.passport_number} onChange={(v) => setForm((f) => ({ ...f, passport_number: v }))} />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <AdDropDown
              label="Country"
              options={countryOptions}
              value={form.country_id}
              onChange={(v) => setForm((f) => ({ ...f, country_id: String(v), state_id: "", city_id: "" }))}
            />
            <AdDropDown
              label="State"
              options={stateOptions}
              disabled={!form.country_id}
              value={form.state_id}
              onChange={(v) => setForm((f) => ({ ...f, state_id: String(v), city_id: "" }))}
            />
            <AdDropDown
              label="City"
              options={cityOptions}
              disabled={!form.state_id}
              value={form.city_id}
              onChange={(v) => setForm((f) => ({ ...f, city_id: String(v) }))}
            />
          </Stack>

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <AdButton variant="text" onClick={() => setModalOpen(false)}>
              Cancel
            </AdButton>
            <AdButton onClick={save}>Create</AdButton>
          </Stack>
        </Stack>
      </AdModal>
    </Stack>
  );
}
