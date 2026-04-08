import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { AdAlertBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { jobsApi, type JobListRow } from "../../common/services/jobsApi";
import { partnerPortalApi, type PartnerApplicationRow } from "../../common/services/partnersApi";

export default function PartnerDashboardPage() {
  const [jobs, setJobs] = useState<JobListRow[]>([]);
  const [apps, setApps] = useState<PartnerApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [j, a] = await Promise.all([jobsApi.list(), partnerPortalApi.applications.list()]);
        setJobs(j);
        setApps(a);
      } catch (e: any) {
        const apiErr = e as ApiError;
        setError(apiErr?.message ?? "Failed to load partner overview");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    const openJobs = jobs.filter((j) => String(j.status ?? "").toLowerCase() === "open").length;
    const totalApps = apps.length;
    const shortlisted = apps.filter((a) => String(a.status ?? "").toLowerCase().includes("short")).length;
    const selected = apps.filter((a) => {
      const s = String(a.status ?? "").toLowerCase();
      return s.includes("select") || s.includes("deploy");
    }).length;
    return [
      { t: "Active Jobs", v: String(openJobs), c: "Open mandates" },
      { t: "Applications", v: String(totalApps), c: "Candidates applied" },
      { t: "Shortlisted", v: String(shortlisted), c: "In review" },
      { t: "Selected/Deployed", v: String(selected), c: "Final stage" },
    ];
  }, [apps, jobs]);

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
          Dashboard
        </Typography>
        <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
          Quick overview of jobs and applications
        </Typography>
      </Box>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 1fr" }, gap: 2, opacity: loading ? 0.7 : 1 }}>
        {metrics.map((x) => (
          <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {x.t}
              </Typography>
              <Typography variant="h4" fontWeight={950} sx={{ mt: 0.75 }}>
                {x.v}
              </Typography>
              <Chip size="small" label={x.c} sx={{ mt: 1.25, fontWeight: 800 }} />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
