import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SisLogo } from "../../common/ad";

type PortalKey = "candidate" | "administrator" | "employer" | "sourcing";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const gradientBg = useMemo(() => "linear-gradient(180deg, #d81b60 0%, #ad1457 100%)", []);

  const panelMinHeight = { xs: "auto", md: 560 };

  const demoCreds = useMemo(() => {
    const env = import.meta.env as any;
    return {
      candidate: {
        username: String(env.VITE_DEMO_CANDIDATE_USERNAME ?? ""),
      },
      administrator: {
        username: String(env.VITE_DEMO_ADMIN_USERNAME ?? ""),
      },
      employer: {
        username: String(env.VITE_DEMO_EMPLOYER_USERNAME ?? ""),
      },
      sourcing: {
        username: String(env.VITE_DEMO_SOURCING_USERNAME ?? ""),
      },
    } satisfies Record<PortalKey, { username: string }>;
  }, []);

  const portals = useMemo(
    () =>
      [
        {
          key: "candidate",
          title: "Candidate Portal",
          description: "Register, apply for jobs, upload documents, and track deployment",
          icon: <PersonOutlineIcon fontSize="small" />,
        },
        {
          key: "administrator",
          title: "Administrator Portal",
          description: "Manage jobs, users, compliance, recruitment, and deployments",
          icon: <AdminPanelSettingsOutlinedIcon fontSize="small" />,
        },
        {
          key: "employer",
          title: "Employer Portal",
          description: "View deployed workforce, attendance, and compliance summaries",
          icon: <ApartmentOutlinedIcon fontSize="small" />,
        },
        {
          key: "sourcing",
          title: "Sourcing Partner Portal",
          description: "Submit candidate referrals and track sourcing performance",
          icon: <GroupAddOutlinedIcon fontSize="small" />,
        },
      ] as const,
    [],
  );

  const goToPortal = (portal: PortalKey) => {
    navigate(`/login/auth?portal=${portal}`, { state: { ...(location.state as any) } });
  };

  const goToDemo = (portal: PortalKey) => {
    const creds = demoCreds[portal];
    navigate(`/login/auth?portal=${portal}`, {
      state: { ...(location.state as any), demo: { username: creds.username } },
    });
  };

  return (
    <Box
      position="relative"
      minHeight="100vh"
      width="100vw"
      overflow="hidden"
      sx={{
        background: "linear-gradient(90deg, #d81b60 0%, #d81b60 50%, #f6f6f8 50%, #f6f6f8 100%)",
      }}
    >

      <Box
        position="relative"
        zIndex={1}
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ px: { xs: 2, md: 5 }, py: { xs: 2, md: 3 }, width: "100%" }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gridTemplateAreas: { xs: `"login" "sis"`, md: `"sis login"` },
            gap: { xs: 2.5, md: 3.5 },
            alignItems: "stretch",
          }}
        >
          <Box sx={{ gridArea: "sis", display: "flex", justifyContent: { xs: "center", md: "flex-end" } }}>
            <Box sx={{ width: "100%", maxWidth: 720 }}>
              <Box
                sx={{
                  width: "100%",
                  minHeight: panelMinHeight,
                  // borderRadius: { xs: 4, md: 6 },
                  // background: gradientBg,
                  color: "white",
                  overflow: "hidden",
                  position: "relative",
                  p: { xs: 3, md: 4 },
                }}
              >
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 2.5,
                        bgcolor: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.28)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <SisLogo height={28} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
                        SIS Global
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Connect
                      </Typography>
                    </Box>
                  </Stack>

                  <Box>
                    <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: -0.8, fontSize: { xs: 34, md: 46 } }}>
                      Workforce Management Ecosystem
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1.5, opacity: 0.92, maxWidth: 560 }}>
                      Digitizing the complete employee lifecycle — from sourcing and training to international deployment and beyond.
                    </Typography>
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    {[
                      { k: "25+", v: "Countries" },
                      { k: "50K+", v: "Workers Deployed" },
                      { k: "200+", v: "Partner Agencies" },
                      { k: "100+", v: "Enterprise Clients" },
                    ].map((s) => (
                      <Box
                        key={s.v}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          backgroundColor: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.20)",
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
          </Box>

          <Box
            sx={{
              gridArea: "login",
              display: "flex",
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: { xs: "center", md: "flex-start" },
            }}
          >
            <Box sx={{ width: "100%", maxWidth: 720 }}>
              <Box
                sx={{
                  width: "100%",
                  minHeight: panelMinHeight,
                  // borderRadius: { xs: 4, md: 6 },
                  // backgroundColor: "#ffffff",
                  // border: "1px solid rgba(15,23,42,0.10)",
                  p: { xs: 2.5, md: 3 },
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack spacing={0.75} sx={{ alignItems: "center", textAlign: "center", pb: 1.5 }}>
                  <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4 }}>
                    Welcome Back
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select your portal to continue
                  </Typography>
                </Stack>

                <Stack spacing={1.25} sx={{ flex: 1 }}>
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
                        p: 1.5,
                        borderRadius: 2.5,
                        backgroundColor: "#ffffff",
                        border: "1px solid rgba(15,23,42,0.14)",
                        cursor: "pointer",
                        transition: "border-color 120ms ease, background-color 120ms ease",
                        "&:hover": {
                          borderColor: "rgba(216,27,96,0.24)",
                          backgroundColor: "rgba(216,27,96,0.02)",
                        },
                        "&:focus-visible": {
                          outline: "2px solid rgba(216,27,96,0.55)",
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
                          bgcolor: "rgba(216,27,96,0.10)",
                          color: "#d81b60",
                          flex: "0 0 auto",
                        }}
                      >
                        {p.icon}
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={800} sx={{ fontSize: 14 }}>
                          {p.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.15, fontSize: 12.5, lineHeight: 1.25 }}>
                          {p.description}
                        </Typography>
                      </Box>

                      <ArrowForwardIosRoundedIcon fontSize="small" sx={{ color: "rgba(15,23,42,0.45)" }} />
                    </Box>
                  ))}

                  <Divider sx={{ mt: 1.5, mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ letterSpacing: 0.8 }}>
                    QUICK DEMO ACCESS
                  </Typography>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.25 }}>
                    {(
                      [
                        { key: "candidate", label: "Demo: Candidate" },
                        { key: "administrator", label: "Demo: Administrator" },
                        { key: "employer", label: "Demo: Employer" },
                        { key: "sourcing", label: "Demo: Sourcing" },
                      ] as const
                    ).map((b) => {
                      const creds = demoCreds[b.key];
                      const enabled = Boolean(creds.username);
                      return (
                        <Button
                          key={b.key}
                          variant="outlined"
                          disabled={!enabled}
                          onClick={() => goToDemo(b.key)}
                          sx={{
                            borderRadius: 999,
                            textTransform: "none",
                            borderColor: "rgba(15,23,42,0.18)",
                            color: "rgba(15,23,42,0.75)",
                            "&:hover": { borderColor: "rgba(216,27,96,0.35)" },
                            py: 0.6,
                            fontSize: 12.5,
                          }}
                        >
                          {b.label}
                        </Button>
                      );
                    })}
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
