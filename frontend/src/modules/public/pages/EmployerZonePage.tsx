import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import PublicPageHero from "../components/PublicPageHero";

export default function EmployerZonePage() {
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <Box>
      <PublicPageHero
        eyebrow="Employer Zone"
        title="Hire"
        highlight="Workforce"
        subtitle="For companies hiring workforce — clear process, compliance support, and structured sourcing."
        actions={
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate("/portal/login/auth?portal=employer")}
              sx={{ borderRadius: 999 }}
            >
              Employer Portal Login
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                const el = document.getElementById("inquiry");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              sx={{ borderRadius: 999, fontWeight: 900 }}
            >
              Send Inquiry
            </Button>
          </Stack>
        }
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          {/* Quick snapshot */}
          <Box
            sx={{
              p: { xs: 2.5, md: 3 },
              bgcolor: "white",
              borderRadius: 4,
              border: "1px solid rgba(15,23,42,0.08)",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
              gap: 2,
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
                Built for hiring at scale — with traceability
              </Typography>
              <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
                SIS Global supports employers with structured sourcing, screening, documentation, and deployment tracking — so you
                can hire faster without losing control of compliance.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.75 }}>
                <Chip label="Multi-country hiring" sx={{ fontWeight: 900 }} />
                <Chip label="Partner network sourcing" sx={{ fontWeight: 900 }} />
                <Chip label="Document checklist control" sx={{ fontWeight: 900 }} />
                <Chip label="Stage-wise status tracking" sx={{ fontWeight: 900 }} />
              </Stack>
            </Box>
            <Box
              component="img"
              src="/home/workforce-1.svg"
              alt="Workforce"
              sx={{
                width: "100%",
                maxHeight: 220,
                objectFit: "cover",
                borderRadius: 3,
                border: "1px solid rgba(15,23,42,0.08)",
                bgcolor: "rgba(2,6,23,0.02)",
              }}
            />
          </Box>

          <Box
            id="why"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Why partner with SIS
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9, maxWidth: 980 }}>
              You get a corporate trust layer over the sourcing ecosystem: standardized screening, controlled documentation,
              structured partner submissions, and stage-wise visibility until deployment.
            </Typography>

            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              {[
                {
                  t: "Compliance-first hiring",
                  d: "Document checklist, verification flow, and audit-ready status history for every candidate.",
                },
                {
                  t: "Faster turnaround",
                  d: "Bulk sourcing + shortlisting + interview scheduling with clear ownership at each stage.",
                },
                {
                  t: "Transparent pipeline",
                  d: "Applied → Screening → Interview → Medical → Visa → Travel → Deployed (trackable at all times).",
                },
                {
                  t: "Employer-ready reporting",
                  d: "Country/role-wise counts, pending actions, and exportable reports for operational control.",
                },
              ].map((x) => (
                <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography fontWeight={950}>{x.t}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.85 }}>
                      {x.d}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Box
            id="solutions"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Workforce solutions
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9, maxWidth: 980 }}>
              End-to-end solutions for skilled / semi-skilled / blue-collar hiring across countries — including sourcing,
              screening, compliance documentation, training readiness, and deployment tracking.
            </Typography>

            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
              {[
                {
                  t: "Role-based hiring",
                  d: "Drivers, security, helpers, housekeeping, technicians, hospitality, construction and more.",
                },
                {
                  t: "Partner sourcing network",
                  d: "Structured referrals with performance tracking and quality feedback loops.",
                },
                {
                  t: "Screening & interviews",
                  d: "Shortlisting, scheduling, feedback capture, and selection decisions — all in one flow.",
                },
                {
                  t: "Trade test & assessment",
                  d: "Skill validation workflows including uploads, scoring, and customer sharing.",
                },
                {
                  t: "Documentation & compliance",
                  d: "Required docs per job, verification status, expiry alerts, and audit trail.",
                },
                {
                  t: "Deployment readiness",
                  d: "Visa stages, travel updates, joining info, and stage-wise tracking until deployed.",
                },
              ].map((x) => (
                <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography fontWeight={950}>{x.t}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.85 }}>
                      {x.d}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Box
            id="process"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Process
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9, maxWidth: 980 }}>
              A process-driven workflow so every stakeholder knows exactly what’s next.
            </Typography>

            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              {[
                { n: "01", t: "Inquiry & role brief", d: "Share role, country, salary, experience, and joining timeline." },
                { n: "02", t: "Sourcing (partners + internal)", d: "Bulk candidate discovery with quality control checkpoints." },
                { n: "03", t: "Screening & interviews", d: "Shortlist, schedule interviews, capture feedback and decisions." },
                { n: "04", t: "Trade test / medical / docs", d: "Skill validation + required documents checklist + medicals." },
                { n: "05", t: "Visa processing & approvals", d: "Stage-wise tracking: biometrics → visa → approvals." },
                { n: "06", t: "Travel & deployment", d: "Travel booking, joining instructions, and deployment confirmation." },
              ].map((x) => (
                <Card key={x.n} variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5} alignItems="baseline">
                      <Typography fontWeight={950} sx={{ color: "primary.main" }}>
                        {x.n}
                      </Typography>
                      <Typography fontWeight={950}>{x.t}</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.85 }}>
                      {x.d}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Employer trust layer
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9, maxWidth: 980 }}>
              Designed to avoid “black box” hiring. You get traceability, compliance control, and predictable delivery.
            </Typography>
            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
              {[
                { t: "SLA-driven workflow", d: "Defined stages, ownership, and measurable progress updates." },
                { t: "Verification checkpoints", d: "Document requirements, verification status, and pending alerts." },
                { t: "Reporting & exports", d: "Country/role pipeline metrics and operational summaries." },
              ].map((x) => (
                <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography fontWeight={950}>{x.t}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.85 }}>
                      {x.d}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Engagement models
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9, maxWidth: 980 }}>
              Choose a structure that fits your hiring volume and timelines.
            </Typography>
            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
              {[
                { t: "Project-based hiring", d: "Ideal for urgent bulk hiring with a fixed joining date." },
                { t: "Recurring workforce supply", d: "Monthly/quarterly requirements with ongoing pipeline." },
                { t: "On-demand roles", d: "Flexible hiring for variable roles and ad-hoc requests." },
              ].map((x) => (
                <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography fontWeight={950}>{x.t}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.85 }}>
                      {x.d}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Divider />

          <Box
            id="inquiry"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Contact / Inquiry form
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary" }}>
              Leave your details — we will contact you.
            </Typography>

            {submitted ? <Alert sx={{ mt: 2 }} severity="success">Thanks — we will reach out shortly.</Alert> : null}

            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <TextField label="Company Name" value={company} onChange={(e) => setCompany(e.target.value)} fullWidth />
              <TextField label="Work Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
              <TextField label="Requirement / Message" value={message} onChange={(e) => setMessage(e.target.value)} fullWidth multiline minRows={4} />
              <Button variant="contained" onClick={() => setSubmitted(true)} sx={{ borderRadius: 3, bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } }}>
                Submit Inquiry
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
