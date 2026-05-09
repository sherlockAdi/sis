import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import { AdAlertBox, AdCard, AdGrid } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { useAuth } from "../../common/auth/AuthContext";
import { employeesApi, type EmployeeRow } from "../../common/services/employeesApi";
import { partnersApi, type PartnerRow } from "../../common/services/partnersApi";

function formatValue(value: string | null | undefined) {
  const v = String(value ?? "").trim();
  return v || "—";
}

export default function PartnerFinalSelectedPage() {
  const { me } = useAuth();
  const partnerId = me?.partner_id ?? null;
  const [partner, setPartner] = useState<PartnerRow | null>(null);
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!partnerId) {
          setPartner(null);
          setRows([]);
          setError("Partner profile not found for this user.");
          return;
        }
        const [allEmployees, partnerInfo] = await Promise.all([employeesApi.list(), partnersApi.get(partnerId)]);
        if (!active) return;
        setPartner(partnerInfo);
        setRows(allEmployees.filter((row) => Number(row.partner_id) === Number(partnerId)));
      } catch (e: any) {
        if (!active) return;
        setError((e as ApiError)?.message ?? "Failed to load employee list");
        setPartner(null);
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [partnerId]);

  const cols = useMemo(
    () => [
      { field: "employee_code", headerName: "Code", width: 140 },
      { field: "employee_name", headerName: "Employee Name", flex: 1, minWidth: 220 },
      { field: "work_location", headerName: "Work Location", flex: 1, minWidth: 180 },
      { field: "industry", headerName: "Industry", width: 160 },
      {
        field: "employment_status",
        headerName: "Status",
        width: 130,
        renderCell: (p: any) => (
          <Chip
            size="small"
            label={formatValue(p.value)}
            color={String(p.value ?? "").toLowerCase() === "inactive" ? "default" : "success"}
          />
        ),
      },
      { field: "date_of_joining", headerName: "Joining", width: 120 },
      { field: "shift_timing", headerName: "Shift", width: 140 },
      { field: "candidate_id", headerName: "Candidate", width: 110 },
    ],
    [],
  );

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
          Employee List
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {partner ? `Only employees for ${partner.partner_name}` : "Only employees for the logged-in partner"}
        </Typography>
      </Stack>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      {partner ? (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip size="small" label={partner.partner_name} sx={{ fontWeight: 800 }} />
          <Chip size="small" label={partner.partner_code ?? `Partner #${partner.partner_id}`} variant="outlined" />
        </Stack>
      ) : null}

      <AdCard animate={false} contentSx={{ p: 2 }}>
        <AdGrid
          rows={rows.map((row) => ({ id: row.employee_id, ...row }))}
          columns={cols as any}
          loading={loading}
          showExport={false}
          disableColumnMenu
          sx={{ minWidth: 0 }}
        />
      </AdCard>
    </Stack>
  );
}
