import { Box, Divider, Stack, Typography } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AdAlertBox,
  AdButton,
  AdCheckBox,
  AdNotification,
  AdTextBox,
} from "../../common/ad";
import { login, me, requestLoginOtp, verifyLoginOtp } from "../../common/services/authApi";
import type { MeResponse } from "../../common/services/authApi";
import type { ApiError } from "../../common/services/apiFetch";
import { getRememberMe, setAuthToken } from "../../common/services/tokenStorage";
import { withPortalBase } from "../../common/paths";

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
      return "Employer Portal";
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

function resolvePostLoginTarget(profile: MeResponse, requestedFrom?: unknown): string {
  const role = String(profile.role_code ?? "").toUpperCase();
  const from = String(requestedFrom ?? "").trim();
  if (from.startsWith("/portal")) {
    if (role === "CANDIDATE" && from.startsWith("/portal/candidate")) return from;
    if ((role === "SOURCING" || role === "PARTNER") && from.startsWith("/portal/partner")) return from;
    if (role === "ASSOCIATE" && from.startsWith("/portal/associate")) return from;
    if (role === "EMPLOYEE" && from.startsWith("/portal/employees")) return from;
    if (!["CANDIDATE", "SOURCING", "PARTNER", "ASSOCIATE", "EMPLOYEE"].includes(role)) return from;
  }

  if (role === "CANDIDATE") return withPortalBase("/candidate/home");
  if (role === "EMPLOYEE") return withPortalBase("/employees/dashboard");
  if (role === "ASSOCIATE") return withPortalBase("/associate/dashboard");
  if (role === "SOURCING" || role === "PARTNER") return withPortalBase("/partner/dashboard");
  return withPortalBase("/dashboard");
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
    () => "linear-gradient(180deg, #0f172a 0%, #1d4ed8 100%)",
    [],
  );
  const portalAccent = gradientBg;

  const panelMinHeight = { xs: "auto", md: 640 };
  const rightPanelMinHeight = { xs: "auto", md: 560 };

  const handlePasswordLogin = async () => {
    setError(null);
    if (!username.trim() || !password) {
      setError("Username or email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(username.trim(), password);
      setAuthToken(res.token, remember);
      const profile = await me();
      navigate(resolvePostLoginTarget(profile, (location.state as any)?.from), { replace: true });
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
      setError("Username or email is required.");
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
      setError("Username or email is required.");
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
      const profile = await me();
      navigate(resolvePostLoginTarget(profile, (location.state as any)?.from), { replace: true });
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const showCandidateSignup = portal === "candidate";

  return (
    <Box
      position="relative"
      width="100%"
      height="100dvh"
      overflow="hidden"
      sx={{ boxSizing: "border-box", background: "#0f172a" }}
    >
      <Box
        display="grid"
        height="100%"
        gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
        gridTemplateAreas={{ xs: `"login" "sis"`, md: `"sis login"` }}
        sx={{ width: "100%", boxSizing: "border-box" }}
      >
        <Box
          sx={{
            gridArea: "sis",
            minHeight: 0,
            px: { xs: 3, sm: 4, md: 5 },
            py: { xs: 3, sm: 4, md: 5 },
            color: "white",
            background: portalAccent,
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
                <Typography
                  variant="h3"
                  fontWeight={900}
                  sx={{ letterSpacing: -1, fontSize: { xs: 32, md: 44 }, lineHeight: 1.05 }}
                >
                  Workforce
                  <br />
                  Management
                  <br />
                  Ecosystem
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ mt: 2, maxWidth: 430, opacity: 0.9, lineHeight: 1.55, fontSize: { xs: 14, md: 15 } }}
                >
                  Digitizing the complete employee lifecycle from sourcing and training to international deployment and beyond.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  maxWidth: 460,
                  mt: 2,
                }}
              >
                {[
                  { k: "25+", v: "COUNTRIES" },
                  { k: "50K+", v: "WORKERS DEPLOYED" },
                ].map((s) => (
                  <Box
                    key={s.v}
                    sx={{
                      py: 2,
                      borderTop: "1px solid rgba(255,255,255,0.14)",
                    }}
                  >
                    <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1 }}>
                      {s.k}
                    </Typography>
                    <Typography variant="caption" sx={{ letterSpacing: 1, opacity: 0.82 }}>
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
            minHeight: 0,
            px: { xs: 3, sm: 4, md: 5 },
            py: { xs: 3, sm: 4, md: 5 },
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 420 }}>
            <Stack spacing={2.2}>
              <Stack spacing={0.6} sx={{ alignItems: "center", textAlign: "center" }}>
                <Typography variant="h5" fontWeight={800} sx={{ color: "#17324d" }}>
                  {portalTitle(portal)}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(15,23,42,0.62)", lineHeight: 1.5 }}>
                  {portalSubtitle(portal)}
                </Typography>
              </Stack>

              <AdNotification
                open={toast.open}
                message={toast.message}
                severity={toast.severity}
                onClose={() => setToast((t) => ({ ...t, open: false }))}
              />
              {error && <AdAlertBox severity="error" title="Sign in failed" message={error} onClose={() => setError(null)} />}

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
                    py: 0.8,
                    borderRadius: 2,
                    border: "1px solid rgba(15,23,42,0.12)",
                    cursor: "pointer",
                    fontWeight: 800,
                    backgroundColor: loginMethod === "password" ? "rgba(216,27,96,0.08)" : "#fff",
                    color: loginMethod === "password" ? "#1d4ed8" : "rgba(15,23,42,0.72)",
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
                    py: 0.8,
                    borderRadius: 2,
                    border: "1px solid rgba(15,23,42,0.12)",
                    cursor: "pointer",
                    fontWeight: 800,
                    backgroundColor: loginMethod === "otp" ? "rgba(216,27,96,0.08)" : "#fff",
                    color: loginMethod === "otp" ? "#1d4ed8" : "rgba(15,23,42,0.72)",
                  }}
                >
                  OTP
                </Box>
              </Stack>

              <AdTextBox
                label="Username"
                placeholder="Enter your username or email"
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

              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <AdCheckBox label="Remember me" checked={remember} onChange={setRemember} />
                <AdButton variant="text" onClick={() => setError("Please contact your administrator to reset password.")}>
                  Forgot password?
                </AdButton>
              </Stack>

              {loginMethod === "password" ? (
                <AdButton size="large" onClick={handlePasswordLogin} loading={submitting} sx={{ py: 0.95, borderRadius: 2 }}>
                  Sign In
                </AdButton>
              ) : (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <AdButton
                    size="large"
                    variant="outlined"
                    onClick={handleSendOtp}
                    loading={sendingOtp}
                    sx={{ py: 0.95, borderRadius: 2, flex: 1 }}
                  >
                    Send OTP
                  </AdButton>
                  <AdButton
                    size="large"
                    onClick={handleVerify}
                    loading={submitting}
                    disabled={!otpSent}
                    sx={{ py: 0.95, borderRadius: 2, flex: 1 }}
                  >
                    Verify & Login
                  </AdButton>
                </Stack>
              )}

              {showCandidateSignup && (
                <AdButton variant="text" onClick={() => navigate("/register")}>
                  Candidate Sign Up
                </AdButton>
              )}

              <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center" }}>
                Secure access for your portal only.
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
