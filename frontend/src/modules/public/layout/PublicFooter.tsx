import { Box, Container, Divider, Link as MuiLink, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { SisLogo } from "../../../common/ad";
import { PORTAL_BASE } from "../../../common/paths";

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <MuiLink
      component={RouterLink}
      to={to}
      underline="hover"
      sx={{ color: "rgba(255,255,255,0.82)", fontWeight: 700 }}
    >
      {children}
    </MuiLink>
  );
}

export default function PublicFooter() {
  return (
    <Box sx={{ bgcolor: "secondary.main", color: "white", mt: 6 }}>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={4}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SisLogo height={26} />
              <Typography fontWeight={950} sx={{ letterSpacing: -0.2 }}>
                SIS Global
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.82, maxWidth: 520 }}>
              Overseas recruitment simplified — job discovery, employer trust, and fast portal handoff.
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 4 }}>
            <Stack spacing={0.75}>
              <Typography variant="overline" sx={{ opacity: 0.7 }}>
                Company
              </Typography>
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/employer-zone">Employer Zone</FooterLink>
              <FooterLink to="/partner-zone">Partner Zone</FooterLink>
            </Stack>

            <Stack spacing={0.75}>
              <Typography variant="overline" sx={{ opacity: 0.7 }}>
                Jobs
              </Typography>
              <FooterLink to="/jobs">Browse Jobs</FooterLink>
              <FooterLink to="/register">Get Registered</FooterLink>
            </Stack>

            <Stack spacing={0.75}>
              <Typography variant="overline" sx={{ opacity: 0.7 }}>
                Portals
              </Typography>
              <FooterLink to={`${PORTAL_BASE}/login?portal=candidate`}>Candidate Login</FooterLink>
              <FooterLink to={`${PORTAL_BASE}/login?portal=employer`}>Customer Login</FooterLink>
              <FooterLink to={`${PORTAL_BASE}/login?portal=sourcing`}>Partner Login</FooterLink>
              <FooterLink to={`${PORTAL_BASE}/login?portal=administrator`}>Admin Login</FooterLink>
            </Stack>
          </Stack>
        </Stack>

          <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.10)" }} />
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} SIS Global. All rights reserved.
          </Typography>
      </Container>
    </Box>
  );
}
