import { Box, Button, Container, Divider, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { PORTAL_BASE } from "../../../common/paths";

export default function PublicMenuPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "secondary.main", color: "white" }}>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Stack spacing={2.5}>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: "none", justifyContent: "flex-start" }}
          >
            Back
          </Button>

          <Typography variant="h4" fontWeight={950} sx={{ letterSpacing: -0.8 }}>
            Menu
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Full-screen navigation (no modals).
          </Typography>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

          <Stack spacing={2}>
            <Stack spacing={1}>
              <Typography variant="overline" sx={{ opacity: 0.7 }}>
                Main
              </Typography>
              {[
                { label: "Home", to: "/" },
                { label: "Employer Zone", to: "/employer-zone" },
                { label: "Partner Zone", to: "/partner-zone" },
                { label: "Get Registered", to: "/register" },
              ].map((l) => (
                <Button
                  key={l.to}
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(l.to)}
                  sx={{
                    justifyContent: "space-between",
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.10)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.14)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.14)" },
                  }}
                >
                  {l.label}
                </Button>
              ))}
            </Stack>

            <Stack spacing={1}>
              <Typography variant="overline" sx={{ opacity: 0.7 }}>
                About Us
              </Typography>
              {[
                { label: "Company overview", to: "/about#overview" },
                { label: "Global presence", to: "/about#presence" },
                { label: "Trust / certifications", to: "/about#trust" },
                { label: "Why SIS", to: "/about#why" },
              ].map((l) => (
                <Button
                  key={l.to}
                  variant="text"
                  onClick={() => navigate(l.to)}
                  sx={{ justifyContent: "flex-start", color: "rgba(255,255,255,0.88)" }}
                >
                  {l.label}
                </Button>
              ))}
            </Stack>

            <Stack spacing={1}>
              <Typography variant="overline" sx={{ opacity: 0.7 }}>
                Jobs
              </Typography>
              {[
                { label: "Browse All Jobs", to: "/jobs" },
                { label: "Jobs in UAE", to: "/jobs/country/uae" },
                { label: "Jobs in Saudi", to: "/jobs/country/saudi" },
                { label: "Jobs in Qatar", to: "/jobs/country/qatar" },
                { label: "Jobs in Kuwait", to: "/jobs/country/kuwait" },
                { label: "Jobs in Oman", to: "/jobs/country/oman" },
              ].map((l) => (
                <Button
                  key={l.to}
                  variant="text"
                  onClick={() => navigate(l.to)}
                  sx={{ justifyContent: "flex-start", color: "rgba(255,255,255,0.88)" }}
                >
                  {l.label}
                </Button>
              ))}
            </Stack>
          </Stack>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

          <Stack spacing={1}>
            <Typography variant="overline" sx={{ opacity: 0.7 }}>
              Portal Logins
            </Typography>
            <Stack spacing={1}>
              {[
                { label: "Candidate Login", portal: "candidate" },
                { label: "Customer Login", portal: "employer" },
                { label: "Partner Login", portal: "sourcing" },
                { label: "Admin Login", portal: "administrator" },
              ].map((p) => (
                <Button
                  key={p.portal}
                  onClick={() => navigate(`${PORTAL_BASE}/login?portal=${p.portal}`)}
                  sx={{ textTransform: "none", fontWeight: 900, justifyContent: "flex-start", color: "rgba(255,255,255,0.88)" }}
                >
                  {p.label}
                </Button>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
