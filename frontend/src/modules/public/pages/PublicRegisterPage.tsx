import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { PORTAL_BASE } from "../../../common/paths";
import { recruitmentApi } from "../../../common/services/recruitmentApi";
import {
  listPublicCities,
  listPublicCountries,
  listPublicStates,
  type CityRow,
  type Country,
  type StateRow,
} from "../../../common/services/locationApi";

type Form = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  passport_number: string;
  country_id: number | "";
  state_id: number | "";
  city_id: number | "";
  father_name: string;
  address1: string;
  address2: string;
  pincode: string;
  dob: string;
  gender: string;
  skills: string;
  education: string;
  experience: string;
  industry_type: string;
  passport_expiry_date: string;
  aadhar_number: string;
  pan_number: string;
  voter_id_number: string;
  languages_known: string;
};

const emptyForm: Form = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  passport_number: "",
  country_id: "",
  state_id: "",
  city_id: "",
  father_name: "",
  address1: "",
  address2: "",
  pincode: "",
  dob: "",
  gender: "",
  skills: "",
  education: "",
  experience: "",
  industry_type: "",
  passport_expiry_date: "",
  aadhar_number: "",
  pan_number: "",
  voter_id_number: "",
  languages_known: "",
};

export default function PublicRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState<Form>(emptyForm);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signup, setSignup] = useState<{ candidate_id: number; username: string; emailed: boolean; user_created: boolean; existing_user_used: boolean; auth_error?: string | null } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await listPublicCountries();
        if (alive) setCountries(rows);
      } catch {
        if (alive) setCountries([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (typeof form.country_id !== "number") {
        setStates([]);
        setForm((f) => ({ ...f, state_id: "", city_id: "" }));
        setCities([]);
        return;
      }
      try {
        const rows = await listPublicStates(form.country_id);
        if (!alive) return;
        setStates(rows);
      } catch {
        if (!alive) return;
        setStates([]);
      }
      setForm((f) => ({ ...f, state_id: "", city_id: "" }));
      setCities([]);
    })();
    return () => {
      alive = false;
    };
  }, [form.country_id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (typeof form.state_id !== "number") {
        setCities([]);
        setForm((f) => ({ ...f, city_id: "" }));
        return;
      }
      try {
        const rows = await listPublicCities(form.state_id);
        if (!alive) return;
        setCities(rows);
      } catch {
        if (!alive) return;
        setCities([]);
      }
      setForm((f) => ({ ...f, city_id: "" }));
    })();
    return () => {
      alive = false;
    };
  }, [form.state_id]);

  const canSubmit = useMemo(
    () => Boolean(form.first_name.trim() && form.last_name.trim() && form.phone.trim() && form.email.trim() && form.passport_number.trim()),
    [form.email, form.first_name, form.last_name, form.passport_number, form.phone],
  );

  const submit = async () => {
    setError(null);
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const res = await recruitmentApi.public.candidateSignup({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        passport_number: form.passport_number.trim(),
        country_id: typeof form.country_id === "number" ? form.country_id : null,
        state_id: typeof form.state_id === "number" ? form.state_id : null,
        city_id: typeof form.city_id === "number" ? form.city_id : null,
        father_name: form.father_name.trim() || null,
        address1: form.address1.trim() || null,
        address2: form.address2.trim() || null,
        pincode: form.pincode.trim() || null,
        dob: form.dob || null,
        gender: form.gender.trim() || null,
        skills: form.skills.trim() || null,
        education: form.education.trim() || null,
        experience: form.experience.trim() || null,
        industry_type: form.industry_type.trim() || null,
        passport_expiry_date: form.passport_expiry_date || null,
        aadhar_number: form.aadhar_number.trim() || null,
        pan_number: form.pan_number.trim() || null,
        voter_id_number: form.voter_id_number.trim() || null,
        languages_known: form.languages_known.trim() || null,
      });

      setSignup(res);
    } catch (e: any) {
      setError(String(e?.message ?? "Failed to register"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.9 }}>
            Candidate Registration
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            Complete your registration here. After login, you can finish document uploads inside the portal.
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {signup ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Registration received. Username: <b>{signup.username}</b>
              {signup.user_created
                ? signup.emailed
                  ? " (Password emailed)"
                  : " (Password not emailed)"
                : signup.existing_user_used
                  ? " (Existing login account linked)"
                  : " (Profile saved, login account pending)"}
            </Alert>
          ) : null}

          {signup && !signup.user_created && !signup.existing_user_used ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {signup.auth_error ?? "Profile saved, but the login account could not be created right now. Please contact support."}
            </Alert>
          ) : null}

          <Stack spacing={2}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={900}>
                Registration
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                <TextField label="First Name" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} fullWidth />
                <TextField label="Last Name" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                <TextField label="Mobile" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} fullWidth />
                <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                <TextField label="Passport Number" value={form.passport_number} onChange={(e) => setForm((f) => ({ ...f, passport_number: e.target.value }))} fullWidth />
                <TextField label="DOB" type="date" value={form.dob} onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
                <TextField
                  select
                  label="Gender"
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                  <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                </TextField>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                <TextField
                  select
                  label="Country"
                  value={form.country_id}
                  onChange={(e) => setForm((f) => ({ ...f, country_id: e.target.value === "" ? "" : Number(e.target.value) }))}
                  fullWidth
                >
                  <MenuItem value="">Select</MenuItem>
                  {countries.map((c) => (
                    <MenuItem key={c.country_id} value={c.country_id}>
                      {c.country_name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="State"
                  value={form.state_id}
                  onChange={(e) => setForm((f) => ({ ...f, state_id: e.target.value === "" ? "" : Number(e.target.value) }))}
                  fullWidth
                  disabled={typeof form.country_id !== "number"}
                >
                  <MenuItem value="">Select</MenuItem>
                  {states.map((s) => (
                    <MenuItem key={s.state_id} value={s.state_id}>
                      {s.state_name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="City"
                  value={form.city_id}
                  onChange={(e) => setForm((f) => ({ ...f, city_id: e.target.value === "" ? "" : Number(e.target.value) }))}
                  fullWidth
                  disabled={typeof form.state_id !== "number"}
                >
                  <MenuItem value="">Select</MenuItem>
                  {cities.map((c) => (
                    <MenuItem key={c.city_id} value={c.city_id}>
                      {c.city_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Stack>

            <Alert severity="info">
              Document uploads are completed after login from the candidate portal.
            </Alert>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ pt: 0.5 }}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={submit}
                disabled={!canSubmit || submitting}
                sx={{ borderRadius: 3 }}
                fullWidth
              >
                {submitting ? "Submitting…" : "Submit"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`${PORTAL_BASE}/login?portal=candidate`, { state: { ...(location.state as any) } })}
                sx={{ textTransform: "none", fontWeight: 950, borderRadius: 3 }}
                fullWidth
              >
                Portal Login
              </Button>
            </Stack>

            <Button variant="text" onClick={() => navigate("/jobs")} sx={{ textTransform: "none", fontWeight: 900, justifyContent: "flex-start" }}>
              ← Back to Jobs
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
