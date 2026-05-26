import { useLocation, useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MenuIcon from "@mui/icons-material/Menu";
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
  const activeEmployerZone = location.pathname === "/partner-zone" || location.pathname.startsWith("/partner-zone/");

  const go = (to: string) => {
    navigate(to);
  };

  const NavButton = ({
    label,
    to,
    active,
  }: {
    label: string;
    to: string;
    active: boolean;
  }) => (
    <Button
      color="inherit"
      onClick={() => go(to)}
      sx={{
        textTransform: "none",
        fontWeight: 900,
        opacity: 1,
        borderRadius: 0,
        borderBottom: active ? "3px solid" : "3px solid transparent",
        borderBottomColor: active ? "primary.main" : "transparent",
        px: 1.25,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Button>
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(255,255,255,0.88)",
        color: "text.primary",
        borderBottom: "1px solid rgba(15,23,42,0.08)",
        backdropFilter: "blur(16px)",
      }}
    >
      <Box sx={{ bgcolor: "secondary.main", color: "white" }}>
        <Container
          maxWidth="lg"
          sx={{
            py: 0.35,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.25,
            flexWrap: "wrap",
          }}
        >
          {/* <Typography variant="caption" sx={{ opacity: 0.88, fontWeight: 700, letterSpacing: 0.4, lineHeight: 1.2 }}>
            Global recruitment, job discovery, and workforce deployment
          </Typography> */}
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <Button
              size="small"
              variant="text"
              onClick={() => navigate("/portal/login?portal=candidate")}
              sx={{ color: "white", fontSize: 11, py: 0.1, minHeight: 24 }}
            >
              Candidate Login
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => navigate("/portal/login?portal=employer")}
              sx={{ color: "white", fontSize: 11, py: 0.1, minHeight: 24 }}
            >
              Employer Login
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => navigate("/portal/login?portal=administrator")}
              sx={{ color: "white", fontSize: 11, py: 0.1, minHeight: 24 }}
            >
              Admin Login
            </Button>
          </Stack>
        </Container>
      </Box>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 68, gap: 1.25 }}>
          <Button color="inherit" onClick={() => navigate("/")} sx={{ textTransform: "none", px: 0, gap: 0.75, minHeight: 52 }}>
            <SisLogo height={44} />
          </Button>

          <Box sx={{ flex: 1 }} />

          {isMdUp ? (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <NavButton label="Home" to="/" active={location.pathname === "/"} />
              <NavButton label="About SIS" to="/about" active={activeAbout} />
              <NavButton label="Jobs" to="/jobs" active={activeJobs} />
              <NavButton label="Employer Zone" to="/employer-zone" active={activeEmployer} />
              <NavButton label="Partner Zone" to="/partner-zone" active={activeEmployerZone} />
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate("/register")}
                sx={{
                  ml: 1,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                  minHeight: 38,
                  px: 2,
                }}
              >
                Register
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                onClick={() => navigate("/register")}
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                  minHeight: 38,
                  px: 2,
                }}
              >
                Register
              </Button>
              {!inPublicMenu ? (
                <IconButton color="inherit" aria-label="menu" onClick={() => navigate("/menu")}>
                  <MenuIcon />
                </IconButton>
              ) : null}
            </Stack>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
