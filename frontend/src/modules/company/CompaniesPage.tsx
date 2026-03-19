import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Divider, Stack, Tab, Tabs, Typography } from "@mui/material";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdModal, AdNotification, AdTextArea, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { companyApi, type CompanyContactRow, type CompanyDocumentRow, type CompanyRow } from "../../common/services/companyApi";
import { listCities, listCountries, listStates, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx).toLowerCase();
}

function safeKeyPart(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function CompaniesPage() {
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({ open: false, message: "", severity: "success" });
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_id: 0,
    company_name: "",
    country_id: "",
    state_id: "",
    city_id: "",
    address: "",
    phone: "",
    email: "",
    contact_person: "",
    status: true,
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);

  const [contacts, setContacts] = useState<CompanyContactRow[]>([]);
  const [docs, setDocs] = useState<CompanyDocumentRow[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);

  const [newContact, setNewContact] = useState({ name: "", designation: "", phone: "", email: "" });
  const [newDocName, setNewDocName] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await companyApi.companies.list(true));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

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
    if (!open) return;
    if (!form.country_id) {
      setStates([]);
      setCities([]);
      setForm((f) => ({ ...f, state_id: "", city_id: "" }));
      return;
    }
    (async () => {
      try {
        setStates(await listStates(Number(form.country_id), true));
      } catch {
        setStates([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.country_id]);

  useEffect(() => {
    if (!open) return;
    if (!form.state_id) {
      setCities([]);
      setForm((f) => ({ ...f, city_id: "" }));
      return;
    }
    (async () => {
      try {
        setCities(await listCities(Number(form.state_id), true));
      } catch {
        setCities([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.state_id]);

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
      { field: "company_code", headerName: "Code", width: 130 },
      { field: "company_name", headerName: "Company", flex: 1, minWidth: 240 },
      { field: "country_name", headerName: "Country", width: 170 },
      { field: "status", headerName: "Status", width: 110, renderCell: (p: any) => <Chip size="small" label={Number(p.value) ? "Active" : "Inactive"} color={Number(p.value) ? "success" : "default"} /> },
      {
        field: "__actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as CompanyRow;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                onClick={() => {
                  setTab(0);
                  setForm({
                    company_id: r.company_id,
                    company_name: r.company_name ?? "",
                    country_id: r.country_id ? String(r.country_id) : "",
                    state_id: r.state_id ? String(r.state_id) : "",
                    city_id: r.city_id ? String(r.city_id) : "",
                    address: r.address ?? "",
                    phone: r.phone ?? "",
                    email: r.email ?? "",
                    contact_person: r.contact_person ?? "",
                    status: Number(r.status) === 1,
                  });
                  setOpen(true);
                }}
              >
                Edit
              </AdButton>
              <AdButton
                variant="text"
                color="error"
                startIcon={<DeleteOutlineIcon fontSize="small" />}
                onClick={async () => {
                  try {
                    await companyApi.companies.disable(r.company_id);
                    setToast({ open: true, message: "Company disabled", severity: "success" });
                    refresh();
                  } catch (e: any) {
                    setToast({ open: true, message: (e as ApiError)?.message ?? "Failed", severity: "error" });
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

  const loadChildren = async (company_id: number) => {
    setChildrenLoading(true);
    try {
      const [c, d] = await Promise.all([companyApi.contacts.list(company_id), companyApi.documents.list(company_id)]);
      setContacts(c);
      setDocs(d);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load company details", severity: "error" });
      setContacts([]);
      setDocs([]);
    } finally {
      setChildrenLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (!form.company_id) {
      setContacts([]);
      setDocs([]);
      return;
    }
    loadChildren(form.company_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.company_id]);

  const saveCompany = async () => {
    setSaving(true);
    try {
      const payload = {
        company_name: form.company_name.trim(),
        country_id: form.country_id ? Number(form.country_id) : null,
        state_id: form.state_id ? Number(form.state_id) : null,
        city_id: form.city_id ? Number(form.city_id) : null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        contact_person: form.contact_person.trim() || null,
        status: form.status,
      };

      if (!payload.company_name) throw new Error("Company name is required");

      if (form.company_id) {
        await companyApi.companies.update(form.company_id, payload);
        setToast({ open: true, message: "Company updated", severity: "success" });
      } else {
        const created = await companyApi.companies.create(payload as any);
        setToast({
          open: true,
          severity: created.emailed ? "success" : "warning",
          message: created.emailed
            ? `Company created. Credentials emailed to ${payload.email ?? "company email"}.`
            : `Company created. Username: ${created.username} (email not sent)`,
        });
        setForm((f) => ({ ...f, company_id: created.company_id }));
      }
      refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Save failed", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const addContact = async () => {
    if (!form.company_id) return;
    try {
      await companyApi.contacts.create(form.company_id, {
        name: newContact.name.trim() || null,
        designation: newContact.designation.trim() || null,
        phone: newContact.phone.trim() || null,
        email: newContact.email.trim() || null,
      });
      setNewContact({ name: "", designation: "", phone: "", email: "" });
      loadChildren(form.company_id);
      setToast({ open: true, message: "Contact added", severity: "success" });
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to add contact", severity: "error" });
    }
  };

  const uploadCompanyDoc = async (file: File) => {
    if (!form.company_id) return;
    const document_name = newDocName.trim();
    if (!document_name) {
      setToast({ open: true, message: "Document name is required", severity: "error" });
      return;
    }
    try {
      const now = Date.now();
      const ext = fileExt(file.name);
      const objectKey = `companies/${form.company_id}/docs/${safeKeyPart(document_name)}/${now}${ext}`;

      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      await companyApi.documents.upsert(form.company_id, { document_name, file_path: objectKey });
      setToast({ open: true, message: "Document uploaded", severity: "success" });
      setNewDocName("");
      loadChildren(form.company_id);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Upload failed", severity: "error" });
    }
  };

  const openDoc = async (doc: CompanyDocumentRow) => {
    if (!doc.file_path) return;
    try {
      const presign = await recruitmentApi.files.presignDownload(doc.file_path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open file", severity: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Companies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create companies, manage contacts, and upload company documents.
          </Typography>
        </Stack>
        <AdButton
          variant="contained"
          startIcon={<AddBusinessIcon />}
          onClick={() => {
            setTab(0);
            setForm({
              company_id: 0,
              company_name: "",
              country_id: "",
              state_id: "",
              city_id: "",
              address: "",
              phone: "",
              email: "",
              contact_person: "",
              status: true,
            });
            setNewContact({ name: "", designation: "", phone: "", email: "" });
            setNewDocName("");
            setOpen(true);
          }}
        >
          New Company
        </AdButton>
      </Stack>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.company_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>

      <AdModal
        open={open}
        onClose={() => setOpen(false)}
        title={form.company_id ? "Edit Company" : "Create Company"}
        subtitle={form.company_id ? `Company ID: ${form.company_id}` : "Company profile, contacts, and documents"}
        maxWidth="lg"
      >
        <Stack spacing={2}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 0.5 }}>
            <Tab label="Company" />
            <Tab label="Contacts" disabled={!form.company_id} />
            <Tab label="Documents" disabled={!form.company_id} />
          </Tabs>

          {tab === 0 ? (
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
                }}
              >
                <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 6" } }}>
                  <AdTextBox label="Company Name" required value={form.company_name} onChange={(v) => setForm((f) => ({ ...f, company_name: v }))} />
                </Box>
                <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 3" } }}>
                  <AdDropDown label="Country" options={countryOptions} value={form.country_id} onChange={(v) => setForm((f) => ({ ...f, country_id: v }))} />
                </Box>
                <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 3" } }}>
                  <AdDropDown label="State" options={stateOptions} value={form.state_id} disabled={!form.country_id} onChange={(v) => setForm((f) => ({ ...f, state_id: v }))} />
                </Box>
                <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 3" } }}>
                  <AdDropDown label="City" options={cityOptions} value={form.city_id} disabled={!form.state_id} onChange={(v) => setForm((f) => ({ ...f, city_id: v }))} />
                </Box>
                <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 9" } }}>
                  <AdTextArea label="Address" value={form.address} onChange={(v: string) => setForm((f) => ({ ...f, address: v }))} minRows={3} />
                </Box>
                <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 4" } }}>
                  <AdTextBox label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
                </Box>
                <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 4" } }}>
                  <AdTextBox label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
                </Box>
                <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 4" } }}>
                  <AdTextBox label="Contact Person" value={form.contact_person} onChange={(v) => setForm((f) => ({ ...f, contact_person: v }))} />
                </Box>
              </Box>

              <Divider />

              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <AdButton variant="contained" disabled={saving} onClick={saveCompany}>
                  {saving ? "Saving..." : "Save"}
                </AdButton>
              </Stack>
            </Stack>
          ) : null}

          {tab === 1 ? (
            <Stack spacing={2}>
              {childrenLoading ? <Typography>Loading...</Typography> : null}

              <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.75)" }} contentSx={{ p: 2 }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Add Contact
                </Typography>
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" } }}>
                  <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 3" } }}>
                    <AdTextBox label="Name" value={newContact.name} onChange={(v) => setNewContact((c) => ({ ...c, name: v }))} />
                  </Box>
                  <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 3" } }}>
                    <AdTextBox label="Designation" value={newContact.designation} onChange={(v) => setNewContact((c) => ({ ...c, designation: v }))} />
                  </Box>
                  <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 3" } }}>
                    <AdTextBox label="Phone" value={newContact.phone} onChange={(v) => setNewContact((c) => ({ ...c, phone: v }))} />
                  </Box>
                  <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 3" } }}>
                    <AdTextBox label="Email" type="email" value={newContact.email} onChange={(v) => setNewContact((c) => ({ ...c, email: v }))} />
                  </Box>
                </Box>
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                  <AdButton variant="contained" onClick={addContact}>
                    Add
                  </AdButton>
                </Stack>
              </AdCard>

              <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.75)" }} contentSx={{ p: 2 }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Contacts
                </Typography>
                {!contacts.length ? (
                  <AdAlertBox severity="info" title="No contacts" message="No contacts added yet." />
                ) : (
                  <Stack spacing={1}>
                    {contacts.map((c) => (
                      <AdCard key={c.contact_id} animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.9)" }} contentSx={{ p: 1.5 }}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                          <Stack spacing={0.25}>
                            <Typography fontWeight={900}>{c.name ?? "—"}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(c.designation ?? "—") + " • " + (c.phone ?? "—") + " • " + (c.email ?? "—")}
                            </Typography>
                          </Stack>
                          <AdButton
                            variant="text"
                            color="error"
                            startIcon={<DeleteOutlineIcon fontSize="small" />}
                            onClick={async () => {
                              if (!form.company_id) return;
                              try {
                                await companyApi.contacts.remove(form.company_id, c.contact_id);
                                setToast({ open: true, message: "Contact removed", severity: "success" });
                                loadChildren(form.company_id);
                              } catch (e: any) {
                                setToast({ open: true, message: (e as ApiError)?.message ?? "Failed", severity: "error" });
                              }
                            }}
                          >
                            Remove
                          </AdButton>
                        </Stack>
                      </AdCard>
                    ))}
                  </Stack>
                )}
              </AdCard>
            </Stack>
          ) : null}

          {tab === 2 ? (
            <Stack spacing={2}>
              {childrenLoading ? <Typography>Loading...</Typography> : null}

              <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.75)" }} contentSx={{ p: 2 }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Upload Document
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                  <Box sx={{ flex: 1 }}>
                    <AdTextBox label="Document Name" value={newDocName} onChange={(v) => setNewDocName(v)} />
                  </Box>
                  <AdButton component="label" startIcon={<UploadFileIcon fontSize="small" />}>
                    Upload
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadCompanyDoc(f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </AdButton>
                </Stack>
              </AdCard>

              <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.75)" }} contentSx={{ p: 2 }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Documents
                </Typography>
                {!docs.length ? (
                  <AdAlertBox severity="info" title="No documents" message="No documents uploaded yet." />
                ) : (
                  <Stack spacing={1}>
                    {docs.map((d) => (
                      <AdCard key={d.id} animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.9)" }} contentSx={{ p: 1.5 }}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
                          <Stack spacing={0.25}>
                            <Typography fontWeight={900}>{d.document_name ?? "—"}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {d.uploaded_at ?? "—"}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} onClick={() => openDoc(d)}>
                              View
                            </AdButton>
                          </Stack>
                        </Stack>
                      </AdCard>
                    ))}
                  </Stack>
                )}
              </AdCard>
            </Stack>
          ) : null}
        </Stack>
      </AdModal>
    </Stack>
  );
}
