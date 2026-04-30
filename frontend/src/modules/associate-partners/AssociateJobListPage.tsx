import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import PlaceIcon from "@mui/icons-material/Place";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdModal, AdNotification, AdRichTextContent } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { jobsApi, type JobDetail, type JobListRow } from "../../common/services/jobsApi";
import { mastersApi, type JobCategory } from "../../common/services/mastersApi";
import { listCities, listCountries, listStates, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";

type Filters = {
  country_id?: number;
  state_id?: number;
  city_id?: number;
  category_id?: number;
  status?: string;
};

export default function AssociateJobListPage() {
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [rows, setRows] = useState<JobListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ status: "Open" });
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cos, cats] = await Promise.all([listCountries(true), mastersApi.jobCategories.list(true)]);
        setCountries(cos);
        setCategories(cats);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!filters.country_id) {
      setStates([]);
      setCities([]);
      setFilters((f) => ({ ...f, state_id: undefined, city_id: undefined }));
      return;
    }
    (async () => {
      try {
        setStates(await listStates(filters.country_id!, true));
      } catch {
        setStates([]);
      }
    })();
  }, [filters.country_id]);

  useEffect(() => {
    if (!filters.state_id) {
      setCities([]);
      setFilters((f) => ({ ...f, city_id: undefined }));
      return;
    }
    (async () => {
      try {
        setCities(await listCities(filters.state_id!, true));
      } catch {
        setCities([]);
      }
    })();
  }, [filters.state_id]);

  const countryOptions = useMemo(
    () => [{ label: "All Countries", value: "" }].concat(countries.map((c) => ({ label: c.country_name, value: String(c.country_id) }))),
    [countries],
  );
  const stateOptions = useMemo(
    () => [{ label: "All States", value: "" }].concat(states.map((s) => ({ label: s.state_name, value: String(s.state_id) }))),
    [states],
  );
  const cityOptions = useMemo(
    () => [{ label: "All Cities", value: "" }].concat(cities.map((c) => ({ label: c.city_name, value: String(c.city_id) }))),
    [cities],
  );
  const categoryOptions = useMemo(
    () => [{ label: "All Categories", value: "" }].concat(categories.map((c) => ({ label: c.category_name, value: String(c.category_id) }))),
    [categories],
  );
  const statusOptions = useMemo(
    () => [
      { label: "All Status", value: "" },
      { label: "Open", value: "Open" },
      { label: "On Hold", value: "On Hold" },
      { label: "Closed", value: "Closed" },
    ],
    [],
  );

  const search = async (override?: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const active = override ?? filters;
      const data = await jobsApi.preview(active);
      setRows(data);
      if (data.length && selectedJobId == null) setSelectedJobId(data[0].job_id);
      if (!data.length) {
        setSelectedJobId(null);
        setDetail(null);
      }
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedJobId || !detailOpen) return;
    (async () => {
      setDetailLoading(true);
      try {
        setDetail(await jobsApi.get(selectedJobId));
      } catch (e: any) {
        setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load job detail", severity: "error" });
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [selectedJobId, detailOpen]);

  const filterChips = useMemo(() => {
    const labelOf = (opts: Array<{ label: string; value: string }>, v?: number) => {
      if (!v) return "";
      return opts.find((o) => o.value === String(v))?.label ?? `#${v}`;
    };
    const chips: Array<{ k: string; label: string }> = [];
    if (filters.country_id) chips.push({ k: "country", label: `Country: ${labelOf(countryOptions as any, filters.country_id)}` });
    if (filters.state_id) chips.push({ k: "state", label: `State: ${labelOf(stateOptions as any, filters.state_id)}` });
    if (filters.city_id) chips.push({ k: "city", label: `City: ${labelOf(cityOptions as any, filters.city_id)}` });
    if (filters.category_id) chips.push({ k: "category", label: `Category: ${labelOf(categoryOptions as any, filters.category_id)}` });
    if (filters.status) chips.push({ k: "status", label: `Status: ${filters.status}` });
    return chips;
  }, [filters, countryOptions, stateOptions, cityOptions, categoryOptions]);

  const grouped = useMemo(() => {
    if (!detail) return null;
    const byLoc = new Map<number, { title: string; vacancy?: any; salary?: string; req: string[]; ben: string[] }>();
    for (const loc of detail.locations) {
      const title = [loc.city_name, loc.state_name, loc.country_name].filter(Boolean).join(", ") || "Location";
      const salary = [loc.salary_min, loc.salary_max].filter(Boolean).join(" - ");
      byLoc.set(loc.id, {
        title,
        vacancy: loc.vacancy,
        salary: salary || "",
        req: [],
        ben: [],
      });
    }
    const globalReq = (detail.requirements as any[]).filter((x: any) => x.location_id == null).map((x: any) => x.requirement);
    const globalBen = (detail.benefits as any[]).filter((x: any) => x.location_id == null).map((x: any) => x.benefit);

    for (const r of detail.requirements as any[]) {
      if (r.location_id == null) continue;
      const bucket = byLoc.get(r.location_id);
      if (bucket) bucket.req.push(r.requirement);
    }
    for (const b of detail.benefits as any[]) {
      if (b.location_id == null) continue;
      const bucket = byLoc.get(b.location_id);
      if (bucket) bucket.ben.push(b.benefit);
    }

    return {
      globalReq,
      globalBen,
      locations: Array.from(byLoc.values()).map((x) => ({
        ...x,
        req: x.req.length ? x.req : globalReq,
        ben: x.ben.length ? x.ben : globalBen,
      })),
    };
  }, [detail]);

  const allDocuments = useMemo(
    () => [...(detail?.documents ?? []), ...(detail?.job_specific_documents ?? [])],
    [detail],
  );

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          Job List
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse the active jobs available to the associate partner and open any card to view the details.
        </Typography>
      </Stack>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(12, minmax(0, 1fr))",
            },
            alignItems: "end",
          }}
        >
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto", md: "span 2" } }}>
            <AdDropDown
              label="Country"
              options={countryOptions}
              value={filters.country_id ? String(filters.country_id) : ""}
              onChange={(v) => setFilters((f) => ({ ...f, country_id: v ? Number(v) : undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto", md: "span 2" } }}>
            <AdDropDown
              label="State"
              options={stateOptions}
              disabled={!filters.country_id}
              value={filters.state_id ? String(filters.state_id) : ""}
              onChange={(v) => setFilters((f) => ({ ...f, state_id: v ? Number(v) : undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto", md: "span 2" } }}>
            <AdDropDown
              label="City"
              options={cityOptions}
              disabled={!filters.state_id}
              value={filters.city_id ? String(filters.city_id) : ""}
              onChange={(v) => setFilters((f) => ({ ...f, city_id: v ? Number(v) : undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto", md: "span 3" } }}>
            <AdDropDown
              label="Category"
              options={categoryOptions}
              value={filters.category_id ? String(filters.category_id) : ""}
              onChange={(v) => setFilters((f) => ({ ...f, category_id: v ? Number(v) : undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto", md: "span 2" } }}>
            <AdDropDown
              label="Status"
              options={statusOptions}
              value={filters.status ?? ""}
              onChange={(v) => setFilters((f) => ({ ...f, status: v || undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 1" } }} />

          <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 12" } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ md: "center" }}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {filterChips.length ? (
                  filterChips.map((c) => <Chip key={c.k} size="small" label={c.label} variant="outlined" />)
                ) : (
                  <Chip size="small" label="No filters applied" variant="outlined" />
                )}
              </Stack>

              <Stack direction="row" spacing={1} justifyContent={{ xs: "stretch", md: "flex-end" }}>
                <AdButton onClick={() => search()} disabled={loading}>
                  Search
                </AdButton>
                <AdButton
                  variant="text"
                  onClick={() => {
                    setFilters({ status: "Open" });
                    setSelectedJobId(null);
                    setDetail(null);
                    search({ status: "Open" });
                  }}
                >
                  Clear
                </AdButton>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </AdCard>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <Box
        sx={{
          display: "grid",
          gap: 0.5,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
          },
          alignItems: "stretch",
        }}
      >
        {loading ? (
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : null}
        {!loading && !rows.length ? (
          <Box sx={{ gridColumn: "1 / -1" }}>
            <AdAlertBox severity="info" title="No jobs" message="No jobs found for the selected filters." />
          </Box>
        ) : null}
        {rows.map((r) => (
          <Box key={r.job_id} sx={{ display: "flex", minWidth: 0, width: "100%" }}>
            <Card
              onClick={() => {
                setSelectedJobId(r.job_id);
                setDetail(null);
                setDetailOpen(true);
              }}
              sx={{
                cursor: "pointer",
                borderRadius: 0,
                height: "100%",
                width: "100%",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderLeft: "1px solid rgba(15, 23, 42, 0.45)",
                borderBottom: "1px solid rgba(15, 23, 42, 0.45)",
                borderTop: 0,
                borderRight: 0,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ p: 1.5, display: "flex", flexDirection: "column", flex: 1 }}>
                <Stack spacing={0.9} sx={{ flex: 1 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1, minHeight: 64 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <WorkOutlineIcon fontSize="small" sx={{ mt: 0.2, flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            fontWeight={900}
                            sx={{
                              lineHeight: 1.15,
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                              overflow: "hidden",
                              minWidth: 0,
                              wordBreak: "break-word",
                            }}
                          >
                            {r.job_title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 0.5,
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 1,
                              overflow: "hidden",
                              minWidth: 0,
                            }}
                          >
                            {r.category_name ?? "—"} • {r.status ? `Job: ${r.status}` : "Job: —"}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 0.25 }} />

                  <Stack direction="row" spacing={1} alignItems="center">
                    <PlaceIcon fontSize="small" />
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 1,
                        overflow: "hidden",
                        minWidth: 0,
                      }}
                    >
                      {r.country_name ?? "Multiple locations"}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.15} sx={{ pt: 0.25 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                      Vacancy: {r.vacancy ?? 0}
                    </Typography>
                    {r.salary_min || r.salary_max ? (
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                        Salary: {[r.salary_min, r.salary_max].filter(Boolean).join(" - ")}
                      </Typography>
                    ) : null}
                  </Stack>
                </Stack>

                <Box sx={{ pt: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, minWidth: 0 }}>
                    View details
                  </Typography>
                  <AdButton
                    variant="secondary"
                    size="small"
                    onClick={(e: any) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedJobId(r.job_id);
                      setDetail(null);
                      setDetailOpen(true);
                    }}
                  >
                    View
                  </AdButton>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <AdModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Job Detail"
        subtitle={selectedJobId ? `Job #${selectedJobId}` : undefined}
        maxWidth="md"
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setDetailOpen(false)}>
              Close
            </AdButton>
          </Stack>
        }
      >
        {!selectedJobId ? (
          <AdAlertBox severity="info" title="Select a job" message="Click any job card to view details." />
        ) : detailLoading ? (
          <Typography>Loading...</Typography>
        ) : !detail ? (
          <AdAlertBox severity="warning" title="Not loaded" message="Unable to load job detail." />
        ) : (
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Typography variant="h6" fontWeight={950}>
                  {detail.job.job_title}
                </Typography>
                <Chip size="small" label={String(detail.job.status ?? "")} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {detail.job.job_code ?? `#${detail.job.job_id}`}
              </Typography>
            </Stack>

            <Divider />

            {detail.job.job_description ? (
              <AdRichTextContent html={detail.job.job_description} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No description.
              </Typography>
            )}

            <Divider />

            <Stack spacing={1.5}>
              <Typography fontWeight={900}>Locations</Typography>
              {grouped?.locations.map((l, idx) => (
                <AdCard
                  key={idx}
                  animate={false}
                  sx={{ borderRadius: 3, backgroundColor: "rgba(255,255,255,0.85)" }}
                  contentSx={{ p: 2 }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography fontWeight={900}>{l.title}</Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip size="small" label={`${Number(l.vacancy ?? 0)} vacancy`} />
                        {l.salary ? <Chip size="small" label={l.salary} variant="outlined" /> : null}
                      </Stack>
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight={800}>
                        Requirements
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                        {(l.req ?? []).join("\n") || "—"}
                      </Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight={800}>
                        Benefits
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                        {(l.ben ?? []).join("\n") || "—"}
                      </Typography>
                    </Stack>
                  </Stack>
                </AdCard>
              ))}
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography fontWeight={900}>Documents</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {allDocuments.map((d: any) => (
                  <Chip
                    key={`doc-${d.id}-${d.document_type_id ?? d.job_specific_document_id ?? "x"}`}
                    size="small"
                    label={`${d.document_name}${Number(d.is_required) ? " (Required)" : ""}`}
                  />
                ))}
                {!allDocuments.length ? (
                  <Typography variant="body2" color="text.secondary">
                    No documents.
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          </Stack>
        )}
      </AdModal>
    </Stack>
  );
}
