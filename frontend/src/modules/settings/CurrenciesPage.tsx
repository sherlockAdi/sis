import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdModal, AdNotification, AdSearchableDropDown, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { listCountries, type Country } from "../../common/services/locationApi";
import { mastersApi, type Currency } from "../../common/services/mastersApi";

type Form = {
  currency_id?: number;
  currency_code: string;
  currency_name: string;
  symbol: string;
  country_id: string;
};

export default function CurrenciesPage() {
  const [rows, setRows] = useState<Currency[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Form>({ currency_code: "", currency_name: "", symbol: "", country_id: "" });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [cur, cos] = await Promise.all([mastersApi.currencies.list(true), listCountries(true)]);
      setRows(cur);
      setCountries(cos);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load currencies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const countryOptions = useMemo(
    () => countries.map((c) => ({ label: c.country_name, value: String(c.country_id) })),
    [countries],
  );

  const cols = useMemo(
    () => [
      { field: "currency_code", headerName: "Code", width: 120 },
      { field: "currency_name", headerName: "Currency", flex: 1, minWidth: 220 },
      { field: "symbol", headerName: "Symbol", width: 120 },
      { field: "country_id", headerName: "Country", width: 160, renderCell: (p: any) => p.row.country_name ?? "—" },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p: any) => <Chip size="small" label={Number(p.value) ? "Active" : "Disabled"} color={Number(p.value) ? "success" : "default"} />,
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as Currency;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => {
                  setForm({
                    currency_id: r.currency_id,
                    currency_code: r.currency_code ?? "",
                    currency_name: r.currency_name ?? "",
                    symbol: r.symbol ?? "",
                    country_id: r.country_id ? String(r.country_id) : "",
                  });
                  setModalOpen(true);
                }}
              >
                Edit
              </AdButton>
              <AdButton
                variant="text"
                startIcon={<BlockIcon fontSize="small" />}
                onClick={async () => {
                  await mastersApi.currencies.disable(r.currency_id);
                  setToast({ open: true, message: "Currency disabled", severity: "success" });
                  refresh();
                }}
              >
                Disable
              </AdButton>
            </Stack>
          );
        },
      },
    ],
    [],
  );

  const save = async () => {
    try {
      if (!form.currency_code.trim()) throw new Error("Currency code is required");
      if (!form.currency_name.trim()) throw new Error("Currency name is required");
      if (form.currency_id) {
        await mastersApi.currencies.update(form.currency_id, {
          currency_code: form.currency_code.trim(),
          currency_name: form.currency_name.trim(),
          symbol: form.symbol.trim() || null,
          country_id: form.country_id ? Number(form.country_id) : null,
        });
      } else {
        await mastersApi.currencies.create({
          currency_code: form.currency_code.trim(),
          currency_name: form.currency_name.trim(),
          symbol: form.symbol.trim() || null,
          country_id: form.country_id ? Number(form.country_id) : null,
        });
      }
      setToast({ open: true, message: "Saved", severity: "success" });
      setModalOpen(false);
      setForm({ currency_code: "", currency_name: "", symbol: "", country_id: "" });
      refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Save failed", severity: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Currencies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            System setting master
          </Typography>
        </Stack>
        <AdButton
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => {
            setForm({ currency_code: "", currency_name: "", symbol: "", country_id: "" });
            setModalOpen(true);
          }}
        >
          Add
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.currency_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>

      <AdModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.currency_id ? "Edit Currency" : "Add Currency"}
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setModalOpen(false)}>
              Cancel
            </AdButton>
            <AdButton onClick={save}>Save</AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <AdTextBox label="Currency Code" required value={form.currency_code} onChange={(v) => setForm((f) => ({ ...f, currency_code: v }))} />
          <AdTextBox label="Currency Name" required value={form.currency_name} onChange={(v) => setForm((f) => ({ ...f, currency_name: v }))} />
          <AdTextBox label="Symbol" value={form.symbol} onChange={(v) => setForm((f) => ({ ...f, symbol: v }))} />
          <AdSearchableDropDown
            label="Country"
            options={countryOptions}
            value={form.country_id}
            onChange={(v) => setForm((f) => ({ ...f, country_id: String(v) }))}
          />
        </Stack>
      </AdModal>
    </Stack>
  );
}
