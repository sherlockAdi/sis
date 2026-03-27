import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { keyframes } from "@emotion/react";
import MenuIcon from "@mui/icons-material/Menu";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { SisLogo } from "../../common/ad";
import { PORTAL_BASE } from "../../common/paths";
import WorkflowCharts from "../dashboard/WorkflowCharts";
import { createDummyWorkflowItems } from "../dashboard/workflowDummyData";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const floaty = keyframes`
  0% { transform: translate(-50%, -50%) translateY(0); }
  50% { transform: translate(-50%, -50%) translateY(-10px); }
  100% { transform: translate(-50%, -50%) translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 18px 60px rgba(0,0,0,0.22); }
  50% { transform: scale(1.06); box-shadow: 0 26px 80px rgba(0,0,0,0.26); }
  100% { transform: scale(1); box-shadow: 0 18px 60px rgba(0,0,0,0.22); }
`;

function softCardSx() {
  return {
    borderRadius: 4,
    bgcolor: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(2,6,23,0.08)",
    boxShadow: "0 16px 50px rgba(15,23,42,0.12)",
  } as const;
}

function Reveal({
  children,
  delayMs = 0,
}: {
  children: React.ReactNode;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
            break;
          }
        }
      },
      { root: null, threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(14px)",
        transition: `opacity 700ms ease ${delayMs}ms, transform 700ms ease ${delayMs}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Box>
  );
}

function initialsFrom(label: string) {
  const parts = label.trim().split(/\s+/g).filter(Boolean);
  const a = parts[0]?.[0] ?? "S";
  const b = parts[1]?.[0] ?? (parts[0]?.[1] ?? "I");
  return `${a}${b}`.toUpperCase();
}

function PersonaBubble({
  name,
  role,
  tone = "green",
  x,
  y,
  size = 92,
  hiddenOnMobile,
  delayMs = 0,
}: {
  name: string;
  role: string;
  tone?: "green" | "teal" | "amber";
  x: string;
  y: string;
  size?: number;
  hiddenOnMobile?: boolean;
  delayMs?: number;
}) {
  const palette =
    tone === "amber"
      ? { ring: "rgba(245,158,11,0.55)", chipBg: "rgba(245,158,11,0.20)", chipFg: "#fbbf24" }
      : tone === "teal"
        ? { ring: "rgba(20,184,166,0.55)", chipBg: "rgba(20,184,166,0.20)", chipFg: "#5eead4" }
        : { ring: "rgba(124,255,91,0.55)", chipBg: "rgba(124,255,91,0.18)", chipFg: "#bbf7d0" };

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        animation: `${floaty} 6s ease-in-out ${delayMs}ms infinite`,
        display: hiddenOnMobile ? { xs: "none", sm: "block" } : "block",
      }}
    >
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `3px solid ${palette.ring}`,
          boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
          bgcolor: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(10px)",
          position: "relative",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Box
          sx={{
            width: size - 16,
            height: size - 16,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.18)",
            display: "grid",
            placeItems: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(120px 80px at 20% 25%, rgba(255,255,255,0.22), transparent 55%)," +
                "radial-gradient(120px 90px at 70% 70%, rgba(255,255,255,0.14), transparent 55%)," +
                "linear-gradient(135deg, rgba(124,255,91,0.16), rgba(14,165,233,0.12))",
            }}
          />
          <Typography variant="h6" fontWeight={950} sx={{ position: "relative", letterSpacing: -0.6, color: "white" }}>
            {initialsFrom(name)}
          </Typography>
        </Box>

        <Box
          sx={{
            position: "absolute",
            bottom: -12,
            left: "50%",
            transform: "translateX(-50%)",
            px: 1.25,
            py: 0.5,
            borderRadius: 999,
            bgcolor: palette.chipBg,
            border: "1px solid rgba(255,255,255,0.16)",
            color: palette.chipFg,
            fontWeight: 900,
            fontSize: 12,
            whiteSpace: "nowrap",
            backdropFilter: "blur(10px)",
          }}
        >
          {role}
        </Box>
      </Box>
    </Box>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const isMdUp = useMediaQuery((theme: any) => theme.breakpoints.up("md"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [howTab, setHowTab] = useState<"talents" | "business">("talents");

  const navLinks = useMemo(
    () => [
      { label: "Home", id: "home" },
      { label: "About", id: "about" },
      { label: "Why Us", id: "why" },
      { label: "Industries", id: "industries" },
      { label: "Process", id: "process" },
      { label: "Team", id: "team" },
      { label: "News", id: "news" },
      { label: "Contact", id: "contact" },
    ],
    [],
  );

  const demoItems = useMemo(() => createDummyWorkflowItems(), []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f6f8" }}>
      <Box
        id="home"
        sx={{
          position: "relative",
          overflow: "hidden",
          color: "white",
          background:
            "radial-gradient(1200px 600px at 20% 10%, rgba(124,255,91,0.16), transparent 55%)," +
            "radial-gradient(1000px 600px at 80% 20%, rgba(14,165,233,0.12), transparent 55%)," +
            "linear-gradient(180deg, #0b2b1e 0%, #071b14 100%)",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.18,
            backgroundImage:
              "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0 1px, transparent 1px 34px)",
            backgroundSize: "520px 520px",
          }}
        />

        <Container maxWidth="lg">
          <Box sx={{ pt: { xs: 2, md: 2.5 } }}>
            <Box
              sx={{
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.96)",
                color: "#0f172a",
                border: "1px solid rgba(2,6,23,0.08)",
                boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
                px: { xs: 1.5, md: 2 },
                py: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
                animation: `${fadeUp} 700ms ease both`,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                <SisLogo height={28} />
                <Typography variant="subtitle1" fontWeight={950} noWrap>
                  SIS Global
                </Typography>
              </Stack>

              <Box sx={{ flex: 1 }} />

              {isMdUp ? (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {navLinks.map((l) => (
                    <Button
                      key={l.id}
                      color="inherit"
                      onClick={() => scrollToId(l.id)}
                      sx={{ textTransform: "none", fontWeight: 800 }}
                    >
                      {l.label}
                    </Button>
                  ))}
                </Stack>
              ) : (
                <IconButton
                  color="inherit"
                  onClick={() => setMobileMenuOpen((v) => !v)}
                  aria-label="menu"
                >
                  <MenuIcon />
                </IconButton>
              )}

              <Button
                color="inherit"
                variant="text"
                onClick={() => navigate(`${PORTAL_BASE}/login`)}
                sx={{ textTransform: "none", fontWeight: 900 }}
              >
                Log In
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate(`${PORTAL_BASE}/login`)}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  bgcolor: "#7CFF5B",
                  color: "#052016",
                  borderRadius: 999,
                  transition: "transform 180ms ease, box-shadow 180ms ease",
                  "&:hover": { bgcolor: "#62f444", transform: "translateY(-1px)", boxShadow: "0 14px 40px rgba(0,0,0,0.18)" },
                }}
              >
                Get Started
              </Button>
            </Box>

            {!isMdUp && mobileMenuOpen && (
              <Box sx={{ mt: 1.25 }}>
                <Box
                  sx={{
                    borderRadius: 4,
                    bgcolor: "rgba(255,255,255,0.96)",
                    color: "#0f172a",
                    border: "1px solid rgba(2,6,23,0.08)",
                    boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <Divider />
                  <Stack direction="row" spacing={1} sx={{ pt: 1, flexWrap: "wrap" }}>
                    {navLinks.map((l) => (
                      <Button
                        key={l.id}
                        size="small"
                        color="inherit"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          scrollToId(l.id);
                        }}
                        sx={{ textTransform: "none", fontWeight: 900 }}
                      >
                        {l.label}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              </Box>
            )}
          </Box>
        </Container>

        <Container maxWidth="lg">
          <Box sx={{ py: { xs: 6, md: 10 } }}>
            <Box sx={{ position: "relative", minHeight: { xs: 540, md: 610 } }}>
              <PersonaBubble name="Worker" role="Waiter" tone="green" x="8%" y="22%" size={104} hiddenOnMobile delayMs={0} />
              <PersonaBubble name="Finance" role="Finance" tone="amber" x="92%" y="22%" size={104} hiddenOnMobile delayMs={420} />
              <PersonaBubble name="Assistant" role="Assistant" tone="teal" x="16%" y="66%" size={104} hiddenOnMobile delayMs={220} />
              <PersonaBubble name="Cleaner" role="Cleaner" tone="amber" x="86%" y="62%" size={104} hiddenOnMobile delayMs={620} />
              <PersonaBubble name="Nurse" role="Nurse" tone="teal" x="92%" y="82%" size={104} hiddenOnMobile delayMs={820} />
              <PersonaBubble name="Painter" role="Painter" tone="green" x="10%" y="86%" size={104} hiddenOnMobile delayMs={520} />

              <Stack spacing={2} alignItems="center" textAlign="center" sx={{ pt: { xs: 6, md: 9 } }}>
                <Typography
                  variant="h2"
                  fontWeight={950}
                  sx={{ letterSpacing: -1.4, fontSize: { xs: 40, md: 72 }, maxWidth: 980 }}
                >
                  <Box component="span" sx={{ display: "inline-block", animation: `${fadeUp} 700ms ease both` }}>
                    Find Your Next Career Here
                  </Box>
                  <br />
                  <Box component="span" sx={{ display: "inline-block", animation: `${fadeUp} 700ms ease 120ms both` }}>
                    Our Open Positions
                  </Box>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    opacity: 0.88,
                    maxWidth: 860,
                    fontSize: { xs: 14.5, md: 16.5 },
                    animation: `${fadeUp} 700ms ease 220ms both`,
                  }}
                >
                  Explore open positions to find roles that align with your interests and expertise — from entry-level positions
                  to leadership roles.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 0.5, animation: `${fadeUp} 700ms ease 320ms both` }}>
                  <Button
                    size="large"
                    variant="contained"
                    onClick={() => scrollToId("industries")}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 950,
                      bgcolor: "#7CFF5B",
                      color: "#052016",
                      borderRadius: 999,
                      px: 3,
                      transition: "transform 180ms ease, box-shadow 180ms ease",
                      "&:hover": { bgcolor: "#62f444", transform: "translateY(-1px)", boxShadow: "0 14px 40px rgba(0,0,0,0.18)" },
                    }}
                  >
                    Find Works
                  </Button>
                  <Button
                    size="large"
                    variant="contained"
                    onClick={() => navigate(`${PORTAL_BASE}/login`)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 950,
                      bgcolor: "rgba(255,255,255,0.92)",
                      color: "#0f172a",
                      borderRadius: 999,
                      px: 3,
                      transition: "transform 180ms ease, box-shadow 180ms ease",
                      "&:hover": { bgcolor: "rgba(255,255,255,1)", transform: "translateY(-1px)", boxShadow: "0 14px 40px rgba(0,0,0,0.18)" },
                    }}
                  >
                    Hire Talents Now
                  </Button>
                </Stack>

                <Box
                  sx={{
                    mt: { xs: 3, md: 4 },
                    width: "100%",
                    maxWidth: 1080,
                    borderRadius: 5,
                    border: "1px solid rgba(255,255,255,0.14)",
                    bgcolor: "rgba(255,255,255,0.06)",
                    p: { xs: 1.25, md: 1.5 },
                    boxShadow: "0 26px 80px rgba(0,0,0,0.35)",
                    animation: `${fadeUp} 700ms ease 420ms both`,
                  }}
                >
                  <Box sx={{ ...softCardSx(), p: { xs: 1.25, md: 1.5 }, color: "#0f172a" }}>
                    <WorkflowCharts items={demoItems} />
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box sx={{ bgcolor: "#f6f6f8", py: { xs: 4, md: 5 } }}>
        <Container maxWidth="lg">
          <Reveal>
            <Box
              sx={{
                ...softCardSx(),
                p: { xs: 2, md: 2.5 },
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
                gap: 2,
                textAlign: "center",
              }}
            >
              {[
                { k: "12k", v: "Freelance Workers" },
                { k: "95%", v: "Jobs Fulfillment Rate" },
                { k: "12k+", v: "Jobs Filled" },
                { k: "825+", v: "Satisfied Businesses" },
              ].map((s, idx) => (
                <Box
                  key={s.v}
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    border: "1px solid rgba(2,6,23,0.06)",
                    bgcolor: "white",
                    transition: "transform 180ms ease, box-shadow 180ms ease",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: "0 14px 44px rgba(15,23,42,0.12)" },
                    animation: `${fadeUp} 700ms ease ${idx * 80}ms both`,
                  }}
                >
                  <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.8 }}>
                    {s.k}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {s.v}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Reveal>
        </Container>
      </Box>

      <Box id="about" sx={{ py: { xs: 6, md: 8 }, bgcolor: "white", borderTop: "1px solid rgba(2,6,23,0.06)" }}>
        <Container maxWidth="lg">
          <Reveal>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" }, gap: 4, alignItems: "center" }}>
            <Box
              sx={{
                position: "relative",
                borderRadius: 5,
                overflow: "hidden",
                border: "1px solid rgba(2,6,23,0.08)",
                boxShadow: "0 24px 80px rgba(15,23,42,0.14)",
                bgcolor: "rgba(2,6,23,0.06)",
                minHeight: { xs: 220, md: 340 },
                transition: "transform 220ms ease, box-shadow 220ms ease",
                "&:hover": { transform: "translateY(-3px) rotate(0.15deg)", boxShadow: "0 30px 90px rgba(15,23,42,0.18)" },
              }}
            >
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(120deg, rgba(2,6,23,0.06), rgba(2,6,23,0.02))," +
                    "radial-gradient(800px 360px at 30% 30%, rgba(124,255,91,0.18), transparent 55%)," +
                    "radial-gradient(700px 300px at 70% 70%, rgba(14,165,233,0.12), transparent 55%)",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 12,
                  borderRadius: 5,
                  border: "10px solid rgba(255,255,255,0.65)",
                  transform: "rotate(-2deg)",
                  opacity: 0.45,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 92,
                  height: 92,
                  borderRadius: "50%",
                  bgcolor: "rgba(124,255,91,0.95)",
                  boxShadow: "0 22px 70px rgba(0,0,0,0.22)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <PlayArrowIcon sx={{ fontSize: 44, color: "#052016" }} />
              </Box>
              <Typography
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "calc(50% + 70px)",
                  transform: "translateX(-50%)",
                  color: "rgba(255,255,255,0.92)",
                  fontWeight: 900,
                }}
              >
                Watch Video
              </Typography>
            </Box>

            <Box>
              <Chip
                label="ABOUT US"
                size="small"
                sx={{
                  fontWeight: 900,
                  bgcolor: "rgba(124,255,91,0.18)",
                  color: "#166534",
                  border: "1px solid rgba(22,101,52,0.18)",
                }}
              />
              <Typography variant="h3" fontWeight={950} sx={{ mt: 1, letterSpacing: -0.8 }}>
                The Leading Workforce
                <br />
                Staffing <span style={{ color: "#22c55e" }}>Platform</span>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 520, fontSize: 14.5 }}>
                This platform provides access to a diverse pool of qualified candidates and provides end-to-end workflow tracking
                for international hiring, compliance, and deployment.
              </Typography>
              <Stack spacing={1.1} sx={{ mt: 2 }}>
                {["Helps businesses maintain service excellence", "Scales staffing as operations grow"].map((t) => (
                  <Stack key={t} direction="row" spacing={1} alignItems="flex-start">
                    <CheckCircleRoundedIcon sx={{ color: "#22c55e", mt: "2px" }} fontSize="small" />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {t}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>
          </Reveal>
        </Container>
      </Box>

      <Box
        id="why"
        sx={{
          py: { xs: 7, md: 9 },
          background:
            "radial-gradient(1200px 520px at 20% 30%, rgba(124,255,91,0.12), transparent 55%)," +
            "radial-gradient(1200px 520px at 80% 60%, rgba(245,158,11,0.10), transparent 55%)," +
            "linear-gradient(180deg, rgba(246,246,248,1) 0%, rgba(255,255,255,1) 100%)",
          borderTop: "1px solid rgba(2,6,23,0.06)",
        }}
      >
        <Container maxWidth="lg">
          <Reveal>
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Chip
              label="WHY US"
              size="small"
              sx={{
                fontWeight: 900,
                bgcolor: "rgba(124,255,91,0.18)",
                color: "#166534",
                border: "1px solid rgba(22,101,52,0.18)",
              }}
            />
            <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.8 }}>
              Why Choose Us
            </Typography>
          </Stack>

          <Box sx={{ mt: 4, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2.5 }}>
            {[
              { title: "Retain Top Talent", desc: "Clear career paths and growth opportunities help retain top talent." },
              { title: "Stay Compliant", desc: "Educate employees on compliance through regular training." },
              { title: "Improve Employee", desc: "Invest in training programs to enhance skills and knowledge." },
            ].map((c) => (
              <Box key={c.title} sx={{ ...softCardSx(), p: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: "rgba(124,255,91,0.22)",
                    border: "1px solid rgba(22,101,52,0.18)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 950,
                    color: "#166534",
                    mb: 2,
                  }}
                >
                  <CheckCircleRoundedIcon />
                </Box>
                <Typography variant="h6" fontWeight={950}>
                  {c.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {c.desc}
                </Typography>
                <Button
                  sx={{ mt: 2, textTransform: "none", fontWeight: 900, color: "#0f172a" }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Learn More
                </Button>
              </Box>
            ))}
          </Box>
          </Reveal>
        </Container>
      </Box>

      <Box id="industries" sx={{ py: { xs: 7, md: 9 }, bgcolor: "white", borderTop: "1px solid rgba(2,6,23,0.06)" }}>
        <Container maxWidth="lg">
          <Reveal>
            <Stack spacing={1} alignItems="center" textAlign="center">
              <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.8 }}>
                Industries Served
              </Typography>
            </Stack>

          <Box
            sx={{
              mt: 4,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" },
              borderRadius: 5,
              overflow: "hidden",
              border: "1px solid rgba(2,6,23,0.08)",
            }}
          >
            {[
              { t: "Hotel", s: "2853 Staffs", active: false },
              { t: "Hospitality", s: "2256 Staffs", active: true },
              { t: "Kitchen", s: "1408 Staffs", active: false },
              { t: "Retail", s: "1740 Staffs", active: false },
              { t: "Special Events", s: "3948 Staffs", active: false },
              { t: "General Labor", s: "2984 Staffs", active: false },
              { t: "Driving", s: "4509 Staffs", active: false },
              { t: "Senior Living", s: "1039 Staffs", active: false },
            ].map((x) => (
              <Box
                key={x.t}
                sx={{
                  p: 3,
                  minHeight: 140,
                  bgcolor: x.active ? "#1f4d2e" : "white",
                  color: x.active ? "white" : "#0f172a",
                  borderRight: { xs: "none", md: "1px solid rgba(2,6,23,0.06)" },
                  borderBottom: "1px solid rgba(2,6,23,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  transition: "transform 180ms ease, box-shadow 180ms ease",
                  "&:hover": {
                    transform: x.active ? "none" : "translateY(-2px)",
                    boxShadow: x.active ? "none" : "0 18px 60px rgba(15,23,42,0.10)",
                    zIndex: 1,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2.5,
                    border: `1px solid ${x.active ? "rgba(255,255,255,0.22)" : "rgba(2,6,23,0.12)"}`,
                    bgcolor: x.active ? "rgba(255,255,255,0.10)" : "rgba(2,6,23,0.02)",
                    mb: 2,
                  }}
                />
                <Typography variant="h6" fontWeight={950}>
                  {x.t}
                </Typography>
                <Typography variant="body2" sx={{ opacity: x.active ? 0.85 : 0.7 }}>
                  {x.s}
                </Typography>
              </Box>
            ))}
          </Box>

          <Stack alignItems="center" sx={{ mt: 4 }}>
            <Button
              variant="contained"
              sx={{
                textTransform: "none",
                fontWeight: 950,
                borderRadius: 999,
                bgcolor: "#7CFF5B",
                color: "#052016",
                "&:hover": { bgcolor: "#62f444" },
                px: 4,
                py: 1.25,
              }}
            >
              View All Categories
            </Button>
          </Stack>
          </Reveal>
        </Container>
      </Box>

      <Box id="process" sx={{ py: { xs: 7, md: 9 }, bgcolor: "#0b3a2a", color: "white" }}>
        <Container maxWidth="lg">
          <Reveal>
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Chip
              label="PROCESS"
              size="small"
              sx={{
                fontWeight: 900,
                bgcolor: "rgba(124,255,91,0.16)",
                color: "#bbf7d0",
                border: "1px solid rgba(124,255,91,0.20)",
              }}
            />
            <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.8 }}>
              How It Works?
            </Typography>
          </Stack>

          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Box
              sx={{
                p: 0.75,
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                gap: 1,
              }}
            >
              <Button
                onClick={() => setHowTab("talents")}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 999,
                  px: 3,
                  bgcolor: howTab === "talents" ? "#7CFF5B" : "transparent",
                  color: howTab === "talents" ? "#052016" : "rgba(255,255,255,0.9)",
                  "&:hover": { bgcolor: howTab === "talents" ? "#62f444" : "rgba(255,255,255,0.10)" },
                }}
              >
                For Talents
              </Button>
              <Button
                onClick={() => setHowTab("business")}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 999,
                  px: 3,
                  bgcolor: howTab === "business" ? "#7CFF5B" : "transparent",
                  color: howTab === "business" ? "#052016" : "rgba(255,255,255,0.9)",
                  "&:hover": { bgcolor: howTab === "business" ? "#62f444" : "rgba(255,255,255,0.10)" },
                }}
              >
                For Business
              </Button>
            </Box>
          </Stack>

          <Box sx={{ mt: 4, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2.5 }}>
            {[
              { n: 1, t: "Sign up, It's Free!", d: "Our team sets up your account and helps you onboard quickly." },
              { n: 2, t: "Post jobs in minutes", d: "Create and publish openings with just a few clicks." },
              { n: 3, t: "Review your staff", d: "View bios and rosters, then manage performance and payroll." },
            ].map((s) => (
              <Box
                key={s.n}
                sx={{
                  borderRadius: 5,
                  p: 3,
                  bgcolor: s.n === 2 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)",
                  color: s.n === 2 ? "#0f172a" : "white",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: s.n === 2 ? "0 24px 80px rgba(0,0,0,0.22)" : "none",
                  transition: "transform 200ms ease, box-shadow 200ms ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: s.n === 2 ? "0 30px 90px rgba(0,0,0,0.26)" : "0 24px 80px rgba(0,0,0,0.22)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor: "#7CFF5B",
                    color: "#052016",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 950,
                    mb: 1.5,
                  }}
                >
                  {s.n}
                </Box>
                <Typography variant="h6" fontWeight={950}>
                  {s.t}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: s.n === 2 ? 0.75 : 0.86 }}>
                  {s.d}
                </Typography>
              </Box>
            ))}
          </Box>
          </Reveal>
        </Container>
      </Box>

      <Box id="team" sx={{ py: { xs: 7, md: 9 }, bgcolor: "white", borderTop: "1px solid rgba(2,6,23,0.06)" }}>
        <Container maxWidth="lg">
          <Reveal>
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Chip
              label="OUR TEAM"
              size="small"
              sx={{
                fontWeight: 900,
                bgcolor: "rgba(124,255,91,0.18)",
                color: "#166534",
                border: "1px solid rgba(22,101,52,0.18)",
              }}
            />
            <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.8 }}>
              Meet The Team
            </Typography>
          </Stack>

          <Box sx={{ mt: 5, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 4, justifyItems: "center" }}>
            {[
              { name: "Tom Oliver", role: "Founder" },
              { name: "Loenard Barnes", role: "Lead Engineer" },
              { name: "Gilbert Sherman", role: "Sale Manager" },
              { name: "Franklin Bailey", role: "Art Director" },
              { name: "Ariana Patel", role: "Recruitment" },
              { name: "Karan Singh", role: "Operations" },
              { name: "Meera Nair", role: "Compliance" },
            ].map((m) => (
              <Box key={m.name} sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    width: { xs: 140, md: 180 },
                    height: { xs: 140, md: 180 },
                    borderRadius: "50%",
                    bgcolor: "rgba(2,6,23,0.06)",
                    border: "10px solid rgba(2,6,23,0.03)",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 20px 70px rgba(15,23,42,0.10)",
                    transition: "transform 200ms ease, box-shadow 200ms ease",
                    "&:hover": { transform: "translateY(-4px) scale(1.02)", boxShadow: "0 30px 90px rgba(15,23,42,0.16)" },
                  }}
                >
                  <Typography variant="h4" fontWeight={950} sx={{ color: "#0f172a" }}>
                    {initialsFrom(m.name)}
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={950} sx={{ mt: 2 }}>
                  {m.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {m.role}
                </Typography>
              </Box>
            ))}
          </Box>
          </Reveal>
        </Container>
      </Box>

      <Box id="news" sx={{ py: { xs: 7, md: 9 }, bgcolor: "#f6f6f8", borderTop: "1px solid rgba(2,6,23,0.06)" }}>
        <Container maxWidth="lg">
          <Reveal>
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Chip
              label="MEDIA"
              size="small"
              sx={{
                fontWeight: 900,
                bgcolor: "rgba(124,255,91,0.18)",
                color: "#166534",
                border: "1px solid rgba(22,101,52,0.18)",
              }}
            />
            <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.8 }}>
              Latest News
            </Typography>
          </Stack>

          <Box sx={{ mt: 4, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2.5 }}>
            {[
              { date: "March 20, 2026", title: "Create a series of blog posts discussing common interview tips" },
              { date: "March 19, 2026", title: "Explore the concept of personal branding and its impact on hiring" },
              { date: "March 18, 2026", title: "Feature interviews with employees from top companies" },
            ].map((n) => (
              <Box
                key={n.title}
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "1px solid rgba(2,6,23,0.08)",
                  boxShadow: "0 18px 60px rgba(15,23,42,0.10)",
                  bgcolor: "rgba(2,6,23,0.06)",
                  minHeight: 220,
                  position: "relative",
                  transition: "transform 200ms ease, box-shadow 200ms ease",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: "0 26px 80px rgba(15,23,42,0.14)" },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(2,6,23,0.12), rgba(2,6,23,0.72))," +
                      "radial-gradient(800px 320px at 20% 30%, rgba(124,255,91,0.20), transparent 55%)," +
                      "radial-gradient(700px 320px at 80% 70%, rgba(14,165,233,0.12), transparent 55%)",
                  }}
                />
                <Box sx={{ position: "absolute", left: 18, right: 18, bottom: 18, color: "white" }}>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    {n.date}
                  </Typography>
                  <Typography variant="h6" fontWeight={950} sx={{ mt: 0.5, lineHeight: 1.15 }}>
                    {n.title}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
          </Reveal>
        </Container>
      </Box>

      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.55), rgba(2,6,23,0.65))," +
            "radial-gradient(1200px 520px at 20% 30%, rgba(124,255,91,0.22), transparent 55%)," +
            "radial-gradient(1200px 520px at 80% 60%, rgba(14,165,233,0.14), transparent 55%)",
          color: "white",
          borderTop: "1px solid rgba(2,6,23,0.06)",
        }}
      >
        <Container maxWidth="lg">
          <Reveal>
          <Stack spacing={2.5} alignItems="center" textAlign="center">
            <Typography variant="h2" fontWeight={950} sx={{ letterSpacing: -1.1, fontSize: { xs: 40, md: 58 } }}>
              Subscribe Newsletter
            </Typography>
            <Box
              sx={{
                width: "100%",
                maxWidth: 860,
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.16)",
                boxShadow: "0 30px 90px rgba(0,0,0,0.35)",
                p: 0.75,
                display: "flex",
                gap: 1,
                alignItems: "center",
              }}
            >
              <TextField
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Email Address"
                variant="standard"
                InputProps={{ disableUnderline: true }}
                sx={{
                  flex: 1,
                  px: 2,
                  "& input": { fontWeight: 800 },
                }}
              />
              <Button
                onClick={() => setNewsletterEmail("")}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 999,
                  bgcolor: "#7CFF5B",
                  color: "#052016",
                  px: 4,
                  py: 1.5,
                  transition: "transform 180ms ease, box-shadow 180ms ease",
                  "&:hover": { bgcolor: "#62f444", transform: "translateY(-1px)", boxShadow: "0 14px 40px rgba(0,0,0,0.18)" },
                }}
              >
                Subscribe
              </Button>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.88 }}>
              You can unsubscribe at any time.
            </Typography>
          </Stack>
          </Reveal>
        </Container>
      </Box>

      <Box id="contact" sx={{ py: { xs: 6, md: 8 }, bgcolor: "white", borderTop: "1px solid rgba(2,6,23,0.06)" }}>
        <Container maxWidth="lg">
          <Reveal>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.6fr 1fr 1fr 1fr 1fr" }, gap: 3 }}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <SisLogo height={28} />
                <Typography variant="h6" fontWeight={950}>
                  SIS Global
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, maxWidth: 360 }}>
                SIS Global Workforce Workflow — dummy landing site. Replace sections with your real content anytime.
              </Typography>
            </Box>

            {[
              { title: "For Workers", links: ["Find Work", "Jobs in Dubai", "Jobs in Virginia", "Jobs in California"] },
              { title: "For Business", links: ["Merchandising", "Hospitality Staff", "General Labour", "Car Drivers"] },
              { title: "Company", links: ["About Us", "Career", "Partners", "Blog"] },
              { title: "Help & Support", links: ["Contact Us", "General FAQ", "Support Center", "Privacy Policy"] },
            ].map((col) => (
              <Box key={col.title}>
                <Typography variant="subtitle1" fontWeight={950}>
                  {col.title}
                </Typography>
                <Stack spacing={1} sx={{ mt: 1.25 }}>
                  {col.links.map((l) => (
                    <Typography key={l} variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {l}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 3 }} />
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
              Copyright © {new Date().getFullYear()} SIS Global. All rights reserved.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
              Follow Us On: Facebook • Twitter • LinkedIn • Web
            </Typography>
          </Stack>
          </Reveal>
        </Container>
      </Box>

      <IconButton
        aria-label="back to top"
        onClick={() => scrollToId("home")}
        sx={{
          position: "fixed",
          right: 18,
          bottom: 18,
          width: 46,
          height: 46,
          borderRadius: "50%",
          bgcolor: "rgba(124,255,91,0.95)",
          color: "#052016",
          boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
          border: "1px solid rgba(22,101,52,0.18)",
          animation: `${pulse} 3.2s ease-in-out 800ms infinite`,
          "&:hover": { bgcolor: "#62f444", animation: "none" },
        }}
      >
        <KeyboardArrowUpIcon />
      </IconButton>
    </Box>
  );
}
