import { useState } from "react";
import { Box, Button, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import type { CandidateExperienceEntry, CandidateExperienceValue } from "../utils/candidateExperience";

function blankEntry(withCountry: boolean): CandidateExperienceEntry {
  return {
    country: withCountry ? "" : undefined,
    organization: "",
    role: "",
    from: "",
    to: "",
  };
}

function updateList(
  entries: CandidateExperienceEntry[],
  index: number,
  patch: Partial<CandidateExperienceEntry>,
): CandidateExperienceEntry[] {
  return entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry));
}

function formatDate(value: string): string {
  const [year, month, day] = String(value ?? "").split("-");
  if (!year || !month || !day) return value;
  return `${day}-${month}-${year}`;
}

function FieldSummary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack spacing={0.1} sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1, fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={strong ? 850 : 650} sx={{ minWidth: 0, lineHeight: 1.2, wordBreak: "break-word" }}>
        {value || "-"}
      </Typography>
    </Stack>
  );
}

function ExperienceSection({
  title,
  entries,
  international,
  countryOptions = [],
  onChange,
}: {
  title: string;
  entries: CandidateExperienceEntry[];
  international?: boolean;
  countryOptions?: Array<{ label: string; value: string }>;
  onChange: (entries: CandidateExperienceEntry[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const countryNames = countryOptions.map((option) => option.label);
  const extraCountryValues = entries
    .map((entry) => String(entry.country ?? "").trim())
    .filter((country) => country && !countryNames.includes(country));

  return (
    <Box
      sx={{
        border: "1px solid rgba(148,163,184,0.28)",
        bgcolor: "rgba(248,250,252,0.6)",
        p: 1.25,
        width: "100%",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: entries.length ? 1.25 : 0.75 }}>
        <Typography variant="body2" fontWeight={900}>
          {title}
        </Typography>
        <Tooltip title={`Add ${title}`}>
          <IconButton
            aria-label={`Add ${title}`}
            color="primary"
            onClick={() => {
              onChange([...entries, blankEntry(Boolean(international))]);
              setEditingIndex(entries.length);
            }}
            size="small"
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack spacing={1}>
        {!entries.length ? (
          <Typography variant="body2" color="text.secondary">
            No entries added.
          </Typography>
        ) : null}

        {entries.map((entry, index) => {
          const isEditing = editingIndex === index;
          return (
            <Box
              key={index}
              sx={{
                p: isEditing ? 1.25 : 0.9,
                border: "1px solid rgba(148,163,184,0.24)",
                bgcolor: "#fff",
              }}
            >
              {isEditing ? (
                <Box
                  sx={{
                    display: "grid",
                    gap: 1.25,
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: international
                        ? "minmax(140px, 1fr) minmax(190px, 1.35fr) minmax(140px, 1fr) minmax(125px, 0.85fr) minmax(125px, 0.85fr) auto"
                        : "minmax(220px, 1.5fr) minmax(160px, 1fr) minmax(125px, 0.85fr) minmax(125px, 0.85fr) auto",
                    },
                    alignItems: "end",
                  }}
                >
                  {international ? (
                    <TextField
                      select
                      variant="standard"
                      size="small"
                      label="Country"
                      value={entry.country ?? ""}
                      onChange={(event) => onChange(updateList(entries, index, { country: event.target.value }))}
                      fullWidth
                    >
                      <MenuItem value="">Select Country</MenuItem>
                      {extraCountryValues.map((country) => (
                        <MenuItem key={country} value={country}>
                          {country}
                        </MenuItem>
                      ))}
                      {countryOptions.map((option) => (
                        <MenuItem key={option.value} value={option.label}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : null}
                    <TextField
                      variant="standard"
                      size="small"
                      label="Name of Organization"
                      value={entry.organization}
                      onChange={(event) => onChange(updateList(entries, index, { organization: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      variant="standard"
                      size="small"
                      label="Role"
                      value={entry.role}
                      onChange={(event) => onChange(updateList(entries, index, { role: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      variant="standard"
                      size="small"
                      label="From"
                      type="date"
                      value={entry.from}
                      onChange={(event) => onChange(updateList(entries, index, { from: event.target.value }))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      variant="standard"
                      size="small"
                      label="To"
                      type="date"
                      value={entry.to}
                      onChange={(event) => onChange(updateList(entries, index, { to: event.target.value }))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon fontSize="small" />}
                      onClick={() => setEditingIndex(null)}
                      sx={{ borderRadius: 0, fontWeight: 800, textTransform: "none" }}
                    >
                      Save
                    </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: { xs: "1fr auto", md: international ? "1fr 1.35fr 1fr 1fr auto" : "1.35fr 1fr 1fr auto" },
                    alignItems: "center",
                  }}
                >
                  {international ? (
                    <FieldSummary label="Country" value={entry.country || "-"} />
                  ) : null}
                  <FieldSummary label="Organization" value={entry.organization || "-"} strong />
                  <FieldSummary label="Role" value={entry.role || "-"} />
                  <FieldSummary label="From - To" value={[formatDate(entry.from), formatDate(entry.to)].filter(Boolean).join(" - ") || "-"} />
                  <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                    <Tooltip title={`Edit ${title}`}>
                      <IconButton aria-label={`Edit ${title} experience`} onClick={() => setEditingIndex(index)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={`Remove ${title}`}>
                      <IconButton
                        aria-label={`Remove ${title} experience`}
                        onClick={() => {
                          onChange(entries.filter((_, i) => i !== index));
                          setEditingIndex(null);
                        }}
                        size="small"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export default function CandidateExperienceEditor({
  value,
  countryOptions,
  onChange,
}: {
  value: CandidateExperienceValue;
  countryOptions?: Array<{ label: string; value: string }>;
  onChange: (value: CandidateExperienceValue) => void;
}) {
  return (
    <Stack spacing={1.25}>
      <ExperienceSection
        title="National Experience"
        entries={value.national}
        onChange={(national) => onChange({ ...value, national })}
      />
      <ExperienceSection
        title="International Experience"
        entries={value.international}
        international
        countryOptions={countryOptions}
        onChange={(international) => onChange({ ...value, international })}
      />
    </Stack>
  );
}
