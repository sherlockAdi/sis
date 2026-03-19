import { Box, Divider, Stack, Typography } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Ad3DBackground, AdAlertBox, AdButton, AdCard, AdCheckBox, AdDropDown, AdModal, AdNotification, AdTextBox, SisLogo } from "../../common/ad";
import { login, me } from "../../common/services/authApi";
import type { ApiError } from "../../common/services/apiFetch";
import { getRememberMe, setAuthToken } from "../../common/services/tokenStorage";
import { recruitmentApi } from "../../common/services/recruitmentApi";
import { listPublicCities, listPublicCountries, listPublicStates, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(getRememberMe());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({ open: false, message: "", severity: "success" });
  const navigate = useNavigate();
  const location = useLocation();

  const gradientBg = useMemo(
    () =>
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.24), transparent 35%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.18), transparent 35%), linear-gradient(135deg, rgba(236,72,153,0.92) 0%, rgba(168,85,247,0.88) 55%, rgba(99,102,241,0.84) 100%)",
    []
  );

  const panelMinHeight = { xs: "auto", md: 640 };

  const handleSubmit = async () => {
    setError(null);
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(username.trim(), password);
      setAuthToken(res.token, remember);
      await me();
      const to = (location.state as any)?.from ?? "/dashboard";
      navigate(to, { replace: true });
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const [signupOpen, setSignupOpen] = useState(false);
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [signup, setSignup] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    passport_number: "",
    country_id: "",
    state_id: "",
    city_id: "",
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);

  const countryOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(countries.map((c) => ({ label: c.country_name, value: String(c.country_id) }))),
    [countries],
  );
  const stateOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(states.map((s) => ({ label: s.state_name, value: String(s.state_id) }))),
    [states],
  );
  const cityOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(cities.map((c) => ({ label: c.city_name, value: String(c.city_id) }))),
    [cities],
  );

  useEffect(() => {
    (async () => {
      try {
        setCountries(await listPublicCountries());
      } catch {
        setCountries([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!signup.country_id) {
      setStates([]);
      setCities([]);
      return;
    }
    (async () => {
      try {
        setStates(await listPublicStates(Number(signup.country_id)));
      } catch {
        setStates([]);
      }
    })();
  }, [signup.country_id]);

  useEffect(() => {
    if (!signup.state_id) {
      setCities([]);
      return;
    }
    (async () => {
      try {
        setCities(await listPublicCities(Number(signup.state_id)));
      } catch {
        setCities([]);
      }
    })();
  }, [signup.state_id]);

  const submitSignup = async () => {
    try {
      if (!signup.email.trim()) throw new Error("Email is required");
      setSignupSubmitting(true);
      const res = await recruitmentApi.public.candidateSignup({
        first_name: signup.first_name.trim() || null,
        last_name: signup.last_name.trim() || null,
        phone: signup.phone.trim() || null,
        email: signup.email.trim(),
        passport_number: signup.passport_number.trim() || null,
        country_id: signup.country_id ? Number(signup.country_id) : null,
        state_id: signup.state_id ? Number(signup.state_id) : null,
        city_id: signup.city_id ? Number(signup.city_id) : null,
      });
      setToast({
        open: true,
        severity: res.emailed ? "success" : "warning",
        message: res.emailed
          ? "Signup successful. Credentials have been emailed."
          : `Signup successful. Username: ${res.username} (email not sent)`,
      });
      setSignupOpen(false);
    } catch (e: any) {
      setToast({ open: true, severity: "error", message: (e as ApiError)?.message ?? e?.message ?? "Signup failed" });
    } finally {
      setSignupSubmitting(false);
    }
  };

  return (
    <Box position="relative" minHeight="100vh" width="100vw" overflow="hidden">
      <Ad3DBackground variant="ehrm" />

      <Box
        position="relative"
        zIndex={1}
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ px: { xs: 2, md: 5 }, py: { xs: 3, md: 5 }, width: "100%" }}
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
                borderRadius: { xs: 4, md: 6 },
                background: gradientBg,
                color: "white",
                overflow: "hidden",
                position: "relative",
                p: { xs: 3, md: 5 },
                boxShadow: "0 22px 70px rgba(2, 6, 23, 0.35)",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.22), transparent 40%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.16), transparent 45%)",
                  pointerEvents: "none",
                }}
              />

              <Stack spacing={3} sx={{ position: "relative" }}>
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
                      SIS EHRM
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Enterprise Human Resource Management
                    </Typography>
                  </Box>
                </Stack>

                <Box>
                  <Typography
                    variant="h3"
                    fontWeight={900}
                    sx={{ letterSpacing: -0.8, fontSize: { xs: 34, md: 46 } }}
                  >
                    Workforce Management Ecosystem
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1.5, opacity: 0.92, maxWidth: 560 }}>
                    Streamline employee lifecycle, attendance, payroll, compliance, and role-based access —
                    all in one secure platform.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  {[
                    { k: "25+", v: "Departments" },
                    { k: "50K+", v: "Employees" },
                    { k: "100+", v: "Enterprise Clients" },
                    { k: "99.9%", v: "Uptime SLA" },
                  ].map((s) => (
                    <AdCard
                      key={s.v}
                      animate={false}
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.14)",
                        border: "1px solid rgba(255,255,255,0.22)",
                        color: "white",
                      }}
                      contentSx={{ p: 2.5 }}
                    >
                      <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: 0.4 }}>
                        {s.k}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {s.v}
                      </Typography>
                    </AdCard>
                  ))}
                </Box>

                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Powered by SIS • Secure access with JWT + Role/Menu permissions
                </Typography>
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
            <AdCard
              title="Welcome Back"
              subtitle="Sign in to continue to your EHRM workspace"
              animate={false}
              sx={{
                width: "100%",
                minHeight: panelMinHeight,
                borderRadius: { xs: 4, md: 6 },
                backgroundColor: "rgba(255,255,255,0.62)",
                border: "1px solid rgba(255,255,255,0.55)",
                backdropFilter: "blur(14px)",
              }}
              contentSx={{
                p: { xs: 3, md: 4 },
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack spacing={2} sx={{ flex: 1 }}>
                <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
                {error && (
                  <AdAlertBox
                    severity="error"
                    title="Sign in failed"
                    message={error}
                    onClose={() => setError(null)}
                  />
                )}

                <AdTextBox
                  label="Username"
                  placeholder="Enter your username"
                  required
                  value={username}
                  onChange={setUsername}
                  prefixIcon={<PersonOutlineIcon fontSize="small" />}
                />

                <AdTextBox
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  showPasswordToggle
                  value={password}
                  onChange={setPassword}
                  prefixIcon={<LockOutlinedIcon fontSize="small" />}
                  onEnter={handleSubmit}
                />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <AdCheckBox label="Remember me" checked={remember} onChange={setRemember} />
                  <AdButton
                    variant="text"
                    onClick={() => setError("Please contact your administrator to reset password.")}
                  >
                    Forgot password?
                  </AdButton>
                </Stack>

                <AdButton
                  size="large"
                  onClick={handleSubmit}
                  loading={submitting}
                  sx={{ py: 1.2, borderRadius: 2 }}
                >
                  Sign In
                </AdButton>

                <AdButton variant="text" onClick={() => setSignupOpen(true)}>
                  Candidate Sign Up
                </AdButton>
                  <Divider sx={{ opacity: 0.8 }} />
                <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                  <SisLogo height={95} />
                </Box>

               
                {/* <Typography variant="caption" color="text.secondary" textAlign="center">
                  SIS • EHRM Module
                </Typography> */}
              </Stack>
            </AdCard>
            </Box>
          </Box>
        </Box>
      </Box>

      <AdModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        title="Candidate Sign Up"
        subtitle="Create your account — credentials will be emailed to you."
        maxWidth="md"
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setSignupOpen(false)}>
              Cancel
            </AdButton>
            <AdButton onClick={submitSignup} loading={signupSubmitting}>
              Create Account
            </AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <AdTextBox label="First Name" value={signup.first_name} onChange={(v) => setSignup((s) => ({ ...s, first_name: v }))} />
            <AdTextBox label="Last Name" value={signup.last_name} onChange={(v) => setSignup((s) => ({ ...s, last_name: v }))} />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <AdTextBox label="Phone" value={signup.phone} onChange={(v) => setSignup((s) => ({ ...s, phone: v }))} />
            <AdTextBox label="Email" required value={signup.email} onChange={(v) => setSignup((s) => ({ ...s, email: v }))} />
          </Stack>
          <AdTextBox label="Passport Number" value={signup.passport_number} onChange={(v) => setSignup((s) => ({ ...s, passport_number: v }))} />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <AdDropDown
              label="Country"
              options={countryOptions}
              value={signup.country_id}
              onChange={(v) => setSignup((s) => ({ ...s, country_id: String(v), state_id: "", city_id: "" }))}
            />
            <AdDropDown
              label="State"
              options={stateOptions}
              disabled={!signup.country_id}
              value={signup.state_id}
              onChange={(v) => setSignup((s) => ({ ...s, state_id: String(v), city_id: "" }))}
            />
            <AdDropDown
              label="City"
              options={cityOptions}
              disabled={!signup.state_id}
              value={signup.city_id}
              onChange={(v) => setSignup((s) => ({ ...s, city_id: String(v) }))}
            />
          </Stack>
        </Stack>
      </AdModal>
    </Box>
  );
}
