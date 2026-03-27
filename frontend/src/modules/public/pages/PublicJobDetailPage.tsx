import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Container, Divider, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { jobsApi, type JobDetail } from "../../../common/services/jobsApi";
import { getAuthToken } from "../../../common/services/tokenStorage";

export default function PublicJobDetailPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const id = Number(jobId);
  const token = getAuthToken();

  const [data, setData] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goApply = () => {
    if (!Number.isFinite(id) || id <= 0) return;
    const target = `/portal/candidate/jobs/${id}/apply`;
    if (token) navigate(target);
    else navigate("/register", { state: { from: target } });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!Number.isFinite(id)) {
        setError("Invalid job id.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let d: JobDetail | null = null;
        try {
          d = await jobsApi.get(id, { auth: false });
        } catch (e) {
          if (getAuthToken()) {
            d = await jobsApi.get(id);
          } else {
            throw e;
          }
        }
        if (!cancelled) setData(d);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ? String(e.message) : "Unable to load job details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/jobs")} sx={{ textTransform: "none", fontWeight: 900 }}>
            Back to Jobs
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={goApply}
            sx={{ borderRadius: 999 }}
            disabled={!Number.isFinite(id) || id <= 0}
          >
            {token ? "Apply Now" : "Register to Apply"}
          </Button>
        </Stack>

        {loading ? <Alert severity="info">Loading job...</Alert> : null}
        {error ? <Alert severity="warning">{error}</Alert> : null}

        {data ? (
          <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.9 }}>
              {data.job.job_title}
            </Typography>

            <Box sx={{ mt: 1.25, display: "flex", flexWrap: "wrap", gap: 1 }}>
              {data.job.vacancy != null ? <Chip label={`${data.job.vacancy} vacancies`} /> : null}
              {data.job.salary_min || data.job.salary_max ? (
                <Chip label={`Salary: ${data.job.salary_min ?? ""}${data.job.salary_min && data.job.salary_max ? " - " : ""}${data.job.salary_max ?? ""}`} />
              ) : null}
              {data.job.status ? <Chip label={data.job.status} /> : null}
            </Box>

            {data.job.job_description ? (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Typography fontWeight={950}>Job Description</Typography>
                <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", whiteSpace: "pre-wrap" }}>
                  {data.job.job_description}
                </Typography>
              </>
            ) : null}

            {data.requirements?.length ? (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Typography fontWeight={950}>Requirements</Typography>
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {data.requirements.map((r) => (
                    <Typography key={r.requirement_id} variant="body2" sx={{ color: "text.secondary" }}>
                      • {r.requirement}
                    </Typography>
                  ))}
                </Stack>
              </>
            ) : null}

            {data.benefits?.length ? (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Typography fontWeight={950}>Benefits</Typography>
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {data.benefits.map((b) => (
                    <Typography key={b.benefit_id} variant="body2" sx={{ color: "text.secondary" }}>
                      • {b.benefit}
                    </Typography>
                  ))}
                </Stack>
              </>
            ) : null}
          </Box>
        ) : null}
      </Stack>
    </Container>
  );
}
