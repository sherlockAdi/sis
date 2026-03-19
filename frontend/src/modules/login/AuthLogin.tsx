import { Box, Divider, Stack, Typography } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AdAlertBox,
  AdButton,
  AdCheckBox,
  AdDropDown,
  AdModal,
  AdNotification,
  AdTextBox,
  SisLogo,
} from "../../common/ad";
import { login, me, requestLoginOtp, verifyLoginOtp } from "../../common/services/authApi";
import type { ApiError } from "../../common/services/apiFetch";
import { getRememberMe, setAuthToken } from "../../common/services/tokenStorage";
import { recruitmentApi } from "../../common/services/recruitmentApi";
import {
  listPublicCities,
  listPublicCountries,
  listPublicStates,
  type CityRow,
  type Country,
  type StateRow,
} from "../../common/services/locationApi";

type PortalKey = "candidate" | "administrator" | "employer" | "sourcing";

function getPortalKey(value: string | null): PortalKey | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "candidate") return "candidate";
  if (v === "administrator" || v === "admin") return "administrator";
  if (v === "employer") return "employer";
  if (v === "sourcing" || v === "sourcing-partner" || v === "partner") return "sourcing";
  return null;
}

function portalTitle(portal: PortalKey | null) {
  switch (portal) {
    case "candidate":
      return "Candidate Portal";
    case "administrator":
      return "Administrator Portal";
    case "employer":
      return "Employer Portal";
    case "sourcing":
      return "Sourcing Partner Portal";
    default:
      return "Sign In";
  }
}

function portalSubtitle(portal: PortalKey | null) {
  switch (portal) {
    case "candidate":
      return "Sign in to apply for jobs and track your applications";
    case "administrator":
      return "Sign in to manage jobs, users, and deployments";
    case "employer":
      return "Sign in to view deployed workforce and compliance summaries";
    case "sourcing":
      return "Sign in to submit referrals and track sourcing performance";
    default:
      return "Sign in to continue to your workspace";
  }
}

export default function AuthLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const portal = useMemo(() => getPortalKey(query.get("portal")), [query]);

  const demo = (location.state as any)?.demo as { username?: string } | undefined;

  const portalAutofill = useMemo(() => {
    if (portal === "candidate") return { username: "C000002", password: "arXEMX6KTF" };
    if (portal === "administrator") return { username: "sisadmin", password: "Aditya@123" };
    return null;
  }, [portal]);

  const [username, setUsername] = useState(demo?.username ?? portalAutofill?.username ?? "");
  const [password, setPassword] = useState(portalAutofill?.password ?? "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [remember, setRemember] = useState(getRememberMe());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (demo?.username) {
      setUsername(demo?.username ?? "");
      setPassword("");
      setOtp("");
      setOtpSent(false);
      return;
    }
    if (portalAutofill) {
      setUsername(portalAutofill.username);
      setPassword(portalAutofill.password ?? "");
      setOtp("");
      setOtpSent(false);
      return;
    }
    setUsername("");
    setPassword("");
    setOtp("");
    setOtpSent(false);
  }, [demo?.username, portalAutofill]);

  const gradientBg = useMemo(
    () => "linear-gradient(180deg, #d81b60 0%, #ad1457 100%)",
    [],
  );

  const panelMinHeight = { xs: "auto", md: 640 };
  const rightPanelMinHeight = { xs: "auto", md: 560 };

  const handlePasswordLogin = async () => {
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

  const handleSendOtp = async () => {
    setError(null);
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    setSendingOtp(true);
    try {
      await requestLoginOtp(username.trim());
      setOtpSent(true);
      setToast({ open: true, severity: "success", message: "OTP sent to your email." });
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!otp.trim()) {
      setError("OTP is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await verifyLoginOtp(username.trim(), otp.trim());
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
    () =>
      [{ label: "— Select —", value: "" }].concat(
        countries.map((c) => ({ label: c.country_name, value: String(c.country_id) })),
      ),
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
      setToast({
        open: true,
        severity: "error",
        message: (e as ApiError)?.message ?? e?.message ?? "Signup failed",
      });
    } finally {
      setSignupSubmitting(false);
    }
  };

  const showCandidateSignup = portal === "candidate";

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
                  borderRadius: { xs: 4, md: 6 },
                  background: gradientBg,
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
                  minHeight: rightPanelMinHeight,
                  borderRadius: { xs: 4, md: 6 },
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(15,23,42,0.10)",
                  p: { xs: 2.5, md: 3 },
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack spacing={0.5} sx={{ pb: 1.75 }}>
                  <Typography variant="h6" fontWeight={800}>
                    {portalTitle(portal)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {portalSubtitle(portal)}
                  </Typography>
                </Stack>

                <Stack spacing={1.5} sx={{ flex: 1 }}>
                  <AdNotification
                    open={toast.open}
                    message={toast.message}
                    severity={toast.severity}
                    onClose={() => setToast((t) => ({ ...t, open: false }))}
                  />
                  {error && (
                    <AdAlertBox severity="error" title="Sign in failed" message={error} onClose={() => setError(null)} />
                  )}

                  <Stack direction="row" spacing={1}>
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setLoginMethod("password");
                        setError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setLoginMethod("password");
                          setError(null);
                        }
                      }}
                      sx={{
                        flex: 1,
                        textAlign: "center",
                        py: 0.9,
                        borderRadius: 2,
                        border: "1px solid rgba(15,23,42,0.14)",
                        cursor: "pointer",
                        fontWeight: 700,
                        backgroundColor: loginMethod === "password" ? "rgba(216,27,96,0.08)" : "#fff",
                        color: loginMethod === "password" ? "#ad1457" : "rgba(15,23,42,0.72)",
                      }}
                    >
                      Password
                    </Box>
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setLoginMethod("otp");
                        setError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setLoginMethod("otp");
                          setError(null);
                        }
                      }}
                      sx={{
                        flex: 1,
                        textAlign: "center",
                        py: 0.9,
                        borderRadius: 2,
                        border: "1px solid rgba(15,23,42,0.14)",
                        cursor: "pointer",
                        fontWeight: 700,
                        backgroundColor: loginMethod === "otp" ? "rgba(216,27,96,0.08)" : "#fff",
                        color: loginMethod === "otp" ? "#ad1457" : "rgba(15,23,42,0.72)",
                      }}
                    >
                      OTP
                    </Box>
                  </Stack>

                  <AdTextBox
                    label="Username"
                    placeholder="Enter your username"
                    required
                    value={username}
                    onChange={(v) => {
                      setUsername(v);
                      setOtp("");
                      setOtpSent(false);
                    }}
                    prefixIcon={<PersonOutlineIcon fontSize="small" />}
                  />

                  {loginMethod === "password" ? (
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
                      onEnter={handlePasswordLogin}
                    />
                  ) : (
                    <AdTextBox
                      label="OTP"
                      placeholder="Enter OTP"
                      required
                      value={otp}
                      onChange={setOtp}
                      prefixIcon={<LockOutlinedIcon fontSize="small" />}
                      disabled={!otpSent}
                      onEnter={handleVerify}
                    />
                  )}

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <AdCheckBox label="Remember me" checked={remember} onChange={setRemember} />
                    <AdButton variant="text" onClick={() => setError("Please contact your administrator to reset password.")}>
                      Forgot password?
                    </AdButton>
                  </Stack>

                  {loginMethod === "password" ? (
                    <AdButton size="large" onClick={handlePasswordLogin} loading={submitting} sx={{ py: 1.1, borderRadius: 2 }}>
                      Sign In
                    </AdButton>
                  ) : (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                      <AdButton
                        size="large"
                        variant="outlined"
                        onClick={handleSendOtp}
                        loading={sendingOtp}
                        sx={{ py: 1.1, borderRadius: 2, flex: 1 }}
                      >
                        Send OTP
                      </AdButton>
                      <AdButton
                        size="large"
                        onClick={handleVerify}
                        loading={submitting}
                        disabled={!otpSent}
                        sx={{ py: 1.1, borderRadius: 2, flex: 1 }}
                      >
                        Verify & Login
                      </AdButton>
                    </Stack>
                  )}

                  {showCandidateSignup && (
                    <AdButton variant="text" onClick={() => setSignupOpen(true)}>
                      Candidate Sign Up
                    </AdButton>
                  )}

                  <Divider sx={{ opacity: 0.8 }} />
                  <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                    <SisLogo height={70} />
                  </Box>
                </Stack>
              </Box>
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
