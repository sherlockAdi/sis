import { useLocation, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { SisLogo } from "../../../common/ad";

export default function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMdUp = useMediaQuery((theme: any) => theme.breakpoints.up("md"));

  const inPublicMenu = location.pathname === "/menu";
  const activeAbout = location.pathname === "/about" || location.pathname.startsWith("/about/");
  const activeJobs = location.pathname === "/jobs" || location.pathname.startsWith("/jobs/");
  const activeEmployer = location.pathname === "/employer-zone" || location.pathname.startsWith("/employer-zone/");
  const activePartner = location.pathname === "/partner-zone" || location.pathname.startsWith("/partner-zone/");

  const go = (to: string) => {
    navigate(to);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: "1px solid rgba(15,23,42,0.10)",
      }}
    >
      {/* top strip like corporate sites */}
      <Box sx={{ bgcolor: "secondary.main", color: "white" }}>
        <Container maxWidth="lg" sx={{ py: 0.75, display: "flex", justifyContent: "flex-end" }}>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            A market leader in recruitment & workforce deployment
          </Typography>
        </Container>
      </Box>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 72 }}>
          <Button
            color="inherit"
            onClick={() => navigate("/")}
            sx={{ textTransform: "none", px: 0, gap: 1.25 }}
          >
            <SisLogo height={28} />
            <Stack spacing={0} alignItems="flex-start" sx={{ lineHeight: 1 }}>
              <Typography fontWeight={950} sx={{ letterSpacing: -0.2 }}>
                SIS Global
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.72 }}>
                Jobs • Trust • Portals
              </Typography>
            </Stack>
          </Button>

          <Box sx={{ flex: 1 }} />

          {isMdUp ? (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Button
                color="inherit"
                onClick={() => go("/")}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  borderRadius: 0,
                  borderBottom: location.pathname === "/" ? "3px solid" : "3px solid transparent",
                  borderBottomColor: location.pathname === "/" ? "primary.main" : "transparent",
                  px: 1.25,
                }}
              >
                Home
              </Button>

              <Button
                color="inherit"
                onClick={() => go("/about")}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  opacity: 1,
                  borderRadius: 0,
                  borderBottom: activeAbout ? "3px solid" : "3px solid transparent",
                  borderBottomColor: activeAbout ? "primary.main" : "transparent",
                  px: 1.25,
                }}
              >
                About Us
              </Button>

              <Button
                color="inherit"
                onClick={() => go("/jobs")}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  opacity: 1,
                  borderRadius: 0,
                  borderBottom: activeJobs ? "3px solid" : "3px solid transparent",
                  borderBottomColor: activeJobs ? "primary.main" : "transparent",
                  px: 1.25,
                }}
              >
                Jobs
              </Button>

              <Button
                color="inherit"
                onClick={() => go("/employer-zone")}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  opacity: 1,
                  borderRadius: 0,
                  borderBottom: activeEmployer ? "3px solid" : "3px solid transparent",
                  borderBottomColor: activeEmployer ? "primary.main" : "transparent",
                  px: 1.25,
                }}
              >
                Employer Zone
              </Button>

              <Button
                color="inherit"
                onClick={() => go("/partner-zone")}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  opacity: 1,
                  borderRadius: 0,
                  borderBottom: activePartner ? "3px solid" : "3px solid transparent",
                  borderBottomColor: activePartner ? "primary.main" : "transparent",
                  px: 1.25,
                }}
              >
                Partner Zone
              </Button>

              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate("/register")}
                sx={{
                  ml: 0.75,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                Get Registered
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              {!inPublicMenu ? (
                <IconButton
                  color="inherit"
                  aria-label="menu"
                  onClick={() => navigate("/menu")}
                >
                  <MenuIcon />
                </IconButton>
              ) : null}
              <Button
                variant="contained"
                onClick={() => navigate("/register")}
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                Register
              </Button>
            </Stack>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
