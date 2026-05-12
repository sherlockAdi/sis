import { Box, Container, Divider, Link as MuiLink, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { SisLogo } from "../../../common/ad";
import { PORTAL_BASE } from "../../../common/paths";
import lightLogoUrl from "../../../assets/sis-logo-light.svg?url";

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
        <Stack spacing={4}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={4}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "flex-start" }}
          >
            <Stack spacing={1.5} sx={{ maxWidth: 440 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SisLogo src={lightLogoUrl} height={52} />
                <Typography fontWeight={950} sx={{ letterSpacing: -0.2 }}>
                  SIS Global Workforce Solutions
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ opacity: 0.82, lineHeight: 1.9 }}>
                A cleaner public journey for candidates and employers, with fast discovery, structured hiring, and simple portal handoff.
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 3, sm: 5 }}>
              <Stack spacing={0.75}>
                <Typography variant="overline" sx={{ opacity: 0.7 }}>
                  Explore
                </Typography>
                <FooterLink to="/">Home</FooterLink>
                <FooterLink to="/jobs">Jobs</FooterLink>
                <FooterLink to="/about">About SIS</FooterLink>
                <FooterLink to="/register">Register</FooterLink>
              </Stack>

              <Stack spacing={0.75}>
                <Typography variant="overline" sx={{ opacity: 0.7 }}>
                  Journeys
                </Typography>
                <FooterLink to="/employer-zone">Employer Zone</FooterLink>
                <FooterLink to="/partner-zone">Partner Zone</FooterLink>
                <FooterLink to={`${PORTAL_BASE}/login?portal=candidate`}>Candidate Login</FooterLink>
                <FooterLink to={`${PORTAL_BASE}/login?portal=employer`}>Employer Login</FooterLink>
              </Stack>

              <Stack spacing={0.75}>
                <Typography variant="overline" sx={{ opacity: 0.7 }}>
                  Portals
                </Typography>
                <FooterLink to={`${PORTAL_BASE}/login?portal=sourcing`}>Sourcing Login</FooterLink>
                <FooterLink to={`${PORTAL_BASE}/login?portal=administrator`}>Admin Login</FooterLink>
                <FooterLink to="/employer-zone/contact">Contact Employer Team</FooterLink>
                <FooterLink to="/partner-zone/submit-candidates">Submit Candidates</FooterLink>
              </Stack>
            </Stack>
          </Stack>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
            <Typography variant="caption" sx={{ opacity: 0.72 }}>
              © {new Date().getFullYear()} SIS Global Workforce Solutions. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.72 }}>
              Candidates, employers, and sourcing partners all start from one clean experience.
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
