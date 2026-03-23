import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { PORTAL_BASE } from "../../../common/paths";

export default function PublicRegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [skill, setSkill] = useState("");
  const [preferredCountry, setPreferredCountry] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = useMemo(() => name.trim() && mobile.trim(), [name, mobile]);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.9 }}>
            Get Registered
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            Quick registration — then continue inside the Candidate Portal.
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
          {submitted ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Registration received. Continue to Candidate Portal to apply and track progress.
            </Alert>
          ) : null}

          <Stack spacing={1.25}>
            <TextField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField label="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} fullWidth />
            <TextField label="Skill / Role" value={skill} onChange={(e) => setSkill(e.target.value)} fullWidth />
            <TextField label="Preferred Country" value={preferredCountry} onChange={(e) => setPreferredCountry(e.target.value)} fullWidth />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ pt: 0.5 }}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => setSubmitted(true)}
                disabled={!canSubmit}
                sx={{ borderRadius: 3 }}
                fullWidth
              >
                Submit
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`${PORTAL_BASE}/login?portal=candidate`)}
                sx={{ textTransform: "none", fontWeight: 950, borderRadius: 3 }}
                fullWidth
              >
                Candidate Portal
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
