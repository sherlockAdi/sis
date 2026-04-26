import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import { AdAlertBox, AdButton, AdCard, AdCheckBox, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { employeesApi, type EmployeeDetailRow, type EmployeeRow } from "../../common/services/employeesApi";

export default function EmployeesPage() {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<EmployeeDetailRow | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [credentialSaving, setCredentialSaving] = useState(false);
  const [credentialForm, setCredentialForm] = useState({ username: "", email: "", password: "" });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await employeesApi.list());
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const cols = useMemo(
    () => [
      { field: "employee_id", headerName: "ID", width: 90 },
      { field: "employee_code", headerName: "Employee Code", width: 160 },
      { field: "employee_name", headerName: "Employee Name", flex: 1, minWidth: 180 },
      { field: "employee_contact_number", headerName: "Contact", width: 140 },
      { field: "work_location", headerName: "Work Location", flex: 1, minWidth: 180 },
      {
        field: "employment_status",
        headerName: "Status",
        width: 130,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "Active")} color={String(p.value ?? "").toLowerCase() === "inactive" ? "default" : "success"} />,
      },
      { field: "date_of_joining", headerName: "Joining", width: 120 },
      { field: "candidate_id", headerName: "Candidate", width: 110 },
      {
        field: "__actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as EmployeeRow;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EditIcon fontSize="small" />}
                onClick={async () => {
                  setModalOpen(true);
                  setLoadingDetail(true);
                  try {
                    setSelected(await employeesApi.get(r.employee_id));
                  } catch (e: any) {
                    setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load employee", severity: "error" });
                    setSelected(null);
                  } finally {
                    setLoadingDetail(false);
                  }
                }}
              >
                View
              </AdButton>
              <AdButton
                variant="text"
                startIcon={<BlockIcon fontSize="small" />}
                onClick={async () => {
                  try {
                    await employeesApi.disable(r.employee_id);
                    setToast({ open: true, message: "Employee disabled", severity: "success" });
                    refresh();
                  } catch (e: any) {
                    setToast({ open: true, message: (e as ApiError)?.message ?? "Disable failed", severity: "error" });
                  }
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

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Employee Zone
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deployed candidates converted into employees
          </Typography>
        </Stack>
        <AdButton startIcon={<AddIcon fontSize="small" />} onClick={refresh}>
          Refresh
        </AdButton>
      </Stack>
      {error && <AdAlertBox severity="error" title="Error" message={error} />}
      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.employee_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>

      <AdModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? `Employee #${selected.employee_code}` : "Employee Details"}
        subtitle={selected ? selected.employee_name : ""}
        maxWidth="lg"
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setModalOpen(false)}>
              Close
            </AdButton>
          </Stack>
        }
      >
        {loadingDetail ? (
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        ) : selected ? (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <AdButton
                variant="outlined"
                onClick={() => {
                  setCredentialForm({
                    username: selected.login_username ?? "",
                    email: selected.login_email ?? selected.email ?? "",
                    password: "",
                  });
                  setCredentialModalOpen(true);
                }}
              >
                Update Login
              </AdButton>
            </Stack>
            <BoxGrid>
              <Field label="Employee Name" value={selected.employee_name} />
              <Field label="Contact" value={selected.employee_contact_number ?? "-"} />
              <Field label="Email" value={selected.email ?? "-"} />
              <Field label="Login Username" value={selected.login_username ?? "-"} />
              <Field label="Login Email" value={selected.login_email ?? selected.email ?? "-"} />
              <Field label="Work Location" value={selected.work_location ?? "-"} />
              <Field label="Industry" value={selected.industry ?? "-"} />
              <Field label="Employment Status" value={selected.employment_status ?? "-"} />
              <Field label="Date of Joining" value={selected.date_of_joining ?? "-"} />
              <Field label="Date of Confirmation" value={selected.date_of_confirmation ?? "-"} />
              <Field label="Shift Timing" value={selected.shift_timing ?? "-"} />
              <Field label="Passport Number" value={selected.passport_number ?? "-"} />
              <Field label="Candidate ID" value={String(selected.candidate_id)} />
              <Field label="Deployment ID" value={selected.deployment_id ? String(selected.deployment_id) : "-"} />
            </BoxGrid>
            <AdCheckBox label="Active" checked={String(selected.employment_status ?? "").toLowerCase() !== "inactive"} onChange={() => undefined} />
            <Typography variant="caption" color="text.secondary">
              Candidate profile data is mapped directly into the employee record during conversion.
            </Typography>
          </Stack>
        ) : null}
      </AdModal>

      <AdModal
        open={credentialModalOpen}
        onClose={() => setCredentialModalOpen(false)}
        title="Update Login Credentials"
        subtitle="Change the linked username, email, or password for this employee"
        maxWidth="sm"
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setCredentialModalOpen(false)} disabled={credentialSaving}>
              Cancel
            </AdButton>
            <AdButton
              onClick={async () => {
                if (!selected) return;
                setCredentialSaving(true);
                try {
                  await employeesApi.updateCredentials(selected.employee_id, {
                    username: credentialForm.username.trim() || null,
                    email: credentialForm.email.trim() || null,
                    password: credentialForm.password.trim() || null,
                  });
                  setToast({ open: true, message: "Login credentials updated", severity: "success" });
                  setCredentialModalOpen(false);
                  setModalOpen(false);
                  await refresh();
                } catch (e: any) {
                  setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to update login credentials", severity: "error" });
                } finally {
                  setCredentialSaving(false);
                }
              }}
              disabled={credentialSaving}
            >
              Save Credentials
            </AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <AdTextBox
            label="Username"
            value={credentialForm.username}
            onChange={(v) => setCredentialForm((f) => ({ ...f, username: v }))}
            placeholder="Enter username"
          />
          <AdTextBox
            label="Email"
            type="email"
            value={credentialForm.email}
            onChange={(v) => setCredentialForm((f) => ({ ...f, email: v }))}
            placeholder="Enter email"
          />
          <AdTextBox
            label="New Password"
            type="password"
            value={credentialForm.password}
            onChange={(v) => setCredentialForm((f) => ({ ...f, password: v }))}
            placeholder="Leave blank to keep current password"
          />
        </Stack>
      </AdModal>
    </Stack>
  );
}

function BoxGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>{children}</div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <AdCard animate={false} sx={{ borderRadius: 3, border: "1px solid rgba(226,232,240,0.9)" }} contentSx={{ p: 1.5 }}>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography fontWeight={800} sx={{ wordBreak: "break-word" }}>
          {value}
        </Typography>
      </Stack>
    </AdCard>
  );
}
