import { Box, Button, Container, Divider, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { PORTAL_BASE } from "../../../common/paths";
import { SisLogo } from "../../../common/ad";

export default function PublicMenuPage() {
  const navigate = useNavigate();
  const isMdUp = useMediaQuery((theme: any) => theme.breakpoints.up("md"));

  return (
    <Box sx={{ height: "100vh", bgcolor: "secondary.main", color: "white", overflow: "hidden" }}>
      <Container
        maxWidth="md"
        sx={{
          py: 2.5,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Fixed header */}
        <Stack spacing={1.75} sx={{ flex: "0 0 auto" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <SisLogo height={28} />
            </Box>
            <Button
              color="inherit"
              startIcon={<CloseIcon />}
              onClick={() => navigate(-1)}
              sx={{ textTransform: "none", justifyContent: "flex-start" }}
            >
              Close
            </Button>
          </Stack>

          {isMdUp ? (
            <TextField
              placeholder="Search jobs (keyword)"
              fullWidth
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  navigate(v ? `/jobs?keyword=${encodeURIComponent(v)}` : "/jobs");
                }
              }}
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 999,
                  bgcolor: "rgba(255,255,255,0.10)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.14)",
                },
                "& input::placeholder": { color: "rgba(255,255,255,0.75)" },
              }}
            />
          ) : null}

          <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
        </Stack>

        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflowY: "auto", pr: { xs: 0, md: 0.5 }, pb: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              pt: 2,
            }}
          >
            <Stack
              spacing={1}
              sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <Typography variant="overline" sx={{ opacity: 0.75 }}>
                Main
              </Typography>
              {[
                { label: "Home", to: "/" },
                { label: "About Us", to: "/about" },
                { label: "Jobs", to: "/jobs" },
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
                  fullWidth
                >
                  {l.label}
                </Button>
              ))}
            </Stack>

            <Stack
              spacing={1}
              sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <Typography variant="overline" sx={{ opacity: 0.75 }}>
                Portal logins
              </Typography>
              {[
                { label: "Candidate Login", portal: "candidate" },
                { label: "Customer Login", portal: "employer" },
                { label: "Partner Login", portal: "sourcing" },
                { label: "Admin Login", portal: "administrator" },
              ].map((p) => (
                <Button
                  key={p.portal}
                  variant="text"
                  onClick={() => navigate(`${PORTAL_BASE}/login?portal=${p.portal}`)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    justifyContent: "flex-start",
                    color: "rgba(255,255,255,0.88)",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </Stack>

            {/* Desktop-only detail panels */}
            {isMdUp ? (
              <>
            <Stack
              spacing={1}
              sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <Typography variant="overline" sx={{ opacity: 0.75 }}>
                About (sections)
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
                  sx={{
                    justifyContent: "flex-start",
                    color: "rgba(255,255,255,0.88)",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  {l.label}
                </Button>
              ))}
            </Stack>

            <Stack
              spacing={1}
              sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <Typography variant="overline" sx={{ opacity: 0.75 }}>
                Employer zone (sections)
              </Typography>
              {[
                { label: "Why partner with SIS", to: "/employer-zone#why" },
                { label: "Workforce solutions", to: "/employer-zone#solutions" },
                { label: "Process", to: "/employer-zone#process" },
                { label: "Inquiry", to: "/employer-zone#inquiry" },
              ].map((l) => (
                <Button
                  key={l.to}
                  variant="text"
                  onClick={() => navigate(l.to)}
                  sx={{
                    justifyContent: "flex-start",
                    color: "rgba(255,255,255,0.88)",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  {l.label}
                </Button>
              ))}
            </Stack>

            <Stack
              spacing={1}
              sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <Typography variant="overline" sx={{ opacity: 0.75 }}>
                Partner zone (sections)
              </Typography>
              {[
                { label: "Benefits", to: "/partner-zone#benefits" },
                { label: "How it works", to: "/partner-zone#how" },
                { label: "Submit candidates", to: "/partner-zone#submit" },
                { label: "Onboarding", to: "/partner-zone#onboarding" },
              ].map((l) => (
                <Button
                  key={l.to}
                  variant="text"
                  onClick={() => navigate(l.to)}
                  sx={{
                    justifyContent: "flex-start",
                    color: "rgba(255,255,255,0.88)",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  {l.label}
                </Button>
              ))}
            </Stack>

            <Stack
              spacing={1}
              sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <Typography variant="overline" sx={{ opacity: 0.75 }}>
                Jobs shortcuts
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
                  sx={{
                    justifyContent: "flex-start",
                    color: "rgba(255,255,255,0.88)",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  {l.label}
                </Button>
              ))}
            </Stack>
              </>
            ) : null}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
