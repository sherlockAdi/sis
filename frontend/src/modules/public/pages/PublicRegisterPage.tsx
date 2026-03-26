import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Container, MenuItem, Stack, TextField, Typography } from "@mui/material";
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

export default function PublicRegisterPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [countryId, setCountryId] = useState<number | "">("");
  const [stateId, setStateId] = useState<number | "">("");
  const [cityId, setCityId] = useState<number | "">("");

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signup, setSignup] = useState<{ candidate_id: number; username: string; emailed: boolean } | null>(null);

  const canSubmit = useMemo(
    () => firstName.trim() && lastName.trim() && phone.trim() && email.trim(),
    [email, firstName, lastName, phone],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await listPublicCountries();
        if (!alive) return;
        setCountries(rows);
      } catch {
        if (!alive) return;
        setCountries([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (typeof countryId !== "number") {
        setStates([]);
        setStateId("");
        setCities([]);
        setCityId("");
        return;
      }

      try {
        const rows = await listPublicStates(countryId);
        if (!alive) return;
        setStates(rows);
      } catch {
        if (!alive) return;
        setStates([]);
      }

      setStateId("");
      setCities([]);
      setCityId("");
    })();
    return () => {
      alive = false;
    };
  }, [countryId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (typeof stateId !== "number") {
        setCities([]);
        setCityId("");
        return;
      }

      try {
        const rows = await listPublicCities(stateId);
        if (!alive) return;
        setCities(rows);
      } catch {
        if (!alive) return;
        setCities([]);
      }

      setCityId("");
    })();
    return () => {
      alive = false;
    };
  }, [stateId]);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.9 }}>
            Get Registered
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            Quick registration — then continue inside the portal.
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
              {signup.emailed ? " (Password emailed)" : ""}
            </Alert>
          ) : null}

          <Stack spacing={1.25}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              <TextField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth />
              <TextField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth />
            </Stack>
            <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField
              label="Passport Number (optional)"
              value={passportNumber}
              onChange={(e) => setPassportNumber(e.target.value)}
              fullWidth
            />

            <TextField
              select
              label="Country (optional)"
              value={countryId}
              onChange={(e) => setCountryId(e.target.value === "" ? "" : Number(e.target.value))}
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
              label="State (optional)"
              value={stateId}
              onChange={(e) => setStateId(e.target.value === "" ? "" : Number(e.target.value))}
              fullWidth
              disabled={typeof countryId !== "number"}
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
              label="City (optional)"
              value={cityId}
              onChange={(e) => setCityId(e.target.value === "" ? "" : Number(e.target.value))}
              fullWidth
              disabled={typeof stateId !== "number"}
            >
              <MenuItem value="">Select</MenuItem>
              {cities.map((c) => (
                <MenuItem key={c.city_id} value={c.city_id}>
                  {c.city_name}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ pt: 0.5 }}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={async () => {
                  setError(null);
                  if (!canSubmit || submitting) return;
                  setSubmitting(true);
                  try {
                    const res = await recruitmentApi.public.candidateSignup({
                      first_name: firstName.trim(),
                      last_name: lastName.trim(),
                      phone: phone.trim(),
                      email: email.trim(),
                      passport_number: passportNumber.trim() ? passportNumber.trim() : null,
                      country_id: typeof countryId === "number" ? countryId : null,
                      state_id: typeof stateId === "number" ? stateId : null,
                      city_id: typeof cityId === "number" ? cityId : null,
                    });
                    setSignup(res);
                  } catch (e: any) {
                    setError(String(e?.message ?? "Failed to register"));
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={!canSubmit || submitting}
                sx={{ borderRadius: 3 }}
                fullWidth
              >
                {submitting ? "Submitting…" : "Submit"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`${PORTAL_BASE}/login?portal=candidate`)}
                sx={{ textTransform: "none", fontWeight: 950, borderRadius: 3 }}
                fullWidth
              >
                Portal Login
              </Button>
            </Stack>

            <Button
              variant="text"
              onClick={() => navigate("/jobs")}
              sx={{ textTransform: "none", fontWeight: 900, justifyContent: "flex-start" }}
            >
              ← Back to Jobs
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
