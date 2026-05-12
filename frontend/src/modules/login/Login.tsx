import { Box, Stack, Typography } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PORTAL_BASE } from "../../common/paths";

type PortalKey = "candidate" | "administrator" | "employer" | "sourcing";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const gradientBg = useMemo(() => "linear-gradient(180deg, #0f172a 0%, #1d4ed8 100%)", []);

  const portals = useMemo(
    () =>
      [
        {
          key: "candidate",
          title: "Candidate Portal",
          icon: <PersonOutlineIcon fontSize="small" />,
        },
        {
          key: "administrator",
          title: "Administrator Portal",
          icon: <AdminPanelSettingsOutlinedIcon fontSize="small" />,
        },
        {
          key: "employer",
          title: "Employer Portal",
          icon: <ApartmentOutlinedIcon fontSize="small" />,
        },
        {
          key: "sourcing",
          title: "Sourcing Portal",
          icon: <GroupAddOutlinedIcon fontSize="small" />,
        },
      ] as const,
    [],
  );

  const goToPortal = (portal: PortalKey) => {
    navigate(`${PORTAL_BASE}/login/auth?portal=${portal}`, { state: { ...(location.state as any) } });
  };

  useEffect(() => {
    const portal = String(searchParams.get("portal") ?? "").trim().toLowerCase();
    if (!portal) return;
    if (portal === "candidate" || portal === "administrator" || portal === "employer" || portal === "sourcing") {
      goToPortal(portal as PortalKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      position="relative"
      minHeight="100dvh"
      width="100%"
      overflow="hidden"
      sx={{
        background: "#f6f6f8",
      }}
    >

      <Box
        position="relative"
        zIndex={1}
        minHeight="100dvh"
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
        gridTemplateAreas={{ xs: `"login" "sis"`, md: `"sis login"` }}
        sx={{ width: "100%", boxSizing: "border-box" }}
      >
        <Box
          sx={{
            gridArea: "sis",
            minHeight: { xs: 420, md: "100dvh" },
            px: { xs: 3, sm: 4, md: 5 },
            py: { xs: 4, md: 5 },
            color: "white",
            background: gradientBg,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 540, mx: "auto" }}>
            <Stack spacing={3}>
              <Typography variant="body2" sx={{ opacity: 0.88, fontWeight: 600, letterSpacing: 0.8 }}>
                Connect
              </Typography>

              <Box sx={{ maxWidth: 460 }}>
                <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: -0.8, fontSize: { xs: 34, md: 46 } }}>
                  Workforce Management Ecosystem
                </Typography>
                <Typography variant="body1" sx={{ mt: 1.5, opacity: 0.92, maxWidth: 560 }}>
                  Digitizing the complete employee lifecycle - from sourcing and training to international deployment and beyond.
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 0, maxWidth: 460 }}>
                {[
                  { k: "25+", v: "Countries" },
                  { k: "50K+", v: "Workers Deployed" },
                ].map((s) => (
                  <Box
                    key={s.v}
                    sx={{
                      py: 2,
                      borderTop: "1px solid rgba(255,255,255,0.14)",
                    }}
                  >
                    <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: 0.4 }}>
                      {s.k}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {s.v}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          </Box>
        </Box>

        <Box
          sx={{
            gridArea: "login",
            minHeight: { xs: 420, md: "100dvh" },
            px: { xs: 3, sm: 4, md: 5 },
            py: { xs: 4, md: 5 },
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 420 }}>
            <Stack spacing={0.75} sx={{ alignItems: "flex-start", pb: 2 }}>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4 }}>
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select your portal to continue
              </Typography>
            </Stack>

            <Stack spacing={0} sx={{ flex: 1 }}>
              {portals.map((p) => (
                <Box
                  key={p.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => goToPortal(p.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") goToPortal(p.key);
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    px: 0,
                    py: 1.4,
                    borderRadius: 0,
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid rgba(15,23,42,0.12)",
                    cursor: "pointer",
                    transition: "background-color 120ms ease",
                    "&:hover": {
                      backgroundColor: "rgba(29,78,216,0.03)",
                    },
                    "&:focus-visible": {
                      outline: "2px solid rgba(29,78,216,0.55)",
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(29,78,216,0.10)",
                      color: "#1d4ed8",
                      flex: "0 0 auto",
                    }}
                  >
                    {p.icon}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={800} sx={{ fontSize: 14 }}>
                      {p.title}
                    </Typography>
                  </Box>

                  <ArrowForwardIosRoundedIcon fontSize="small" sx={{ color: "rgba(15,23,42,0.45)" }} />
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
